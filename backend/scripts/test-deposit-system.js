const { PrismaClient } = require('@prisma/client');
const WalletAddressService = require('../services/walletAddressService');

const prisma = new PrismaClient();

async function testDepositSystem() {
  try {
    console.log('🧪 Testing USDT Deposit System...\n');

    // Test 1: Check environment configuration
    console.log('1️⃣ Testing Environment Configuration...');
    try {
      WalletAddressService.validateCompanyWalletAddresses();
      console.log('   ✅ Company wallet addresses are properly configured');
    } catch (error) {
      console.log('   ❌ Company wallet addresses not configured:', error.message);
      console.log('   Please set the required environment variables first.');
      return;
    }

    // Test 2: Get company wallet addresses
    console.log('\n2️⃣ Testing Company Wallet Addresses...');
    const companyAddresses = WalletAddressService.getCompanyWalletAddresses();
    console.log('   Company addresses:');
    for (const [network, address] of Object.entries(companyAddresses)) {
      if (address) {
        console.log(`   ✅ ${network}: ${address}`);
      } else {
        console.log(`   ❌ ${network}: Not configured`);
      }
    }

    // Test 3: Check if users exist
    console.log('\n3️⃣ Testing User Database...');
    const userCount = await prisma.user.count();
    console.log(`   Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log('   ⚠️  No users found. Please create some users first.');
      return;
    }

    // Test 4: Check user wallet addresses
    console.log('\n4️⃣ Testing User Wallet Addresses...');
    const usersWithAddresses = await prisma.user.findMany({
      include: {
        walletAddresses: true
      }
    });

    console.log(`   Users with wallet addresses: ${usersWithAddresses.length}`);

    for (const user of usersWithAddresses) {
      console.log(`\n   👤 User: ${user.fullName || user.email || user.id}`);
      console.log(`   📍 Wallet addresses: ${user.walletAddresses.length}`);
      
      for (const addr of user.walletAddresses) {
        const isCompanyAddress = Object.values(companyAddresses).includes(addr.address);
        const status = isCompanyAddress ? '✅ Company Address' : '❌ Fake Address';
        console.log(`     ${addr.network}: ${addr.address} (${status})`);
      }
    }

    // Test 5: Check for fake addresses
    console.log('\n5️⃣ Checking for Fake Addresses...');
    let fakeAddressCount = 0;
    let realAddressCount = 0;

    for (const user of usersWithAddresses) {
      for (const addr of user.walletAddresses) {
        if (Object.values(companyAddresses).includes(addr.address)) {
          realAddressCount++;
        } else {
          fakeAddressCount++;
          console.log(`   ❌ Fake address found: ${user.fullName || user.id} - ${addr.network}: ${addr.address}`);
        }
      }
    }

    console.log(`   Real addresses: ${realAddressCount}`);
    console.log(`   Fake addresses: ${fakeAddressCount}`);

    if (fakeAddressCount > 0) {
      console.log('\n   ⚠️  Fake addresses detected! Run the update script:');
      console.log('   node scripts/update-user-addresses.js');
    } else {
      console.log('\n   ✅ All addresses are real company addresses!');
    }

    // Test 6: Test address generation for new user
    console.log('\n6️⃣ Testing Address Generation...');
    try {
      const testUserId = 'test-user-' + Date.now();
      const testAddresses = await WalletAddressService.generateUserWalletAddresses(testUserId);
      console.log(`   ✅ Generated ${testAddresses.length} addresses for test user`);
      
      // Clean up test data
      await prisma.userWalletAddress.deleteMany({
        where: { userId: testUserId }
      });
      console.log('   🧹 Cleaned up test data');
    } catch (error) {
      console.log('   ❌ Address generation failed:', error.message);
    }

    // Summary
    console.log('\n🎯 Test Summary:');
    if (fakeAddressCount === 0) {
      console.log('   🎉 System is ready for real USDT deposits!');
      console.log('   Users will see their personal deposit addresses');
      console.log('   All addresses can receive real USDT');
    } else {
      console.log('   ⚠️  System needs to be updated');
      console.log('   Run: node scripts/update-user-addresses.js');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testDepositSystem()
    .then(() => {
      console.log('\n🚀 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDepositSystem };
