const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { generateOTP } = require('../utils/helpers');
// Auto-complete task functionality removed - only daily earning tasks available

const router = express.Router();
const prisma = new PrismaClient();

// Generate unique referral code
const generateReferralCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Register new user
router.post('/register', [
  body('fullName').optional({ checkFalsy: true }).trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters if provided'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail().withMessage('Please provide a valid email if provided'),
  body('phone').optional({ checkFalsy: true }).custom((value) => {
    if (value && value.length < 8) {
      throw new Error('Phone number must be at least 8 digits');
    }
    return true;
  }).withMessage('Please provide a valid phone number if provided'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('referralCode').optional({ checkFalsy: true }).isLength({ min: 6, max: 6 }).withMessage('Invalid referral code')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { fullName, email, phone, password, referralCode } = req.body;

    // Validate that at least email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({
        error: 'Validation failed',
        details: [{
          type: 'field',
          msg: 'At least email or phone number is required',
          path: 'email',
          location: 'body'
        }]
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email or phone number already exists'
      });
    }

    // Validate referral code if provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });

      if (!referrer) {
        return res.status(400).json({
          error: 'Invalid referral code',
          message: 'The referral code you entered is not valid'
        });
      }

      referrerId = referrer.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique referral code for new user
    let newReferralCode;
    let isUnique = false;
    while (!isUnique) {
      newReferralCode = generateReferralCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode: newReferralCode }
      });
      if (!existing) isUnique = true;
    }

    // Create user and wallet in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          fullName: fullName || null,
          email: email || null,
          phone: phone || null,
          password: hashedPassword,
          referralCode: newReferralCode,
          referredBy: referrerId,
          isEmailVerified: email ? true : false, // Auto-verify email if provided
          isPhoneVerified: phone ? false : true // Only verify phone if provided
        }
      });

      // Create wallet for user
      await tx.wallet.create({
        data: {
          userId: user.id
        }
      });

      return user;
    });

    // Generate JWT token
    const tokenPayload = { 
      userId: result.id 
    };
    
    // Only include email in token if it exists
    if (result.email) {
      tokenPayload.email = result.email;
    }
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: result.id,
        fullName: result.fullName,
        email: result.email,
        phone: result.phone,
        referralCode: result.referralCode,
        isEmailVerified: result.isEmailVerified,
        isPhoneVerified: result.isPhoneVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

// Login user
router.post('/login', [
  body('identifier').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: {
        wallet: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/phone or password is incorrect'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account suspended',
        message: 'Your account has been suspended'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/phone or password is incorrect'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Note: Auto-complete task functionality removed - only daily earning tasks are available

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isAdmin: user.isAdmin,
        wallet: user.wallet
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

// Email verification has been disabled - users are auto-verified upon registration

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        wallet: true,
        referrals: {
          select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true
          }
        }
      }
    });

    res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        wallet: user.wallet,
        referralCount: user.referrals.length,
        referrals: user.referrals
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: 'An error occurred while fetching profile'
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

// Change password
router.post('/change-password', authenticateToken, [
  body('currentPassword').isLength({ min: 6 }).withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        template: 'passwordChanged',
        data: {
          fullName: user.fullName || user.email || user.phone || 'User',
          email: user.email,
          changedAt: new Date().toLocaleString()
        }
      });
    } catch (emailError) {
      console.error('Failed to send password change email:', emailError);
      // Don't fail the password change if email fails
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

module.exports = router;
