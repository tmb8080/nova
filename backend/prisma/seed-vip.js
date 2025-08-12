const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const vipLevels = [
  { name: 'Starter', amount: 30, dailyEarning: 2 },
  { name: 'Bronze', amount: 180, dailyEarning: 10 },
  { name: 'Silver', amount: 400, dailyEarning: 24 },
  { name: 'Gold', amount: 1000, dailyEarning: 50 },
  { name: 'Platinum', amount: 1500, dailyEarning: 65 },
  { name: 'Diamond', amount: 2000, dailyEarning: 75 },
  { name: 'Elite', amount: 5000, dailyEarning: 200 },
  { name: 'Master', amount: 6000, dailyEarning: 250 },
  { name: 'Legend', amount: 12000, dailyEarning: 500 },
  { name: 'Supreme', amount: 25000, dailyEarning: 800 }
];

async function seedVipLevels() {
  try {
    console.log('Seeding VIP levels...');
    
    for (const vip of vipLevels) {
      await prisma.vipLevel.upsert({
        where: { name: vip.name },
        update: {
          amount: vip.amount,
          dailyEarning: vip.dailyEarning,
          isActive: true
        },
        create: {
          name: vip.name,
          amount: vip.amount,
          dailyEarning: vip.dailyEarning,
          isActive: true
        }
      });
    }
    
    console.log('VIP levels seeded successfully!');
  } catch (error) {
    console.error('Error seeding VIP levels:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedVipLevels();
}

module.exports = { seedVipLevels };
