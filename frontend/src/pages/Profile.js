import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { walletAPI, taskAPI } from '../services/api';
import UsdtDeposit from '../components/UsdtDeposit';
import UsdtWithdrawal from '../components/UsdtWithdrawal';
import DepositHistory from '../components/DepositHistory';
import WithdrawalHistory from '../components/WithdrawalHistory';
import WithdrawalHistoryPreview from '../components/WithdrawalHistoryPreview';
import ChangePassword from '../components/ChangePassword';
import CountdownTimer from '../components/ui/CountdownTimer';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showDepositHistory, setShowDepositHistory] = useState(false);
  const [showWithdrawalHistory, setShowWithdrawalHistory] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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

  // Fetch earning session status
  const { data: earningStatus } = useQuery({
    queryKey: ['earningStatus'],
    queryFn: taskAPI.getEarningStatus,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
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

  const getTransactionIcon = (type) => {
    const icons = {
      'DEPOSIT': '💰',
      'WITHDRAWAL': '💸',
      'VIP_EARNINGS': '🚴',
      'REFERRAL_BONUS': '👥',
      'VIP_PAYMENT': '👑',
      'TASK_REWARD': '🎯'
    };
    return icons[type] || '📊';
  };

  const getTransactionColor = (type) => {
    const colors = {
      'DEPOSIT': isDark ? 'text-coinbase-green bg-coinbase-green/20' : 'text-green-600 bg-green-100',
      'WITHDRAWAL': isDark ? 'text-coinbase-red bg-coinbase-red/20' : 'text-red-600 bg-red-100',
      'VIP_EARNINGS': isDark ? 'text-coinbase-blue bg-coinbase-blue/20' : 'text-blue-600 bg-blue-100',
      'REFERRAL_BONUS': isDark ? 'text-purple-400 bg-purple-400/20' : 'text-purple-600 bg-purple-100',
      'VIP_PAYMENT': isDark ? 'text-yellow-400 bg-yellow-400/20' : 'text-yellow-600 bg-yellow-100',
      'TASK_REWARD': isDark ? 'text-indigo-400 bg-indigo-400/20' : 'text-indigo-600 bg-indigo-100'
    };
    return colors[type] || (isDark ? 'text-coinbase-text-secondary bg-coinbase-dark-tertiary' : 'text-gray-600 bg-gray-100');
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-coinbase-dark' : 'bg-gray-50'} pb-20 md:pb-0`}>
      {/* Modern Header */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Token Rise</h1>
                <p className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-500'}`}>Profile Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-coinbase-green/10 rounded-full">
                <div className="w-2 h-2 bg-coinbase-green rounded-full animate-pulse"></div>
                <span className={`text-sm font-medium ${isDark ? 'text-coinbase-green' : 'text-green-600'}`}>Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pb-20 md:pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className={`inline-flex items-center px-4 py-2 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-full border mb-6 shadow-sm`}>
            <div className="w-2 h-2 bg-coinbase-blue rounded-full mr-2 animate-pulse"></div>
            <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm font-medium`}>Profile Dashboard</span>
          </div>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
            My Profile
          </h1>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-lg max-w-3xl mx-auto leading-relaxed`}>
            Manage your account, view earnings, and track your progress in one place
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar - User Info & Quick Actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Profile</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Account Details</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-2`}>Full Name</label>
                    <div className={`p-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-lg border`}>
                      {user?.fullName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-2`}>Email</label>
                    <div className={`p-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-lg border`}>
                      {user?.email || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-2`}>Referral Code</label>
                    <div className={`p-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-lg border font-mono`}>
                      {user?.referralCode || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-2`}>Member Since</label>
                    <div className={`p-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary' : 'bg-gray-50 border-gray-200 text-gray-900'} rounded-lg border`}>
                      {formatDate(user?.createdAt || new Date())}
                    </div>
                  </div>
                  
                  {/* Change Password Button */}
                  <div className="pt-4">
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      🔐 Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Quick Actions</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Common Tasks</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
              <button
                  onClick={() => setShowDepositModal(true)}
                  className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  💰 Make Deposit
              </button>
                
              <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    isDark
                      ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💸 Request Withdrawal
                </button>
                
                <button
                  onClick={() => setShowDepositHistory(true)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    isDark
                      ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Deposit History
                </button>
                
                <button
                  onClick={() => setShowWithdrawalHistory(true)}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    isDark
                      ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💸 Withdrawal History
                </button>
                
                {user?.isAdmin && (
                  <button
                    onClick={() => window.location.href = '/admin'}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🔐 Admin Panel
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                    isDark
                      ? 'bg-coinbase-red hover:bg-coinbase-red/80 text-white'
                      : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  🚪 Logout
              </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Account Balance */}
              <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-coinbase-green to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Balance</div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      {walletLoading ? (
                        <div className={`animate-pulse ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} h-8 w-24 rounded`}></div>
                      ) : (
                        formatCurrency(walletStats?.data?.data?.balance || 0)
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>Available Funds</div>
            </div>
          </div>

          {/* Total Deposits */}
              <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-coinbase-blue to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="text-right">
                    <div className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Deposits</div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    {walletLoading ? (
                        <div className={`animate-pulse ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} h-8 w-24 rounded`}></div>
                    ) : (
                      formatCurrency(walletStats?.data?.data?.totalDeposits || 0)
                    )}
                  </div>
                </div>
              </div>
                <div className="text-center">
                  <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>Total Invested</div>
            </div>
          </div>

          {/* VIP Task Earnings */}
              <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-coinbase-blue to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🚴</span>
                </div>
                <div className="text-right">
                    <div className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Earnings</div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    {walletLoading ? (
                        <div className={`animate-pulse ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} h-8 w-24 rounded`}></div>
                    ) : (
                      formatCurrency(walletStats?.data?.data?.totalEarnings || 0)
                    )}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>From Tasks</div>
                </div>
              </div>
              
              {/* Referral Bonus */}
              <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-coinbase-green to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Referrals</div>
                    <div className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      {walletLoading ? (
                        <div className={`animate-pulse ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} h-8 w-24 rounded`}></div>
                      ) : (
                        formatCurrency(walletStats?.data?.data?.totalReferralBonus || 0)
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>Commission</div>
                </div>
              </div>
            </div>

            {/* Task Status & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Task Status Card */}
              <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
                <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚴</span>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Task Status</h3>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Daily earning progress</p>
                  </div>
                  </div>
                </div>
                <div className="p-6">
                  {earningStatus?.data?.data?.hasActiveSession ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${isDark ? 'text-coinbase-green' : 'text-green-600'} mb-2`}>
                          {earningStatus.data.data.remainingTime.minutes}m {earningStatus.data.data.remainingTime.seconds}s
                        </div>
                        <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Remaining</div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} font-medium`}>Progress</span>
                          <span className="font-bold text-coinbase-green">{earningStatus.data.data.progress.toFixed(1)}%</span>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded-full h-3`}>
                          <div 
                            className="bg-gradient-to-r from-coinbase-green to-green-500 h-3 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
                            style={{ width: `${earningStatus.data.data.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-xl p-4`}>
                  <div className="text-center">
                          <div className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-1`}>
                            {formatCurrency(earningStatus.data.data.totalEarnings || earningStatus.data.data.dailyEarningRate)}
                          </div>
                          <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Total Earnings</div>
                        </div>
                      </div>

                      <button
                        onClick={() => window.location.href = '/tasks'}
                        className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        🔄 View Progress
                      </button>
                    </div>
                  ) : earningStatus?.data?.data?.cooldownRemaining ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>Task Completed! 🎉</div>
                        <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm mb-4`}>
                          Great job! Your next task will be available in:
                        </div>
                      </div>
                      
                    <CountdownTimer
                      targetTime={new Date(Date.now() + earningStatus.data.data.cooldownRemaining.hours * 60 * 60 * 1000)}
                        size="large"
                      className="text-center"
                      onComplete={() => {
                        queryClient.invalidateQueries(['earningStatus']);
                        toast.success('🎉 Ready to start your next daily task!');
                      }}
                    />
                      
                      <div className={`${isDark ? 'bg-coinbase-green/10 border-coinbase-green/20' : 'bg-green-50 border-green-200'} border rounded-xl p-4`}>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${isDark ? 'text-coinbase-green' : 'text-green-600'} mb-1`}>
                            +{formatCurrency(earningStatus.data.data.lastEarnings || 0)}
                    </div>
                          <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Last Earnings</div>
                  </div>
                </div>

              <button
                  onClick={() => window.location.href = '/tasks'}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        ⏰ View Countdown
              </button>
            </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className={`w-16 h-16 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-100 border-gray-200'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border`}>
                        <svg className={`w-8 h-8 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>Ready to Start</h4>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>
                        Complete your daily task to start earning rewards
                      </p>
              <button
                        onClick={() => window.location.href = '/tasks'}
                        className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                        🎯 Start Task
              </button>
            </div>
                    )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
                <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
        </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Recent Activity</h3>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Latest transactions</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {transactionsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className={`h-16 ${isDark ? 'bg-coinbase-dark-tertiary' : 'bg-gray-100'} rounded-xl`}></div>
                        </div>
                      ))}
                    </div>
                  ) : transactions?.data?.transactions?.length > 0 ? (
                    <div className="space-y-3">
                      {transactions.data.transactions.slice(0, 5).map((transaction) => (
                        <div key={transaction.id} className={`flex items-center justify-between p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-100'} transition-all duration-200`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getTransactionColor(transaction.type)}`}>
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className={`font-medium ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{transaction.description}</div>
                              <div className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>{formatDate(transaction.createdAt)}</div>
                          </div>
                          </div>
                          <div className={`font-semibold text-lg ${
                            transaction.type === 'DEPOSIT' || transaction.type === 'VIP_EARNINGS' || transaction.type === 'REFERRAL_BONUS' 
                              ? (isDark ? 'text-coinbase-green' : 'text-green-600')
                              : (isDark ? 'text-coinbase-red' : 'text-red-600')
                          }`}>
                            {transaction.type === 'DEPOSIT' || transaction.type === 'VIP_EARNINGS' || transaction.type === 'REFERRAL_BONUS' ? '+' : ''}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className={`w-16 h-16 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-100 border-gray-200'} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border`}>
                        <svg className={`w-8 h-8 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
              </div>
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>No Activity Yet</h4>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>
                        Start by making your first deposit to see transaction history
                      </p>
                  <button
                        onClick={() => setShowDepositModal(true)}
                        className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        💰 Make First Deposit
                  </button>
                    </div>
                  )}
              </div>
            </div>
          </div>

            {/* Withdrawal Preview */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                  </div>
                  <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Withdrawal Status</h3>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Recent withdrawal requests</p>
                    </div>
                  </div>
                <button
                    onClick={() => setShowWithdrawalHistory(true)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all duration-200 text-sm ${
                      isDark
                        ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💸 View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                <WithdrawalHistoryPreview />
              </div>
            </div>
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

      {showWithdrawalHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border shadow-2xl`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Withdrawal History</h3>
                <button
                  onClick={() => setShowWithdrawalHistory(false)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDark
                      ? 'text-coinbase-text-secondary hover:bg-coinbase-dark-tertiary hover:text-coinbase-text-primary'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="max-h-[70vh] overflow-y-auto">
                <WithdrawalHistory />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default Profile;
