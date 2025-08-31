const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateAdminSettings() {
  try {
    console.log('Checking admin settings...');
    
    // Get current admin settings
    let settings = await prisma.adminSettings.findFirst();
    
    if (!settings) {
      console.log('No admin settings found. Creating default settings...');
      settings = await prisma.adminSettings.create({
        data: {
          minWithdrawalAmount: 10,
          minUsdcWithdrawalAmount: 10, // Changed from 20 to 10
          minUsdtDepositAmount: 30,
          isWithdrawalEnabled: true,
          isDepositEnabled: true,
          isRegistrationEnabled: true,
          maintenanceMode: false,
          dailyGrowthRate: 0.01
        }
      });
      console.log('Default admin settings created successfully!');
    } else {
      console.log('Current admin settings:');
      console.log('- minWithdrawalAmount:', settings.minWithdrawalAmount.toString());
      console.log('- minUsdcWithdrawalAmount:', settings.minUsdcWithdrawalAmount.toString());
      console.log('- minUsdtDepositAmount:', settings.minUsdtDepositAmount.toString());
      
      let updated = false;
      
      // Update minimum withdrawal amount to 10 if it's not already
      if (parseFloat(settings.minWithdrawalAmount) !== 10) {
        console.log('Updating minWithdrawalAmount to 10...');
        await prisma.adminSettings.update({
          where: { id: settings.id },
          data: {
            minWithdrawalAmount: 10
          }
        });
        console.log('minWithdrawalAmount updated to 10 successfully!');
        updated = true;
      } else {
        console.log('minWithdrawalAmount is already set to 10.');
      }
      
      // Update USDC minimum withdrawal amount to 10 if it's not already
      if (parseFloat(settings.minUsdcWithdrawalAmount) !== 10) {
        console.log('Updating minUsdcWithdrawalAmount to 10...');
        await prisma.adminSettings.update({
          where: { id: settings.id },
          data: {
            minUsdcWithdrawalAmount: 10
          }
        });
        console.log('minUsdcWithdrawalAmount updated to 10 successfully!');
        updated = true;
      } else {
        console.log('minUsdcWithdrawalAmount is already set to 10.');
      }
      
      if (!updated) {
        console.log('All settings are already correct.');
      }
    }
    
    console.log('Admin settings check/update completed!');
  } catch (error) {
    console.error('Error updating admin settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateAdminSettings();
}

module.exports = { updateAdminSettings };
