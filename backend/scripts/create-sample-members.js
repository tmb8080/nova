const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSampleMembers() {
  try {
    console.log('Creating sample members...');

    // Sample member data
    const sampleMembers = [
      {
        email: 'john.doe@example.com',
        fullName: 'John Doe',
        phone: '+1234567890',
        password: 'password123',
        referralCode: 'JOHN001'
      },
      {
        email: 'jane.smith@example.com',
        fullName: 'Jane Smith',
        phone: '+1234567891',
        password: 'password123',
        referralCode: 'JANE002'
      },
      {
        email: 'mike.wilson@example.com',
        fullName: 'Mike Wilson',
        phone: '+1234567892',
        password: 'password123',
        referralCode: 'MIKE003'
      },
      {
        email: 'sarah.johnson@example.com',
        fullName: 'Sarah Johnson',
        phone: '+1234567893',
        password: 'password123',
        referralCode: 'SARAH004'
      },
      {
        email: 'david.brown@example.com',
        fullName: 'David Brown',
        phone: '+1234567894',
        password: 'password123',
        referralCode: 'DAVID005'
      }
    ];

    // Create or update users
    for (const memberData of sampleMembers) {
      const hashedPassword = await bcrypt.hash(memberData.password, 10);
      
      const user = await prisma.user.upsert({
        where: { email: memberData.email },
        update: {
          fullName: memberData.fullName,
          phone: memberData.phone,
          referralCode: memberData.referralCode,
          isEmailVerified: true,
          isPhoneVerified: true
        },
        create: {
          email: memberData.email,
          fullName: memberData.fullName,
          phone: memberData.phone,
          password: hashedPassword,
          referralCode: memberData.referralCode,
          isEmailVerified: true,
          isPhoneVerified: true
        }
      });

      // Create or update wallet for user
      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: {
          balance: Math.random() * 1000 + 100, // Random balance between 100-1100
          totalDeposits: Math.random() * 2000 + 500, // Random deposits between 500-2500
          totalEarnings: Math.random() * 800 + 200, // Random earnings between 200-1000
          totalReferralBonus: Math.random() * 300 + 50, // Random referral bonus between 50-350
          dailyEarnings: Math.random() * 50 + 10 // Random daily earnings between 10-60
        },
        create: {
          userId: user.id,
          balance: Math.random() * 1000 + 100, // Random balance between 100-1100
          totalDeposits: Math.random() * 2000 + 500, // Random deposits between 500-2500
          totalEarnings: Math.random() * 800 + 200, // Random earnings between 200-1000
          totalReferralBonus: Math.random() * 300 + 50, // Random referral bonus between 50-350
          dailyEarnings: Math.random() * 50 + 10 // Random daily earnings between 10-60
        }
      });

      console.log(`Created/Updated user: ${memberData.fullName} (${memberData.email})`);
    }

    // Get VIP levels
    const vipLevels = await prisma.vipLevel.findMany({
      orderBy: { amount: 'asc' }
    });

    if (vipLevels.length === 0) {
      console.log('No VIP levels found. Please run the VIP seeding script first.');
      return;
    }

    // Assign random VIP levels to users
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      include: { wallet: true }
    });

    for (const user of users) {
      // Randomly assign a VIP level (higher chance for lower levels)
      const randomLevel = Math.random();
      let selectedLevel;
      
      if (randomLevel < 0.4) {
        selectedLevel = vipLevels[0]; // Starter
      } else if (randomLevel < 0.6) {
        selectedLevel = vipLevels[1]; // V2
      } else if (randomLevel < 0.75) {
        selectedLevel = vipLevels[2]; // V3
      } else if (randomLevel < 0.85) {
        selectedLevel = vipLevels[3]; // V4
      } else if (randomLevel < 0.92) {
        selectedLevel = vipLevels[4]; // V5
      } else if (randomLevel < 0.96) {
        selectedLevel = vipLevels[5]; // V6
      } else {
        selectedLevel = vipLevels[Math.floor(Math.random() * Math.min(3, vipLevels.length - 6)) + 6]; // V7+
      }

      // Create user VIP
      await prisma.userVip.upsert({
        where: { userId: user.id },
        update: {
          vipLevelId: selectedLevel.id,
          isActive: true,
          totalPaid: selectedLevel.amount
        },
        create: {
          userId: user.id,
          vipLevelId: selectedLevel.id,
          isActive: true,
          totalPaid: selectedLevel.amount
        }
      });

      // Create some sample transactions
      const totalEarnings = Math.random() * 1000 + 100;
      const transactionCount = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < transactionCount; i++) {
        const amount = totalEarnings / transactionCount + (Math.random() - 0.5) * 20;
        const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

        await prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'VIP_EARNINGS',
            amount: Math.max(0, amount),
            description: `Daily VIP earnings from ${selectedLevel.name}`,
            createdAt: createdAt
          }
        });
      }

      console.log(`Assigned VIP level ${selectedLevel.name} to ${user.fullName}`);
    }

    console.log('✅ Sample members created successfully!');
    console.log(`Created ${users.length} users with VIP levels and transaction history.`);

  } catch (error) {
    console.error('❌ Error creating sample members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleMembers();
