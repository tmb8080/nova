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

    res.json({
      success: true,
      data: vipLevels
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
    const { vipLevelId } = req.body;
    const userId = req.user.id;

    // Check if user already has VIP
    const existingVip = await prisma.userVip.findUnique({
      where: { userId }
    });

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

    if (!wallet || wallet.balance < vipLevel.amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to join this VIP level'
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct VIP amount from wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: vipLevel.amount
          }
        }
      });

      // Create VIP membership
      const userVip = await tx.userVip.create({
        data: {
          userId,
          vipLevelId,
          totalPaid: vipLevel.amount
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: 'VIP_PAYMENT',
          amount: vipLevel.amount,
          description: `VIP ${vipLevel.name} membership payment`
        }
      });

      return userVip;
    });

    res.json({
      success: true,
      message: 'Successfully joined VIP level',
      data: result
    });
  } catch (error) {
    console.error('Error joining VIP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join VIP level'
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
        isActive: true,
        endsAt: {
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
        startedAt: {
          gte: today,
          lt: tomorrow
        },
        isPaid: true
      },
      _sum: {
        earningsAmount: true
      }
    });

    res.json({
      success: true,
      data: {
        userVip,
        activeSession,
        todayEarnings: todayEarnings._sum.earningsAmount || 0
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
        isActive: true,
        endsAt: {
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
        startedAt: startTime,
        endsAt: endTime,
        earningsAmount: userVip.vipLevel.dailyEarning,
        isActive: true
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
        isActive: true,
        isPaid: false,
        endsAt: {
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
                increment: session.earningsAmount
              },
              totalEarnings: {
                increment: session.earningsAmount
              }
            }
          });

          // Mark session as paid
          await tx.earningsSession.update({
            where: { id: session.id },
            data: {
              isPaid: true,
              paidAt: new Date(),
              isActive: false
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: session.userId,
              type: 'VIP_EARNINGS',
              amount: session.earningsAmount,
              description: 'Daily VIP earnings'
            }
          });
        });

        results.push({
          sessionId: session.id,
          userId: session.userId,
          amount: session.earningsAmount,
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
