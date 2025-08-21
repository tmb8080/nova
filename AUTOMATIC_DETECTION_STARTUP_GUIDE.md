# 🚀 Automatic Detection Startup Guide

## 🎯 **What is Automatic Detection?**

Automatic detection eliminates the need for users to manually provide transaction hashes. The system **automatically monitors your wallet** and detects when money arrives, then credits users automatically.

## 🔄 **How It Works**

### **Before (Manual)**:
```
User → Sends Money → Gets TX Hash → Manually Provides TX Hash → System Verifies → Credits User
```

### **Now (Automatic)**:
```
User → Sends Money → System Automatically Detects → Verifies → Credits User
```

## 🚀 **Starting Automatic Detection**

### **Option 1: Start with Script**
```bash
# Start automatic detection
node start_automatic_detection.js
```

### **Option 2: Start Manually**
```bash
# Navigate to backend
cd backend

# Start the backend server
npm start

# In another terminal, start automatic detection
node ../start_automatic_detection.js
```

### **Option 3: Start Frontend**
```bash
# Navigate to frontend
cd frontend

# Start the frontend
npm start
```

## 📊 **Monitoring Status**

### **Check if Automatic Detection is Running**
The frontend will automatically show the status:
- ✅ **Green**: Automatic detection is active
- ⚠️ **Yellow**: Automatic detection is inactive

### **Backend Status Check**
```bash
# Check if backend is running
curl http://bambe.shop/api/deposit/automatic-detection-status
```

## 🎨 **Updated UI Features**

### **What Users See Now**:
1. **No Transaction Hash Input** - Removed manual input
2. **Automatic Detection Status** - Shows if system is monitoring
3. **Simplified Process** - Just send money, system handles the rest
4. **Real-time Status** - Live updates on detection status

### **User Flow**:
1. **Select USDT** → Choose network → Enter amount
2. **Click Deposit** → Get wallet address
3. **Send Money** → To the provided address
4. **Automatic Verification** → System detects and credits automatically

## 🔧 **Configuration**

### **Environment Variables Needed**:
```bash
# Wallet addresses (one per network)
BSC_WALLET_ADDRESS=your_bsc_wallet_address
TRON_WALLET_ADDRESS=your_tron_wallet_address
ETH_WALLET_ADDRESS=your_ethereum_wallet_address
POLYGON_WALLET_ADDRESS=your_polygon_wallet_address

# API keys for blockchain verification
BSCSCAN_API_KEY=your_bscscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### **Token Contract Addresses** (already configured):
- **USDT**: Automatically configured for all networks
- **USDC**: Automatically configured for all networks

## 📱 **Testing the System**

### **1. Start Everything**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Automatic Detection
node start_automatic_detection.js

# Terminal 3: Frontend
cd frontend && npm start
```

### **2. Test Deposit Flow**
1. **Open browser** → https://tmbtest.vercel.app
2. **Login** to your account
3. **Go to Deposit page**
4. **Select USDT** → Choose network → Enter amount
5. **Click Deposit** → Copy wallet address
6. **Send test amount** to the address
7. **Watch automatic verification** → Status should change to "Confirmed"

### **3. Monitor Logs**
```bash
# Check automatic detection logs
tail -f logs/automatic_detection.log

# Check backend logs
tail -f logs/backend.log
```

## 🎯 **Benefits**

### **For Users**:
- ✅ **No manual work** - just send money
- ✅ **Instant processing** - automatic detection
- ✅ **Better UX** - seamless experience
- ✅ **No errors** - no wrong transaction hashes

### **For Business**:
- ✅ **Reduced support** - fewer manual verifications
- ✅ **Faster processing** - instant detection
- ✅ **Better scalability** - handles more transactions
- ✅ **Improved reliability** - automated process

## 🚨 **Troubleshooting**

### **Issue: Automatic Detection Not Starting**
```bash
# Check if backend is running
curl http://bambe.shop/api/health

# Check environment variables
echo $BSC_WALLET_ADDRESS
echo $BSCSCAN_API_KEY

# Restart automatic detection
node start_automatic_detection.js
```

### **Issue: No Transactions Detected**
1. **Check wallet addresses** are correct
2. **Verify API keys** are valid
3. **Check network connectivity**
4. **Monitor logs** for errors

### **Issue: Frontend Shows "Inactive"**
1. **Check if automatic detection is running**
2. **Verify backend is accessible**
3. **Check authentication token**
4. **Refresh the page**

## 🎉 **Success Indicators**

### **When Everything is Working**:
- ✅ **Backend running** on port 5000
- ✅ **Automatic detection active** (green status)
- ✅ **Frontend accessible** on port 3000
- ✅ **Database connected** and working
- ✅ **API keys configured** and valid

### **Test Transaction**:
- ✅ **Deposit created** successfully
- ✅ **Wallet address** displayed correctly
- ✅ **Transaction detected** automatically
- ✅ **User credited** automatically
- ✅ **Status updated** to "Confirmed"

## 🚀 **Next Steps**

1. **Start the system** using the scripts above
2. **Test with small amounts** first
3. **Monitor the logs** for any issues
4. **Verify automatic detection** is working
5. **Go live** with the new system

**Your automatic detection system is now ready to eliminate manual transaction hash input!** 🎯
