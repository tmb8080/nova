const { PrismaClient } = require('@prisma/client');
const { initializeDefaultFees } = require('../services/networkFeeService');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Initializing default network fees...');
    await initializeDefaultFees();
    console.log('Network fees initialized successfully!');
  } catch (error) {
    console.error('Error initializing network fees:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
