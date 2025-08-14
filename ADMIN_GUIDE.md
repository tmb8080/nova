# 🛡️ Trinity Metro Admin Panel Guide

## 📋 Table of Contents
- [Admin Credentials](#admin-credentials)
- [Accessing the Admin Panel](#accessing-the-admin-panel)
- [Admin Features](#admin-features)
- [API Routes](#api-routes)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🔑 Admin Credentials

### Default Admin User
- **Email**: `admin@trinitymetrobike.com`
- **Password**: `admin123` (⚠️ **CHANGE THIS IMMEDIATELY AFTER FIRST LOGIN**)
- **Name**: System Administrator
- **Status**: Active

### Creating New Admin Users
To create additional admin users, use the script:
```bash
cd backend
node scripts/create-admin.js
```

## 🌐 Accessing the Admin Panel

### Web Interface
1. **URL**: `http://localhost:3000/admin`
2. **Login**: Use the admin credentials above
3. **Access**: Only users with `isAdmin: true` can access

### API Access
All admin endpoints require:
- Valid JWT token
- `isAdmin: true` user flag
- `Authorization: Bearer <token>` header

## 📊 Admin Features

### 1. Dashboard 📊
- **System Overview**: Total users, deposits, withdrawals, system balance
- **Real-time Statistics**: Live data from the database
- **Quick Actions**: Access to common admin tasks

### 2. Withdrawal Management 💰
- **View Pending Withdrawals**: List all withdrawal requests awaiting approval
- **Process Withdrawals**: Approve or reject withdrawal requests
- **Add Transaction Hash**: Include blockchain transaction hash for approved withdrawals
- **Admin Notes**: Add notes for approval/rejection reasons

### 3. User Management 👥
- **View All Users**: List all registered users with their details
- **User Status**: Activate/suspend user accounts
- **User Information**: View user balances, registration dates, etc.
- **Bulk Actions**: Manage multiple users at once

### 4. System Settings ⚙️
- **Minimum Deposit Amount**: Set minimum deposit requirements
- **Minimum Withdrawal Amount**: Set minimum withdrawal requirements
- **Feature Toggles**: Enable/disable deposits and withdrawals
- **System Configuration**: Manage platform settings

## 🔌 API Routes

### Authentication Required
All admin routes require admin privileges and valid JWT token.

### Dashboard & Statistics
```http
GET /api/admin/stats
```
**Response**: System statistics including total users, deposits, withdrawals, system balance

### Withdrawal Management
```http
GET /api/admin/withdrawals/pending
```
**Response**: List of all pending withdrawal requests

```http
PATCH /api/admin/withdrawals/:id/process
```
**Body**:
```json
{
  "action": "approve|reject",
  "adminNotes": "Optional notes",
  "transactionHash": "Optional for approval"
}
```

### User Management
```http
GET /api/admin/users?page=1&limit=20&search=email
```
**Response**: Paginated list of users with search functionality

```http
PATCH /api/admin/users/:id/toggle-status
```
**Response**: Toggle user active/inactive status

### System Settings
```http
GET /api/admin/settings
```
**Response**: Current system settings

```http
PATCH /api/admin/settings
```
**Body**:
```json
{
  "minDepositAmount": 30,
  "minWithdrawalAmount": 20,
  "isDepositEnabled": true,
  "isWithdrawalEnabled": true
}
```

## 🔒 Security

### Admin Authentication
- **JWT Token Required**: All admin requests must include valid JWT token
- **Admin Flag Check**: User must have `isAdmin: true` in database
- **Session Management**: Tokens expire and require re-authentication

### Access Control
- **Route Protection**: All admin routes are protected by middleware
- **User Validation**: Admin status is verified on every request
- **Audit Trail**: All admin actions are logged

### Best Practices
1. **Change Default Password**: Immediately change `admin123` after first login
2. **Use Strong Passwords**: Minimum 12 characters with mixed characters
3. **Regular Security Updates**: Keep the system updated
4. **Monitor Access**: Regularly check admin access logs
5. **Limit Admin Users**: Only create admin accounts for trusted personnel

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Access Denied" Error
**Problem**: User cannot access admin panel
**Solution**: 
- Verify user has `isAdmin: true` in database
- Check JWT token is valid and not expired
- Ensure user account is active

#### 2. Admin Routes Not Working
**Problem**: API calls to admin endpoints fail
**Solution**:
- Check authentication middleware is properly configured
- Verify admin flag is set correctly
- Ensure proper JWT token in Authorization header

#### 3. Cannot Create Admin User
**Problem**: Script fails to create admin user
**Solution**:
- Check database connection
- Verify Prisma schema is up to date
- Run `npx prisma migrate dev` if needed

### Database Queries

#### Check Admin Users
```sql
SELECT id, email, fullName, isAdmin, isActive, createdAt 
FROM users 
WHERE isAdmin = true;
```

#### Update User to Admin
```sql
UPDATE users 
SET isAdmin = true 
WHERE email = 'user@example.com';
```

#### Reset Admin Password
```sql
UPDATE users 
SET password = 'hashed_password_here' 
WHERE email = 'admin@trinitymetrobike.com';
```

## 📱 Mobile Responsiveness

The admin panel is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones
- ✅ All modern browsers

## 🚀 Quick Start

1. **Start the Application**:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm start
   
   # Terminal 2 - Frontend
   cd frontend && npm start
   ```

2. **Access Admin Panel**:
   - Go to `http://localhost:3000/admin`
   - Login with: `admin@trinitymetrobike.com` / `admin123`

3. **Change Password**:
   - Go to Profile settings
   - Update password immediately

4. **Start Managing**:
   - Review pending withdrawals
   - Monitor user activity
   - Configure system settings

## 📞 Support

For admin panel issues:
1. Check this guide first
2. Review server logs for errors
3. Verify database connectivity
4. Contact system administrator

---

**⚠️ Security Reminder**: Always change default credentials and keep admin access secure!
