const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixReferralRates() {
  try {
    console.log('🔧 Fixing referral rates in admin settings...');
    
    // Check if admin settings exist
    let adminSettings = await prisma.adminSettings.findFirst();
    
    if (!adminSettings) {
      // Create admin settings with default referral rates
      console.log('📝 Creating admin settings with default referral rates...');
      adminSettings = await prisma.adminSettings.create({
        data: {
          dailyGrowthRate: 0.01,
          minDepositAmount: 10,
          minWithdrawalAmount: 20,
          isDepositEnabled: true,
          isWithdrawalEnabled: true,
          isRegistrationEnabled: true,
          maintenanceMode: false,
          referralBonusLevel1Rate: 0.10, // 10%
          referralBonusLevel2Rate: 0.05, // 5%
          referralBonusLevel3Rate: 0.02  // 2%
        }
      });
      console.log('✅ Admin settings created with referral rates');
    } else {
      // Update existing admin settings to ensure referral rates are set
      console.log('🔄 Updating existing admin settings with referral rates...');
      
      const updateData = {};
      
      // Only update if the values are null or undefined
      if (adminSettings.referralBonusLevel1Rate === null || adminSettings.referralBonusLevel1Rate === undefined) {
        updateData.referralBonusLevel1Rate = 0.10; // 10%
      }
      if (adminSettings.referralBonusLevel2Rate === null || adminSettings.referralBonusLevel2Rate === undefined) {
        updateData.referralBonusLevel2Rate = 0.05; // 5%
      }
      if (adminSettings.referralBonusLevel3Rate === null || adminSettings.referralBonusLevel3Rate === undefined) {
        updateData.referralBonusLevel3Rate = 0.02; // 2%
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.adminSettings.update({
          where: { id: adminSettings.id },
          data: updateData
        });
        console.log('✅ Referral rates updated:', updateData);
      } else {
        console.log('✅ Referral rates already set properly');
      }
    }
    
    // Verify the final state
    const finalSettings = await prisma.adminSettings.findFirst({
      select: {
        referralBonusLevel1Rate: true,
        referralBonusLevel2Rate: true,
        referralBonusLevel3Rate: true
      }
    });
    
    console.log('📊 Final referral rates:');
    console.log(`  Level 1: ${finalSettings.referralBonusLevel1Rate} (${(parseFloat(finalSettings.referralBonusLevel1Rate) * 100).toFixed(1)}%)`);
    console.log(`  Level 2: ${finalSettings.referralBonusLevel2Rate} (${(parseFloat(finalSettings.referralBonusLevel2Rate) * 100).toFixed(1)}%)`);
    console.log(`  Level 3: ${finalSettings.referralBonusLevel3Rate} (${(parseFloat(finalSettings.referralBonusLevel3Rate) * 100).toFixed(1)}%)`);
    
    console.log('🎉 Referral rates fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing referral rates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixReferralRates();
}

module.exports = { fixReferralRates };
