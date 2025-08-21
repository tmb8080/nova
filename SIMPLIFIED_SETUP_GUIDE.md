# Simplified Setup Guide: One Address for Multiple Tokens

## 🎯 **Key Concept: One Wallet Address = Multiple Tokens**

**Yes, one wallet address can accept both USDT and USDC on the same network!** This simplifies your setup significantly.

## 📊 **How It Works**

### **Traditional Approach (Complex)**:
```
Network: BSC
├── USDT Wallet: 0x1234... (only accepts USDT)
└── USDC Wallet: 0x5678... (only accepts USDC)
```

### **Simplified Approach (Recommended)**:
```
Network: BSC
└── Single Wallet: 0x1234... (accepts both USDT and USDC)
    ├── USDT Balance: 1000 USDT
    └── USDC Balance: 500 USDC
```

## 🔧 **Simplified Environment Configuration**

### **Option 1: Minimal Setup (Recommended)**
```bash
# API Keys
BSCSCAN_API_KEY=your_bscscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Single Wallet Addresses (accepts both USDT and USDC)
TRON_WALLET_ADDRESS=your_tron_wallet_address
BSC_WALLET_ADDRESS=your_bsc_wallet_address
ETH_WALLET_ADDRESS=your_ethereum_wallet_address
POLYGON_WALLET_ADDRESS=your_polygon_wallet_address
```

### **Option 2: Full Control Setup**
```bash
# API Keys
BSCSCAN_API_KEY=your_bscscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Wallet Addresses
TRON_WALLET_ADDRESS=your_tron_wallet_address
BSC_WALLET_ADDRESS=your_bsc_wallet_address
ETH_WALLET_ADDRESS=your_ethereum_wallet_address
POLYGON_WALLET_ADDRESS=your_polygon_wallet_address

# Token Contract Addresses (optional - system has defaults)
USDT_TRC20_CONTRACT=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
USDT_BEP20_CONTRACT=0x55d398326f99059fF775485246999027B3197955
USDT_ERC20_CONTRACT=0xdAC17F958D2ee523a2206206994597C13D831ec7
USDT_POLYGON_CONTRACT=0xc2132D05D31c914a87C6611C10748AEb04B58e8F

USDC_BEP20_CONTRACT=0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
USDC_ERC20_CONTRACT=0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8C
USDC_POLYGON_CONTRACT=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```

## 🚀 **Step-by-Step Setup**

### **Step 1: Create Wallets (One per Network)**

#### **1. MetaMask Setup (Recommended)**
```bash
# Install MetaMask: https://metamask.io/
# Create one wallet that will work for all networks
```

**Add Networks to MetaMask**:

**BSC Network**:
- Network Name: BSC
- RPC URL: https://bsc-dataseed.binance.org/
- Chain ID: 56
- Symbol: BNB

**Polygon Network**:
- Network Name: Polygon
- RPC URL: https://polygon-rpc.com/
- Chain ID: 137
- Symbol: MATIC

#### **2. TronLink Setup (for TRON)**
```bash
# Install TronLink: https://www.tronlink.org/
# Create TRON wallet
```

### **Step 2: Get Your Wallet Addresses**

After setting up wallets, copy these addresses:

```bash
# From MetaMask (BSC, ETH, Polygon)
BSC_WALLET_ADDRESS=0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09
ETH_WALLET_ADDRESS=0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09
POLYGON_WALLET_ADDRESS=0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09

# From TronLink (TRON)
TRON_WALLET_ADDRESS=TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK
```

### **Step 3: Get API Keys**

**BSCScan**: https://bscscan.com/apis
**Etherscan**: https://etherscan.io/apis
**PolygonScan**: https://polygonscan.com/apis

### **Step 4: Configure Environment**

Create `.env` file:
```bash
# API Keys
BSCSCAN_API_KEY=your_actual_bscscan_key
ETHERSCAN_API_KEY=your_actual_etherscan_key
POLYGONSCAN_API_KEY=your_actual_polygonscan_key

# Wallet Addresses (one per network, accepts multiple tokens)
TRON_WALLET_ADDRESS=your_tron_address
BSC_WALLET_ADDRESS=your_bsc_address
ETH_WALLET_ADDRESS=your_eth_address
POLYGON_WALLET_ADDRESS=your_polygon_address
```

