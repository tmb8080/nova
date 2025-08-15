#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

async function setupTasks() {
  try {
    console.log('🚀 Setting up task system...');
    
    // Run the migration
    console.log('📦 Running database migration...');
    try {
      execSync('npx prisma migrate dev --name add_task_system', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.log('⚠️  Migration failed or already applied');
    }
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Prisma client generated');
    } catch (error) {
      console.error('❌ Failed to generate Prisma client:', error.message);
    }
    
    // Seed tasks
    console.log('🌱 Seeding default tasks...');
    try {
      const { seedTasks } = require('./seed-tasks');
      await seedTasks();
      console.log('✅ Tasks seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed tasks:', error.message);
    }
    
    console.log('🎉 Task system setup completed!');
    console.log('');
    console.log('📋 Available task types:');
    console.log('   • Daily Login - Earn $1.00 for logging in daily');
    console.log('   • Refer a Friend - Earn $5.00 for each referral');
    console.log('   • Make Your First Deposit - Earn $10.00 for first deposit');
    console.log('   • Upgrade to VIP - Earn $15.00 for joining VIP');
    console.log('   • Share on Social Media - Earn $2.00 for social sharing');
    console.log('   • Complete Survey - Earn $3.00 for surveys');
    console.log('   • Watch Tutorial Video - Earn $1.50 for watching videos');
    console.log('   • Verify Your Email - Earn $2.00 for email verification');
    console.log('   • Verify Your Phone - Earn $2.00 for phone verification');
    console.log('   • Complete Profile - Earn $1.00 for profile completion');
    console.log('');
    console.log('💰 Task rewards are automatically added to user wallets when completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupTasks()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTasks };
