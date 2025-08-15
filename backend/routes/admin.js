const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { 
  getSystemStats, 
  getUserManagementData, 
  toggleUserStatus,
  getAdminSettings,
  updateAdminSettings,
  getReferralTree
} = require('../services/adminService');
const { 
  createOrUpdateVipLevels,
  getAllVipLevels,
  getVipLevelById
} = require('../services/vipService');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticateToken, requireAdmin);

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getSystemStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({
      error: 'Failed to fetch system statistics',
      message: error.message
    });
  }
});

// Get all withdrawals (admin)
router.get('/withdrawals', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['PENDING', 'COMPLETED', 'REJECTED']).withMessage('Invalid status'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { walletAddress: { contains: search, mode: 'insensitive' } },
        { transactionHash: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.withdrawal.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    res.status(500).json({
      error: 'Failed to fetch withdrawals',
      message: error.message
    });
  }
});

// Get pending withdrawals
router.get('/withdrawals/pending', async (req, res) => {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: withdrawals
    });
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error);
    res.status(500).json({
      error: 'Failed to fetch pending withdrawals',
      message: error.message
    });
  }
});

// Process withdrawal (approve/reject)
router.patch('/withdrawals/:id/process', [
  body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
  body('transactionHash').optional().isLength({ min: 10, max: 100 }).withMessage('Transaction hash must be between 10 and 100 characters'),
  body('adminNotes').optional().isLength({ max: 500 }).withMessage('Admin notes must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { action, transactionHash, adminNotes } = req.body;
    const adminId = req.user.id;

    // Get withdrawal
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!withdrawal) {
      return res.status(404).json({
        error: 'Withdrawal not found',
        message: 'The specified withdrawal does not exist'
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Invalid withdrawal status',
        message: 'Only pending withdrawals can be processed'
      });
    }

    // Process withdrawal in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: action === 'APPROVE' ? 'COMPLETED' : 'REJECTED',
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes: adminNotes || null
      };

      if (action === 'APPROVE' && transactionHash) {
        updateData.transactionHash = transactionHash;
      }

      // Update withdrawal
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id },
        data: updateData
      });

      // If approved, deduct from user's wallet
      if (action === 'APPROVE') {
        await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: {
              decrement: withdrawal.amount
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'WITHDRAWAL',
            amount: withdrawal.amount,
            description: `Withdrawal processed: ${withdrawal.currency} via ${withdrawal.network}`,
            referenceId: withdrawal.id,
            metadata: {
              withdrawalId: withdrawal.id,
              currency: withdrawal.currency,
              network: withdrawal.network,
              transactionHash: transactionHash
            }
          }
        });
      }

      return updatedWithdrawal;
    });

    // Send email notification to user
    try {
      const { sendEmail } = require('../services/emailService');
      await sendEmail({
        to: withdrawal.user.email,
        template: action === 'APPROVE' ? 'withdrawalApproved' : 'withdrawalRejected',
        data: {
          fullName: withdrawal.user.fullName,
          amount: withdrawal.amount,
          currency: withdrawal.currency,
          network: withdrawal.network,
          walletAddress: withdrawal.walletAddress,
          transactionHash: transactionHash,
          adminNotes: adminNotes,
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
        }
      });
    } catch (emailError) {
      console.error('Failed to send withdrawal notification email:', emailError);
    }

    res.json({
      success: true,
      message: `Withdrawal ${action.toLowerCase()}d successfully`,
      data: result
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      error: 'Failed to process withdrawal',
      message: error.message
    });
  }
});

// Get all deposits (admin)
router.get('/deposits', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'REJECTED']).withMessage('Invalid status'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search || '';

    const skip = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { transactionHash: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [deposits, total] = await Promise.all([
      prisma.deposit.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.deposit.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: deposits,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({
      error: 'Failed to fetch deposits',
      message: error.message
    });
  }
});

// Get pending deposits
router.get('/deposits/pending', async (req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: deposits
    });
  } catch (error) {
    console.error('Error fetching pending deposits:', error);
    res.status(500).json({
      error: 'Failed to fetch pending deposits',
      message: error.message
    });
  }
});

