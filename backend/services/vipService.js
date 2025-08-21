const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Complete expired earning sessions
 */
async function completeExpiredEarningSessions() {
  try {
    console.log('Completing expired earning sessions...');
    
    const now = new Date();
    
    // Find active sessions that have expired
    const expiredSessions = await prisma.earningsSession.findMany({
      where: {
        status: 'ACTIVE',
        expectedEndTime: {
          lt: now
        }
      },
      include: {
        user: {
          include: {
            wallet: true
          }
        },
        vipLevel: true
      }
    });

    console.log(`Found ${expiredSessions.length} expired sessions to complete`);

    const results = [];

    for (const session of expiredSessions) {
      try {
        console.log(`Completing expired session ${session.id} for user ${session.userId}`);
        
        // Mark session as completed with full daily earnings
        await prisma.earningsSession.update({
          where: { id: session.id },
          data: {
            status: 'COMPLETED',
            actualEndTime: new Date(session.expectedEndTime),
            totalEarnings: session.dailyEarningRate
          }
        });

        results.push({
          sessionId: session.id,
          userId: session.userId,
          amount: session.dailyEarningRate,
          status: 'completed'
        });

        console.log(`✅ Session ${session.id} marked as completed with earnings: $${session.dailyEarningRate}`);
      } catch (error) {
        console.error(`❌ Error completing session ${session.id}:`, error);
        results.push({
          sessionId: session.id,
          userId: session.userId,
          status: 'error',
          error: error.message
        });
      }
    }

    const completedCount = results.filter(r => r.status === 'completed').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`📊 Session completion: ${completedCount} completed, ${errorCount} failed`);
    return results;
  } catch (error) {
    console.error('❌ Error in completeExpiredEarningSessions:', error);
    throw error;
  }
}

/**
 * Process completed earning sessions and pay users
 */
