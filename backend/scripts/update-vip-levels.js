/*
  Script: Update VIP Levels to match the 30 Days Earnings Table
  Usage:  NODE_ENV=production node backend/scripts/update-vip-levels.js
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Table source:
// [amount, dailyProfitPercent]
const LEVELS = [
  [10, 10],
  [50, 10],
  [100, 10],
  [150, 11],
  [250, 11],
  [300, 11],
  [500, 11],
  [650, 11.5],
  [900, 12],
  [1000, 12],
  [1500, 12.5],
  [10000, 12.5],
  [50000, 13],
  [200000, 13],
];

function calcDailyEarning(amount, percent) {
  return (amount * (percent / 100)).toFixed(8);
}

async function main() {
  console.log('🔧 Updating VIP Levels...');

  for (let i = 0; i < LEVELS.length; i++) {
    const [amount, percent] = LEVELS[i];
    const name = `VIP $${amount.toLocaleString('en-US')}`;
    const dailyEarning = calcDailyEarning(amount, percent);

    const data = {
      name,
      amount: amount.toString(),
      dailyEarning: dailyEarning.toString(),
      isActive: true,
    };

    const res = await prisma.vipLevel.upsert({
      where: { name },
      update: data,
      create: data,
    });

    console.log(`✅ ${res.name} → amount=$${amount}, daily=${dailyEarning} (${percent}%)`);
  }

  console.log('🎉 VIP Levels updated successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error updating VIP levels:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


