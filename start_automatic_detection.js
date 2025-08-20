const { startMonitoring } = require('./backend/services/automaticDetectionService');

console.log('🚀 Starting Automatic Detection System...');
console.log('📡 This will monitor your wallet addresses for incoming transactions');
console.log('💡 Users will no longer need to provide transaction hashes manually');

// Start the automatic detection
startMonitoring().then(() => {
  console.log('✅ Automatic detection started successfully!');
  console.log('🔍 Monitoring wallets for incoming transactions...');
  console.log('📊 Check logs for detected transactions');
  
  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping automatic detection...');
    process.exit(0);
  });
}).catch(error => {
  console.error('❌ Failed to start automatic detection:', error);
  process.exit(1);
});
