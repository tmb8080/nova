const TransactionVerificationService = require('../services/transactionVerificationService');

async function testTransactionVerification() {
  console.log('🧪 Testing Transaction Verification Service...\n');

  // Test cases
  const testCases = [
    {
      name: 'BSC Transaction Test',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      walletAddress: '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      amount: 100,
      network: 'BSC'
    },
    {
      name: 'TRON Transaction Test',
      transactionHash: 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK',
      walletAddress: 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK',
      amount: 50,
      network: 'TRON'
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    console.log(`   Transaction Hash: ${testCase.transactionHash}`);
    console.log(`   Wallet Address: ${testCase.walletAddress}`);
    console.log(`   Amount: ${testCase.amount}`);
    console.log(`   Network: ${testCase.network}`);
    
    try {
      const result = await TransactionVerificationService.verifyTransaction(
        testCase.transactionHash,
        testCase.walletAddress,
        testCase.amount,
        testCase.network
      );
      
      console.log(`   Result: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.details) {
        console.log(`   Details:`, result.details);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('✅ Transaction verification test completed!');
}

// Run the test
testTransactionVerification().catch(console.error);
