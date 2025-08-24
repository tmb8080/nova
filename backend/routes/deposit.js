const express = require('express');
const { body, query, validationResult } = require('express-validator');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const { authenticateToken, requireEmailVerification, requireAdmin } = require('../middleware/auth');
const { updateWalletBalance, processReferralBonus } = require('../services/walletService');
const { sendEmail } = require('../services/emailService');
const { 
  verifyUsdtDeposit, 
  manualVerifyDeposit, 
  getPendingDepositsForVerification,
  batchVerifyDeposits 
} = require('../services/depositVerificationService');

const router = express.Router();
const prisma = new PrismaClient();

// Create deposit request
router.post('/create', [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0.01'),
  body('currency').isIn(['BTC', 'ETH', 'USDT']).withMessage('Invalid currency')
], authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, currency } = req.body;
    const userId = req.user.id;

    // Check admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings || !settings.isDepositEnabled) {
      return res.status(400).json({
        error: 'Deposits are currently disabled',
        message: 'Please try again later'
      });
    }

    if (parseFloat(amount) < parseFloat(settings.minDepositAmount)) {
      return res.status(400).json({
        error: 'Amount too low',
        message: `Minimum deposit amount is ${settings.minDepositAmount}`
      });
    }

    // Create Coinbase Commerce charge
    const coinbaseResponse = await axios.post('https://api.commerce.coinbase.com/charges', {
      name: 'Trinity Metro Bike Deposit',
      description: `Deposit ${amount} ${currency} to Trinity Metro Bike wallet`,
      local_price: {
        amount: amount.toString(),
        currency: currency
      },
      pricing_type: 'fixed_price',
      metadata: {
        user_id: userId,
        platform: 'trinity-metro-bike'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY,
        'X-CC-Version': '2018-03-22'
      }
    });

    const charge = coinbaseResponse.data.data;

    // Create deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: parseFloat(amount),
        currency,
        coinbaseChargeId: charge.id,
        coinbaseCode: charge.code,
        depositType: 'COINBASE',
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      message: 'Deposit request created successfully',
      data: {
        depositId: deposit.id,
        coinbaseUrl: charge.hosted_url,
        chargeCode: charge.code,
        amount: deposit.amount,
        currency: deposit.currency,
        expiresAt: charge.expires_at
      }
    });

  } catch (error) {
    console.error('Error creating deposit:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        error: 'Payment service configuration error',
        message: 'Please contact support'
      });
    }

    res.status(500).json({
      error: 'Failed to create deposit',
      message: error.message
    });
  }
});

// Get user's deposit history
router.get('/my-deposits', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'FAILED', 'EXPIRED']).withMessage('Invalid status')
], authenticateToken, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const skip = (page - 1) * limit;
    
    const whereClause = {
      userId,
      ...(status && { status })
    };

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      
      prisma.deposit.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: deposits,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Error fetching deposit history:', error);
    res.status(500).json({
      error: 'Failed to fetch deposit history',
      message: error.message
    });
  }
});

// Get USDT deposit addresses
router.get('/usdt/addresses', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, these would be fetched from a secure configuration
    // or generated dynamically based on user preferences
    const addresses = {
      TRC20: process.env.USDT_TRC20_ADDRESS || 'TJwzxqg5FbGRibyMRArrnSo828WppqvQjd',
      BEP20: process.env.USDT_BEP20_ADDRESS || '0x1016f7DAF8b1816C0979992Ab3c8C8D8D8D8D8D8D',
      ERC20: process.env.USDT_ERC20_ADDRESS || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      POLYGON: process.env.USDT_POLYGON_ADDRESS || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
    };

    res.json({
      success: true,
      data: addresses
    });

  } catch (error) {
    console.error('Error fetching USDT addresses:', error);
    res.status(500).json({
      error: 'Failed to fetch USDT addresses',
      message: error.message
    });
  }
});

