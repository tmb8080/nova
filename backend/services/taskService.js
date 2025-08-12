const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Start daily earning session
 */
async function startEarningSession(userId) {
  try {
    // Check if user has an active VIP level
    const userVip = await prisma.userVip.findFirst({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        vipLevel: true
      }
    });

    if (!userVip) {
      throw new Error('No active VIP level found. Please join a VIP level first.');
    }

    // Check if there's already an active session for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingSession = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        startTime: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      }
    });

    if (existingSession) {
      throw new Error('You already have an active earning session for today.');
    }

    // Create new earning session
    const session = await prisma.earningsSession.create({
      data: {
        userId: userId,
        vipLevelId: userVip.vipLevelId,
        startTime: new Date(),
        status: 'ACTIVE',
        dailyEarningRate: userVip.vipLevel.dailyEarning,
        expectedEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    });

    return {
      success: true,
      data: {
        sessionId: session.id,
        startTime: session.startTime,
        expectedEndTime: session.expectedEndTime,
        dailyEarningRate: session.dailyEarningRate,
        message: 'Earning session started successfully! Your earnings will accumulate for the next 24 hours.'
      }
    };
  } catch (error) {
    console.error('Error starting earning session:', error);
    throw error;
  }
}

/**
 * Get current earning session status
 */
async function getEarningSessionStatus(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const session = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        startTime: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      },
      include: {
        vipLevel: true
      }
    });

    if (!session) {
      return {
        success: true,
        data: {
          hasActiveSession: false,
          canStart: true,
          message: 'No active session. Click "Start Earning" to begin your daily profit cycle.'
        }
      };
    }

    const now = new Date();
    const startTime = new Date(session.startTime);
    const endTime = new Date(session.expectedEndTime);
    const isExpired = now >= endTime;

    // Calculate current earnings
    const elapsedHours = Math.min((now - startTime) / (1000 * 60 * 60), 24);
    const currentEarnings = (elapsedHours / 24) * parseFloat(session.dailyEarningRate);

    // If session is expired, mark it as completed
    if (isExpired) {
      await prisma.earningsSession.update({
        where: { id: session.id },
        data: { 
          status: 'COMPLETED',
          actualEndTime: endTime,
          totalEarnings: session.dailyEarningRate
        }
      });

      // Add earnings to user's wallet
      await prisma.wallet.update({
        where: { userId: userId },
        data: {
          balance: {
            increment: session.dailyEarningRate
          }
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: userId,
          type: 'EARNING',
          amount: session.dailyEarningRate,
          description: `Daily earnings from ${session.vipLevel.name} VIP level`,
          status: 'COMPLETED'
        }
      });

      return {
        success: true,
        data: {
          hasActiveSession: false,
          canStart: true,
          message: 'Your 24-hour earning cycle has completed! Earnings have been added to your wallet. Start a new cycle to continue earning.',
          completedEarnings: session.dailyEarningRate
        }
      };
    }

    // Calculate remaining time
    const remainingMs = endTime - now;
    const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      success: true,
      data: {
        hasActiveSession: true,
        canStart: false,
        sessionId: session.id,
        startTime: session.startTime,
        expectedEndTime: session.expectedEndTime,
        currentEarnings: currentEarnings,
        dailyEarningRate: session.dailyEarningRate,
        remainingTime: {
          hours: remainingHours,
          minutes: remainingMinutes
        },
        progress: (elapsedHours / 24) * 100,
        message: `Earning session active! Current earnings: $${currentEarnings.toFixed(2)}. Time remaining: ${remainingHours}h ${remainingMinutes}m`
      }
    };
  } catch (error) {
    console.error('Error getting earning session status:', error);
    throw error;
  }
}

/**
 * Stop earning session manually (optional)
 */
async function stopEarningSession(userId) {
  try {
    const session = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE'
      }
    });

    if (!session) {
      throw new Error('No active earning session found.');
    }

    const now = new Date();
    const startTime = new Date(session.startTime);
    const elapsedHours = Math.min((now - startTime) / (1000 * 60 * 60), 24);
    const earnedAmount = (elapsedHours / 24) * parseFloat(session.dailyEarningRate);

    // Update session
    await prisma.earningsSession.update({
      where: { id: session.id },
      data: {
        status: 'STOPPED',
        actualEndTime: now,
        totalEarnings: earnedAmount
      }
    });

    // Add earnings to wallet
    await prisma.wallet.update({
      where: { userId: userId },
      data: {
        balance: {
          increment: earnedAmount
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'EARNING',
        amount: earnedAmount,
        description: `Manual stop - earnings from ${elapsedHours.toFixed(2)} hours`,
        status: 'COMPLETED'
      }
    });

    return {
      success: true,
      data: {
        message: `Earning session stopped. You earned $${earnedAmount.toFixed(2)} for ${elapsedHours.toFixed(2)} hours.`,
        earnedAmount: earnedAmount,
        elapsedHours: elapsedHours
      }
    };
  } catch (error) {
    console.error('Error stopping earning session:', error);
    throw error;
  }
}

/**
 * Get user's earning history
 */
async function getEarningHistory(userId) {
  try {
    const sessions = await prisma.earningsSession.findMany({
      where: {
        userId: userId
      },
      include: {
        vipLevel: true
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 30 // Last 30 sessions
    });

    return {
      success: true,
      data: {
        sessions: sessions.map(session => ({
          id: session.id,
          startTime: session.startTime,
          endTime: session.actualEndTime || session.expectedEndTime,
          status: session.status,
          totalEarnings: session.totalEarnings,
          vipLevelName: session.vipLevel.name,
          dailyEarningRate: session.dailyEarningRate
        }))
      }
    };
  } catch (error) {
    console.error('Error getting earning history:', error);
    throw error;
  }
}

module.exports = {
  startEarningSession,
  getEarningSessionStatus,
  stopEarningSession,
  getEarningHistory
};
