# Deposit System Testing Guide

## 🎯 **Overview**

This guide will help you test the complete deposit system functionality, including both USDT direct deposits and Coinbase Commerce deposits.

## 🚀 **Quick Start Testing**

### **1. Start the Backend Server**
```bash
cd backend
npm install
npm start
```

### **2. Start the Frontend**
```bash
cd frontend
npm install
npm start
```

### **3. Run the Test Script**
```bash
node test_deposit_system.js
```

## 📋 **Manual Testing Checklist**

### **Frontend Testing**

#### **1. USDT Direct Deposit Flow**
- [ ] **Navigate to Deposit page**
- [ ] **Select USDT currency** (should show "Direct Transfer")
- [ ] **Select network** (BEP20, TRC20, ERC20, POLYGON)
- [ ] **Choose predefined amount** (30, 50, 100, 200, 500, 1000 USDT)
- [ ] **Enter custom amount** (minimum 30 USDT)
- [ ] **Click "Deposit" button**
- [ ] **Verify pending deposit alert appears**
- [ ] **Copy wallet address** (should copy to clipboard)
- [ ] **Enter transaction hash**
- [ ] **Click "Verify Deposit"**
- [ ] **Check deposit status changes to "Confirmed"**

#### **2. Coinbase Commerce Flow**
- [ ] **Select BTC or ETH currency** (should show "Coinbase")
- [ ] **Enter amount**
- [ ] **Click "Deposit" button**
- [ ] **Verify redirect to Coinbase Commerce**
- [ ] **Complete payment on Coinbase**
- [ ] **Check deposit status after payment**

#### **3. UI Features**
- [ ] **Currency selection** (USDT, BTC, ETH)
- [ ] **Network selection** (for USDT)
- [ ] **Predefined amounts** (for USDT)
- [ ] **Instructions toggle** (show/hide)
- [ ] **Pending deposits count**
- [ ] **Recent deposits list**
- [ ] **Deposit history pagination**

### **Backend API Testing**

#### **1. USDT Deposit Endpoints**
```bash
# Get USDT addresses
curl -X GET https://bambe.shop/api/deposit/usdt/addresses \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create USDT deposit
curl -X POST https://bambe.shop/api/deposit/usdt/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": "100", "network": "BEP20"}'

# Update transaction hash
curl -X PATCH https://bambe.shop/api/deposit/DEPOSIT_ID/transaction-hash \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"transactionHash": "0x1234567890abcdef..."}'

# Verify deposit
curl -X POST https://bambe.shop/api/deposit/DEPOSIT_ID/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **2. Coinbase Deposit Endpoints**
```bash
# Create Coinbase deposit
curl -X POST https://bambe.shop/api/deposit/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": "0.001", "currency": "BTC"}'
```

#### **3. Deposit History Endpoints**
```bash
# Get user deposits
curl -X GET "https://bambe.shop/api/deposit/my-deposits?limit=10&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get pending count
curl -X GET https://bambe.shop/api/deposit/pending-count \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get deposit details
curl -X GET https://bambe.shop/api/deposit/DEPOSIT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### **4. Admin Endpoints**
```bash
# Get pending deposits for verification
curl -X GET https://bambe.shop/api/deposit/admin/pending-verification \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Manual verification
curl -X POST https://bambe.shop/api/deposit/admin/DEPOSIT_ID/manual-verify \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"verificationNotes": "Manually verified"}'

# Batch verification
curl -X POST https://bambe.shop/api/deposit/admin/batch-verify \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"depositIds": ["id1", "id2", "id3"]}'

# Verification dashboard
curl -X GET https://bambe.shop/api/admin/verification-dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"

# System addresses
curl -X GET https://bambe.shop/api/admin/system-addresses \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🧪 **Automated Testing**

### **Run Complete Test Suite**
```bash
node test_deposit_system.js
```

### **Test Individual Components**
```javascript
const { 
  testUsdtDepositFlow,
  testCoinbaseDepositFlow,
  testDepositHistory,
  testAdminDepositFeatures 
} = require('./test_deposit_system');

