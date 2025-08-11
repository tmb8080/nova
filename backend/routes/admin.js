const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { 
  getSystemStats, 
  getUserManagementData, 
  toggleUserStatus,
  getAdminSettings,
  updateAdminSettings,
  getReferralTree
} = require('../services/adminService');

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

module.exports = router;
