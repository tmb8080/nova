const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const CompanyWalletService = require('../services/companyWalletService');

const prisma = new PrismaClient();

const router = express.Router();

/**
 * Get company wallet overview (public info)
 */
router.get('/overview', async (req, res) => {
  try {
    const stats = await CompanyWalletService.getCompanyWalletStats();
    
    res.json({
      success: true,
      data: {
        totalBalance: stats.totalBalance,
        totalDeposits: stats.totalDeposits,
        totalWithdrawals: stats.totalWithdrawals,
        wallets: stats.wallets.map(wallet => ({
          network: wallet.network,
          address: wallet.address,
          balance: wallet.balance,
          lastUpdated: wallet.lastUpdated
        }))
      }
    });
  } catch (error) {
    console.error('Error getting company wallet overview:', error);
    res.status(500).json({
      error: 'Failed to get company wallet overview',
      message: error.message
    });
  }
});

/**
 * Get company wallet details (admin only)
 */
router.get('/details', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const stats = await CompanyWalletService.getCompanyWalletStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting company wallet details:', error);
    res.status(500).json({
      error: 'Failed to get company wallet details',
      message: error.message
    });
  }
});

/**
 * Get company wallet transaction history (admin only)
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const { network, limit = 50 } = req.query;
    const transactions = await CompanyWalletService.getTransactionHistory(network, parseInt(limit));
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting company wallet transactions:', error);
    res.status(500).json({
      error: 'Failed to get company wallet transactions',
      message: error.message
    });
  }
});

/**
 * Initialize company wallets (admin only)
 */
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Admin access required'
      });
    }

    const wallets = await CompanyWalletService.initializeCompanyWallets();
    
    res.json({
      success: true,
      message: 'Company wallets initialized successfully',
      data: wallets
    });
  } catch (error) {
    console.error('Error initializing company wallets:', error);
    res.status(500).json({
      error: 'Failed to initialize company wallets',
      message: error.message
    });
  }
});

module.exports = router;
