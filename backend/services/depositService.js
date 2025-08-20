const { PrismaClient } = require('@prisma/client');
const { updateWalletBalance, processReferralBonus } = require('./walletService');
const { sendEmail } = require('./emailService');
// Auto-complete task functionality removed - only daily earning tasks available

const prisma = new PrismaClient();

// Process USDT deposit confirmation
const processUsdtDepositConfirmation = async (depositId, transactionHash) => {
  try {
    console.log(`Processing USDT deposit confirmation for deposit ${depositId}`);

    // Get deposit details
    const deposit = await prisma.deposit.findUnique({
      where: { id: depositId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            referredBy: true
          }
        }
      }
    });

    if (!deposit) {
      throw new Error(`Deposit ${depositId} not found`);
    }

    if (deposit.status !== 'PENDING') {
      console.log(`Deposit ${depositId} already processed with status: ${deposit.status}`);
      return deposit;
    }

    // Process deposit in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: 'CONFIRMED',
          transactionHash,
          updatedAt: new Date()
        }
      });

      // Update user wallet
      const walletUpdate = await updateWalletBalance(
        deposit.userId,
        parseFloat(deposit.amount),
        'DEPOSIT',
        `USDT deposit via ${deposit.network}`,
        depositId
      );

      // Process referral bonus if user was referred
      let referralBonus = null;
      if (deposit.user.referredBy) {
        try {
          referralBonus = await processReferralBonus(
            deposit.user.referredBy,
            deposit.userId,
            parseFloat(deposit.amount),
            deposit.id
          );
        } catch (error) {
          console.error('Error processing referral bonus:', error);
        }
      }

      return { updatedDeposit, walletUpdate, referralBonus };
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: deposit.user.email,
        template: 'depositConfirmed',
        data: {
          fullName: deposit.user.fullName,
          amount: deposit.amount,
          currency: deposit.currency,
          network: deposit.network,
          transactionHash
        }
      });
    } catch (emailError) {
      console.error('Failed to send deposit confirmation email:', emailError);
    }

    // Note: Auto-complete task functionality removed - only daily earning tasks are available

    console.log(`USDT deposit ${depositId} processed successfully`);
    return result;

  } catch (error) {
    console.error(`Error processing USDT deposit confirmation for ${depositId}:`, error);
    throw error;
  }
};

// Create USDT deposit record
const createUsdtDeposit = async (userId, amount, network, transactionHash = null) => {
  try {
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: parseFloat(amount),
        currency: 'USDT',
        network,
        transactionHash,
        status: 'PENDING',
        depositType: 'USDT_DIRECT'
      }
    });

    console.log(`USDT deposit record created: ${deposit.id}`);
    return deposit;

  } catch (error) {
    console.error('Error creating USDT deposit:', error);
    throw error;
  }
};

// Get deposit statistics
const getDepositStats = async (userId) => {
  try {
    const stats = await prisma.deposit.aggregate({
      where: {
        userId,
        status: 'CONFIRMED'
      },
      _sum: {
        amount: true
      },
      _count: true
    });

    const pendingDeposits = await prisma.deposit.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    return {
      totalDeposits: parseFloat(stats._sum.amount || 0),
      depositCount: stats._count,
      pendingCount: pendingDeposits
    };

  } catch (error) {
    console.error('Error fetching deposit stats:', error);
    throw error;
  }
};

// Get recent deposits
const getRecentDeposits = async (userId, limit = 10) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return deposits;

  } catch (error) {
    console.error('Error fetching recent deposits:', error);
    throw error;
  }
};

module.exports = {
  processUsdtDepositConfirmation,
  createUsdtDeposit,
  getDepositStats,
  getRecentDeposits
};
