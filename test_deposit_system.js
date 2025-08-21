const axios = require('axios');

// Configuration
const BASE_URL = 'http://bambe.shop/api';
const ADMIN_TOKEN = 'your_admin_token_here';
const USER_TOKEN = 'your_user_token_here';

// Test data
const testUsdtDeposit = {
  amount: '100',
  network: 'BEP20'
};

const testTransactionHash = '0x1234567890abcdef1234567890abcdef12345678';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = USER_TOKEN) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const testUsdtDepositFlow = async () => {
  console.log('\n=== Testing USDT Deposit Flow ===');

  // 1. Get USDT addresses
  console.log('1. Getting USDT addresses...');
  const addressesResponse = await makeRequest('GET', '/deposit/usdt/addresses');
  
  if (addressesResponse?.success) {
    console.log('✅ USDT addresses retrieved successfully');
    console.log('Addresses:', addressesResponse.data);
  } else {
    console.log('❌ Failed to get USDT addresses');
    return;
  }

  // 2. Create USDT deposit
  console.log('2. Creating USDT deposit...');
  const depositResponse = await makeRequest('POST', '/deposit/usdt/create', testUsdtDeposit);
  
  if (depositResponse?.success) {
    console.log('✅ USDT deposit created successfully');
    console.log('Deposit ID:', depositResponse.data.depositId);
    console.log('Amount:', depositResponse.data.amount);
    console.log('Network:', depositResponse.data.network);
    console.log('Status:', depositResponse.data.status);
    
    const depositId = depositResponse.data.depositId;
    
    // 3. Update transaction hash
    console.log('3. Updating transaction hash...');
    const updateResponse = await makeRequest('PATCH', `/deposit/${depositId}/transaction-hash`, {
      transactionHash: testTransactionHash
    });
    
    if (updateResponse?.success) {
      console.log('✅ Transaction hash updated successfully');
      
      // 4. Verify deposit
      console.log('4. Verifying deposit...');
      const verifyResponse = await makeRequest('POST', `/deposit/${depositId}/verify`);
      
      if (verifyResponse?.success) {
        console.log('✅ Deposit verified successfully');
        console.log('Verification result:', verifyResponse.data);
      } else {
        console.log('❌ Deposit verification failed:', verifyResponse?.error);
      }
    } else {
      console.log('❌ Failed to update transaction hash:', updateResponse?.error);
    }
  } else {
    console.log('❌ Failed to create USDT deposit:', depositResponse?.error);
  }
};

const testCoinbaseDepositFlow = async () => {
  console.log('\n=== Testing Coinbase Deposit Flow ===');

  // 1. Create Coinbase deposit
  console.log('1. Creating Coinbase deposit...');
  const depositResponse = await makeRequest('POST', '/deposit/create', {
    amount: '0.001',
    currency: 'BTC'
  });
  
  if (depositResponse?.success) {
    console.log('✅ Coinbase deposit created successfully');
    console.log('Deposit ID:', depositResponse.data.depositId);
    console.log('Coinbase URL:', depositResponse.data.coinbaseUrl);
    console.log('Charge Code:', depositResponse.data.chargeCode);
  } else {
    console.log('❌ Failed to create Coinbase deposit:', depositResponse?.error);
  }
};

const testDepositHistory = async () => {
  console.log('\n=== Testing Deposit History ===');

  // 1. Get user deposits
  console.log('1. Getting user deposits...');
  const depositsResponse = await makeRequest('GET', '/deposit/my-deposits?limit=5&page=1');
  
  if (depositsResponse?.success) {
    console.log('✅ User deposits retrieved successfully');
    console.log('Total deposits:', depositsResponse.data.pagination.totalItems);
    console.log('Deposits:', depositsResponse.data.deposits.length);
    
    if (depositsResponse.data.deposits.length > 0) {
      const firstDeposit = depositsResponse.data.deposits[0];
      console.log('Sample deposit:', {
        id: firstDeposit.id,
        amount: firstDeposit.amount,
        currency: firstDeposit.currency,
        network: firstDeposit.network,
        status: firstDeposit.status,
        createdAt: firstDeposit.createdAt
      });
    }
  } else {
    console.log('❌ Failed to get user deposits:', depositsResponse?.error);
  }

  // 2. Get pending count
  console.log('2. Getting pending deposits count...');
  const pendingResponse = await makeRequest('GET', '/deposit/pending-count');
  
  if (pendingResponse?.success) {
    console.log('✅ Pending count retrieved successfully');
    console.log('Pending deposits:', pendingResponse.data.pendingCount);
  } else {
    console.log('❌ Failed to get pending count:', pendingResponse?.error);
  }
};

const testDepositDetails = async () => {
  console.log('\n=== Testing Deposit Details ===');

  // First get a deposit ID
  const depositsResponse = await makeRequest('GET', '/deposit/my-deposits?limit=1');
  
  if (depositsResponse?.success && depositsResponse.data.deposits.length > 0) {
    const depositId = depositsResponse.data.deposits[0].id;
    
    console.log('1. Getting deposit details...');
    const detailsResponse = await makeRequest('GET', `/deposit/${depositId}`);
    
    if (detailsResponse?.success) {
      console.log('✅ Deposit details retrieved successfully');
      console.log('Deposit details:', detailsResponse.data);
    } else {
      console.log('❌ Failed to get deposit details:', detailsResponse?.error);
    }
  } else {
    console.log('❌ No deposits found to test details');
  }
};

