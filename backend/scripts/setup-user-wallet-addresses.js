const { PrismaClient } = require('@prisma/client');
const WalletAddressService = require('../services/walletAddressService');

const prisma = new PrismaClient();

async function setupUserWalletAddresses() {
  try {
    console.log('🚀 Starting setup of user wallet addresses...\n');

    // 1. Check if table exists
    console.log('📋 Checking database schema...');
    
    try {
      await prisma.$queryRaw`SELECT 1 FROM "user_wallet_addresses" LIMIT 1`;
      console.log('✅ User wallet addresses table already exists');
    } catch (error) {
      console.log('❌ User wallet addresses table does not exist');
      console.log('Please run: npx prisma migrate dev --name add_user_wallet_addresses');
      return;
    }

    // 2. Get all existing users
    console.log('\n👥 Getting existing users...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    console.log(`📊 Found ${users.length} users`);

    // 3. Check which users already have wallet addresses
    console.log('\n🔍 Checking existing wallet addresses...');
    const usersWithAddresses = await prisma.userWalletAddress.findMany({
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    const usersWithAddressesIds = usersWithAddresses.map(u => u.userId);
    const usersNeedingAddresses = users.filter(u => !usersWithAddressesIds.includes(u.id));

    console.log(`✅ ${usersWithAddressesIds.length} users already have wallet addresses`);
    console.log(`🆕 ${usersNeedingAddresses.length} users need wallet addresses`);

    if (usersNeedingAddresses.length === 0) {
      console.log('\n🎉 All users already have wallet addresses!');
      return;
    }

    // 4. Generate wallet addresses for users who need them
    console.log('\n🔧 Generating wallet addresses for new users...');
    
    for (const user of usersNeedingAddresses) {
      try {
        console.log(`  📝 Generating addresses for ${user.fullName || user.email || user.id}...`);
        
        await WalletAddressService.generateUserWalletAddresses(user.id);
        
        console.log(`  ✅ Generated addresses for ${user.fullName || user.email || user.id}`);
      } catch (error) {
        console.error(`  ❌ Error generating addresses for ${user.fullName || user.email || user.id}:`, error.message);
      }
    }

    // 5. Final verification
    console.log('\n🔍 Final verification...');
    const finalCount = await prisma.userWalletAddress.count();
    const uniqueUsers = await prisma.userWalletAddress.findMany({
      select: {
        userId: true
      },
      distinct: ['userId']
    });

    console.log(`📊 Total wallet addresses: ${finalCount}`);
    console.log(`👥 Users with addresses: ${uniqueUsers.length}`);
    console.log(`🎯 Expected: ${users.length * 4} addresses (${users.length} users × 4 networks)`);

    if (finalCount === users.length * 4) {
      console.log('\n🎉 Setup completed successfully!');
    } else {
      console.log('\n⚠️  Setup completed with some issues. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
if (require.main === module) {
  setupUserWalletAddresses();
}

module.exports = { setupUserWalletAddresses };
