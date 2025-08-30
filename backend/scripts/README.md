# Database Management Scripts

This directory contains scripts for managing the database during development and testing.

## 🚀 New Environment Setup

### Complete Setup Script (`setup-new-environment.js`)
**Command:** `npm run db:setup`

This is the **ONLY script you need** for setting up a new environment. It does everything automatically:

**What it does:**
1. **Complete Database Reset** - Drops all tables, sequences, and types
2. **Run Migrations** - Applies all Prisma migrations
3. **Generate Prisma Client** - Creates fresh Prisma client
4. **Seed VIP Levels** - Creates 10 VIP levels with bicycle information
5. **Seed Tasks** - Creates daily earning task
6. **Create Admin User** - Creates admin user (admin@trinitymetro.com / admin123)
7. **Create Company Wallet** - Sets up company wallet for transactions

**Use case:** Perfect for new environment setup, complete reset, or fresh installation.

## 📊 Available Commands

```bash
# Complete new environment setup (RECOMMENDED)
npm run db:setup

# Individual seeding commands (if needed)
npm run db:seed-vip      # Seed VIP levels only
npm run db:seed          # Seed tasks only
```

## 🎯 Quick Start for New Environment

For a completely fresh setup in a new environment:

```bash
# 1. Run the setup script
npm run db:setup

# 2. Start the application
npm run dev
```

This will give you:
- ✅ Complete database schema with all migrations
- ✅ 10 VIP levels with bicycle information
- ✅ Daily earning task system
- ✅ Admin user (admin@trinitymetro.com / admin123)
- ✅ Company wallet for transactions
- ✅ Ready-to-use application

## 📝 VIP Levels Created

The setup script automatically creates these VIP levels with bicycle information:

| Level | Investment | Daily Earnings | Bicycle Model | Features |
|-------|------------|----------------|---------------|----------|
| Starter | $30 | $2/day | City Cruiser Basic | Comfortable seat, basic gears |
| Bronze | $180 | $10/day | Mountain Explorer | Shock absorbers, 21-speed gears |
| Silver | $400 | $24/day | Road Racer Pro | Lightweight frame, racing gears |
| Gold | $1,000 | $50/day | Electric Commuter | Electric motor, GPS tracker |
| Platinum | $1,500 | $65/day | Hybrid Adventure | Electric assist, cargo rack |
| Diamond | $2,000 | $75/day | Carbon Fiber Elite | Carbon fiber frame, wireless shifting |
| Elite | $5,000 | $200/day | Smart E-Bike Premium | AI navigation, biometric sensors |
| Master | $6,000 | $250/day | Custom Performance | Handcrafted frame, custom paint |
| Legend | $12,000 | $500/day | Luxury Touring | Built-in entertainment, climate control |
| Supreme | $25,000 | $800/day | Ultimate Dream Bike | Exclusive design, lifetime warranty |

## ⚠️ Safety Features

The setup script includes:
- **Confirmation prompt** before execution
- **Clear warnings** about data loss
- **Error handling** for failed operations
- **Step-by-step progress** reporting
- **Graceful failure** handling

## 🔧 Manual Database Operations

### Clear Specific Tables (if needed)
```bash
# Connect to database
psql your_database_name

# Clear specific tables
DELETE FROM users;
DELETE FROM wallets;
DELETE FROM transactions;
-- etc.
```

### Reset Sequences (if needed)
```sql
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE wallets_id_seq RESTART WITH 1;
-- etc.
```

## 🔍 Troubleshooting

### Permission Issues
```bash
# Make sure you have proper database access
# Check your .env file has correct DATABASE_URL
```

### Migration Issues
```bash
# If setup fails, try manual migration
npx prisma migrate deploy
npx prisma generate
```

### Connection Issues
```bash
# Check if database is running
# Verify DATABASE_URL in .env
# Ensure database exists
```

## 🎉 Benefits of the New Setup

- **One Command Setup** - Everything in a single script
- **Complete Reset** - Fresh start every time
- **VIP Bicycles Included** - All VIP levels have bicycle information
- **Admin Ready** - Admin user created automatically
- **Company Wallet** - Transaction system ready
- **Error Handling** - Robust error handling and recovery
- **Progress Tracking** - Clear step-by-step progress

## 🚀 Production Deployment

For production deployment:

1. **Set up database** with proper credentials
2. **Update .env** with production settings
3. **Run setup script** once: `npm run db:setup`
4. **Start application**: `npm start`

The setup script is designed to be run once per environment and will create everything needed for the application to function properly.
