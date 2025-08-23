const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateUserPassword() {
  try {
    console.log('🔧 Updating user password...\n');

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { phone: '1234567890' }
        ]
      }
    });

    if (!user) {
      console.log('❌ No user found');
      return;
    }

    console.log(`👤 Found user: ${user.fullName || user.email || user.id}`);

    // Hash new password
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        isAdmin: true
      }
    });

    console.log('✅ User password updated!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`📱 Phone: ${user.phone}`);
    console.log(`🔑 New Password: ${newPassword}`);
    console.log(`👑 Is Admin: true`);

  } catch (error) {
    console.error('❌ Error updating user password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateUserPassword();
