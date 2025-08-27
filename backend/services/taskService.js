const { PrismaClient } = require('@prisma/client');
const { updateWalletBalance } = require('./walletService');
const prisma = new PrismaClient();

/**
 * Start daily earning session (1 hour duration)
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

    // Check if user has completed a task in the last 24 hours
    const lastCompletedSession = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        status: 'COMPLETED'
      },
      orderBy: {
        actualEndTime: 'desc'
      }
    });

    if (lastCompletedSession) {
      const timeSinceLastCompletion = Date.now() - new Date(lastCompletedSession.actualEndTime).getTime();
      const hoursSinceLastCompletion = timeSinceLastCompletion / (1000 * 60 * 60);
      
      if (hoursSinceLastCompletion < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastCompletion);
        throw new Error(`You can start a new daily task in ${remainingHours} hours. Daily tasks have a 24-hour cooldown.`);
      }
    }

    // Check if there's already an active session
    const activeSession = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE'
      }
    });

    if (activeSession) {
      throw new Error('You already have an active earning session.');
    }

    // Calculate earnings for 1 hour (daily rate / 24)
    const hourlyEarningRate = parseFloat(userVip.vipLevel.dailyEarning) / 24;
    const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds

    // Create new earning session
    const session = await prisma.earningsSession.create({
      data: {
        userId: userId,
        vipLevelId: userVip.vipLevelId,
        startTime: new Date(),
        status: 'ACTIVE',
        dailyEarningRate: hourlyEarningRate,
        expectedEndTime: new Date(Date.now() + sessionDuration) // 1 hour from now
      }
    });

    // Schedule automatic completion after 1 hour
    setTimeout(async () => {
      try {
        await completeEarningSession(session.id);
      } catch (error) {
        console.error('Error auto-completing session:', error);
      }
    }, sessionDuration);

    return {
      success: true,
      data: {
        sessionId: session.id,
        startTime: session.startTime,
        expectedEndTime: session.expectedEndTime,
        dailyEarningRate: session.dailyEarningRate,
        message: 'Daily earning session started! Your task will complete automatically in 1 hour and earnings will be deposited to your wallet.'
      }
    };
  } catch (error) {
    console.error('Error starting earning session:', error);
    throw error;
  }
}

/**
 * Complete earning session and process payout
 */
async function completeEarningSession(sessionId) {
  try {
    const session = await prisma.earningsSession.findUnique({
      where: { id: sessionId },
      include: {
        vipLevel: true,
        user: true
      }
    });

    if (!session || session.status !== 'ACTIVE') {
      console.log(`Session ${sessionId} not found or already completed`);
      return;
    }

    console.log(`Completing session ${sessionId} for user ${session.userId}`);

    await prisma.$transaction(async (tx) => {
      // Mark session as completed
      await tx.earningsSession.update({
        where: { id: sessionId },
        data: { 
          status: 'COMPLETED',
          actualEndTime: new Date(),
          totalEarnings: session.dailyEarningRate
        }
      });

      // Add earnings to user's wallet
      await updateWalletBalance(
        session.userId,
        session.dailyEarningRate,
        'VIP_EARNINGS',
        `Daily task earnings from ${session.vipLevel.name} VIP level`,
        sessionId
      );

      // Update user task record
      const task = await tx.task.findFirst({
        where: { type: 'DAILY_EARNING' }
      });

      if (task) {
        await tx.userTask.upsert({
          where: {
            userId_taskId: {
              userId: session.userId,
              taskId: task.id
            }
          },
          update: {
            status: 'COMPLETED',
            completedAt: new Date(),
            rewardEarned: session.dailyEarningRate
          },
          create: {
            userId: session.userId,
            taskId: task.id,
            status: 'COMPLETED',
            startedAt: session.startTime,
            completedAt: new Date(),
            rewardEarned: session.dailyEarningRate
          }
        });
      }
    });

    console.log(`✅ Session ${sessionId} completed and earnings processed: ${session.dailyEarningRate}`);
  } catch (error) {
    console.error('Error completing earning session:', error);
    throw error;
  }
}

/**
 * Get current earning session status
 */
async function getEarningSessionStatus(userId) {
  try {
    // Check for active session
    const activeSession = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        status: 'ACTIVE'
      },
      include: {
        vipLevel: true
      }
    });

    if (activeSession) {
      const now = new Date();
      const startTime = new Date(activeSession.startTime);
      const endTime = new Date(activeSession.expectedEndTime);
      const isExpired = now >= endTime;

      // Calculate current earnings and progress
      const elapsedMs = Math.min(now - startTime, endTime - startTime);
      const totalDuration = endTime - startTime;
      const progress = (elapsedMs / totalDuration) * 100;
      const currentEarnings = (elapsedMs / totalDuration) * parseFloat(activeSession.dailyEarningRate);

      // Calculate remaining time
      const remainingMs = Math.max(0, endTime - now);
      const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
      const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

      return {
        success: true,
        data: {
          hasActiveSession: true,
          canStart: false,
          sessionId: activeSession.id,
          startTime: activeSession.startTime,
          expectedEndTime: activeSession.expectedEndTime,
          currentEarnings: currentEarnings,
          dailyEarningRate: activeSession.dailyEarningRate,
          remainingTime: {
            minutes: remainingMinutes,
            seconds: remainingSeconds
          },
          progress: progress,
          message: `Daily task active! Current earnings: $${currentEarnings.toFixed(2)}. Time remaining: ${remainingMinutes}m ${remainingSeconds}s`
        }
      };
    }

    // Check last completed session for cooldown
    const lastCompletedSession = await prisma.earningsSession.findFirst({
      where: {
        userId: userId,
        status: 'COMPLETED'
      },
      orderBy: {
        actualEndTime: 'desc'
      }
    });

    if (lastCompletedSession) {
      const timeSinceLastCompletion = Date.now() - new Date(lastCompletedSession.actualEndTime).getTime();
      const hoursSinceLastCompletion = timeSinceLastCompletion / (1000 * 60 * 60);
      
      if (hoursSinceLastCompletion < 24) {
        const remainingHours = Math.ceil(24 - hoursSinceLastCompletion);
        const remainingMinutes = Math.ceil((24 - hoursSinceLastCompletion) * 60);
        
        return {
          success: true,
          data: {
            hasActiveSession: false,
            canStart: false,
            cooldownRemaining: {
              hours: remainingHours,
              minutes: remainingMinutes
            },
            lastEarnings: lastCompletedSession.totalEarnings,
            message: `Daily task completed! You earned $${lastCompletedSession.totalEarnings}. Next task available in ${remainingHours}h ${remainingMinutes % 60}m`
          }
        };
      }
    }

    return {
      success: true,
      data: {
        hasActiveSession: false,
        canStart: true,
        message: 'Ready to start daily task! Click "Start Daily Task" to begin your 1-hour earning session.'
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

    // Get current session status
    const sessionStatus = await getEarningSessionStatus(userId);
    
    const canStart = sessionStatus.data.canStart;
    const hasActiveSession = sessionStatus.data.hasActiveSession;

    return {
      success: true,
      data: [{
        ...task,
        status: hasActiveSession ? 'IN_PROGRESS' : (canStart ? 'PENDING' : 'COOLDOWN'),
        canStart,
        canComplete: false,
        progress: hasActiveSession ? sessionStatus.data.progress || 0 : 0,
        message: sessionStatus.data.message,
        cooldownRemaining: sessionStatus.data.cooldownRemaining,
        lastEarnings: sessionStatus.data.lastEarnings
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

    // Start the earning session
    const result = await startEarningSession(userId);

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
  getTaskHistory,
  completeEarningSession
};
