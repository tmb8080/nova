const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addBalance() {
  try {
    // Find the VIP buyer user
    const user = await prisma.user.findUnique({
      where: { email: 'vipbuyer@test.com' },
      include: { wallet: true }
    });

    if (!user) {
      console.log('VIP buyer user not found');
      return;
    }

    console.log('Found user:', user.fullName, 'ID:', user.id);

    // Add $1000 balance to the wallet
    const updatedWallet = await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: {
          increment: 1000
        }
      }
    });

    console.log('Updated wallet balance:', updatedWallet.balance);

    // Create a transaction record for the balance addition
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'DEPOSIT',
        amount: 1000,
        description: 'Test balance addition for VIP purchase'
      }
    });

    console.log('Balance added successfully!');
  } catch (error) {
    console.error('Error adding balance:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBalance();
