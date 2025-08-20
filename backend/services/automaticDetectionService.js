const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { ethers } = require('ethers');

const prisma = new PrismaClient();

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
    if (NETWORKS[network].rpcUrl) {
      NETWORKS[network].provider = new ethers.providers.JsonRpcProvider(NETWORKS[network].rpcUrl);
    }
  });
};

// Monitor wallet for incoming transactions
const startWalletMonitoring = async () => {
  console.log('Starting automatic wallet monitoring...');
  
  initializeProviders();
  
  // Start monitoring for each network
  Object.keys(NETWORKS).forEach(network => {
    if (NETWORKS[network].provider) {
      monitorNetworkTransactions(network);
    }
  });
};

// Monitor transactions on a specific network
const monitorNetworkTransactions = async (network) => {
  const networkConfig = NETWORKS[network];
  const provider = networkConfig.provider;
  const walletAddress = getWalletAddressForNetwork(network);
  
  if (!walletAddress) {
    console.log(`No wallet address configured for ${network}`);
    return;
  }

  console.log(`Monitoring ${network} transactions for wallet: ${walletAddress}`);

  // Monitor USDT transfers
  if (networkConfig.contracts.USDT) {
    monitorTokenTransfers(network, 'USDT', networkConfig.contracts.USDT, walletAddress);
  }

  // Monitor USDC transfers
  if (networkConfig.contracts.USDC) {
    monitorTokenTransfers(network, 'USDC', networkConfig.contracts.USDC, walletAddress);
  }
};

// Monitor specific token transfers
const monitorTokenTransfers = async (network, token, contractAddress, walletAddress) => {
  const provider = NETWORKS[network].provider;
  
  // Create filter for Transfer events to your wallet
  const filter = {
    address: contractAddress,
    topics: [
      ethers.utils.id("Transfer(address,address,uint256)"),
      null, // from address (any)
      ethers.utils.hexZeroPad(walletAddress, 32) // to address (your wallet)
    ]
  };

  // Listen for Transfer events
  provider.on(filter, async (log) => {
    try {
      console.log(`Detected ${token} transfer on ${network}:`, log.transactionHash);
      
      // Parse transfer event
      const transferData = parseTransferEvent(log, token);
      
      // Process the transfer
      await processIncomingTransfer(network, token, transferData);
      
    } catch (error) {
      console.error(`Error processing ${token} transfer on ${network}:`, error);
    }
  });
};

// Parse transfer event data
const parseTransferEvent = (log, token) => {
  const iface = new ethers.utils.Interface([
    "event Transfer(address indexed from, address indexed to, uint256 value)"
  ]);
  
  const parsedLog = iface.parseLog(log);
  
  return {
    from: parsedLog.args.from,
    to: parsedLog.args.to,
    amount: parsedLog.args.value.toString(),
    transactionHash: log.transactionHash,
    blockNumber: log.blockNumber,
    token: token
  };
};

// Process incoming transfer
const processIncomingTransfer = async (network, token, transferData) => {
  try {
    console.log(`Processing ${token} transfer:`, transferData);

    // Convert amount to decimal
    const decimals = token === 'USDT' ? 18 : 6; // USDT on BSC has 18 decimals
    const amount = ethers.utils.formatUnits(transferData.amount, decimals);

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

    console.log(`Created orphan transaction record: ${transferData.transactionHash}`);
    
  } catch (error) {
    console.error('Error creating orphan transaction:', error);
  }
};

// Polling method for networks without event support
const startPollingMonitoring = async () => {
  console.log('Starting polling-based monitoring...');
  
  setInterval(async () => {
    await pollAllNetworks();
  }, 30000); // Poll every 30 seconds
};

// Poll all networks for new transactions
const pollAllNetworks = async () => {
  for (const network of Object.keys(NETWORKS)) {
    await pollNetworkTransactions(network);
  }
};

// Poll specific network for transactions
const pollNetworkTransactions = async (network) => {
  try {
    const walletAddress = getWalletAddressForNetwork(network);
    if (!walletAddress) return;

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
    let apiUrl;
    let apiKey;
    
    switch (network) {
      case 'BSC':
        apiKey = process.env.BSCSCAN_API_KEY;
        apiUrl = `https://api.bscscan.com/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        break;
      case 'POLYGON':
        apiKey = process.env.POLYGONSCAN_API_KEY;
        apiUrl = `https://api.polygonscan.com/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        break;
      case 'ETHEREUM':
        apiKey = process.env.ETHERSCAN_API_KEY;
        apiUrl = `https://api.etherscan.io/api?module=account&action=tokentx&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
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
    // Set global flag
    global.automaticDetectionRunning = true;
    
    // Start event-based monitoring
    await startWalletMonitoring();
    
    // Start polling-based monitoring as backup
    await startPollingMonitoring();
    
    console.log('Automatic detection monitoring started successfully');
    
  } catch (error) {
    console.error('Error starting automatic detection:', error);
    global.automaticDetectionRunning = false;
  }
};

// Stop monitoring
const stopMonitoring = () => {
  console.log('Stopping automatic detection monitoring...');
  
  // Set global flag
  global.automaticDetectionRunning = false;
  
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
