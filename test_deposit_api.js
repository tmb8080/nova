const axios = require('axios');

const API_BASE_URL = 'https://bambe.shop/api';

async function testDepositAPI() {
  try {
    console.log('🔐 Logging in as admin...');
    
    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      identifier: 'admin@trinitymetro.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Set auth header
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Check admin settings
    console.log('\n📊 Checking admin settings...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/admin/settings`, { headers: authHeaders });
    
    console.log('Raw settings response:', JSON.stringify(settingsResponse.data, null, 2));
    
    if (!settingsResponse.data.data) {
      console.log('❌ No admin settings data in response');
      console.log('Response structure:', Object.keys(settingsResponse.data));
      return;
    }
    
    const settings = settingsResponse.data.data;
    
    console.log('Admin settings:');
    console.log('- isDepositEnabled:', settings.isDepositEnabled);
    console.log('- isWithdrawalEnabled:', settings.isWithdrawalEnabled);
    console.log('- minDepositAmount:', settings.minDepositAmount);
    
    // Test USDT deposit creation
    console.log('\n🧪 Testing USDT deposit creation...');
    try {
      const depositResponse = await axios.post(`${API_BASE_URL}/deposit/usdt/create`, {
        amount: 50,
        network: 'TRC20'
      }, { headers: authHeaders });
      
      console.log('✅ USDT deposit created successfully!');
      console.log('Response:', depositResponse.data);
      
    } catch (depositError) {
      console.log('❌ USDT deposit failed:');
      console.log('Error:', depositError.response?.data || depositError.message);
      console.log('Status:', depositError.response?.status);
    }
    
    // Test regular deposit creation
    console.log('\n🧪 Testing regular deposit creation...');
    try {
      const depositResponse = await axios.post(`${API_BASE_URL}/deposit/create`, {
        amount: 50,
        currency: 'USDT'
      }, { headers: authHeaders });
      
      console.log('✅ Regular deposit created successfully!');
      console.log('Response:', depositResponse.data);
      
    } catch (depositError) {
      console.log('❌ Regular deposit failed:');
      console.log('Error:', depositError.response?.data || depositError.message);
      console.log('Status:', depositError.response?.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDepositAPI();