// Get company wallet addresses for manual deposits
router.get('/company-addresses', authenticateToken, async (req, res) => {
  try {
    // Get company wallet addresses from environment variables
    const addresses = {
      TRC20: process.env.TRON_WALLET_ADDRESS || 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK',
      BEP20: process.env.BSC_WALLET_ADDRESS || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      ERC20: process.env.ETH_WALLET_ADDRESS || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      POLYGON: process.env.POLYGON_WALLET_ADDRESS || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    };

    // Add network information and fees
    const networkInfo = {
      TRC20: { name: 'Tron TRC20', fee: '~$1', minAmount: 30, supportedTokens: ['USDT'] },
      BEP20: { name: 'BSC BEP20', fee: '~$0.5', minAmount: 30, supportedTokens: ['USDT', 'USDC'] },
      ERC20: { name: 'Ethereum ERC20', fee: '~$10-50', minAmount: 30, supportedTokens: ['USDT', 'USDC'] },
      POLYGON: { name: 'Polygon MATIC', fee: '~$0.01', minAmount: 30, supportedTokens: ['USDT', 'USDC'] }
    };

    const result = {};
    Object.keys(addresses).forEach(network => {
      result[network] = {
        address: addresses[network],
        ...networkInfo[network]
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching company wallet addresses:', error);
    res.status(500).json({
      error: 'Failed to fetch company wallet addresses',
      message: error.message
    });
  }
});

// Create USDT deposit record
router.post('/usdt/create', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1 USDT'),
  body('network').isIn(['BEP20', 'TRC20', 'ERC20', 'POLYGON']).withMessage('Invalid network'),
  body('transactionHash').notEmpty().withMessage('Transaction hash is required')
], authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, network, transactionHash } = req.body;
    const userId = req.user.id;

    console.log(`Creating USDT deposit:`, {
      userId,
      amount,
      network,
      transactionHash: transactionHash ? `${transactionHash.substring(0, 10)}...` : 'null'
    });

    // Check admin settings
    const settings = await prisma.adminSettings.findFirst();
    if (!settings || !settings.isDepositEnabled) {
      return res.status(400).json({
        error: 'Deposits are currently disabled',
        message: 'Please try again later'
      });
    }

    // For USDT deposits, use the admin setting for minimum amount
    const minUsdtAmount = parseFloat(settings.minUsdtDepositAmount || 30);
    if (parseFloat(amount) < minUsdtAmount) {
      return res.status(400).json({
        error: 'Amount too low',
        message: `Minimum USDT deposit amount is ${minUsdtAmount} USDT`
      });
    }

    // Create USDT deposit record
    const deposit = await prisma.deposit.create({
      data: {
        userId,
        amount: parseFloat(amount),
        currency: 'USDT',
        network: network,
        transactionHash: transactionHash.trim(),
        status: 'PENDING',
        depositType: 'USDT_DIRECT'
      }
    });

    console.log(`✅ USDT deposit created successfully:`, {
      depositId: deposit.id,
      userId: deposit.userId,
      amount: deposit.amount,
      network: deposit.network,
      transactionHash: deposit.transactionHash ? `${deposit.transactionHash.substring(0, 10)}...` : 'null',
      status: deposit.status,
      depositType: deposit.depositType,
      createdAt: deposit.createdAt
    });

    // Verify the deposit was actually saved by querying it back
    const verifyDeposit = await prisma.deposit.findUnique({
      where: { id: deposit.id }
    });

    if (verifyDeposit) {
      console.log(`✅ Deposit verification query successful:`, {
        id: verifyDeposit.id,
        userId: verifyDeposit.userId,
        status: verifyDeposit.status
      });
    } else {
      console.log(`❌ Deposit verification query failed - deposit not found after creation!`);
    }

    res.json({
      success: true,
      message: 'USDT deposit record created successfully',
      data: {
        depositId: deposit.id,
        amount: deposit.amount,
        currency: deposit.currency,
        network: deposit.network,
        status: deposit.status,
        createdAt: deposit.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating USDT deposit:', error);
    res.status(500).json({
      error: 'Failed to create USDT deposit',
      message: error.message
    });
  }
});

// Get pending deposits count for user
router.get('/pending-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingCount = await prisma.deposit.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      data: {
        pendingCount
      }
    });

  } catch (error) {
    console.error('Error fetching pending deposits count:', error);
    res.status(500).json({
      error: 'Failed to fetch pending deposits count',
      message: error.message
    });
  }
});

