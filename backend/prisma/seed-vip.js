const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const vipLevels = [
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
