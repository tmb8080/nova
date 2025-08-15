const axios = require('axios');

const API_BASE_URL = 'https://bambe.shop/api';

async function testAPIs() {
  try {
    // Test login
    console.log('Testing login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@trinitymetrobike.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Set auth header
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test wallet stats
    console.log('\nTesting wallet stats...');
    const walletResponse = await axios.get(`${API_BASE_URL}/wallet/stats`, { headers: authHeaders });
    console.log('Wallet stats response:', JSON.stringify(walletResponse.data, null, 2));
    
    // Test VIP levels
    console.log('\nTesting VIP levels...');
    const vipResponse = await axios.get(`${API_BASE_URL}/vip/levels`, { headers: authHeaders });
    console.log('VIP levels response:', JSON.stringify(vipResponse.data, null, 2));
    
    // Test VIP status
    console.log('\nTesting VIP status...');
    const vipStatusResponse = await axios.get(`${API_BASE_URL}/vip/status`, { headers: authHeaders });
    console.log('VIP status response:', JSON.stringify(vipStatusResponse.data, null, 2));
    
    // Test profile
    console.log('\nTesting profile...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, { headers: authHeaders });
    console.log('Profile response:', JSON.stringify(profileResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAPIs();
