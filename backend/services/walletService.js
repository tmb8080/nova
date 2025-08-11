const { PrismaClient } = require('@prisma/client');
const { calculatePercentage } = require('../utils/helpers');
const { sendEmail } = require('./emailService');
const prisma = new PrismaClient();

// Process daily wallet growth for all users
const processWalletGrowth = async () => {
  try {
    console.log('Starting wallet growth processing...');
    
    // Get admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      throw new Error('Admin settings not found');
    }

    const dailyGrowthRate = parseFloat(settings.dailyGrowthRate);
    
    // Get all wallets with positive balance
    const wallets = await prisma.wallet.findMany({
      where: {
        balance: {
          gt: 0
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    console.log(`Processing growth for ${wallets.length} wallets...`);

    const results = [];
    
    for (const wallet of wallets) {
      try {
        // Calculate growth amount
        const currentBalance = parseFloat(wallet.balance);
        const growthAmount = parseFloat(calculatePercentage(currentBalance, dailyGrowthRate));
        
        if (growthAmount > 0) {
          // Update wallet in transaction
          const result = await prisma.$transaction(async (tx) => {
            // Update wallet balance and earnings
            const updatedWallet = await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  increment: growthAmount
                },
                totalEarnings: {
                  increment: growthAmount
                },
                lastGrowthUpdate: new Date()
              }
            });

            // Create transaction record
            await tx.transaction.create({
              data: {
                userId: wallet.userId,
                type: 'WALLET_GROWTH',
                amount: growthAmount,
                description: `Daily wallet growth (${(dailyGrowthRate * 100).toFixed(2)}%)`
              }
            });

            return updatedWallet;
          });

          results.push({
            userId: wallet.userId,
            userName: wallet.user.fullName,
            previousBalance: currentBalance,
            growthAmount,
            newBalance: parseFloat(result.balance),
            success: true
          });
        }
      } catch (error) {
        console.error(`Error processing growth for wallet ${wallet.id}:`, error);
        results.push({
          userId: wallet.userId,
          userName: wallet.user.fullName,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalGrowth = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.growthAmount, 0);

    console.log(`Wallet growth processing completed:`);
    console.log(`- Successful: ${successCount}/${wallets.length}`);
    console.log(`- Total growth distributed: ${totalGrowth.toFixed(8)}`);

    return {
      processed: wallets.length,
      successful: successCount,
      totalGrowth,
      results
    };

  } catch (error) {
    console.error('Error in wallet growth processing:', error);
    throw error;
  }
};

// Get wallet balance and statistics
const getWalletStats = async (userId) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            referralCode: true,
            createdAt: true
          }
        }
      }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Get transaction history
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get referral statistics
    const referralStats = await prisma.user.aggregate({
      where: { referredBy: userId },
      _count: true
    });

    const referralBonuses = await prisma.transaction.aggregate({
      where: {
        userId,
        type: 'REFERRAL_BONUS'
      },
      _sum: { amount: true }
    });

    return {
      balance: parseFloat(wallet.balance),
      totalDeposits: parseFloat(wallet.totalDeposits),
      totalEarnings: parseFloat(wallet.totalEarnings),
      totalReferralBonus: parseFloat(wallet.totalReferralBonus),
      lastGrowthUpdate: wallet.lastGrowthUpdate,
      referralCode: wallet.user.referralCode,
      referralCount: referralStats._count,
      totalReferralEarnings: parseFloat(referralBonuses._sum.amount || 0),
      recentTransactions: transactions,
      memberSince: wallet.user.createdAt
    };
  } catch (error) {
    console.error('Error fetching wallet stats:', error);
    throw error;
  }
};

