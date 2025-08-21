const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Start daily earning session (the only task available)
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
        message: 'Daily earning session started successfully! Your earnings will accumulate for the next 24 hours.'
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
          message: 'No active session. Click "Start Daily Task" to begin your 24-hour earning cycle.'
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
      console.log(`Session ${session.id} expired, marking as completed and processing earnings...`);
      
      await prisma.$transaction(async (tx) => {
        // Mark session as completed
        await tx.earningsSession.update({
          where: { id: session.id },
          data: { 
            status: 'COMPLETED',
            actualEndTime: endTime,
            totalEarnings: session.dailyEarningRate
          }
        });

        // Add earnings to user's wallet - update both balance and dailyEarnings
        await tx.wallet.update({
          where: { userId: userId },
          data: {
            balance: {
              increment: session.dailyEarningRate
            },
            dailyEarnings: {
              increment: session.dailyEarningRate
            },
            totalEarnings: {
              increment: session.dailyEarningRate
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: userId,
            type: 'VIP_EARNINGS',
            amount: session.dailyEarningRate,
            description: `Daily task earnings from ${session.vipLevel.name} VIP level`,
            referenceId: session.id,
            status: 'COMPLETED'
          }
        });
      });

      console.log(`✅ Session ${session.id} completed and earnings processed: ${session.dailyEarningRate}`);

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
        message: `Daily task active! Current earnings: $${currentEarnings.toFixed(2)}. Time remaining: ${remainingHours}h ${remainingMinutes}m`
      }
    };
  } catch (error) {
    console.error('Error getting earning session status:', error);
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

/**
 * Get available daily earning task
 */
async function getAvailableTasks(userId) {
  try {
    // Get the daily earning task
    const task = await prisma.task.findFirst({
      where: { 
        type: 'DAILY_EARNING',
        isActive: true 
      }
    });

    if (!task) {
      return {
        success: true,
        data: []
      };
    }

    // Get user's task progress
    const userTask = await prisma.userTask.findFirst({
      where: { 
        userId,
        taskId: task.id
      }
    });

    // Check if user can start the task
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeSession = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        startTime: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      }
    });

    const canStart = !activeSession;

    return {
      success: true,
      data: [{
        ...task,
        status: activeSession ? 'IN_PROGRESS' : 'PENDING',
        canStart,
        canComplete: false,
        progress: activeSession ? 50 : 0,
        message: activeSession ? 'Daily task in progress' : 'Ready to start daily task'
      }]
    };
  } catch (error) {
    console.error('Error getting available tasks:', error);
    throw error;
  }
}

/**
 * Start the daily earning task
 */
async function startTask(userId, taskId) {
  try {
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || !task.isActive || task.type !== 'DAILY_EARNING') {
      throw new Error('Invalid task or task not available');
    }

    // Check if user can start this task
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
      throw new Error('You already have an active daily earning session');
    }

    // Start the earning session
    const result = await startEarningSession(userId);

    // Create or update user task record
    await prisma.userTask.upsert({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      },
      update: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        completedAt: null,
        rewardEarned: null
      },
      create: {
        userId,
        taskId,
        status: 'IN_PROGRESS',
        startedAt: new Date()
      }
    });

    return {
      success: true,
      data: {
        message: 'Daily earning task started successfully',
        ...result.data
      }
    };
  } catch (error) {
    console.error('Error starting task:', error);
    throw error;
  }
}

/**
 * Get user's task history (only daily earning tasks)
 */
async function getTaskHistory(userId) {
  try {
    const userTasks = await prisma.userTask.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { updatedAt: 'desc' }
    });

    const totalEarned = userTasks
      .filter(ut => ut.status === 'COMPLETED' && ut.rewardEarned)
      .reduce((sum, ut) => sum + parseFloat(ut.rewardEarned), 0);

    return {
      success: true,
      data: {
        tasks: userTasks,
        totalEarned,
        completedCount: userTasks.filter(ut => ut.status === 'COMPLETED').length,
        totalCount: userTasks.length
      }
    };
  } catch (error) {
    console.error('Error getting task history:', error);
    throw error;
  }
}

module.exports = {
  startEarningSession,
  getEarningSessionStatus,
  getEarningHistory,
  getAvailableTasks,
  startTask,
  getTaskHistory
};
