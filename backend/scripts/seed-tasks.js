const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTasks() {
  try {
    console.log('Seeding default tasks...');

    const defaultTasks = [
      {
        title: 'Daily Login',
        description: 'Log in to your account daily to earn rewards',
        type: 'DAILY_LOGIN',
        reward: 1.00,
        isRepeatable: true,
        cooldownHours: 24,
        requirements: {
          action: 'login',
          frequency: 'daily'
        }
      },
      {
        title: 'Refer a Friend',
        description: 'Invite a friend to join the platform',
        type: 'REFERRAL',
        reward: 5.00,
        isRepeatable: true,
        requirements: {
          action: 'referral',
          minDeposit: 10
        }
      },
      {
        title: 'Make Your First Deposit',
        description: 'Complete your first deposit to unlock more features',
        type: 'DEPOSIT',
        reward: 10.00,
        isRepeatable: false,
        requirements: {
          action: 'deposit',
          minAmount: 10
        }
      },
      {
        title: 'Upgrade to VIP',
        description: 'Join a VIP level to access exclusive benefits',
        type: 'VIP_UPGRADE',
        reward: 15.00,
        isRepeatable: false,
        requirements: {
          action: 'vip_upgrade'
        }
      },
      {
        title: 'Share on Social Media',
        description: 'Share your referral link on social media',
        type: 'SOCIAL_SHARE',
        reward: 2.00,
        isRepeatable: true,
        cooldownHours: 12,
        requirements: {
          action: 'social_share',
          platforms: ['facebook', 'twitter', 'instagram', 'telegram']
        }
      },
      {
        title: 'Complete Survey',
        description: 'Complete a quick survey to help us improve',
        type: 'SURVEY',
        reward: 3.00,
        isRepeatable: true,
        cooldownHours: 6,
        requirements: {
          action: 'survey',
          minQuestions: 5
        }
      },
      {
        title: 'Watch Tutorial Video',
        description: 'Watch a tutorial video to learn about the platform',
        type: 'WATCH_VIDEO',
        reward: 1.50,
        isRepeatable: true,
        cooldownHours: 2,
        requirements: {
          action: 'watch_video',
          minDuration: 60 // seconds
        }
      },
      {
        title: 'Verify Your Email',
        description: 'Verify your email address for account security',
        type: 'CUSTOM',
        reward: 2.00,
        isRepeatable: false,
        requirements: {
          action: 'email_verification'
        }
      },
      {
        title: 'Verify Your Phone',
        description: 'Verify your phone number for additional security',
        type: 'CUSTOM',
        reward: 2.00,
        isRepeatable: false,
        requirements: {
          action: 'phone_verification'
        }
      },
      {
        title: 'Complete Profile',
        description: 'Fill out your complete profile information',
        type: 'CUSTOM',
        reward: 1.00,
        isRepeatable: false,
        requirements: {
          action: 'profile_completion',
          fields: ['fullName', 'phone']
        }
      }
    ];

    for (const taskData of defaultTasks) {
      const existingTask = await prisma.task.findFirst({
        where: {
          title: taskData.title,
          type: taskData.type
        }
      });

      if (!existingTask) {
        await prisma.task.create({
          data: taskData
        });
        console.log(`Created task: ${taskData.title}`);
      } else {
        console.log(`Task already exists: ${taskData.title}`);
      }
    }

    console.log('Task seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tasks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedTasks()
    .then(() => {
      console.log('Task seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Task seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTasks };
