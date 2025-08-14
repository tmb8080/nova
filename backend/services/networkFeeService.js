const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get network fee for a specific network and currency
const getNetworkFee = async (network, currency) => {
  try {
    const fee = await prisma.networkFees.findFirst({
      where: {
        network,
        currency,
        isActive: true
      }
    });

    return fee ? parseFloat(fee.feeAmount) : 0;
  } catch (error) {
    console.error('Error fetching network fee:', error);
    return 0;
  }
};

// Get all network fees
const getAllNetworkFees = async () => {
  try {
    const fees = await prisma.networkFees.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { network: 'asc' },
        { currency: 'asc' }
      ]
    });

    return fees.map(fee => ({
      ...fee,
      feeAmount: parseFloat(fee.feeAmount)
    }));
  } catch (error) {
    console.error('Error fetching all network fees:', error);
    return [];
  }
};

// Create or update network fee
const upsertNetworkFee = async (network, currency, feeAmount) => {
  try {
    const fee = await prisma.networkFees.upsert({
      where: {
        network_currency: {
          network,
          currency
        }
      },
      update: {
        feeAmount,
        updatedAt: new Date()
      },
      create: {
        network,
        currency,
        feeAmount
      }
    });

    return {
      ...fee,
      feeAmount: parseFloat(fee.feeAmount)
    };
  } catch (error) {
    console.error('Error upserting network fee:', error);
    throw error;
  }
};

// Initialize default network fees
const initializeDefaultFees = async () => {
  try {
    const defaultFees = [
      { network: 'TRC20', currency: 'USDT', feeAmount: 1 },
      { network: 'BEP20', currency: 'USDT', feeAmount: 2 },
      { network: 'BEP20', currency: 'USDC', feeAmount: 2 },
      { network: 'ERC20', currency: 'USDT', feeAmount: 5 },
      { network: 'ERC20', currency: 'USDC', feeAmount: 5 },
      { network: 'POLYGON', currency: 'USDT', feeAmount: 3 },
      { network: 'POLYGON', currency: 'USDC', feeAmount: 3 },
      { network: 'ARBITRUM', currency: 'USDT', feeAmount: 4 },
      { network: 'ARBITRUM', currency: 'USDC', feeAmount: 4 },
      { network: 'OPTIMISM', currency: 'USDT', feeAmount: 4 },
      { network: 'OPTIMISM', currency: 'USDC', feeAmount: 4 }
    ];

    for (const fee of defaultFees) {
      await upsertNetworkFee(fee.network, fee.currency, fee.feeAmount);
    }

    console.log('Default network fees initialized successfully');
  } catch (error) {
    console.error('Error initializing default network fees:', error);
  }
};

// Get available networks for a currency
const getAvailableNetworks = async (currency) => {
  try {
    const fees = await prisma.networkFees.findMany({
      where: {
        currency,
        isActive: true
      },
      select: {
        network: true,
        feeAmount: true
      },
      orderBy: {
        feeAmount: 'asc'
      }
    });

    return fees.map(fee => ({
      network: fee.network,
      fee: parseFloat(fee.feeAmount)
    }));
  } catch (error) {
    console.error('Error fetching available networks:', error);
    return [];
  }
};

module.exports = {
  getNetworkFee,
  getAllNetworkFees,
  upsertNetworkFee,
  initializeDefaultFees,
  getAvailableNetworks
};