## 📱 **Wallet Management**

### **MetaMask (Recommended)**
**Advantages**:
- One wallet for multiple networks
- Easy to manage
- Supports BSC, ETH, Polygon
- Can hold multiple tokens

**Setup**:
1. Install MetaMask extension
2. Create wallet
3. Add BSC and Polygon networks
4. Copy the same address for all networks

### **TronLink (for TRON)**
**Advantages**:
- Native TRON support
- TRC20 token support
- Easy TRON address management

## 🔍 **How Verification Works**

### **For USDT Deposits**:
1. User sends USDT to your wallet address
2. System checks transaction on blockchain
3. Verifies amount and recipient (your wallet)
4. Confirms it's a USDT transaction (not USDC)

### **For USDC Deposits**:
1. User sends USDC to your wallet address
2. System checks transaction on blockchain
3. Verifies amount and recipient (your wallet)
4. Confirms it's a USDC transaction (not USDT)

### **Key Point**:
- **Same wallet address** receives both tokens
- **Different contract addresses** distinguish USDT vs USDC
- **System automatically detects** which token was sent

## 🧪 **Testing Your Setup**

### **Test with Small Amounts**:

1. **Send USDT to your wallet**:
   - Network: BSC
   - Amount: 1 USDT
   - Address: Your BSC wallet address

2. **Send USDC to the same wallet**:
   - Network: BSC
   - Amount: 1 USDC
   - Address: Same BSC wallet address

3. **Verify in MetaMask**:
   - You should see both USDT and USDC balances
   - Same wallet address holds both tokens

### **Test with Verification System**:
```bash
# Run the test script
node test_verification_system.js
```

## 💡 **Benefits of This Approach**

### **Simplified Management**:
- **4 wallet addresses** instead of 8
- **Easier backup** and security
- **Unified dashboard** for all tokens

### **Cost Effective**:
- **Lower gas fees** (fewer wallets to fund)
- **Simpler maintenance**
- **Reduced complexity**

### **Better User Experience**:
- **One address per network** for users
- **Less confusion** about which address to use
- **Faster setup** for new users

## 🔒 **Security Considerations**

### **Best Practices**:
1. **Use dedicated wallets** for business operations
2. **Keep private keys secure**
3. **Test with small amounts first**
4. **Monitor transactions regularly**
5. **Backup wallet information securely**

### **Multi-Signature (Optional)**:
For enhanced security, consider:
- **Hardware wallets** (Ledger, Trezor)
- **Multi-signature wallets**
- **Cold storage** for large amounts

## 📊 **Example Configuration**

### **Complete .env Example**:
```bash
# API Keys
BSCSCAN_API_KEY=ABC123DEF456GHI789
ETHERSCAN_API_KEY=XYZ789ABC123DEF456
POLYGONSCAN_API_KEY=GHI456XYZ789ABC123

# Wallet Addresses (one per network)
TRON_WALLET_ADDRESS=TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK
BSC_WALLET_ADDRESS=0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09
ETH_WALLET_ADDRESS=0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09
POLYGON_WALLET_ADDRESS=0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09
```

### **What This Enables**:
- ✅ **USDT deposits** on TRC20, BEP20, ERC20, POLYGON
- ✅ **USDC deposits** on BEP20, ERC20, POLYGON
- ✅ **Single wallet** per network
- ✅ **Automatic token detection**
- ✅ **Simplified management**

## 🎯 **Summary**

**Yes, one network address can accept both USDT and USDC!** This approach:

1. **Simplifies your setup** (4 addresses instead of 8)
2. **Reduces costs** (fewer wallets to manage)
3. **Improves user experience** (one address per network)
4. **Maintains security** (same security level)
5. **Enables automatic detection** (system knows which token was sent)

**This is the recommended approach for most businesses!** 🚀
