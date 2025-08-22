const axios = require('axios');

const API_BASE_URL = 'https://bambe.shop/api';

async function createProductionAdminSettings() {
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
    
    // Check current admin settings
    console.log('\n📊 Checking current admin settings...');
    const settingsResponse = await axios.get(`${API_BASE_URL}/admin/settings`, { headers: authHeaders });
    
    console.log('Current settings response:', JSON.stringify(settingsResponse.data, null, 2));
    
    if (settingsResponse.data.data) {
      console.log('✅ Admin settings already exist in production');
      const settings = settingsResponse.data.data;
      console.log('- isDepositEnabled:', settings.isDepositEnabled);
      console.log('- isWithdrawalEnabled:', settings.isWithdrawalEnabled);
      
      if (!settings.isDepositEnabled) {
        console.log('\n🔄 Deposits are disabled. Enabling them...');
        
        const updateResponse = await axios.put(`${API_BASE_URL}/admin/settings`, {
          isDepositEnabled: true
        }, { headers: authHeaders });
        
        console.log('✅ Deposits enabled successfully!');
        console.log('Response:', updateResponse.data.message);
      } else {
        console.log('\n✅ Deposits are already enabled!');
      }
      
      return;
    }
    
    console.log('❌ No admin settings found in production. Creating them...');
    
    // Try to create admin settings through the API
    try {
      const createResponse = await axios.put(`${API_BASE_URL}/admin/settings`, {
        isDepositEnabled: true,
        isWithdrawalEnabled: true,
        minDepositAmount: 30,
        minWithdrawalAmount: 10,
        dailyGrowthRate: 0.01,
        referralBonusRate: 0.05
      }, { headers: authHeaders });
      
      console.log('✅ Admin settings created successfully!');
      console.log('Response:', createResponse.data.message);
      
      // Verify the creation
      console.log('\n🔍 Verifying creation...');
      const verifyResponse = await axios.get(`${API_BASE_URL}/admin/settings`, { headers: authHeaders });
      const newSettings = verifyResponse.data.data;
      
      if (newSettings) {
        console.log('✅ Admin settings verified:');
        console.log('- isDepositEnabled:', newSettings.isDepositEnabled);
        console.log('- isWithdrawalEnabled:', newSettings.isWithdrawalEnabled);
        
        if (newSettings.isDepositEnabled) {
          console.log('\n🎉 SUCCESS: Deposits are now enabled in production!');
          console.log('Users should now be able to make deposits without getting the "disabled" error.');
        }
      } else {
        console.log('❌ Failed to verify admin settings creation');
      }
      
    } catch (createError) {
      console.log('❌ Failed to create admin settings through API:');
      console.log('Error:', createError.response?.data || createError.message);
      console.log('Status:', createError.response?.status);
      
      console.log('\n💡 This suggests the admin settings need to be created directly in the production database.');
      console.log('You may need to:');
      console.log('1. Access the production database directly');
      console.log('2. Run the database initialization script');
      console.log('3. Or contact the system administrator');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createProductionAdminSettings();
