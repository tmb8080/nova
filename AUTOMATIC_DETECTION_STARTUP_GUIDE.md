# 🚀 Automatic Detection Startup Guide

## 📋 **Overview**

The automatic detection system monitors blockchain transactions and automatically credits user deposits without requiring manual transaction hash input. This guide will help you start and troubleshoot the system.

## 🔧 **System Components**

### **1. Backend Server** (Port 5000)
- Main API server handling user requests
- Status endpoint: `/api/deposit/automatic-detection-status`

### **2. Automatic Detection Service** (Separate Process)
- Monitors blockchain transactions every 30 seconds
- Polls BSC, Polygon, and Ethereum networks
- Creates status file: `backend/automatic_detection_status.json`

## 🚀 **Starting the System**

### **Step 1: Start Backend Server**
```bash
cd backend
npm start
```
**Expected Output:**
```
⚠️  Rate limiting has been DISABLED - No request limits enforced
✅ Database connected successfully
✅ Admin settings initialized
🚀 Trinity Metro Bike API running on port 5000
📊 Environment: development
🌐 Frontend URL: https://tmbtest.vercel.app
```

### **Step 2: Start Automatic Detection Service**
```bash
# From project root directory
node start_automatic_detection.js
```
**Expected Output:**
```
🚀 Starting Automatic Detection System...
📡 This will monitor your wallet addresses for incoming transactions
💡 Users will no longer need to provide transaction hashes manually
🚀 Starting automatic transaction detection...
✅ Provider initialized for BSC
✅ Provider initialized for POLYGON
Starting polling-based monitoring...
Polling monitoring started (every 30 seconds)
✅ Automatic detection monitoring started successfully
✅ Automatic detection started successfully!
🔍 Monitoring wallets for incoming transactions...
📊 Check logs for detected transactions
Polling BSC for transactions...
Polling POLYGON for transactions...
Polling ETHEREUM for transactions...
```

## 🔍 **Testing the System**

### **1. Check Backend Status**
```bash
curl -X GET "https://bambe.shop/api/deposit/automatic-detection-status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "message": "Automatic detection is active and monitoring transactions"
  }
}
```

### **2. Check Status File**
```bash
cat backend/automatic_detection_status.json
```

**Expected Content:**
```json
{
  "isRunning": true,
  "message": "Automatic detection is active and monitoring transactions",
  "lastUpdated": "2025-08-22T17:32:56.557Z"
}
```

### **3. Frontend Testing**
1. Open the deposit page in your browser
2. Look for the "Automatic Detection" status indicator
3. Use the refresh button (🔄) to manually update status
4. Use the test button (✅) to test API calls directly
5. Check browser console for debug logs

## 🐛 **Troubleshooting**

### **Issue: Frontend Shows INACTIVE but Backend Shows ACTIVE**

**Symptoms:**
- Backend API returns `isRunning: true`
- Frontend shows "INACTIVE" status
- Console shows authentication or API errors

**Solutions:**

1. **Check Authentication:**
   ```javascript
   // In browser console
   console.log('Token:', localStorage.getItem('token'));
   ```

2. **Clear React Query Cache:**
   - Click the refresh button (🔄) in the UI
   - Or manually clear cache in console:
   ```javascript
   // In browser console
   window.queryClient.removeQueries(['automaticDetectionStatus']);
   ```

3. **Test API Directly:**
   - Click the test button (✅) in the UI
   - Check console for API response

4. **Check Network Tab:**
   - Open browser DevTools → Network tab
   - Look for calls to `/api/deposit/automatic-detection-status`
   - Check if they return 200 status with correct data

### **Issue: Automatic Detection Service Not Starting**

**Symptoms:**
- Service exits immediately
- Error messages about missing modules or configuration

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   # Ensure these are set in .env file
   BSC_WALLET_ADDRESS=your_bsc_address
   POLYGON_WALLET_ADDRESS=your_polygon_address
   ETH_WALLET_ADDRESS=your_eth_address
   TRON_WALLET_ADDRESS=your_tron_address
   ```

2. **Check Dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Check File Permissions:**
   ```bash
   # Ensure the service can write status file
   chmod 755 backend/
   ```

### **Issue: Service Running but Not Detecting Transactions**

**Symptoms:**
- Service shows "ACTIVE" status
- No transaction detection logs
- Users not getting credited

**Solutions:**

1. **Check Wallet Addresses:**
   - Verify wallet addresses in environment variables
   - Ensure addresses are correct for each network

2. **Check Network Connectivity:**
   - Ensure RPC endpoints are accessible
   - Check if blockchain explorers are responding

3. **Monitor Logs:**
   ```bash
   # Watch for polling messages
   tail -f logs/automatic_detection.log
   ```

## 📊 **Monitoring**

### **Real-time Status**
- **Green indicator + pulsing dot**: System is ACTIVE
- **Red indicator + static dot**: System is INACTIVE
- **Loading indicator**: Fetching status

### **API Calls in Network Tab**
- `GET /api/deposit/automatic-detection-status` - Every 10 seconds
- `GET /api/deposit/usdt/addresses` - Once when page loads
- `GET /api/admin/settings` - Once when page loads

### **Console Debug Logs**
```javascript
// Look for these logs in browser console
🔍 Detection Status Debug: {
  detectionStatus: {...},
  isDetectionRunning: true/false,
  statusError: null/error,
  statusLoading: true/false,
  token: 'Present'/'Missing'
}
```

## 🎯 **Expected User Experience**

### **When System is Working:**
1. User opens deposit page
2. Sees "🟢 Automatic Detection [ACTIVE]"
3. User copies wallet address or scans QR code
4. User sends USDT from their wallet
5. System automatically detects transaction within 1-3 minutes
6. User's account is credited automatically

### **When System is Not Working:**
1. User sees "🔴 Automatic Detection [INACTIVE]"
2. User can use refresh button to retry
3. User can use test button to check API
4. Debug information shows in console

## 🔄 **Restarting Services**

### **Quick Restart:**
```bash
# Stop all services
pkill -f "node server.js"
pkill -f "start_automatic_detection.js"

# Start backend
cd backend && npm start &

# Start automatic detection
cd .. && node start_automatic_detection.js &
```

### **Full Restart:**
```bash
# Stop all Node.js processes
pkill -f node

# Clear any cached data
rm -f backend/automatic_detection_status.json

# Start services again
cd backend && npm start &
cd .. && node start_automatic_detection.js &
```

## 📞 **Support**

If you continue to experience issues:

1. **Check all logs** in terminal and browser console
2. **Verify authentication** is working
3. **Test API endpoints** directly with curl
4. **Ensure both services** are running simultaneously
5. **Check environment variables** are properly configured

The system should show "ACTIVE" status when both the backend server and automatic detection service are running correctly.
