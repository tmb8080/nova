# Deposit and Withdrawal Verification System

This document provides a comprehensive guide to the enhanced deposit and withdrawal verification system that ensures funds are actually deposited in your accounts before processing transactions.

## Overview

The verification system provides multiple layers of security and verification:

1. **Automated Blockchain Verification** - Verifies transactions on the blockchain
2. **Manual Admin Verification** - Allows admins to manually verify deposits
3. **Address Validation** - Validates crypto addresses before processing
4. **Suspicious Activity Detection** - Detects potentially fraudulent transactions
5. **Withdrawal Limits** - Enforces daily and monthly withdrawal limits

## Features

### Deposit Verification

#### Automated Verification
- **Blockchain Transaction Verification**: Automatically verifies USDT deposits on multiple networks (TRC20, BEP20, ERC20, POLYGON)
- **Amount Validation**: Ensures the deposited amount matches the expected amount
- **Address Validation**: Verifies that funds were sent to the correct system addresses
- **Transaction Confirmation**: Checks if transactions are confirmed on the blockchain

#### Manual Verification
- **Admin Manual Verification**: Admins can manually verify deposits when automated verification fails
- **Batch Verification**: Process multiple deposits at once
- **Verification Notes**: Add notes for manual verifications

#### Supported Networks
- **TRC20 (TRON)**: USDT on TRON network
- **BEP20 (BSC)**: USDT on Binance Smart Chain
- **ERC20 (Ethereum)**: USDT on Ethereum mainnet
- **POLYGON**: USDT on Polygon network

### Withdrawal Verification

#### Pre-Processing Verification
- **Address Validation**: Validates crypto addresses before processing withdrawals
- **Balance Verification**: Ensures users have sufficient balance
- **Suspicious Activity Detection**: Detects unusual withdrawal patterns
- **Limit Enforcement**: Enforces daily and monthly withdrawal limits

#### Security Features
- **Email Verification Required**: Users must verify their email before withdrawals
- **Suspicious Activity Monitoring**: Detects multiple failed attempts and unusual patterns
- **Withdrawal Limits**: Configurable daily and monthly limits
- **Address Format Validation**: Validates address formats for different cryptocurrencies

## API Endpoints

### Deposit Verification Endpoints

#### User Endpoints

**Verify Deposit Transaction**
```
POST /api/deposits/:depositId/verify
```
- Allows users to verify their own deposits
- Requires transaction hash and network information
- Automatically processes the deposit if verification succeeds

**Update Transaction Hash**
```
PATCH /api/deposits/:depositId/transaction-hash
```
- Update transaction hash for pending deposits
- Only works for deposits that belong to the user

#### Admin Endpoints

**Get Pending Deposits for Verification**
```
GET /api/deposits/admin/pending-verification
```
- Returns all pending deposits that need verification
- Includes user information for each deposit

**Manual Verification**
```
POST /api/deposits/admin/:depositId/manual-verify
```
- Manually verify a deposit
- Requires admin privileges
- Can include verification notes

**Batch Verification**
```
POST /api/deposits/admin/batch-verify
```
- Verify multiple deposits at once
- Returns detailed results for each deposit
- Processes successful verifications automatically

### Withdrawal Verification Endpoints

#### User Endpoints

**Get Withdrawal Statistics**
```
GET /api/withdrawals/stats
```
- Returns user's withdrawal statistics
- Includes total withdrawals, count, and pending withdrawals

#### Admin Endpoints

**Verify Withdrawal Request**
```
POST /api/withdrawals/admin/:withdrawalId/verify
```
- Verify a withdrawal request before processing
- Checks address validity, balance, and suspicious activity
- Returns detailed verification results

**Process Verified Withdrawal**
```
POST /api/withdrawals/admin/:withdrawalId/process-verified
```
- Process a withdrawal that has been verified
- Can include transaction hash for completed withdrawals
- Automatically deducts from user's balance

### Admin Dashboard Endpoints

**Verification Dashboard**
```
GET /api/admin/verification-dashboard
```
- Overview of pending deposits and withdrawals
- Recent activity and monthly statistics
- Quick access to verification tasks

**System Addresses Management**
```
GET /api/admin/system-addresses
PUT /api/admin/system-addresses
```
- View and update system wallet addresses
- Configure addresses for different networks

**Verification Logs**
```
GET /api/admin/verification-logs
```
- View verification history
- Filter by deposit or withdrawal type
- Paginated results

## Environment Variables

Configure the following environment variables for the verification system:

