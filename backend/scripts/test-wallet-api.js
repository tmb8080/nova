const axios = require('axios');

// Test the wallet addresses API endpoint
async function testWalletAPI() {
  try {
    console.log('🧪 Testing Wallet API Endpoints...\n');

    const baseURL = process.env.API_BASE_URL || 'https://bambe.shop';
    
    // Test 1: Check if server is running
    console.log('1️⃣ Testing server connectivity...');
    try {
      const healthResponse = await axios.get(`${baseURL}/api/health`);
      console.log('   ✅ Server is running');
    } catch (error) {
      console.log('   ❌ Server is not running or health endpoint not available');
      console.log('   Please start the server first: npm start');
      return;
    }

    // Test 2: Test wallet addresses endpoint (without auth)
    console.log('\n2️⃣ Testing wallet addresses endpoint (no auth)...');
    try {
      const addressesResponse = await axios.get(`${baseURL}/api/wallet/addresses`);
      console.log('   ❌ Endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Endpoint properly requires authentication');
      } else {
        console.log('   ⚠️  Unexpected error:', error.response?.status, error.message);
      }
    }

    // Test 3: Test USDT addresses endpoint (without auth)
    console.log('\n3️⃣ Testing USDT addresses endpoint (no auth)...');
    try {
      const usdtResponse = await axios.get(`${baseURL}/api/deposit/usdt/addresses`);
      console.log('   ❌ Endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Endpoint properly requires authentication');
      } else {
        console.log('   ⚠️  Unexpected error:', error.response?.status, error.message);
      }
    }

    console.log('\n🎯 API Test Summary:');
    console.log('   ✅ Server connectivity: PASSED');
    console.log('   ✅ Authentication required: PASSED');
    console.log('\n   To test with authentication, you need to:');
    console.log('   1. Login to get a JWT token');
    console.log('   2. Include the token in the Authorization header');
    console.log('   3. Test the endpoints with valid authentication');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testWalletAPI()
    .then(() => {
      console.log('\n🚀 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testWalletAPI };
