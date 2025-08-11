const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');
const depositRoutes = require('./routes/deposit');
const withdrawalRoutes = require('./routes/withdrawal');
const referralRoutes = require('./routes/referral');
const webhookRoutes = require('./routes/webhook');
const vipRoutes = require('./routes/vip');

// Import services
const { processWalletGrowth } = require('./services/walletService');
const { initializeAdminSettings } = require('./services/adminService');
const { processCompletedEarningSessions } = require('./services/vipService');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting (when behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Trinity Metro Bike API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/deposit', depositRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/referral', referralRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/vip', vipRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error:', error);
  
  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(400).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      message: 'The requested record was not found'
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please login again'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please login again'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      message: error.message
    });
  }

  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Scheduled tasks
// Run wallet growth calculation daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily wallet growth calculation...');
  try {
    await processWalletGrowth();
    console.log('Daily wallet growth calculation completed');
  } catch (error) {
    console.error('Error in daily wallet growth calculation:', error);
  }
});

// Process VIP earnings every hour
cron.schedule('0 * * * *', async () => {
  console.log('Processing completed VIP earning sessions...');
  try {
    await processCompletedEarningSessions();
    console.log('VIP earnings processing completed');
  } catch (error) {
    console.error('Error processing VIP earnings:', error);
  }
});

// Initialize server
async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize admin settings
    await initializeAdminSettings();
    console.log('✅ Admin settings initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Trinity Metro Bike API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
