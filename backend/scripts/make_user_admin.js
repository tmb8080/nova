const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`✅ Found user: ${user.fullName || 'No name'} (ID: ${user.id})`);
    console.log(`📊 Current admin status: ${user.isAdmin ? 'Admin' : 'Regular User'}`);

    if (user.isAdmin) {
      console.log(`ℹ️  User is already an admin`);
      return;
    }

    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin: true }
    });

    console.log(`✅ Successfully made user admin!`);
    console.log(`📊 New admin status: ${updatedUser.isAdmin ? 'Admin' : 'Regular User'}`);
    console.log(`👤 User: ${updatedUser.fullName || 'No name'} (${updatedUser.email})`);

  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node make_user_admin.js <email>');
  console.log('Example: node make_user_admin.js test123@example.com');
  process.exit(1);
}

makeUserAdmin(email);
