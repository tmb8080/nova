const axios = require('axios');

const API_BASE_URL = 'https://bambe.shop/api';

async function checkAndUpdateAdminSettings() {
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
    
    console.log('Raw settings response:', JSON.stringify(settingsResponse.data, null, 2));
    
    const currentSettings = settingsResponse.data.data;
    
    if (!currentSettings) {
      console.log('❌ No admin settings found. Creating default settings...');
      
      // Try to create default admin settings
      const createResponse = await axios.put(`${API_BASE_URL}/admin/settings`, {
        isDepositEnabled: true,
        isWithdrawalEnabled: true,
        minDepositAmount: 30,
        minWithdrawalAmount: 10,
        dailyGrowthRate: 0.01,
        referralBonusRate: 0.05
      }, { headers: authHeaders });
      
      console.log('✅ Default admin settings created:', createResponse.data.message);
      
      // Check the settings again
      const verifyResponse = await axios.get(`${API_BASE_URL}/admin/settings`, { headers: authHeaders });
      const updatedSettings = verifyResponse.data.data;
      
      console.log('New settings:', updatedSettings);
      
      if (updatedSettings.isDepositEnabled) {
        console.log('\n🎉 SUCCESS: Deposits are now enabled!');
      }
      
      return;
    }
    
    console.log('Current settings:');
    console.log('- isDepositEnabled:', currentSettings.isDepositEnabled);
    console.log('- isWithdrawalEnabled:', currentSettings.isWithdrawalEnabled);
    console.log('- minDepositAmount:', currentSettings.minDepositAmount);
    console.log('- minWithdrawalAmount:', currentSettings.minWithdrawalAmount);
    
    // Check if deposits are disabled
    if (!currentSettings.isDepositEnabled) {
      console.log('\n❌ Deposits are currently DISABLED!');
      console.log('🔄 Enabling deposits...');
      
      // Update settings to enable deposits
      const updateResponse = await axios.put(`${API_BASE_URL}/admin/settings`, {
        isDepositEnabled: true
      }, { headers: authHeaders });
      
      console.log('✅ Deposits enabled successfully!');
      console.log('Response:', updateResponse.data.message);
      
      // Verify the update
      console.log('\n🔍 Verifying update...');
      const verifyResponse = await axios.get(`${API_BASE_URL}/admin/settings`, { headers: authHeaders });
      const updatedSettings = verifyResponse.data.data;
      
      console.log('Updated settings:');
      console.log('- isDepositEnabled:', updatedSettings.isDepositEnabled);
      
      if (updatedSettings.isDepositEnabled) {
        console.log('\n🎉 SUCCESS: Deposits are now enabled!');
        console.log('Users should now be able to make deposits without getting the "disabled" error.');
      } else {
        console.log('\n❌ FAILED: Deposits are still disabled after update.');
      }
      
    } else {
      console.log('\n✅ Deposits are already enabled!');
      console.log('The issue might be elsewhere. Let me check the deposit routes...');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔐 Authentication failed. Check admin credentials.');
    } else if (error.response?.status === 403) {
      console.log('🚫 Access denied. User might not have admin privileges.');
    }
  }
}

checkAndUpdateAdminSettings();
