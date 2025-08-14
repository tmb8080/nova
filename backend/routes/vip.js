const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all VIP levels
router.get('/levels', authenticateToken, async (req, res) => {
  try {
    const vipLevels = await prisma.vipLevel.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });

    // Convert Decimal values to numbers for frontend compatibility
    const formattedVipLevels = vipLevels.map(level => ({
      ...level,
      amount: parseFloat(level.amount),
      dailyEarning: parseFloat(level.dailyEarning)
    }));

    res.json({
      success: true,
      data: formattedVipLevels
    });
  } catch (error) {
    console.error('Error fetching VIP levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch VIP levels'
    });
  }
});

// Join VIP level
router.post('/join', authenticateToken, async (req, res) => {
  try {
    console.log('VIP join request received:', req.body);
    console.log('User ID:', req.user.id);
    const { vipLevelId } = req.body;
    const userId = req.user.id;

    // Get user details to check verification status
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    console.log('User details:', {
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified
    });

    // Check if user already has VIP
    const existingVip = await prisma.userVip.findUnique({
      where: { userId }
    });

    console.log('Existing VIP check:', existingVip);

    if (existingVip) {
      return res.status(400).json({
        success: false,
        message: 'User already has a VIP membership'
      });
    }

    // Get VIP level details
    const vipLevel = await prisma.vipLevel.findUnique({
      where: { id: vipLevelId }
    });

    if (!vipLevel) {
      return res.status(404).json({
        success: false,
        message: 'VIP level not found'
      });
    }

    // Check if user has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    const vipAmount = parseFloat(vipLevel.amount);
    const walletBalance = parseFloat(wallet?.balance || 0);

    console.log('Wallet check:', { 
      wallet: wallet ? 'exists' : 'not found', 
      walletBalance, 
      vipAmount,
      walletDetails: wallet ? {
        id: wallet.id,
        balance: wallet.balance,
        totalDeposits: wallet.totalDeposits
      } : null
    });

    if (!wallet) {
      console.log('Creating wallet for user:', userId);
      // Create wallet for user if it doesn't exist
      await prisma.wallet.create({
        data: {
          userId: userId
        }
      });
      
      // Fetch the newly created wallet
      const newWallet = await prisma.wallet.findUnique({
        where: { userId }
      });
      
      console.log('New wallet created:', newWallet);
      
      if (!newWallet) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create wallet. Please try again.'
        });
      }
      
      // Update wallet reference
      wallet = newWallet;
    }

    // Recalculate balance after potential wallet creation
    const finalWalletBalance = parseFloat(wallet.balance || 0);
    
    if (finalWalletBalance < vipAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You have $${finalWalletBalance} but need $${vipAmount} to join this VIP level.`
      });
    }

    // Start transaction
    console.log('Starting VIP join transaction...');
    const result = await prisma.$transaction(async (tx) => {
      console.log('Deducting VIP amount from wallet...');
      // Deduct VIP amount from wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: vipLevel.amount
          }
        }
      });

      console.log('Creating VIP membership...');
      // Create VIP membership
      const userVip = await tx.userVip.create({
        data: {
          userId,
          vipLevelId,
          totalPaid: vipLevel.amount
        }
      });

      console.log('Creating transaction record...');
      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'VIP_PAYMENT',
          amount: vipLevel.amount,
          description: `VIP ${vipLevel.name} membership payment`
        }
      });

      console.log('Transaction completed successfully');
      return userVip;
    });

    res.json({
      success: true,
      message: 'Successfully joined VIP level',
      data: result
    });
  } catch (error) {
    console.error('Error joining VIP:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to join VIP level',
      error: error.message
    });
  }
});

// Get user VIP status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userVip = await prisma.userVip.findUnique({
      where: { userId },
      include: {
        vipLevel: true
      }
    });

    // Get current active session
    const activeSession = await prisma.earningsSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expectedEndTime: {
          gt: new Date()
        }
      }
    });

    // Get today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEarnings = await prisma.earningsSession.aggregate({
      where: {
        userId,
        startTime: {
          gte: today,
          lt: tomorrow
        },
        status: 'COMPLETED'
      },
      _sum: {
        totalEarnings: true
      }
    });

    res.json({
      success: true,
      data: {
        userVip: userVip ? {
          ...userVip,
          totalPaid: parseFloat(userVip.totalPaid),
          vipLevel: userVip.vipLevel ? {
            ...userVip.vipLevel,
            amount: parseFloat(userVip.vipLevel.amount),
            dailyEarning: parseFloat(userVip.vipLevel.dailyEarning)
          } : null
        } : null,
        activeSession: activeSession ? {
          ...activeSession,
          totalEarnings: parseFloat(activeSession.totalEarnings || 0)
        } : null,
        todayEarnings: parseFloat(todayEarnings._sum.totalEarnings || 0)
      }
    });
  } catch (error) {
    console.error('Error fetching VIP status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch VIP status'
    });
  }
});

// Start earning session
router.post('/start-earning', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has VIP membership
    const userVip = await prisma.userVip.findUnique({
      where: { userId },
      include: { vipLevel: true }
    });

    if (!userVip || !userVip.isActive) {
      return res.status(400).json({
        success: false,
        message: 'No active VIP membership found'
      });
    }

    // Check if there's already an active session
    const activeSession = await prisma.earningsSession.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        expectedEndTime: {
          gt: new Date()
        }
      }
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active earning session'
      });
    }

    // Create new earning session (24 hours)
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

    const session = await prisma.earningsSession.create({
      data: {
        userId,
        vipLevelId: userVip.vipLevelId,
        startTime: startTime,
        expectedEndTime: endTime,
        dailyEarningRate: userVip.vipLevel.dailyEarning,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      message: 'Earning session started successfully',
      data: session
    });
  } catch (error) {
    console.error('Error starting earning session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start earning session'
    });
  }
});

// Process completed earning sessions (called by cron job)
router.post('/process-earnings', authenticateToken, async (req, res) => {
  try {
    // Find completed sessions that haven't been paid
    const completedSessions = await prisma.earningsSession.findMany({
      where: {
        status: 'ACTIVE',
        expectedEndTime: {
          lt: new Date()
        }
      },
      include: {
        user: {
          include: {
            wallet: true
          }
        }
      }
    });

    const results = [];

    for (const session of completedSessions) {
      try {
        await prisma.$transaction(async (tx) => {
          // Add earnings to wallet
          await tx.wallet.update({
            where: { userId: session.userId },
            data: {
              dailyEarnings: {
                increment: session.dailyEarningRate
              },
              totalEarnings: {
                increment: session.dailyEarningRate
              }
            }
          });

          // Mark session as completed
          await tx.earningsSession.update({
            where: { id: session.id },
            data: {
              status: 'COMPLETED',
              actualEndTime: new Date(),
              totalEarnings: session.dailyEarningRate
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: session.userId,
              type: 'VIP_EARNINGS',
              amount: session.dailyEarningRate,
              description: 'Daily VIP earnings'
            }
          });
        });

        results.push({
          sessionId: session.id,
          userId: session.userId,
          amount: session.dailyEarningRate,
          status: 'success'
        });
      } catch (error) {
        results.push({
          sessionId: session.id,
          userId: session.userId,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Processed ${results.length} earning sessions`,
      data: results
    });
  } catch (error) {
    console.error('Error processing earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process earnings'
    });
  }
});

module.exports = router;