const testAdminDepositFeatures = async () => {
  console.log('\n=== Testing Admin Deposit Features ===');

  // 1. Get pending deposits for verification
  console.log('1. Getting pending deposits for verification...');
  const pendingResponse = await makeRequest('GET', '/deposit/admin/pending-verification', null, ADMIN_TOKEN);
  
  if (pendingResponse?.success) {
    console.log('✅ Pending deposits retrieved successfully');
    console.log('Pending deposits count:', pendingResponse.data.length);
  } else {
    console.log('❌ Failed to get pending deposits:', pendingResponse?.error);
  }

  // 2. Get verification dashboard
  console.log('2. Getting verification dashboard...');
  const dashboardResponse = await makeRequest('GET', '/admin/verification-dashboard', null, ADMIN_TOKEN);
  
  if (dashboardResponse?.success) {
    console.log('✅ Verification dashboard retrieved successfully');
    console.log('Dashboard data:', {
      pendingDeposits: dashboardResponse.data.pendingDepositsCount,
      pendingWithdrawals: dashboardResponse.data.pendingWithdrawalsCount,
      monthlyStats: dashboardResponse.data.monthlyStats
    });
  } else {
    console.log('❌ Failed to get verification dashboard:', dashboardResponse?.error);
  }

  // 3. Get system addresses
  console.log('3. Getting system addresses...');
  const addressesResponse = await makeRequest('GET', '/admin/system-addresses', null, ADMIN_TOKEN);
  
  if (addressesResponse?.success) {
    console.log('✅ System addresses retrieved successfully');
    console.log('Wallet addresses:', addressesResponse.data.walletAddresses);
    console.log('Token contracts:', addressesResponse.data.tokenContracts);
  } else {
    console.log('❌ Failed to get system addresses:', addressesResponse?.error);
  }
};

const testErrorHandling = async () => {
  console.log('\n=== Testing Error Handling ===');

  // 1. Test invalid amount
  console.log('1. Testing invalid amount...');
  const invalidAmountResponse = await makeRequest('POST', '/deposit/usdt/create', {
    amount: '5', // Below minimum
    network: 'BEP20'
  });
  
  if (!invalidAmountResponse?.success) {
    console.log('✅ Invalid amount properly rejected');
    console.log('Error message:', invalidAmountResponse?.error);
  } else {
    console.log('❌ Invalid amount was accepted');
  }

  // 2. Test invalid network
  console.log('2. Testing invalid network...');
  const invalidNetworkResponse = await makeRequest('POST', '/deposit/usdt/create', {
    amount: '100',
    network: 'INVALID_NETWORK'
  });
  
  if (!invalidNetworkResponse?.success) {
    console.log('✅ Invalid network properly rejected');
    console.log('Error message:', invalidNetworkResponse?.error);
  } else {
    console.log('❌ Invalid network was accepted');
  }

  // 3. Test invalid transaction hash
  console.log('3. Testing invalid transaction hash...');
  const invalidHashResponse = await makeRequest('PATCH', '/deposit/invalid-id/transaction-hash', {
    transactionHash: 'invalid_hash'
  });
  
  if (!invalidHashResponse?.success) {
    console.log('✅ Invalid transaction hash properly rejected');
    console.log('Error message:', invalidHashResponse?.error);
  } else {
    console.log('❌ Invalid transaction hash was accepted');
  }
};

const testNetworkFeatures = async () => {
  console.log('\n=== Testing Network Features ===');

  const networks = ['BEP20', 'TRC20', 'ERC20', 'POLYGON'];
  
  for (const network of networks) {
    console.log(`Testing ${network} network...`);
    
    const response = await makeRequest('POST', '/deposit/usdt/create', {
      amount: '50',
      network: network
    });
    
    if (response?.success) {
      console.log(`✅ ${network} deposit created successfully`);
    } else {
      console.log(`❌ ${network} deposit failed:`, response?.error);
    }
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Deposit System Tests\n');

  try {
    await testUsdtDepositFlow();
    await testCoinbaseDepositFlow();
    await testDepositHistory();
    await testDepositDetails();
    await testAdminDepositFeatures();
    await testErrorHandling();
    await testNetworkFeatures();

    console.log('\n✅ All tests completed!');
    console.log('\n📋 Summary:');
    console.log('- USDT deposit flow tested');
    console.log('- Coinbase deposit flow tested');
    console.log('- Deposit history tested');
    console.log('- Deposit details tested');
    console.log('- Admin features tested');
    console.log('- Error handling tested');
    console.log('- Network features tested');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testUsdtDepositFlow,
  testCoinbaseDepositFlow,
  testDepositHistory,
  testDepositDetails,
  testAdminDepositFeatures,
  testErrorHandling,
  testNetworkFeatures,
  runTests
};
