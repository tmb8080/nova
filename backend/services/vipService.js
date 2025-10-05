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
    
    // Since earnings are now deposited when tasks start, this function should find no sessions to process
    // This is kept for backward compatibility and to handle any edge cases
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

    console.log(`Found ${completedSessions.length} completed sessions to process (earnings should already be deposited)`);

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
          console.log(`Session ${session.id} already processed (earnings deposited when started), skipping...`);
          results.push({
            sessionId: session.id,
            userId: session.userId,
            status: 'skipped',
            reason: 'Earnings already deposited when task started'
          });
          continue;
        }

        // This should not happen since earnings are deposited immediately when task starts
        console.log(`⚠️ Found session ${session.id} without transaction - this should not happen with new logic`);
        
        const earningsAmount = parseFloat(session.totalEarnings);
        console.log(`Processing session ${session.id} for user ${session.userId}, amount: ${earningsAmount} (fallback processing)`);

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
              description: `Daily VIP earnings completed - ${session.vipLevel?.name || 'VIP'} level (fallback processing)`,
              referenceId: session.id
            }
          });
        });

        results.push({
          sessionId: session.id,
          userId: session.userId,
          amount: earningsAmount,
          status: 'success',
          note: 'Fallback processing - earnings should have been deposited when task started'
        });

        console.log(`✅ Successfully paid ${earningsAmount} to user ${session.userId} for session ${session.id} (fallback)`);
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
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`📊 Processing completed: ${successCount} successful, ${skippedCount} skipped, ${errorCount} failed`);
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
        amount: 10, 
        dailyEarning: 1.00,
        bicycleModel: 'City Cruiser Basic',
        bicycleColor: 'Blue',
        bicycleFeatures: 'Comfortable seat, basic gears, city tires'
      },
      { 
        name: 'Bronze', 
        amount: 50, 
        dailyEarning: 5.00,
        bicycleModel: 'Mountain Explorer',
        bicycleColor: 'Green',
        bicycleFeatures: 'Shock absorbers, 21-speed gears, off-road tires'
      },
      { 
        name: 'Silver', 
        amount: 100, 
        dailyEarning: 10.00,
        bicycleModel: 'Road Racer Pro',
        bicycleColor: 'Red',
        bicycleFeatures: 'Lightweight frame, racing gears, performance tires'
      },
      { 
        name: 'Gold', 
        amount: 150, 
        dailyEarning: 16.50,
        bicycleModel: 'Electric Commuter',
        bicycleColor: 'Black',
        bicycleFeatures: 'Electric motor, battery pack, LED lights, GPS tracker'
      },
      { 
        name: 'Platinum', 
        amount: 250, 
        dailyEarning: 27.50,
        bicycleModel: 'Hybrid Adventure',
        bicycleColor: 'Silver',
        bicycleFeatures: 'Electric assist, suspension, cargo rack, smartphone holder'
      },
      { 
        name: 'Diamond', 
        amount: 300, 
        dailyEarning: 33.00,
        bicycleModel: 'Carbon Fiber Elite',
        bicycleColor: 'Carbon Black',
        bicycleFeatures: 'Carbon fiber frame, wireless shifting, power meter, premium components'
      },
      { 
        name: 'Elite', 
        amount: 500, 
        dailyEarning: 55.00,
        bicycleModel: 'Smart E-Bike Premium',
        bicycleColor: 'Titanium',
        bicycleFeatures: 'AI navigation, solar charging, biometric sensors, premium leather seat'
      },
      { 
        name: 'Master', 
        amount: 650, 
        dailyEarning: 74.75,
        bicycleModel: 'Custom Performance',
        bicycleColor: 'Custom Paint',
        bicycleFeatures: 'Handcrafted frame, premium components, custom paint job, professional fitting'
      },
      { 
        name: 'Legend', 
        amount: 900, 
        dailyEarning: 108.00,
        bicycleModel: 'Luxury Touring',
        bicycleColor: 'Gold Plated',
        bicycleFeatures: 'Luxury materials, built-in entertainment, climate control, concierge service'
      },
      { 
        name: 'Supreme', 
        amount: 1000, 
        dailyEarning: 120.00,
        bicycleModel: 'Ultimate Dream Bike',
        bicycleColor: 'Diamond Encrusted',
        bicycleFeatures: 'Exclusive design, rare materials, lifetime warranty, personal bike concierge'
      },
      { 
        name: 'Ultimate', 
        amount: 1500, 
        dailyEarning: 187.50,
        bicycleModel: 'Premium Elite',
        bicycleColor: 'Platinum',
        bicycleFeatures: 'Premium materials, advanced technology, exclusive design, VIP service'
      },
      { 
        name: 'Mega', 
        amount: 10000, 
        dailyEarning: 1250.00,
        bicycleModel: 'Mega Elite',
        bicycleColor: 'Chrome',
        bicycleFeatures: 'Mega features, premium components, exclusive access, personal concierge'
      },
      { 
        name: 'Giga', 
        amount: 50000, 
        dailyEarning: 6500.00,
        bicycleModel: 'Giga Elite',
        bicycleColor: 'Gold',
        bicycleFeatures: 'Giga features, luxury materials, exclusive design, premium service'
      },
      { 
        name: 'Tera', 
        amount: 200000, 
        dailyEarning: 26000.00,
        bicycleModel: 'Tera Elite',
        bicycleColor: 'Diamond',
        bicycleFeatures: 'Tera features, ultimate luxury, exclusive access, personal butler service'
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

/**
 * Admin: Get all VIP levels (including inactive)
 */
async function getAllVipLevelsAdmin() {
  try {
    const vipLevels = await prisma.vipLevel.findMany({
      orderBy: { amount: 'asc' }
    });
    return vipLevels;
  } catch (error) {
    console.error('Error getting all VIP levels (admin):', error);
    throw error;
  }
}

/**
 * Admin: Create VIP level
 */
async function createVipLevel(data) {
  try {
    const created = await prisma.vipLevel.create({
      data: {
        name: data.name,
        amount: data.amount,
        dailyEarning: data.dailyEarning,
        bicycleModel: data.bicycleModel || null,
        bicycleColor: data.bicycleColor || null,
        bicycleFeatures: data.bicycleFeatures || null,
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
    return created;
  } catch (error) {
    console.error('Error creating VIP level:', error);
    throw error;
  }
}

/**
 * Admin: Update VIP level
 */
async function updateVipLevel(id, updates) {
  try {
    const updated = await prisma.vipLevel.update({
      where: { id },
      data: {
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
        ...(updates.dailyEarning !== undefined ? { dailyEarning: updates.dailyEarning } : {}),
        ...(updates.bicycleModel !== undefined ? { bicycleModel: updates.bicycleModel } : {}),
        ...(updates.bicycleColor !== undefined ? { bicycleColor: updates.bicycleColor } : {}),
        ...(updates.bicycleFeatures !== undefined ? { bicycleFeatures: updates.bicycleFeatures } : {}),
        ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {})
      }
    });
    return updated;
  } catch (error) {
    console.error('Error updating VIP level:', error);
    throw error;
  }
}

/**
 * Admin: Delete VIP level
 */
async function deleteVipLevel(id) {
  try {
    // Ensure not referenced by any user
    const usageCount = await prisma.userVip.count({ where: { vipLevelId: id } });
    if (usageCount > 0) {
      const error = new Error('Cannot delete a VIP level that is assigned to users');
      error.code = 'VIP_IN_USE';
      throw error;
    }
    const deleted = await prisma.vipLevel.delete({ where: { id } });
    return deleted;
  } catch (error) {
    console.error('Error deleting VIP level:', error);
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
  completeExpiredEarningSessions,
  getAllVipLevelsAdmin,
  createVipLevel,
  updateVipLevel,
  deleteVipLevel
};
