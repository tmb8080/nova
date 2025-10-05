const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCurrentVips() {
  try {
    console.log('🔧 Fixing current VIP level names...');
    
    // Get current VIP levels
    const currentVips = await prisma.vipLevel.findMany({ 
      orderBy: { amount: 'asc' } 
    });
    
    console.log('Current VIP levels:');
    currentVips.forEach(vip => {
      console.log(`  ${vip.name}: $${vip.amount} → $${vip.dailyEarning}/day`);
    });
    
    // Update VIP level names to be more professional
    const updates = [
      { oldName: 'xxxx', newName: 'Starter', amount: 40, dailyEarning: 3 },
      { oldName: 'Moped', newName: 'Bronze', amount: 50, dailyEarning: 3 },
      { oldName: 'nnn', newName: 'Silver', amount: 660, dailyEarning: 67 }
    ];
    
    console.log('\n🔄 Updating VIP level names...');
    for (const update of updates) {
      const existingVip = currentVips.find(vip => vip.name === update.oldName);
      if (existingVip) {
        await prisma.vipLevel.update({
          where: { id: existingVip.id },
          data: { 
            name: update.newName,
            // Keep existing amounts and earnings
            amount: existingVip.amount,
            dailyEarning: existingVip.dailyEarning
          }
        });
        console.log(`✅ Updated: "${update.oldName}" → "${update.newName}"`);
      }
    }
    
    console.log('🎉 VIP level names updated successfully!');
    
    // Verify the final state
    const finalVips = await prisma.vipLevel.findMany({ 
      orderBy: { amount: 'asc' },
      select: { name: true, amount: true, dailyEarning: true }
    });
    
    console.log('\n📊 Updated VIP Levels:');
    finalVips.forEach(vip => {
      const rate = ((parseFloat(vip.dailyEarning) / parseFloat(vip.amount)) * 100).toFixed(1);
      console.log(`  ${vip.name}: $${vip.amount} → $${vip.dailyEarning}/day (${rate}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing VIP levels:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixCurrentVips();
}

module.exports = { fixCurrentVips };
