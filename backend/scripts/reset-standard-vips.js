const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const standardVipLevels = [
  { name: 'Starter', amount: 10, dailyEarning: 1.00 },
  { name: 'Bronze', amount: 50, dailyEarning: 5.00 },
  { name: 'Silver', amount: 100, dailyEarning: 10.00 },
  { name: 'Gold', amount: 150, dailyEarning: 16.50 },
  { name: 'Platinum', amount: 250, dailyEarning: 27.50 },
  { name: 'Diamond', amount: 300, dailyEarning: 33.00 },
  { name: 'Elite', amount: 500, dailyEarning: 55.00 },
  { name: 'Master', amount: 650, dailyEarning: 74.75 },
  { name: 'Legend', amount: 900, dailyEarning: 108.00 },
  { name: 'Supreme', amount: 1000, dailyEarning: 120.00 },
  { name: 'Ultimate', amount: 1500, dailyEarning: 187.50 },
  { name: 'Mega', amount: 10000, dailyEarning: 1250.00 },
  { name: 'Giga', amount: 50000, dailyEarning: 6500.00 },
  { name: 'Tera', amount: 200000, dailyEarning: 26000.00 }
];

async function resetToStandardVips() {
  try {
    console.log('🔄 Resetting to standard VIP levels...');
    
    // First, delete existing VIP levels
    console.log('🗑️  Deleting existing VIP levels...');
    await prisma.vipLevel.deleteMany({});
    
    // Create standard VIP levels
    console.log('📝 Creating standard VIP levels...');
    for (const vip of standardVipLevels) {
      await prisma.vipLevel.create({
        data: {
          name: vip.name,
          amount: vip.amount,
          dailyEarning: vip.dailyEarning,
          isActive: true
        }
      });
      console.log(`✅ Created: ${vip.name} - $${vip.amount} investment, $${vip.dailyEarning}/day`);
    }
    
    console.log('🎉 Standard VIP levels reset completed successfully!');
    
    // Verify the final state
    const finalVips = await prisma.vipLevel.findMany({ 
      orderBy: { amount: 'asc' },
      select: { name: true, amount: true, dailyEarning: true }
    });
    
    console.log('\n📊 Final VIP Levels:');
    finalVips.forEach(vip => {
      const rate = ((parseFloat(vip.dailyEarning) / parseFloat(vip.amount)) * 100).toFixed(1);
      console.log(`  ${vip.name}: $${vip.amount} → $${vip.dailyEarning}/day (${rate}%)`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting VIP levels:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  resetToStandardVips();
}

module.exports = { resetToStandardVips };
