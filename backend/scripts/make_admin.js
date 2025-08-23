const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeUserAdmin() {
  try {
    console.log('🔧 Making user admin...\n');

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@company.com' },
          { email: 'admin@example.com' },
          { phone: '1234567890' }
        ]
      }
    });

    if (!user) {
      console.log('❌ No user found with admin credentials');
      return;
    }

    console.log(`👤 Found user: ${user.fullName || user.email || user.id}`);

    // Update user to admin
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true }
    });

    console.log('✅ User is now admin!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`📱 Phone: ${user.phone}`);
    console.log(`🔑 Password: admin123`);

  } catch (error) {
    console.error('❌ Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
makeUserAdmin();
