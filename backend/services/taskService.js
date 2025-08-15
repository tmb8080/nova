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

/**
 * Get available tasks for a user
 */
async function getAvailableTasks(userId) {
  try {
    // Get all active tasks
    const tasks = await prisma.task.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    // Get user's task progress
    const userTasks = await prisma.userTask.findMany({
      where: { userId },
      include: { task: true }
    });

    // Map tasks with user progress
    const tasksWithProgress = tasks.map(task => {
      const userTask = userTasks.find(ut => ut.taskId === task.id);
      
      if (!userTask) {
        return {
          ...task,
          status: 'PENDING',
          canStart: true,
          canComplete: false,
          progress: 0
        };
      }

      // Check if task can be repeated
      let canStart = false;
      let canComplete = false;
      
      if (task.isRepeatable && userTask.status === 'COMPLETED') {
        // Check cooldown period
        if (task.cooldownHours) {
          const cooldownTime = new Date(userTask.completedAt.getTime() + task.cooldownHours * 60 * 60 * 1000);
          canStart = new Date() >= cooldownTime;
        } else {
          canStart = true;
        }
      } else if (userTask.status === 'PENDING') {
        canStart = true;
      } else if (userTask.status === 'IN_PROGRESS') {
        canComplete = true;
      }

      return {
        ...task,
        status: userTask.status,
        startedAt: userTask.startedAt,
        completedAt: userTask.completedAt,
        rewardEarned: userTask.rewardEarned,
        canStart,
        canComplete,
        progress: userTask.status === 'COMPLETED' ? 100 : 0
      };
    });

    return {
      success: true,
      data: tasksWithProgress
    };
  } catch (error) {
    console.error('Error getting available tasks:', error);
    throw error;
  }
}

/**
 * Start a task
 */
async function startTask(userId, taskId) {
  try {
    // Get task details
    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task || !task.isActive) {
      throw new Error('Task not found or inactive');
    }

    // Check if user can start this task
    const existingUserTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      }
    });

    if (existingUserTask) {
      if (existingUserTask.status === 'IN_PROGRESS') {
        throw new Error('Task already in progress');
      }
      
      if (existingUserTask.status === 'COMPLETED' && !task.isRepeatable) {
        throw new Error('Task already completed and not repeatable');
      }

      if (existingUserTask.status === 'COMPLETED' && task.isRepeatable) {
        // Check cooldown period
        if (task.cooldownHours) {
          const cooldownTime = new Date(existingUserTask.completedAt.getTime() + task.cooldownHours * 60 * 60 * 1000);
          if (new Date() < cooldownTime) {
            const remainingHours = Math.ceil((cooldownTime - new Date()) / (1000 * 60 * 60));
            throw new Error(`Task is on cooldown. Try again in ${remainingHours} hours`);
          }
        }
      }
    }

    // Create or update user task
    const userTask = await prisma.userTask.upsert({
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
        message: `Task "${task.title}" started successfully`,
        userTask
      }
    };
  } catch (error) {
    console.error('Error starting task:', error);
    throw error;
  }
}

/**
 * Complete a task and add reward to wallet
 */
async function completeTask(userId, taskId) {
  try {
    // Get user task
    const userTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId
        }
      },
      include: { task: true }
    });

    if (!userTask) {
      throw new Error('Task not found for user');
    }

    if (userTask.status !== 'IN_PROGRESS') {
      throw new Error('Task is not in progress');
    }

    const task = userTask.task;
    const rewardAmount = parseFloat(task.reward);

    // Complete task and add reward to wallet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user task
      const updatedUserTask = await tx.userTask.update({
        where: { id: userTask.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          rewardEarned: rewardAmount
        }
      });

      // Add reward to user's wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            increment: rewardAmount
          },
          totalEarnings: {
            increment: rewardAmount
          }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'TASK_REWARD',
          amount: rewardAmount,
          description: `Task completion reward: ${task.title}`,
          referenceId: userTask.id,
          metadata: {
            taskId: task.id,
            taskType: task.type,
            taskTitle: task.title
          }
        }
      });

      return { updatedUserTask, updatedWallet, transaction };
    });

    return {
      success: true,
      data: {
        message: `Task "${task.title}" completed! You earned $${rewardAmount.toFixed(2)}`,
        reward: rewardAmount,
        taskTitle: task.title
      }
    };
  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

/**
 * Get user's task history
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

/**
 * Auto-complete certain task types based on user actions
 */
async function autoCompleteTask(userId, taskType, metadata = {}) {
  try {
    // Find tasks of the specified type
    const tasks = await prisma.task.findMany({
      where: {
        type: taskType,
        isActive: true
      }
    });

    const results = [];

    for (const task of tasks) {
      try {
        // Check if user can complete this task
        const userTask = await prisma.userTask.findUnique({
          where: {
            userId_taskId: {
              userId,
              taskId: task.id
            }
          }
        });

        if (!userTask || userTask.status === 'PENDING') {
          // Start and complete the task automatically
          await startTask(userId, task.id);
          const result = await completeTask(userId, task.id);
          results.push({
            taskId: task.id,
            taskTitle: task.title,
            status: 'completed',
            reward: parseFloat(task.reward)
          });
        }
      } catch (error) {
        console.error(`Error auto-completing task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          taskTitle: task.title,
          status: 'failed',
          error: error.message
        });
      }
    }

    return {
      success: true,
      data: {
        message: `Auto-completed ${results.filter(r => r.status === 'completed').length} tasks`,
        results
      }
    };
  } catch (error) {
    console.error('Error auto-completing tasks:', error);
    throw error;
  }
}

module.exports = {
  startEarningSession,
  getEarningSessionStatus,
  stopEarningSession,
  getEarningHistory,
  getAvailableTasks,
  startTask,
  completeTask,
  getTaskHistory,
  autoCompleteTask
};