async function processCompletedEarningSessions() {
  try {
    console.log('Processing completed earning sessions...');
    
    // Find completed sessions that haven't been paid yet
    const completedSessions = await prisma.earningsSession.findMany({
      where: {
        status: 'COMPLETED',
        totalEarnings: {
          not: null
        }
      },
      include: {
        user: {
          include: {
            wallet: true
          }
        },
        vipLevel: true
      }
    });

    console.log(`Found ${completedSessions.length} completed sessions to process`);

    const results = [];

    for (const session of completedSessions) {
      try {
        // Check if this session has already been processed (by checking if a transaction exists)
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId: session.userId,
            type: 'VIP_EARNINGS',
            referenceId: session.id
          }
        });

        if (existingTransaction) {
          console.log(`Session ${session.id} already processed, skipping...`);
          continue;
        }

        const earningsAmount = parseFloat(session.totalEarnings);
        console.log(`Processing session ${session.id} for user ${session.userId}, amount: ${earningsAmount}`);

        await prisma.$transaction(async (tx) => {
          // Add earnings to wallet - update both balance and dailyEarnings
          await tx.wallet.update({
            where: { userId: session.userId },
            data: {
              balance: {
                increment: earningsAmount
              },
              dailyEarnings: {
                increment: earningsAmount
              },
              totalEarnings: {
                increment: earningsAmount
              }
            }
          });

          // Create transaction record
          await tx.transaction.create({
            data: {
              userId: session.userId,
              type: 'VIP_EARNINGS',
              amount: earningsAmount,
              description: `Daily VIP earnings completed - ${session.vipLevel?.name || 'VIP'} level`,
              referenceId: session.id
            }
          });
        });

        results.push({
          sessionId: session.id,
          userId: session.userId,
          amount: earningsAmount,
          status: 'success'
        });

        console.log(`✅ Successfully paid ${earningsAmount} to user ${session.userId} for session ${session.id}`);
      } catch (error) {
        console.error(`❌ Error processing session ${session.id}:`, error);
        results.push({
          sessionId: session.id,
          userId: session.userId,
          status: 'error',
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`📊 Processing completed: ${successCount} successful, ${errorCount} failed`);
    return results;
  } catch (error) {
    console.error('❌ Error in processCompletedEarningSessions:', error);
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

    // Check if user can start earning (no active session and no session started today)
    const todaySession = await prisma.earningsSession.findFirst({
      where: {
        userId,
        startTime: {
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
      todayEarnings: parseFloat(todayEarnings._sum.totalEarnings || 0),
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
      { 
        name: 'Starter', 
        amount: 30, 
        dailyEarning: 2,
        bicycleModel: 'City Cruiser Basic',
        bicycleColor: 'Blue',
        bicycleFeatures: 'Comfortable seat, basic gears, city tires'
      },
      { 
        name: 'Bronze', 
        amount: 180, 
        dailyEarning: 10,
        bicycleModel: 'Mountain Explorer',
        bicycleColor: 'Green',
        bicycleFeatures: 'Shock absorbers, 21-speed gears, off-road tires'
      },
      { 
        name: 'Silver', 
        amount: 400, 
        dailyEarning: 24,
        bicycleModel: 'Road Racer Pro',
        bicycleColor: 'Red',
        bicycleFeatures: 'Lightweight frame, racing gears, performance tires'
      },
      { 
        name: 'Gold', 
        amount: 1000, 
        dailyEarning: 50,
        bicycleModel: 'Electric Commuter',
        bicycleColor: 'Black',
        bicycleFeatures: 'Electric motor, battery pack, LED lights, GPS tracker'
      },
      { 
        name: 'Platinum', 
        amount: 1500, 
        dailyEarning: 65,
        bicycleModel: 'Hybrid Adventure',
        bicycleColor: 'Silver',
        bicycleFeatures: 'Electric assist, suspension, cargo rack, smartphone holder'
      },
      { 
        name: 'Diamond', 
        amount: 2000, 
        dailyEarning: 75,
        bicycleModel: 'Carbon Fiber Elite',
        bicycleColor: 'Carbon Black',
        bicycleFeatures: 'Carbon fiber frame, wireless shifting, power meter, premium components'
      },
      { 
        name: 'Elite', 
        amount: 5000, 
        dailyEarning: 200,
        bicycleModel: 'Smart E-Bike Premium',
        bicycleColor: 'Titanium',
        bicycleFeatures: 'AI navigation, solar charging, biometric sensors, premium leather seat'
      },
      { 
        name: 'Master', 
        amount: 6000, 
        dailyEarning: 250,
        bicycleModel: 'Custom Performance',
        bicycleColor: 'Custom Paint',
        bicycleFeatures: 'Handcrafted frame, premium components, custom paint job, professional fitting'
      },
      { 
        name: 'Legend', 
        amount: 12000, 
        dailyEarning: 500,
        bicycleModel: 'Luxury Touring',
        bicycleColor: 'Gold Plated',
        bicycleFeatures: 'Luxury materials, built-in entertainment, climate control, concierge service'
      },
      { 
        name: 'Supreme', 
        amount: 25000, 
        dailyEarning: 800,
        bicycleModel: 'Ultimate Dream Bike',
        bicycleColor: 'Diamond Encrusted',
        bicycleFeatures: 'Exclusive design, rare materials, lifetime warranty, personal bike concierge'
      }
    ];

    const results = [];

    for (const vip of vipLevels) {
      try {
        const result = await prisma.vipLevel.upsert({
          where: { name: vip.name },
          update: {
            amount: vip.amount,
            dailyEarning: vip.dailyEarning,
            bicycleModel: vip.bicycleModel,
            bicycleColor: vip.bicycleColor,
            bicycleFeatures: vip.bicycleFeatures,
            isActive: true
          },
          create: {
            name: vip.name,
            amount: vip.amount,
            dailyEarning: vip.dailyEarning,
            bicycleModel: vip.bicycleModel,
            bicycleColor: vip.bicycleColor,
            bicycleFeatures: vip.bicycleFeatures,
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
  getVipLevelById,
  completeExpiredEarningSessions
};