// Test specific functionality
await testUsdtDepositFlow();
await testCoinbaseDepositFlow();
await testDepositHistory();
await testAdminDepositFeatures();
```

## 🔍 **Testing Scenarios**

### **1. Normal Flow Testing**

#### **USDT Direct Deposit**
1. **Create deposit** → Should return deposit ID and status PENDING
2. **Get wallet address** → Should return correct address for selected network
3. **Update transaction hash** → Should accept valid hash format
4. **Verify deposit** → Should verify on blockchain and credit user
5. **Check deposit history** → Should show confirmed deposit

#### **Coinbase Commerce**
1. **Create deposit** → Should return Coinbase URL
2. **Complete payment** → Should redirect to Coinbase
3. **Webhook processing** → Should automatically credit user
4. **Check deposit history** → Should show confirmed deposit

### **2. Error Handling Testing**

#### **Invalid Inputs**
- [ ] **Amount below minimum** (should reject)
- [ ] **Invalid network** (should reject)
- [ ] **Invalid transaction hash** (should reject)
- [ ] **Missing required fields** (should reject)

#### **Edge Cases**
- [ ] **Duplicate transaction hash** (should reject)
- [ ] **Expired deposit** (should not allow verification)
- [ ] **Already confirmed deposit** (should not allow re-verification)
- [ ] **Invalid deposit ID** (should return 404)

### **3. Security Testing**

#### **Authentication**
- [ ] **Unauthenticated requests** (should return 401)
- [ ] **Invalid token** (should return 401)
- [ ] **Expired token** (should return 401)

#### **Authorization**
- [ ] **User accessing other user's deposits** (should return 403)
- [ ] **Non-admin accessing admin endpoints** (should return 403)

### **4. Performance Testing**

#### **Load Testing**
```bash
# Test multiple concurrent deposits
for i in {1..10}; do
  curl -X POST https://bambe.shop/api/deposit/usdt/create \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"amount\": \"50\", \"network\": \"BEP20\"}" &
done
```

#### **Database Performance**
- [ ] **Large deposit history** (should paginate correctly)
- [ ] **Multiple pending deposits** (should handle efficiently)
- [ ] **Concurrent verifications** (should not conflict)

## 🐛 **Common Issues & Solutions**

### **1. Frontend Issues**

#### **Issue: USDT addresses not loading**
**Solution**: Check if backend is running and API endpoint is accessible

#### **Issue: Transaction hash not updating**
**Solution**: Verify the deposit ID is correct and deposit is in PENDING status

#### **Issue: Verification failing**
**Solution**: Check if transaction hash is valid and deposit exists

### **2. Backend Issues**

#### **Issue: API key errors**
**Solution**: Verify environment variables are set correctly
```bash
BSCSCAN_API_KEY=your_key
ETHERSCAN_API_KEY=your_key
POLYGONSCAN_API_KEY=your_key
```

#### **Issue: Database connection errors**
**Solution**: Check database configuration and connection
```bash
# Test database connection
npx prisma db push
```

#### **Issue: Webhook not receiving**
**Solution**: Check webhook URL and signature verification

### **3. Blockchain Issues**

#### **Issue: Transaction verification failing**
**Solution**: 
- Verify transaction hash is correct
- Check if transaction is confirmed on blockchain
- Ensure correct network is selected

#### **Issue: API rate limiting**
**Solution**: 
- Implement rate limiting in your requests
- Use multiple API keys if available
- Add delays between requests

## 📊 **Testing Metrics**

### **Success Criteria**
- [ ] **100% deposit creation success** (valid inputs)
- [ ] **100% transaction verification success** (valid hashes)
- [ ] **0% unauthorized access** (security)
- [ ] **< 2 second response time** (performance)
- [ ] **100% error handling** (invalid inputs)

### **Test Coverage**
- [ ] **All API endpoints** tested
- [ ] **All UI components** tested
- [ ] **All error scenarios** tested
- [ ] **All network types** tested
- [ ] **Admin functionality** tested

## 🚀 **Production Testing**

### **Pre-Production Checklist**
- [ ] **Environment variables** configured
- [ ] **Database migrations** applied
- [ ] **API keys** validated
- [ ] **Wallet addresses** verified
- [ ] **Webhook URLs** configured
- [ ] **SSL certificates** installed

### **Go-Live Testing**
1. **Create test deposit** with small amount
2. **Verify on testnet** first
3. **Test with real transaction** on mainnet
4. **Monitor logs** for any errors
5. **Verify user balance** is credited correctly

## 📞 **Support & Troubleshooting**

### **Getting Help**
1. **Check logs** for error messages
2. **Verify configuration** is correct
3. **Test with minimal setup** first
4. **Contact support** with specific error details

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=* npm start

# Check specific service logs
tail -f logs/deposit.log
tail -f logs/verification.log
```

## ✅ **Testing Summary**

After completing all tests, you should have:

- ✅ **Working USDT direct deposits** with verification
- ✅ **Working Coinbase Commerce deposits**
- ✅ **Proper error handling** for all scenarios
- ✅ **Secure authentication** and authorization
- ✅ **Good performance** under load
- ✅ **Complete admin functionality**

**The deposit system is ready for production use!** 🚀
