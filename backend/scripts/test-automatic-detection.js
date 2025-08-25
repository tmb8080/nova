const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001'; // Adjust if your backend runs on a different port
const TEST_TRANSACTION_HASHES = [
  '0x8822b1236f31c75f501fb6ee34b4278de6163fd4e734604883e49784bcb9802b', // Sample BSC hash
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', // Invalid hash
  '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', // Sample Ethereum hash
];

// Test the automatic detection endpoints
async function testAutomaticDetection() {
  console.log('🧪 Testing Automatic Detection System...\n');

  for (const hash of TEST_TRANSACTION_HASHES) {
    console.log(`🔍 Testing transaction hash: ${hash}`);
    
    try {
      // Test auto-fill transaction endpoint
      console.log('  📝 Testing auto-fill transaction...');
      const autoFillResponse = await axios.post(`${BASE_URL}/api/deposit/auto-fill-transaction`, {
        transactionHash: hash
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // You might need to adjust this
        }
      });
      
      console.log('  ✅ Auto-fill response:', JSON.stringify(autoFillResponse.data, null, 2));
      
    } catch (error) {
      console.log('  ❌ Auto-fill error:', error.response?.data || error.message);
    }

    try {
      // Test check all networks endpoint
      console.log('  🌐 Testing check all networks...');
      const checkAllResponse = await axios.post(`${BASE_URL}/api/admin/check-transaction-all-networks`, {
        transactionHash: hash
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // You might need to adjust this
        }
      });
      
      console.log('  ✅ Check all networks response:', JSON.stringify(checkAllResponse.data, null, 2));
      
    } catch (error) {
      console.log('  ❌ Check all networks error:', error.response?.data || error.message);
    }

    console.log(''); // Empty line for readability
  }

  console.log('✅ Automatic detection testing completed!');
}

// Test the transaction verification service directly
async function testTransactionVerificationService() {
  console.log('🔧 Testing Transaction Verification Service...\n');

  const TransactionVerificationService = require('../services/transactionVerificationService');
  
  for (const hash of TEST_TRANSACTION_HASHES) {
    console.log(`🔍 Testing transaction hash: ${hash}`);
    
    try {
      const result = await TransactionVerificationService.checkTransactionAcrossAllNetworks(hash);
      console.log('  ✅ Result:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('  ❌ Error:', error.message);
    }
    
    console.log(''); // Empty line for readability
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Automatic Detection Tests...\n');
  
  try {
    // Test the API endpoints
    await testAutomaticDetection();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test the service directly
    await testTransactionVerificationService();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testAutomaticDetection,
  testTransactionVerificationService,
  runTests
};
