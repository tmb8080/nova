const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Status file path for communication with main server
const STATUS_FILE_PATH = path.join(__dirname, '../automatic_detection_status.json');

// Update status file
const updateStatus = (isRunning, message = '') => {
  try {
    const status = {
      isRunning,
      message,
      lastUpdated: new Date().toISOString()
    };
    fs.writeFileSync(STATUS_FILE_PATH, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error updating status file:', error);
  }
};

// Configuration
const NETWORKS = {
  BSC: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    provider: null,
    contracts: {
      USDT: '0x55d398326f99059fF775485246999027B3197955',
      USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
    }
  },
  POLYGON: {
    rpcUrl: 'https://polygon-rpc.com/',
    provider: null,
    contracts: {
      USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    }
  },
  ETHEREUM: {
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    provider: null,
    contracts: {
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      USDC: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C'
    }
  }
};

// Initialize providers
const initializeProviders = () => {
  Object.keys(NETWORKS).forEach(network => {
    if (NETWORKS[network].rpcUrl && !NETWORKS[network].rpcUrl.includes('YOUR_INFURA_KEY')) {
      try {
        NETWORKS[network].provider = new ethers.JsonRpcProvider(NETWORKS[network].rpcUrl);
        console.log(`✅ Provider initialized for ${network}`);
      } catch (error) {
        console.log(`❌ Failed to initialize provider for ${network}:`, error.message);
      }
    }
  });
};

// Start polling-based monitoring
const startPollingMonitoring = async () => {
  console.log('Starting polling-based monitoring...');
  
  // Poll every 30 seconds
  setInterval(async () => {
    try {
      await pollAllNetworks();
    } catch (error) {
      console.error('Error in polling cycle:', error);
    }
  }, 30000); // 30 seconds
  
  console.log('Polling monitoring started (every 30 seconds)');
};

// Poll all networks for transactions
const pollAllNetworks = async () => {
  const networks = Object.keys(NETWORKS);
  
  for (const network of networks) {
    try {
      await pollNetworkTransactions(network);
    } catch (error) {
      console.error(`Error polling ${network}:`, error);
    }
  }
};

// Poll specific network for transactions
const pollNetworkTransactions = async (network) => {
  try {
    const walletAddress = getWalletAddressForNetwork(network);
    if (!walletAddress) {
      console.log(`No wallet address configured for ${network}`);
      return;
    }

    console.log(`Polling ${network} for transactions...`);

    // Get recent transactions using blockchain API
    const transactions = await getRecentTransactions(network, walletAddress);
    
    for (const tx of transactions) {
      await processIncomingTransfer(network, tx.token, {
        from: tx.from,
        to: tx.to,
        amount: tx.amount,
        transactionHash: tx.hash,
        blockNumber: tx.blockNumber,
        token: tx.token
      });
    }
    
  } catch (error) {
    console.error(`Error polling ${network} transactions:`, error);
  }
};

// Get recent transactions from blockchain API
const getRecentTransactions = async (network, walletAddress) => {
  try {
    // Use blockchain explorer APIs to get recent transactions
    let apiUrl;
    
    switch (network) {
      case 'BSC':
        apiUrl = `https://api.bscscan.com/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.BSCSCAN_API_KEY || 'YourApiKeyToken'}`;
        break;
      case 'POLYGON':
        apiUrl = `https://api.polygonscan.com/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken'}`;
        break;
      case 'ETHEREUM':
        apiUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'}`;
        break;
      default:
        return [];
    }

    const response = await axios.get(apiUrl);
    
    if (response.data.status === '1') {
      return response.data.result.map(tx => ({
        from: tx.from,
        to: tx.to,
        amount: tx.value,
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        token: getTokenFromContract(tx.contractAddress, network)
      }));
    }
    
    return [];
    
  } catch (error) {
    console.error(`Error getting recent transactions for ${network}:`, error);
    return [];
  }
};

// Process incoming transfer
const processIncomingTransfer = async (network, token, transferData) => {
  try {
    console.log(`Processing ${token} transfer:`, transferData);

    // Convert amount to decimal
    const decimals = token === 'USDT' ? 18 : 6; // USDT on BSC has 18 decimals
    const amount = ethers.formatUnits(transferData.amount, decimals);

    // Find matching pending deposit
    const matchingDeposit = await findMatchingDeposit(amount, network, transferData.from, token);
    
    if (matchingDeposit) {
      console.log(`Found matching deposit: ${matchingDeposit.id}`);
      
      // Process the deposit automatically
      await processAutomaticDeposit(matchingDeposit.id, transferData.transactionHash);
      
    } else {
      console.log(`No matching deposit found for ${amount} ${token} from ${transferData.from}`);
      
      // Create orphan transaction record
      await createOrphanTransaction(transferData, network, token, amount);
    }
    
  } catch (error) {
    console.error('Error processing incoming transfer:', error);
  }
};