```bash
# Blockchain API Keys
BSCSCAN_API_KEY=your_bscscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# System Wallet Addresses
USDT_TRC20_ADDRESS=your_tron_usdt_address
USDT_BEP20_ADDRESS=your_bsc_usdt_address
USDT_ERC20_ADDRESS=your_ethereum_usdt_address
USDT_POLYGON_ADDRESS=your_polygon_usdt_address

# Coinbase Commerce (for existing functionality)
COINBASE_COMMERCE_API_KEY=your_coinbase_api_key
COINBASE_COMMERCE_WEBHOOK_SECRET=your_webhook_secret
```

## Usage Examples

### Verifying a USDT Deposit

1. **User creates deposit record**:
```javascript
POST /api/deposits/usdt/create
{
  "amount": "100",
  "network": "TRC20",
  "transactionHash": "0x1234567890abcdef..."
}
```

2. **User verifies the deposit**:
```javascript
POST /api/deposits/:depositId/verify
```

3. **System verifies on blockchain**:
- Checks transaction on TRON network
- Validates amount and recipient address
- Confirms transaction status

4. **Deposit is processed**:
- Status updated to CONFIRMED
- User's wallet balance increased
- Referral bonuses processed (if applicable)

### Processing a Withdrawal

1. **User requests withdrawal**:
```javascript
POST /api/withdrawals/request
{
  "amount": "50",
  "currency": "USDT",
  "network": "TRC20",
  "walletAddress": "TABC1234567890..."
}
```

2. **Admin verifies withdrawal**:
```javascript
POST /api/withdrawals/admin/:withdrawalId/verify
```

3. **System performs checks**:
- Validates wallet address format
- Checks user's balance
- Detects suspicious activity
- Enforces withdrawal limits

4. **Admin processes withdrawal**:
```javascript
POST /api/withdrawals/admin/:withdrawalId/process-verified
{
  "transactionHash": "0xabcdef1234567890..."
}
```

## Security Features

### Suspicious Activity Detection

The system monitors for:
- Multiple failed withdrawal attempts in 24 hours
- Withdrawals exceeding 90% of total deposits
- Large withdrawals shortly after deposits
- Unusual transaction patterns

### Address Validation

- **Format Validation**: Checks address format for each network
- **Blockchain Validation**: Verifies addresses exist on the blockchain
- **Contract Detection**: Identifies contract addresses (for Ethereum)

### Withdrawal Limits

- **Daily Limit**: $1,000 per user per day
- **Monthly Limit**: $10,000 per user per month
- **Minimum Amount**: Configurable minimum withdrawal amounts
- **Currency-Specific Limits**: Different limits for different currencies

## Error Handling

The system provides detailed error messages for various scenarios:

- **Invalid Address**: "Invalid wallet address format"
- **Insufficient Balance**: "Insufficient balance for withdrawal"
- **Suspicious Activity**: "Suspicious activity detected: [reason]"
- **Limit Exceeded**: "Daily withdrawal limit exceeded"
- **Transaction Not Found**: "Transaction not found on [network]"
- **Amount Mismatch**: "Amount mismatch. Expected: X, Received: Y"

## Monitoring and Logging

### Verification Logs

All verification activities are logged with:
- Timestamp
- User information
- Transaction details
- Verification results
- Admin notes (for manual verifications)

### Dashboard Metrics

The admin dashboard provides:
- Pending deposits and withdrawals count
- Recent activity overview
- Monthly statistics
- Verification success rates

## Best Practices

### For Admins

1. **Regular Monitoring**: Check the verification dashboard regularly
2. **Manual Verification**: Use manual verification for edge cases
3. **Address Management**: Keep system addresses secure and updated
4. **Log Review**: Regularly review verification logs for patterns

### For Users

1. **Correct Information**: Ensure transaction hash and network are correct
2. **Address Validation**: Double-check wallet addresses before withdrawals
3. **Patience**: Allow time for blockchain confirmations
4. **Support**: Contact support if verification fails

## Troubleshooting

### Common Issues

1. **Transaction Not Found**
   - Check if transaction hash is correct
   - Verify network selection
   - Allow time for blockchain confirmation

2. **Address Validation Failed**
   - Verify address format for the selected network
   - Check if address exists on the blockchain
   - Ensure address is not a contract (for Ethereum)

3. **Amount Mismatch**
   - Check for network fees
   - Verify exact amount sent
   - Consider decimal precision differences

4. **Suspicious Activity Detected**
   - Review recent activity
   - Contact support for manual review
   - Provide additional verification if needed

### Support

For issues with the verification system:
1. Check the verification logs
2. Review error messages carefully
3. Contact admin support with transaction details
4. Provide screenshots or blockchain explorer links

## Future Enhancements

Planned improvements include:
- **Multi-signature Support**: Enhanced security for large transactions
- **Real-time Notifications**: Instant alerts for verification events
- **Advanced Analytics**: Detailed reporting and analytics
- **API Rate Limiting**: Protection against abuse
- **Mobile App Integration**: Mobile verification capabilities
