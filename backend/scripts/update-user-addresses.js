const { PrismaClient } = require('@prisma/client');
const WalletAddressService = require('../services/walletAddressService');

const prisma = new PrismaClient();

async function updateUserWalletAddresses() {
  try {
    console.log('🔄 Starting to update user wallet addresses...');
    
    // First validate that company wallet addresses are configured
    try {
      WalletAddressService.validateCompanyWalletAddresses();
      console.log('✅ Company wallet addresses are properly configured');
    } catch (error) {
      console.error('❌ Company wallet addresses not configured:', error.message);
      console.log('Please set the following environment variables:');
      console.log('- TRON_WALLET_ADDRESS');
      console.log('- BSC_WALLET_ADDRESS');
      console.log('- ETH_WALLET_ADDRESS');
      console.log('- POLYGON_WALLET_ADDRESS');
      return;
    }

    // Get all users with wallet addresses
    const usersWithAddresses = await prisma.user.findMany({
      include: {
        walletAddresses: true
      }
    });

    console.log(`📊 Found ${usersWithAddresses.length} users with wallet addresses`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of usersWithAddresses) {
      try {
        console.log(`\n👤 Processing user: ${user.fullName || user.email || user.id}`);
        
        // Get company wallet addresses
        const companyAddresses = WalletAddressService.getCompanyWalletAddresses();
        
        // Update each network address for the user
        for (const [networkKey, companyAddress] of Object.entries(companyAddresses)) {
          if (!companyAddress) continue;
          
          // Map network keys to internal network names
          const networkMap = {
            'TRC20': 'TRON',
            'BEP20': 'BSC',
            'ERC20': 'ETHEREUM',
            'POLYGON': 'POLYGON'
          };
          
          const networkName = networkMap[networkKey];
          if (!networkName) continue;
          
          // Find existing address record for this user and network
          const existingAddress = user.walletAddresses.find(addr => addr.network === networkName);
          
          if (existingAddress) {
            // Update existing address
            await prisma.userWalletAddress.update({
              where: { id: existingAddress.id },
              data: { address: companyAddress }
            });
            console.log(`  ✅ Updated ${networkName} address: ${existingAddress.address} → ${companyAddress}`);
          } else {
            // Create new address record
            await prisma.userWalletAddress.create({
              data: {
                userId: user.id,
                network: networkName,
                address: companyAddress,
                isActive: true
              }
            });
            console.log(`  ➕ Created ${networkName} address: ${companyAddress}`);
          }
        }
        
        updatedCount++;
        
      } catch (error) {
        console.error(`  ❌ Error updating user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Update completed!`);
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount} users`);
    }

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const verificationResult = await verifyAddressUpdate();
    console.log(`📊 Verification result: ${verificationResult ? 'PASSED' : 'FAILED'}`);

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyAddressUpdate() {
  try {
    // Get company addresses
    const companyAddresses = WalletAddressService.getCompanyWalletAddresses();
    
    // Check if all users now have the company addresses
    const usersWithAddresses = await prisma.user.findMany({
      include: {
        walletAddresses: true
      }
    });

    for (const user of usersWithAddresses) {
      for (const [networkKey, companyAddress] of Object.entries(companyAddresses)) {
        if (!companyAddress) continue;
        
        const networkMap = {
          'TRC20': 'TRON',
          'BEP20': 'BSC',
          'ERC20': 'ETHEREUM',
          'POLYGON': 'POLYGON'
        };
        
        const networkName = networkMap[networkKey];
        const userAddress = user.walletAddresses.find(addr => addr.network === networkName);
        
        if (!userAddress || userAddress.address !== companyAddress) {
          console.log(`  ❌ User ${user.id} ${networkName} address mismatch: expected ${companyAddress}, got ${userAddress?.address || 'none'}`);
          return false;
        }
      }
    }
    
    console.log('  ✅ All users have correct company wallet addresses');
    return true;
    
  } catch (error) {
    console.error('  ❌ Verification failed:', error.message);
    return false;
  }
}

// Run the script
if (require.main === module) {
  updateUserWalletAddresses()
    .then(() => {
      console.log('\n🚀 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateUserWalletAddresses, verifyAddressUpdate };
