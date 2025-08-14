import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI, vipAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import UsdtDeposit from '../components/UsdtDeposit';
import UsdtWithdrawal from '../components/UsdtWithdrawal';
import DepositHistory from '../components/DepositHistory';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositHistory, setShowDepositHistory] = useState(false);

  // Fetch user wallet stats
  const { data: walletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => {
      console.log('Profile: Executing wallet stats query...');
      return walletAPI.getStats();
    },
    onSuccess: (data) => {
      console.log('Profile: Wallet stats loaded:', data);
      console.log('Profile: Balance from wallet stats:', data?.data?.data?.balance);
    },
    onError: (error) => {
      console.error('Profile: Error loading wallet stats:', error);
    },
  });

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', { limit: 10 }],
    queryFn: () => walletAPI.getTransactions({ limit: 10, page: 1 }),
  });

  // Fetch user VIP status
  const { data: userVipStatus, error: vipStatusError } = useQuery({
    queryKey: ['userVipStatus'],
    queryFn: () => vipAPI.getStatus(),
    onSuccess: (data) => {
      console.log('VIP Status loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading VIP status:', error);
    }
  });

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20 md:pb-0">
      {/* Modern Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Trinity Metro</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Modern Profile Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">Profile Dashboard</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-gray-300 text-base max-w-2xl mx-auto">
            Manage your account information and preferences
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Account Balance */}
          <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-300">Account Balance</div>
                <div className="text-2xl font-bold text-white">
                  {walletLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-24 rounded"></div>
                  ) : (
                    formatCurrency(walletStats?.data?.data?.balance || 0)
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowDepositModal(true)}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm py-2"
              >
                Deposit
              </Button>
              <Button
                onClick={() => setShowWithdrawalModal(true)}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-sm py-2"
              >
                Withdraw (USDT/USDC)
              </Button>
            </div>
            <div className="mt-2">
              <Button
                onClick={() => setShowDepositHistory(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm py-2"
              >
                View Deposit History
              </Button>
            </div>
            
            {/* Admin Access Button */}
            {user?.isAdmin && (
              <div className="mt-2">
                <Button
                  onClick={() => window.location.href = '/admin'}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm py-2"
                >
                  🔐 Admin Panel
                </Button>
              </div>
            )}
          </div>

          {/* Total Deposits */}
          <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-300">Total Deposits</div>
                <div className="text-2xl font-bold text-white">
                  {walletLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-24 rounded"></div>
                  ) : (
                    formatCurrency(walletStats?.data?.data?.totalDeposits || 0)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Total Earnings */}
          <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-300">Total Earnings</div>
                <div className="text-2xl font-bold text-white">
                  {walletLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-24 rounded"></div>
                  ) : (
                    formatCurrency(walletStats?.data?.data?.totalEarnings || 0)
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Referral Bonus */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">Referral Bonus</div>
                <div className="text-2xl font-bold text-gray-900">
                  {walletLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                  ) : (
                    formatCurrency(walletStats?.data?.data?.totalReferralBonus || 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deposit Section */}
          

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Overview of your account activity and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {walletLoading ? '...' : formatCurrency(walletStats?.data?.data?.balance || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {transactionsLoading ? '...' : transactions?.data?.transactions?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatDate(user?.createdAt || new Date())}
                    </div>
                    <div className="text-sm text-gray-600">Member Since</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Your latest account activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : transactions?.data?.transactions?.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.data.transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'DEPOSIT' ? 'bg-green-100' :
                            transaction.type === 'WITHDRAWAL' ? 'bg-red-100' :
                            transaction.type === 'VIP_EARNINGS' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <svg className={`w-5 h-5 ${
                              transaction.type === 'DEPOSIT' ? 'text-green-600' :
                              transaction.type === 'WITHDRAWAL' ? 'text-red-600' :
                              transaction.type === 'VIP_EARNINGS' ? 'text-blue-600' :
                              'text-gray-600'
                            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{transaction.description}</div>
                            <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                          </div>
                        </div>
                        <div className={`font-semibold ${
                          transaction.type === 'DEPOSIT' ? 'text-green-600' :
                          transaction.type === 'WITHDRAWAL' ? 'text-red-600' :
                          'text-gray-900'
                        }`}>
                          {transaction.type === 'DEPOSIT' ? '+' : ''}{formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Transactions Yet</h3>
                    <p className="text-gray-600">Your transaction history will appear here once you start using the platform.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Profile */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.fullName || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.email || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {user?.phone || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referral Code</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900 font-mono">
                    {user?.referralCode || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-900">
                    {formatDate(user?.createdAt || new Date())}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* VIP Status */}
            {userVipStatus?.data?.data?.userVip && (
              <Card>
                <CardHeader>
                  <CardTitle>VIP Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl mb-2">👑</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {userVipStatus.data.data.userVip.vipLevel?.name}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      Daily Earnings: {formatCurrency(userVipStatus.data.data.userVip.vipLevel?.dailyEarning || 0)}
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-800">
                        <div className="font-medium">Today's Earnings</div>
                        <div className="text-lg font-bold">
                          {formatCurrency(userVipStatus.data.data.todayEarnings || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logout */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  onClick={handleLogout}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <UsdtDeposit
          onClose={() => setShowDepositModal(false)}
        />
      )}

      {showWithdrawalModal && (
        <UsdtWithdrawal
          onClose={() => setShowWithdrawalModal(false)}
        />
      )}

      {showDepositHistory && (
        <DepositHistory
          onClose={() => setShowDepositHistory(false)}
        />
      )}
    </div>
  );
};

export default Profile;
