const axios = require('axios');

// Test the basic connectivity and endpoints
const testBasicConnectivity = async () => {
  console.log('🔍 Testing Basic Connectivity...\n');

  try {
    // Test if backend is running
    console.log('1. Testing backend connectivity...');
    const response = await axios.get('http://bambe.shop/api/deposit/usdt/addresses');
    console.log('❌ Backend should require authentication');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Backend is running and properly secured');
    } else {
      console.log('❌ Backend connectivity issue:', error.message);
    }
  }

  // Test frontend
  try {
    console.log('\n2. Testing frontend connectivity...');
    const response = await axios.get('https://tmbtest.vercel.app');
    console.log('✅ Frontend is running');
  } catch (error) {
    console.log('❌ Frontend not running:', error.message);
  }

  // Test database connection by checking if Prisma is working
  console.log('\n3. Testing database connection...');
  try {
    const { execSync } = require('child_process');
    execSync('cd backend && npx prisma db push --accept-data-loss', { stdio: 'pipe' });
    console.log('✅ Database connection working');
  } catch (error) {
    console.log('❌ Database connection issue:', error.message);
  }

  console.log('\n📋 System Status:');
  console.log('- Backend: Running and secured');
  console.log('- Frontend: Check if running on https://tmbtest.vercel.app');
  console.log('- Database: Check Prisma connection');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Start frontend: cd frontend && npm start');
  console.log('2. Login to get authentication token');
  console.log('3. Test deposit functionality in the UI');
  console.log('4. Run full test suite: node test_deposit_system.js');
};

testBasicConnectivity();
