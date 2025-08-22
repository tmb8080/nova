const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminSettings() {
  try {
    console.log('🔍 Checking if admin settings exist...');
    
    // Check if admin settings already exist
    let settings = await prisma.adminSettings.findFirst();
    
    if (settings) {
      console.log('✅ Admin settings already exist:');
      console.log('- isDepositEnabled:', settings.isDepositEnabled);
      console.log('- isWithdrawalEnabled:', settings.isWithdrawalEnabled);
      console.log('- minDepositAmount:', settings.minDepositAmount);
      console.log('- minWithdrawalAmount:', settings.minWithdrawalAmount);
      
      // Check if deposits are disabled
      if (!settings.isDepositEnabled) {
        console.log('\n❌ Deposits are currently DISABLED!');
        console.log('🔄 Enabling deposits...');
        
        // Update to enable deposits
        const updatedSettings = await prisma.adminSettings.update({
          where: { id: settings.id },
          data: { isDepositEnabled: true }
        });
        
        console.log('✅ Deposits enabled successfully!');
        console.log('New isDepositEnabled value:', updatedSettings.isDepositEnabled);
      } else {
        console.log('\n✅ Deposits are already enabled!');
      }
      
      return;
    }
    
    console.log('❌ No admin settings found. Creating default settings...');
    
    // Create default admin settings
    const newSettings = await prisma.adminSettings.create({
      data: {
        dailyGrowthRate: 0.01, // 1%
        referralBonusRate: 0.05, // 5%
        minDepositAmount: 30,
        minUsdtDepositAmount: 30,
        minWithdrawalAmount: 10,
        minUsdcWithdrawalAmount: 20,
        isDepositEnabled: true, // Enable deposits by default
        isWithdrawalEnabled: true,
        isRegistrationEnabled: true,
        maintenanceMode: false
      }
    });
    
    console.log('✅ Default admin settings created successfully!');
    console.log('Settings:', {
      id: newSettings.id,
      isDepositEnabled: newSettings.isDepositEnabled,
      isWithdrawalEnabled: newSettings.isWithdrawalEnabled,
      minDepositAmount: newSettings.minDepositAmount,
      minWithdrawalAmount: newSettings.minWithdrawalAmount
    });
    
    console.log('\n🎉 SUCCESS: Deposits are now enabled!');
    console.log('Users should now be able to make deposits without getting the "disabled" error.');
    
  } catch (error) {
    console.error('❌ Error creating admin settings:', error);
    
    if (error.code === 'P2002') {
      console.log('This might be a unique constraint violation. Let me check the database...');
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminSettings();
