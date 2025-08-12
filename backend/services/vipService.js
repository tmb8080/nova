const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Process completed earning sessions and pay users
 */
async function processCompletedEarningSessions() {
  try {
    console.log('Processing completed earning sessions...');
    
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
              description: 'Daily VIP earnings completed'
            }
          });
        });

        results.push({
          sessionId: session.id,
          userId: session.userId,
          amount: session.earningsAmount,
          status: 'success'
        });

        console.log(`Paid ${session.earningsAmount} to user ${session.userId}`);
      } catch (error) {
        console.error(`Error processing session ${session.id}:`, error);
        results.push({
          sessionId: session.id,
          userId: session.userId,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`Processed ${results.length} earning sessions`);
    return results;
  } catch (error) {
    console.error('Error in processCompletedEarningSessions:', error);
    throw error;
  }
}

/**
 * Get VIP statistics for a user
 */
async function getUserVipStats(userId) {
  try {
    const userVip = await prisma.userVip.findUnique({
      where: { userId },
      include: {
        vipLevel: true
      }
    });

    if (!userVip) {
      return {
        hasVip: false,
        vipLevel: null,
        activeSession: null,
        todayEarnings: 0,
        canStartEarning: false
      };
    }

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

    // Check if user can start earning (no active session and no session started today)
    const todaySession = await prisma.earningsSession.findFirst({
      where: {
        userId,
        startedAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const canStartEarning = !activeSession && !todaySession;

    return {
      hasVip: true,
      vipLevel: userVip.vipLevel,
      userVip,
      activeSession,
      todayEarnings: todayEarnings._sum.earningsAmount || 0,
      canStartEarning
    };
  } catch (error) {
    console.error('Error getting user VIP stats:', error);
    throw error;
  }
}

/**
 * Check if user can withdraw earnings today
 */
async function canWithdrawToday(userId) {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user already withdrew today
    const hasWithdrawnToday = wallet.lastWithdrawal && wallet.lastWithdrawal >= today;
    
    // Check if user has minimum earnings
    const hasMinimumEarnings = wallet.dailyEarnings >= 10;

    return !hasWithdrawnToday && hasMinimumEarnings;
  } catch (error) {
    console.error('Error checking withdrawal eligibility:', error);
    return false;
  }
}

/**
 * Create or update VIP levels
 */
async function createOrUpdateVipLevels() {
  try {
    console.log('Creating/updating VIP levels...');
    
    const vipLevels = [
      { name: 'Starter', amount: 30, dailyEarning: 2 },
      { name: 'Bronze', amount: 180, dailyEarning: 10 },
      { name: 'Silver', amount: 400, dailyEarning: 24 },
      { name: 'Gold', amount: 1000, dailyEarning: 50 },
      { name: 'Platinum', amount: 1500, dailyEarning: 65 },
      { name: 'Diamond', amount: 2000, dailyEarning: 75 },
      { name: 'Elite', amount: 5000, dailyEarning: 200 },
      { name: 'Master', amount: 6000, dailyEarning: 250 },
      { name: 'Legend', amount: 12000, dailyEarning: 500 },
      { name: 'Supreme', amount: 25000, dailyEarning: 800 }
    ];

    const results = [];

    for (const vip of vipLevels) {
      try {
        const result = await prisma.vipLevel.upsert({
          where: { name: vip.name },
          update: {
            amount: vip.amount,
            dailyEarning: vip.dailyEarning,
            isActive: true
          },
          create: {
            name: vip.name,
            amount: vip.amount,
            dailyEarning: vip.dailyEarning,
            isActive: true
          }
        });

        results.push({
          name: vip.name,
          status: 'success',
          data: result
        });

        console.log(`VIP level ${vip.name} created/updated successfully`);
      } catch (error) {
        console.error(`Error creating/updating VIP level ${vip.name}:`, error);
        results.push({
          name: vip.name,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log('VIP levels creation/update completed');
    return results;
  } catch (error) {
    console.error('Error in createOrUpdateVipLevels:', error);
    throw error;
  }
}

/**
 * Get all VIP levels
 */
async function getAllVipLevels() {
  try {
    const vipLevels = await prisma.vipLevel.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });
    
    return vipLevels;
  } catch (error) {
    console.error('Error getting VIP levels:', error);
    throw error;
  }
}

/**
 * Get VIP level by ID
 */
async function getVipLevelById(id) {
  try {
    const vipLevel = await prisma.vipLevel.findUnique({
      where: { id }
    });
    
    return vipLevel;
  } catch (error) {
    console.error('Error getting VIP level by ID:', error);
    throw error;
  }
}

module.exports = {
  processCompletedEarningSessions,
  getUserVipStats,
  canWithdrawToday,
  createOrUpdateVipLevels,
  getAllVipLevels,
  getVipLevelById
};
