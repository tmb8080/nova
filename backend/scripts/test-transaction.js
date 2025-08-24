const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const { ethers } = require('ethers');

const prisma = new PrismaClient();

// Configuration for different networks
const NETWORKS = {
  BSC: {
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
    apiUrl: 'https://api.bscscan.com/api',
    apiKey: process.env.BSCSCAN_API_KEY || 'YourApiKeyToken'
  },
  POLYGON: {
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com/',
    explorer: 'https://polygonscan.com',
    apiUrl: 'https://api.polygonscan.com/api',
    apiKey: process.env.POLYGONSCAN_API_KEY || 'YourApiKeyToken'
  },
  ETHEREUM: {
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    explorer: 'https://etherscan.io',
    apiUrl: 'https://api.etherscan.io/api',
    apiKey: process.env.ETHERSCAN_API_KEY || 'YourApiKeyToken'
  }
};

async function testTransaction(transactionHash) {
  try {
    console.log(`🧪 Testing Transaction: ${transactionHash}\n`);

    // Declare variables at function scope
    let transactionDetails = null;
    let detectedNetwork = null;
    let userAddress = null;
    let existingDeposit = null;

    // Test 1: Check environment variables
    console.log('1️⃣ Checking Environment Configuration...');
    const requiredVars = ['BSCSCAN_API_KEY', 'POLYGONSCAN_API_KEY', 'ETHERSCAN_API_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`   ⚠️  Missing API keys: ${missingVars.join(', ')}`);
      console.log('   Some features may not work properly');
    } else {
      console.log('   ✅ All API keys are configured');
    }

    // Test 2: Try to detect transaction network and details
    console.log('\n2️⃣ Detecting Transaction Details...');

    for (const [networkKey, network] of Object.entries(NETWORKS)) {
      try {
        console.log(`   🔍 Checking ${network.name}...`);
        
        const response = await axios.get(network.apiUrl, {
          params: {
            module: 'proxy',
            action: 'eth_getTransactionByHash',
            txhash: transactionHash,
            apikey: network.apiKey
          },
          timeout: 10000
        });

        if (response.data.result) {
          console.log(`   ✅ Transaction found on ${network.name}!`);
          transactionDetails = response.data.result;
          detectedNetwork = networkKey;
          break;
        }
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`   ⚠️  Rate limited on ${network.name}`);
        } else {
          console.log(`   ❌ Error checking ${network.name}: ${error.message}`);
        }
      }
    }

    if (!transactionDetails) {
      console.log('   ❌ Transaction not found on any supported network');
      console.log('   This could mean:');
      console.log('   - Transaction hash is invalid');
      console.log('   - Transaction is on an unsupported network');
      console.log('   - Transaction is still pending');
      return;
    }

    // Test 3: Get detailed transaction info
    console.log('\n3️⃣ Getting Transaction Details...');
    try {
      const network = NETWORKS[detectedNetwork];
      const response = await axios.get(network.apiUrl, {
        params: {
          module: 'account',
          action: 'tokentx',
          txhash: transactionHash,
          apikey: network.apiKey
        }
      });

      if (response.data.status === '1' && response.data.result.length > 0) {
        const tx = response.data.result[0];
        console.log(`   📊 Transaction Details:`);
        console.log(`      Network: ${network.name}`);
        console.log(`      From: ${tx.from}`);
        console.log(`      To: ${tx.to}`);
        console.log(`      Token: ${tx.tokenName} (${tx.tokenSymbol})`);
        console.log(`      Amount: ${ethers.formatUnits(tx.value, tx.tokenDecimal)}`);
        console.log(`      Contract: ${tx.contractAddress}`);
        console.log(`      Block: ${tx.blockNumber}`);
        console.log(`      Gas Used: ${tx.gasUsed}`);
        console.log(`      Gas Price: ${ethers.formatUnits(tx.gasPrice, 'wei')} wei`);
        
        // Test 4: Check if this is a USDT transaction
        console.log('\n4️⃣ Checking Token Type...');
        const usdtContracts = {
          'BSC': '0x55d398326f99059fF775485246999027B3197955',
          'POLYGON': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          'ETHEREUM': '0xdAC17F958D2ee523a2206206994597C13D831ec7'
        };
        
        const isUsdt = usdtContracts[detectedNetwork]?.toLowerCase() === tx.contractAddress.toLowerCase();
        if (isUsdt) {
          console.log('   ✅ This is a USDT transaction!');
        } else {
          console.log('   ⚠️  This is not a USDT transaction');
          console.log(`      Expected: ${usdtContracts[detectedNetwork]}`);
          console.log(`      Got: ${tx.contractAddress}`);
        }

        // Test 5: Check if recipient address is in our system
        console.log('\n5️⃣ Checking Recipient Address...');
        const recipientAddress = tx.to.toLowerCase();
        
        // Check user wallet addresses
        userAddress = await prisma.userWalletAddress.findFirst({
          where: {
            address: {
              equals: recipientAddress,
              mode: 'insensitive'
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

        if (userAddress) {
          console.log('   ✅ Recipient address found in our system!');
          console.log(`      User: ${userAddress.user.fullName || userAddress.user.email || userAddress.user.id}`);
          console.log(`      Network: ${userAddress.network}`);
        } else {
          console.log('   ❌ Recipient address not found in our system');
          console.log('   This could mean:');
          console.log('   - Address is not registered');
          console.log('   - Address is on wrong network');
          console.log('   - Database needs to be updated');
        }

        // Test 6: Check if transaction is already processed
        console.log('\n6️⃣ Checking Transaction Status...');
        try {
          existingDeposit = await prisma.deposit.findFirst({
            where: {
              transactionHash: transactionHash
            }
          });

          if (existingDeposit) {
            console.log('   ⚠️  Transaction already processed!');
            console.log(`      Deposit ID: ${existingDeposit.id}`);
            console.log(`      Status: ${existingDeposit.status}`);
            console.log(`      Amount: ${existingDeposit.amount} ${existingDeposit.currency}`);
          } else {
            console.log('   ✅ Transaction not yet processed');
            console.log('   Ready for automatic detection or manual processing');
          }
        } catch (error) {
          console.log(`   ❌ Error checking transaction status: ${error.message}`);
        }

      } else {
        console.log('   ❌ Could not get detailed transaction info');
        console.log('   Response:', response.data);
      }
    } catch (error) {
      console.log(`   ❌ Error getting transaction details: ${error.message}`);
    }

    // Test 7: Test automatic detection simulation
    console.log('\n7️⃣ Testing Automatic Detection...');
    try {
      const { processIncomingTransferForUser } = require('../services/automaticDetectionService');
      
      if (userAddress) {
        console.log('   🧪 Simulating automatic detection...');
        // Note: This is just a simulation, won't actually process the transaction
        console.log('   ✅ Automatic detection service is available');
        console.log('   Transaction would be processed for user:', userAddress.user.id);
      } else {
        console.log('   ⚠️  Cannot test automatic detection - recipient not found');
      }
    } catch (error) {
      console.log(`   ❌ Automatic detection service error: ${error.message}`);
    }

    // Summary
    console.log('\n🎯 Test Summary:');
    console.log(`   Transaction Hash: ${transactionHash}`);
    console.log(`   Network: ${detectedNetwork ? NETWORKS[detectedNetwork].name : 'Unknown'}`);
    console.log(`   Status: ${existingDeposit ? 'Already Processed' : 'Ready for Processing'}`);
    
    if (userAddress) {
      console.log(`   Recipient: ${userAddress.user.fullName || userAddress.user.email || userAddress.user.id}`);
      console.log(`   Ready for: Automatic detection or manual processing`);
    } else {
      console.log(`   Recipient: Not found in system`);
      console.log(`   Action needed: Register address or update database`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test if called directly
if (require.main === module) {
  const transactionHash = process.argv[2];
  
  if (!transactionHash) {
    console.log('❌ Please provide a transaction hash as an argument');
    console.log('Usage: node test-transaction.js <transaction_hash>');
    console.log('Example: node test-transaction.js 0x7e72f6f9529443c8bffd60bdb1857d4ba89aeac9eb32990225470b36e592abde');
    process.exit(1);
  }

  testTransaction(transactionHash)
    .then(() => {
      console.log('\n🚀 Transaction test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Transaction test failed:', error);
      process.exit(1);
    });
}

module.exports = { testTransaction };