// Check automatic detection status
router.get('/automatic-detection-status', authenticateToken, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const statusFilePath = path.join(__dirname, '../automatic_detection_status.json');
    
    let isRunning = false;
    let message = 'Automatic detection is not running';
    
    // Try to read status from file
    if (fs.existsSync(statusFilePath)) {
      try {
        const statusData = JSON.parse(fs.readFileSync(statusFilePath, 'utf8'));
        isRunning = statusData.isRunning || false;
        message = statusData.message || (isRunning ? 'Automatic detection is active' : 'Automatic detection is not running');
      } catch (fileError) {
        console.error('Error reading status file:', fileError);
        // Fallback to global variable
        isRunning = global.automaticDetectionRunning || false;
        message = isRunning ? 'Automatic detection is active' : 'Automatic detection is not running';
      }
    } else {
      // Fallback to global variable if file doesn't exist
      isRunning = global.automaticDetectionRunning || false;
      message = isRunning ? 'Automatic detection is active' : 'Automatic detection is not running';
    }
    
    res.json({ 
      success: true, 
      data: { 
        isRunning,
        message
      } 
    });
  } catch (error) {
    console.error('Error checking automatic detection status:', error);
    res.status(500).json({ error: 'Failed to check status', message: error.message });
  }
});

// Get deposit details
router.get('/:depositId', authenticateToken, async (req, res) => {
  try {
    const { depositId } = req.params;
    const userId = req.user.id;

    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        userId
      }
    });

    if (!deposit) {
      return res.status(404).json({
        error: 'Deposit not found'
      });
    }

    res.json({
      success: true,
      data: deposit
    });

  } catch (error) {
    console.error('Error fetching deposit details:', error);
    res.status(500).json({
      error: 'Failed to fetch deposit details',
      message: error.message
    });
  }
});

// Update transaction hash for a deposit
router.patch('/:depositId/transaction-hash', [
  body('transactionHash').notEmpty().withMessage('Transaction hash is required')
], authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { depositId } = req.params;
    const { transactionHash } = req.body;
    const userId = req.user.id;

    // Check if deposit exists and belongs to user
    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        userId
      }
    });

    if (!deposit) {
      return res.status(404).json({
        error: 'Deposit not found',
        message: 'The specified deposit does not exist or does not belong to you'
      });
    }

    // Only allow updates for pending deposits
    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot update transaction hash',
        message: 'Transaction hash can only be updated for pending deposits'
      });
    }

    // Update the transaction hash
    const updatedDeposit = await prisma.deposit.update({
      where: {
        id: depositId
      },
      data: {
        transactionHash,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Transaction hash updated successfully',
      data: {
        depositId: updatedDeposit.id,
        transactionHash: updatedDeposit.transactionHash,
        status: updatedDeposit.status
      }
    });

  } catch (error) {
    console.error('Error updating transaction hash:', error);
    res.status(500).json({
      error: 'Failed to update transaction hash',
      message: error.message
    });
  }
});