// Find matching pending deposit
const findMatchingDeposit = async (amount, network, fromAddress, token) => {
  try {
    // Convert network name to deposit type
    const depositType = getDepositTypeFromNetwork(network);
    
    // Find pending deposit with matching criteria
    const deposit = await prisma.deposit.findFirst({
      where: {
        amount: parseFloat(amount),
        currency: token,
        network: network,
        status: 'PENDING',
        depositType: depositType,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    return deposit;
    
  } catch (error) {
    console.error('Error finding matching deposit:', error);
    return null;
  }
};

// Process automatic deposit
const processAutomaticDeposit = async (depositId, transactionHash) => {
  try {
    console.log(`Processing automatic deposit: ${depositId}`);

    // Import deposit service
    const { processUsdtDepositConfirmation } = require('./depositService');
    
    // Process the deposit confirmation
    await processUsdtDepositConfirmation(depositId, transactionHash);
    
    console.log(`Automatic deposit processed successfully: ${depositId}`);
    
  } catch (error) {
    console.error(`Error processing automatic deposit ${depositId}:`, error);
  }
};

// Create orphan transaction record
const createOrphanTransaction = async (transferData, network, token, amount) => {
  try {
    // Create a record of unmatched transactions
    await prisma.orphanTransaction.create({
      data: {
        transactionHash: transferData.transactionHash,
        fromAddress: transferData.from,
        toAddress: transferData.to,
        amount: parseFloat(amount),
        currency: token,
        network: network,
        blockNumber: transferData.blockNumber,
        status: 'UNMATCHED'
      }
    });
    
    console.log(`Orphan transaction recorded: ${transferData.transactionHash}`);
    
  } catch (error) {
    console.error('Error creating orphan transaction:', error);
  }
};

// Helper functions
const getWalletAddressForNetwork = (network) => {
  const addresses = {
    'BSC': process.env.BSC_WALLET_ADDRESS,
    'POLYGON': process.env.POLYGON_WALLET_ADDRESS,
    'ETHEREUM': process.env.ETH_WALLET_ADDRESS,
    'TRON': process.env.TRON_WALLET_ADDRESS
  };
  
  return addresses[network];
};

const getDepositTypeFromNetwork = (network) => {
  const types = {
    'BSC': 'USDT_DIRECT',
    'POLYGON': 'USDT_DIRECT',
    'ETHEREUM': 'USDT_DIRECT',
    'TRON': 'USDT_DIRECT'
  };
  
  return types[network] || 'USDT_DIRECT';
};

const getTokenFromContract = (contractAddress, network) => {
  const contracts = NETWORKS[network]?.contracts || {};
  
  for (const [token, address] of Object.entries(contracts)) {
    if (address.toLowerCase() === contractAddress.toLowerCase()) {
      return token;
    }
  }
  
  return 'UNKNOWN';
};

// Start monitoring
const startMonitoring = async () => {
  try {
    console.log('🚀 Starting automatic transaction detection...');
    
    // Set global flag
    global.automaticDetectionRunning = true;
    
    // Update status file
    updateStatus(true, 'Automatic detection is active and monitoring transactions');
    
    // Initialize providers (for future use)
    initializeProviders();
    
    // Start polling-based monitoring
    await startPollingMonitoring();
    
    console.log('✅ Automatic detection monitoring started successfully');
    
  } catch (error) {
    console.error('❌ Error starting automatic detection:', error);
    global.automaticDetectionRunning = false;
    updateStatus(false, 'Failed to start automatic detection: ' + error.message);
  }
};

// Stop monitoring
const stopMonitoring = () => {
  console.log('🛑 Stopping automatic detection monitoring...');
  
  // Set global flag
  global.automaticDetectionRunning = false;
  
  // Update status file
  updateStatus(false, 'Automatic detection has been stopped');
  
  // Stop all providers
  Object.keys(NETWORKS).forEach(network => {
    if (NETWORKS[network].provider) {
      NETWORKS[network].provider.removeAllListeners();
    }
  });
};

module.exports = {
  startMonitoring,
  stopMonitoring,
  processIncomingTransfer,
  findMatchingDeposit
};
