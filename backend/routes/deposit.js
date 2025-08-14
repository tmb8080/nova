const express = require('express');
const { body, query, validationResult } = require('express-validator');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const { authenticateToken, requireEmailVerification } = require('../middleware/auth');
const { updateWalletBalance, processReferralBonus } = require('../services/walletService');
const { sendEmail } = require('../services/emailService');

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
      ERC20: process.env.USDT_ERC20_ADDRESS || '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
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

// Create USDT deposit record
router.post('/usdt/create', [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1 USDT'),
  body('network').isIn(['BEP20', 'TRC20', 'ERC20', 'POLYGON']).withMessage('Invalid network'),
  body('transactionHash').optional().custom((value) => {
    if (value !== null && value !== undefined && typeof value !== 'string') {
      throw new Error('Transaction hash must be a string');
    }
    return true;
  }).withMessage('Transaction hash must be a string')
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
        transactionHash: transactionHash || null,
        status: 'PENDING',
        depositType: 'USDT_DIRECT'
      }
    });

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

module.exports = router;