// Verify deposit transaction (for users)
router.post('/:depositId/verify', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { depositId } = req.params;
    const userId = req.user.id;

    console.log(`🔍 Verification request for deposit ${depositId} by user ${userId}`);
    console.log(`   User email: ${req.user.email}`);
    console.log(`   User phone: ${req.user.phone}`);
    console.log(`   User isEmailVerified: ${req.user.isEmailVerified}`);

    // Check if deposit exists and belongs to user
    const deposit = await prisma.deposit.findFirst({
      where: {
        id: depositId,
        userId
      }
    });

    if (!deposit) {
      console.log(`❌ Deposit ${depositId} not found for user ${userId}`);
      
      // Let's also check if the deposit exists at all (for debugging)
      const anyDeposit = await prisma.deposit.findUnique({
        where: { id: depositId }
      });
      
      if (anyDeposit) {
        console.log(`⚠️  Deposit ${depositId} exists but belongs to user ${anyDeposit.userId} (not ${userId})`);
        console.log(`   This suggests a user context mismatch`);
      } else {
        console.log(`⚠️  Deposit ${depositId} doesn't exist in database at all`);
      }
      
      return res.status(404).json({
        error: 'Deposit not found',
        message: 'The specified deposit does not belong to you'
      });
    }

    console.log(`✅ Found deposit:`, {
      id: deposit.id,
      userId: deposit.userId,
      status: deposit.status,
      transactionHash: deposit.transactionHash,
      network: deposit.network,
      amount: deposit.amount,
      currency: deposit.currency
    });

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Cannot verify deposit',
        message: `Deposit is already ${deposit.status.toLowerCase()}`
      });
    }

    if (!deposit.transactionHash || !deposit.network) {
      console.log(`❌ Missing required fields for deposit ${depositId}:`, {
        transactionHash: deposit.transactionHash,
        network: deposit.network
      });
      return res.status(400).json({
        error: 'Missing information',
        message: 'Transaction hash and network are required for verification'
      });
    }

    // Verify the deposit
    const verificationResult = await verifyUsdtDeposit(
      depositId,
      deposit.transactionHash,
      deposit.network
    );

    if (verificationResult.verified) {
      // Process the deposit confirmation
      const { processUsdtDepositConfirmation } = require('../services/depositService');
      await processUsdtDepositConfirmation(depositId, deposit.transactionHash);
    }

    res.json({
      success: true,
      message: verificationResult.message,
      data: verificationResult
    });

  } catch (error) {
    console.error('❌ Error verifying deposit:', error);
    res.status(500).json({
      error: 'Failed to verify deposit',
      message: error.message
    });
  }
});

// Admin: Get pending deposits for verification
router.get('/admin/pending-verification', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const deposits = await getPendingDepositsForVerification();

    res.json({
      success: true,
      data: deposits
    });

  } catch (error) {
    console.error('Error fetching pending deposits for verification:', error);
    res.status(500).json({
      error: 'Failed to fetch pending deposits',
      message: error.message
    });
  }
});

// Admin: Manually verify deposit
router.post('/admin/:depositId/manual-verify', [
  body('verificationNotes').optional().isLength({ max: 500 }).withMessage('Verification notes too long')
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { depositId } = req.params;
    const { verificationNotes } = req.body;
    const adminId = req.user.id;

    // Manually verify the deposit
    const verificationResult = await manualVerifyDeposit(depositId, adminId, verificationNotes);

    if (verificationResult.verified) {
      // Process the deposit confirmation
      const { processUsdtDepositConfirmation } = require('../services/depositService');
      await processUsdtDepositConfirmation(depositId, null);
    }

    res.json({
      success: true,
      message: verificationResult.message,
      data: verificationResult
    });

  } catch (error) {
    console.error('Error manually verifying deposit:', error);
    res.status(500).json({
      error: 'Failed to manually verify deposit',
      message: error.message
    });
  }
});

// Admin: Batch verify deposits
router.post('/admin/batch-verify', [
  body('depositIds').isArray({ min: 1 }).withMessage('At least one deposit ID is required'),
  body('depositIds.*').isUUID().withMessage('Invalid deposit ID format')
], authenticateToken, requireAdmin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { depositIds } = req.body;

    // Batch verify deposits
    const results = await batchVerifyDeposits(depositIds);

    // Process successful verifications
    const successfulVerifications = results.filter(result => result.verified);
    for (const verification of successfulVerifications) {
      try {
        const { processUsdtDepositConfirmation } = require('../services/depositService');
        await processUsdtDepositConfirmation(verification.depositId, null);
      } catch (error) {
        console.error(`Error processing deposit ${verification.depositId}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Batch verification completed. ${successfulVerifications.length} deposits verified successfully.`,
      data: {
        total: depositIds.length,
        successful: successfulVerifications.length,
        failed: results.length - successfulVerifications.length,
        results
      }
    });

  } catch (error) {
    console.error('Error in batch verification:', error);
    res.status(500).json({
      error: 'Failed to batch verify deposits',
      message: error.message
    });
  }
});

module.exports = router;
