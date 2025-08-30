const { PrismaClient } = require('@prisma/client');
const taskService = require('./services/taskService');

const prisma = new PrismaClient();

async function testDailyEarnings() {
  try {
    console.log('🧪 Testing daily earnings: Full daily amount should be deposited...\n');

    // Find a test user with VIP level
    const testUser = await prisma.user.findFirst({
      where: {
        userVips: {
          some: {
            isActive: true
          }
        }
      },
      include: {
        userVips: {
          include: {
            vipLevel: true
          }
        },
        wallet: true
      }
    });

    if (!testUser) {
      console.log('❌ No test user with VIP level found. Please create a user with VIP level first.');
      return;
    }

    console.log(`👤 Test user: ${testUser.email} (ID: ${testUser.id})`);
    console.log(`💰 Initial wallet balance: $${testUser.wallet?.balance || 0}`);
    console.log(`🏆 VIP Level: ${testUser.userVips[0]?.vipLevel.name}`);
    console.log(`💵 VIP Investment: $${testUser.userVips[0]?.vipLevel.amount}`);
    console.log(`📊 Daily earning rate: $${testUser.userVips[0]?.vipLevel.dailyEarning}/day`);
    console.log(`📈 Expected earnings when starting task: $${testUser.userVips[0]?.vipLevel.dailyEarning}\n`);

    // Check if user has any active sessions
    const activeSession = await prisma.earningsSession.findFirst({
      where: {
        userId: testUser.id,
        status: 'ACTIVE'
      }
    });

    if (activeSession) {
      console.log('⚠️ User has an active session. Cannot start new task.');
      return;
    }

    // Check last completed session for cooldown
    const lastCompletedSession = await prisma.earningsSession.findFirst({
      where: {
        userId: testUser.id,
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
        console.log(`⏳ User is in cooldown. Cannot start new task for ${remainingHours} hours.`);
        return;
      }
    }

    console.log('🚀 Starting daily earning session...\n');

    // Start the earning session
    const result = await taskService.startEarningSession(testUser.id);

    if (result.success) {
      console.log('✅ Task started successfully!');
      console.log(`📝 Session ID: ${result.data.sessionId}`);
      console.log(`⏰ Start time: ${result.data.startTime}`);
      console.log(`⏰ Expected end time: ${result.data.expectedEndTime}`);
      console.log(`💰 Earning rate: $${result.data.dailyEarningRate}`);
      console.log(`💬 Message: ${result.data.message}\n`);

      // Check wallet balance after task start
      const updatedWallet = await prisma.wallet.findUnique({
        where: { userId: testUser.id }
      });

      const expectedEarnings = parseFloat(testUser.userVips[0]?.vipLevel.dailyEarning);
      const actualEarnings = updatedWallet.balance - (testUser.wallet?.balance || 0);

      console.log(`💰 Wallet balance after task start: $${updatedWallet.balance}`);
      console.log(`📈 Balance increase: $${actualEarnings}`);
      console.log(`🎯 Expected earnings: $${expectedEarnings}`);
      
      if (actualEarnings === expectedEarnings) {
        console.log('✅ SUCCESS: Full daily amount was deposited!');
      } else {
        console.log('❌ FAILED: Incorrect amount was deposited!');
        console.log(`   Expected: $${expectedEarnings}`);
        console.log(`   Actual: $${actualEarnings}`);
      }

      // Check if transaction was created
      const transaction = await prisma.transaction.findFirst({
        where: {
          userId: testUser.id,
          type: 'VIP_EARNINGS',
          referenceId: result.data.sessionId
        }
      });

      if (transaction) {
        console.log(`✅ Transaction created: $${transaction.amount} - ${transaction.description}`);
      } else {
        console.log('❌ No transaction found!');
      }

      // Check session details
      const session = await prisma.earningsSession.findUnique({
        where: { id: result.data.sessionId }
      });

      console.log(`\n📊 Session details:`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Total earnings: $${session.totalEarnings}`);
      console.log(`   Daily earning rate: $${session.dailyEarningRate}`);

      console.log('\n🎉 Test completed! Full daily amount should be deposited when task starts.');

    } else {
      console.log('❌ Failed to start task:', result.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDailyEarnings();