// Process referral bonus
const processReferralBonus = async (referrerId, referredUserId, depositAmount) => {
  try {
    // Get admin settings for referral bonus rate
    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      throw new Error('Admin settings not found');
    }

    const bonusRate = parseFloat(settings.referralBonusRate);
    const bonusAmount = parseFloat(calculatePercentage(depositAmount, bonusRate));

    if (bonusAmount <= 0) {
      return null;
    }

    // Get referrer information
    const referrer = await prisma.user.findUnique({
      where: { id: referrerId },
      include: { wallet: true }
    });

    const referredUser = await prisma.user.findUnique({
      where: { id: referredUserId },
      select: { fullName: true, email: true }
    });

    if (!referrer || !referredUser) {
      throw new Error('Referrer or referred user not found');
    }

    // Process bonus in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update referrer's wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: referrerId },
        data: {
          balance: {
            increment: bonusAmount
          },
          totalReferralBonus: {
            increment: bonusAmount
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: referrerId,
          type: 'REFERRAL_BONUS',
          amount: bonusAmount,
          description: `Referral bonus from ${referredUser.fullName}`,
          referenceId: referredUserId
        }
      });

      // Create referral bonus record
      const bonusRecord = await tx.referralBonus.create({
        data: {
          referrerId,
          referredId: referredUserId,
          depositId: 'deposit-ref', // This should be the actual deposit ID
          bonusAmount,
          bonusRate
        }
      });

      return { updatedWallet, transaction, bonusRecord };
    });

    // Send notification email to referrer
    try {
      const totalReferrals = await prisma.user.count({
        where: { referredBy: referrerId }
      });

      await sendEmail({
        to: referrer.email,
        template: 'referralBonus',
        data: {
          fullName: referrer.fullName,
          referredUser: referredUser.fullName,
          bonusAmount: bonusAmount.toFixed(8),
          currency: 'USD', // This should be dynamic based on deposit
          totalReferrals,
          referralCode: referrer.referralCode
        }
      });
    } catch (emailError) {
      console.error('Failed to send referral bonus email:', emailError);
    }

    console.log(`Referral bonus processed: ${bonusAmount} for user ${referrerId}`);
    return result;

  } catch (error) {
    console.error('Error processing referral bonus:', error);
    throw error;
  }
};

// Update wallet balance (for deposits/withdrawals)
const updateWalletBalance = async (userId, amount, type, description, referenceId = null) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update wallet balance
      const updateData = {
        balance: {
          [amount > 0 ? 'increment' : 'decrement']: Math.abs(amount)
        }
      };

      // Update specific totals based on type
      if (type === 'DEPOSIT') {
        updateData.totalDeposits = {
          increment: Math.abs(amount)
        };
      }

      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: updateData
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type,
          amount: Math.abs(amount),
          description,
          referenceId
        }
      });

      return { updatedWallet, transaction };
    });

    return result;
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

// Get transaction history with pagination
const getTransactionHistory = async (userId, page = 1, limit = 20, type = null) => {
  try {
    const skip = (page - 1) * limit;
    
    const whereClause = {
      userId,
      ...(type && { type })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      
      prisma.transaction.count({ where: whereClause })
    ]);

    return {
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

// Calculate projected earnings
const calculateProjectedEarnings = async (userId, days = 30) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const settings = await prisma.adminSettings.findFirst();
    if (!settings) {
      throw new Error('Admin settings not found');
    }

    const currentBalance = parseFloat(wallet.balance);
    const dailyRate = parseFloat(settings.dailyGrowthRate);
    
    // Calculate compound growth
    const projectedBalance = currentBalance * Math.pow(1 + dailyRate, days);
    const totalEarnings = projectedBalance - currentBalance;

    return {
      currentBalance,
      projectedBalance,
      totalEarnings,
      dailyRate: dailyRate * 100, // Convert to percentage
      days
    };
  } catch (error) {
    console.error('Error calculating projected earnings:', error);
    throw error;
  }
};

module.exports = {
  processWalletGrowth,
  getWalletStats,
  processReferralBonus,
  updateWalletBalance,
  getTransactionHistory,
  calculateProjectedEarnings
};
