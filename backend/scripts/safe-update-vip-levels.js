/*
  Script: Safely update VIP levels WITHOUT affecting current user VIPs
  - Upserts target levels by amount
  - Updates name/dailyEarning/isActive for matching amounts
  - Creates missing levels
  - Optionally deactivates obsolete levels that have no users
  Usage: node backend/scripts/safe-update-vip-levels.js
*/

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// [amount, dailyPercent]
const TARGET_LEVELS = [
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

const calcDaily = (amount, pct) => (amount * (pct / 100)).toFixed(8);

async function main() {
  const existing = await prisma.vipLevel.findMany({});
  // Build amount->level map (as number)
  const amountToLevel = new Map(
    existing.map((l) => [Number(l.amount), l])
  );

  console.log('🔧 Upserting VIP levels (non-destructive)...');

  for (const [amount, pct] of TARGET_LEVELS) {
    const daily = calcDaily(amount, pct);
    const name = `VIP $${amount.toLocaleString('en-US')}`;
    const match = amountToLevel.get(amount);

    if (match) {
      // Update in place: keep ID so user_vips remain intact
      await prisma.vipLevel.update({
        where: { id: match.id },
        data: {
          name,
          amount: amount.toString(),
          dailyEarning: daily,
          isActive: true,
        },
      });
      console.log(`✅ Updated ${name} (id=${match.id}) daily=${daily}`);
    } else {
      // Create new level (does not affect current assignments)
      const created = await prisma.vipLevel.create({
        data: {
          name,
          amount: amount.toString(),
          dailyEarning: daily,
          isActive: true,
        },
      });
      console.log(`➕ Created ${name} (id=${created.id}) daily=${daily}`);
    }
  }

  // Optionally deactivate obsolete levels that have no users and not in target
  const targetAmounts = new Set(TARGET_LEVELS.map(([a]) => a));
  for (const lvl of existing) {
    if (!targetAmounts.has(Number(lvl.amount))) {
      const userCount = await prisma.userVip.count({ where: { vipLevelId: lvl.id } });
      if (userCount === 0 && lvl.isActive) {
        await prisma.vipLevel.update({ where: { id: lvl.id }, data: { isActive: false } });
        console.log(`🛈 Deactivated obsolete level id=${lvl.id} amount=${lvl.amount}`);
      }
    }
  }

  console.log('🎉 Safe VIP level update complete. No user assignments were changed.');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


