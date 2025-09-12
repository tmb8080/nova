const express = require('express');
const { query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Get public member list for home page display
router.get('/public', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sortBy').optional().isIn(['earnings', 'vipLevel', 'createdAt']).withMessage('Invalid sort field'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'earnings';
    const order = req.query.order || 'desc';

    // Get members with VIP levels and earnings data
    const members = await prisma.user.findMany({
      where: {
        isAdmin: false,
        userVip: {
          isNot: null
        }
      },
      include: {
        userVip: {
          include: {
            vipLevel: true
          }
        },
        wallet: {
          select: {
            totalDeposits: true,
            balance: true
          }
        },
        _count: {
          select: {
            referrals: true
          }
        }
      },
      orderBy: {
        [sortBy === 'earnings' ? 'wallet' : sortBy === 'vipLevel' ? 'userVip' : 'createdAt']: 
        sortBy === 'earnings' ? { totalDeposits: order } :
        sortBy === 'vipLevel' ? { vipLevel: { amount: order } } :
        order
      },
      take: limit
    });

    // Get recent earnings for each member
    const membersWithEarnings = await Promise.all(
      members.map(async (member) => {
        // Get total earnings from VIP_EARNINGS transactions
        const totalEarnings = await prisma.transaction.aggregate({
          where: {
            userId: member.id,
            type: 'VIP_EARNINGS'
          },
          _sum: { amount: true }
        });

        // Get today's earnings
        const todayEarnings = await prisma.transaction.aggregate({
          where: {
            userId: member.id,
            type: 'VIP_EARNINGS',
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          _sum: { amount: true }
        });

        // Get referral earnings
        const referralEarnings = await prisma.transaction.aggregate({
          where: {
            userId: member.id,
            type: 'REFERRAL_BONUS'
          },
          _sum: { amount: true }
        });

        return {
          id: member.id,
          email: member.email ? member.email.replace(/(.{2}).*(@.*)/, '$1****$2') : '****',
          fullName: member.fullName ? member.fullName.replace(/(.{2}).*/, '$1****') : '****',
          vipLevel: member.userVip?.vipLevel?.name || 'No VIP',
          vipLevelNumber: member.userVip?.vipLevel?.amount || 0,
          totalEarnings: totalEarnings._sum.amount || 0,
          todayEarnings: todayEarnings._sum.amount || 0,
          referralEarnings: referralEarnings._sum.amount || 0,
          totalDeposits: member.wallet?.totalDeposits || 0,
          balance: member.wallet?.balance || 0,
          referralCount: member._count.referrals,
          joinedAt: member.createdAt,
          badge: getBadgeType(member.userVip?.vipLevel?.name)
        };
      })
    );

    // Sort by earnings if that was requested
    if (sortBy === 'earnings') {
      membersWithEarnings.sort((a, b) => 
        order === 'desc' ? b.totalEarnings - a.totalEarnings : a.totalEarnings - b.totalEarnings
      );
    }

    res.json({
      success: true,
      data: membersWithEarnings,
      total: membersWithEarnings.length
    });

  } catch (error) {
    console.error('Error fetching public member list:', error);
    res.status(500).json({
      error: 'Failed to fetch member list',
      message: error.message
    });
  }
});

// Get member statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalMembers,
      activeMembers,
      totalEarnings,
      topEarner
    ] = await Promise.all([
      // Total members
      prisma.user.count({
        where: { isAdmin: false }
      }),
      
      // Active members (with VIP levels)
      prisma.user.count({
        where: {
          isAdmin: false,
          userVip: { isNot: null }
        }
      }),
      
      // Total earnings across all members
      prisma.transaction.aggregate({
        where: { type: 'VIP_EARNINGS' },
        _sum: { amount: true }
      }),
      
      // Top earner
      prisma.user.findFirst({
        where: {
          isAdmin: false,
          userVip: { isNot: null }
        },
        include: {
          userVip: {
            include: {
              vipLevel: true
            }
          }
        },
        orderBy: {
          wallet: {
            totalDeposits: 'desc'
          }
        }
      })
    ]);

    // Get top earner's total earnings
    let topEarnerEarnings = 0;
    if (topEarner) {
      const topEarnerTotalEarnings = await prisma.transaction.aggregate({
        where: {
          userId: topEarner.id,
          type: 'VIP_EARNINGS'
        },
        _sum: { amount: true }
      });
      topEarnerEarnings = topEarnerTotalEarnings._sum.amount || 0;
    }

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        totalEarnings: totalEarnings._sum.amount || 0,
        topEarner: topEarner ? {
          email: topEarner.email ? topEarner.email.replace(/(.{2}).*(@.*)/, '$1****$2') : '****',
          vipLevel: topEarner.userVip?.vipLevel?.name || 'No VIP',
          totalEarnings: topEarnerEarnings
        } : null
      }
    });

  } catch (error) {
    console.error('Error fetching member statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch member statistics',
      message: error.message
    });
  }
});

// Helper function to determine badge type based on VIP level
function getBadgeType(vipLevelName) {
  if (!vipLevelName) return 'default';
  
  const level = vipLevelName.toLowerCase();
  
  if (level.includes('tera') || level.includes('v14')) return 'purple-gold-winged-crown';
  if (level.includes('giga') || level.includes('v13')) return 'purple-gold-crown';
  if (level.includes('mega') || level.includes('v12')) return 'purple-gold-crown';
  if (level.includes('ultimate') || level.includes('v11')) return 'purple-gold-crown';
  if (level.includes('v10')) return 'purple-gold-crown';
  if (level.includes('v9')) return 'purple-gold-crown';
  if (level.includes('v8')) return 'blue-silver-diamond';
  if (level.includes('v7')) return 'blue-silver-diamond';
  if (level.includes('v6')) return 'blue-silver-diamond';
  if (level.includes('v5')) return 'blue-silver-diamond';
  if (level.includes('v4')) return 'blue-silver-diamond';
  if (level.includes('v3')) return 'orange-gold-star';
  if (level.includes('v2')) return 'orange-gold-star';
  if (level.includes('v1') || level.includes('starter')) return 'bronze-w';
  
  return 'default';
}

module.exports = router;