// Process deposit (approve/reject)
router.patch('/deposits/:id/process', [
  body('action').isIn(['APPROVE', 'REJECT']).withMessage('Action must be APPROVE or REJECT'),
  body('adminNotes').optional().isString().withMessage('Admin notes must be a string'),
  body('transactionHash').optional().isString().withMessage('Transaction hash must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { action, adminNotes, transactionHash } = req.body;

    // Find the deposit
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!deposit) {
      return res.status(404).json({
        error: 'Deposit not found'
      });
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Can only process pending deposits'
      });
    }

    // Start a transaction
    await prisma.$transaction(async (tx) => {
      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: {
          status: action === 'APPROVE' ? 'CONFIRMED' : 'REJECTED',
          adminNotes: adminNotes || null,
          updatedAt: new Date()
        }
      });

      if (action === 'APPROVE') {
        // Get or create user's wallet
        let wallet = await tx.wallet.findUnique({
          where: { userId: deposit.userId }
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: deposit.userId }
          });
        }

        // Update wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: parseFloat(deposit.amount)
            }
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: 'DEPOSIT',
            amount: parseFloat(deposit.amount),
            description: `Deposit confirmed - ${deposit.currency}`,
            referenceId: deposit.id,
            metadata: {
              depositId: deposit.id,
              transactionHash: transactionHash || deposit.transactionHash
            }
          }
        });

        // Process referral bonus if applicable
        if (deposit.user.referrerId) {
          const referralBonus = parseFloat(deposit.amount) * 0.05; // 5% referral bonus
          
          const referrerWallet = await tx.wallet.findUnique({
            where: { userId: deposit.user.referrerId }
          });

          if (referrerWallet) {
            await tx.wallet.update({
              where: { id: referrerWallet.id },
              data: {
                balance: { increment: referralBonus },
                totalReferralBonus: { increment: referralBonus }
              }
            });

            await tx.transaction.create({
              data: {
                userId: deposit.user.referrerId,
                type: 'REFERRAL_BONUS',
                amount: referralBonus,
                description: `Referral bonus from ${deposit.user.fullName}`,
                referenceId: deposit.id,
                metadata: {
                  referredUserId: deposit.userId,
                  depositId: deposit.id
                }
              }
            });
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Deposit ${action === 'approve' ? 'approved' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({
      error: 'Failed to process deposit',
      message: error.message
    });
  }
});

// Get user management data
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';

    const result = await getUserManagementData(page, limit, search);
    
    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching user management data:', error);
    res.status(500).json({
      error: 'Failed to fetch user data',
      message: error.message
    });
  }
});

// Toggle user status (active/inactive)
router.put('/users/:userId/toggle-status', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const updatedUser = await toggleUserStatus(userId);
    
    res.json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: updatedUser.id,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      message: error.message
    });
  }
});

// Get referral tree for a user
router.get('/users/:userId/referral-tree', [
  query('depth').optional().isInt({ min: 1, max: 5 }).withMessage('Depth must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { userId } = req.params;
    const depth = parseInt(req.query.depth) || 3;

    const tree = await getReferralTree(userId, depth);
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    console.error('Error fetching referral tree:', error);
    res.status(500).json({
      error: 'Failed to fetch referral tree',
      message: error.message
    });
  }
});

// Get admin settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await getAdminSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    res.status(500).json({
      error: 'Failed to fetch admin settings',
      message: error.message
    });
  }
});

// Update admin settings
router.put('/settings', [
  body('dailyGrowthRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Daily growth rate must be between 0 and 1'),
  body('referralBonusRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Referral bonus rate must be between 0 and 1'),
  body('minDepositAmount').optional().isFloat({ min: 0 }).withMessage('Minimum deposit amount must be positive'),
  body('minWithdrawalAmount').optional().isFloat({ min: 0 }).withMessage('Minimum withdrawal amount must be positive'),
  body('isDepositEnabled').optional().isBoolean().withMessage('Deposit enabled must be boolean'),
  body('isWithdrawalEnabled').optional().isBoolean().withMessage('Withdrawal enabled must be boolean'),
  body('isRegistrationEnabled').optional().isBoolean().withMessage('Registration enabled must be boolean'),
  body('maintenanceMode').optional().isBoolean().withMessage('Maintenance mode must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const updates = req.body;
    const updatedSettings = await updateAdminSettings(updates);
    
    res.json({
      success: true,
      message: 'Admin settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    res.status(500).json({
      error: 'Failed to update admin settings',
      message: error.message
    });
  }
});

// VIP Management Routes

// Get all VIP levels
router.get('/vip-levels', async (req, res) => {
  try {
    const vipLevels = await getAllVipLevels();
    
    res.json({
      success: true,
      data: vipLevels
    });
  } catch (error) {
    console.error('Error fetching VIP levels:', error);
    res.status(500).json({
      error: 'Failed to fetch VIP levels',
      message: error.message
    });
  }
});

// Get specific VIP level
router.get('/vip-levels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        error: 'VIP level ID is required'
      });
    }

    const vipLevel = await getVipLevelById(id);
    
    if (!vipLevel) {
      return res.status(404).json({
        error: 'VIP level not found'
      });
    }
    
    res.json({
      success: true,
      data: vipLevel
    });
  } catch (error) {
    console.error('Error fetching VIP level:', error);
    res.status(500).json({
      error: 'Failed to fetch VIP level',
      message: error.message
    });
  }
});

// Create or update VIP levels (bulk operation)
router.post('/vip-levels/seed', async (req, res) => {
  try {
    const results = await createOrUpdateVipLevels();
    
    res.json({
      success: true,
      message: 'VIP levels created/updated successfully',
      data: results
    });
  } catch (error) {
    console.error('Error creating/updating VIP levels:', error);
    res.status(500).json({
      error: 'Failed to create/update VIP levels',
      message: error.message
    });
  }
});

module.exports = router;
