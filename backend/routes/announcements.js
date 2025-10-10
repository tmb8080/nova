const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

// Get active announcements (public endpoint for users)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching active announcements:', error);
    res.status(500).json({
      error: 'Failed to fetch active announcements',
      message: error.message
    });
  }
});

module.exports = router;
