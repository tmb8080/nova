import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI, referralAPI, vipAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import VipDashboard from '../components/VipDashboard';
import UsdtDeposit from '../components/UsdtDeposit';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('home');
  const [timeRange, setTimeRange] = useState('30d');
  const [showUsdtDeposit, setShowUsdtDeposit] = useState(false);
  const [vipToJoin, setVipToJoin] = useState(null);

  // Fetch wallet stats
  const { data: walletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => walletAPI.getStats(),
  });

  // Fetch referral stats
  const { data: referralStats, isLoading: referralLoading } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => referralAPI.getStats(),
  });

  // Fetch recent transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => walletAPI.getTransactions({ limit: 5, page: 1 }),
  });

  // Fetch projected earnings data for chart
  const { data: projectedEarnings } = useQuery({
    queryKey: ['projectedEarnings', timeRange],
    queryFn: () => walletAPI.getProjectedEarnings({ timeRange }),
    enabled: !!timeRange
  });

  // Fetch VIP levels
  const { data: vipLevels, isLoading: vipLoading, error: vipError } = useQuery({
    queryKey: ['vipLevels'],
    queryFn: () => vipAPI.getLevels(),
    onSuccess: (data) => {
      console.log('VIP Levels loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading VIP levels:', error);
    }
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVipLevelColor = (index) => {
    const colors = [
      'bg-gray-500',      // Starter
      'bg-amber-600',     // Bronze
      'bg-gray-400',      // Silver
      'bg-yellow-500',    // Gold
      'bg-gray-700',      // Platinum
      'bg-blue-500',      // Diamond
      'bg-purple-600',    // Elite
      'bg-red-600',       // Master
      'bg-indigo-700',    // Legend
      'bg-black'          // Supreme
    ];
    return colors[index] || 'bg-emerald-500';
  };

  const getVipLevelGradient = (index) => {
    const gradients = [
      'from-gray-400 to-gray-600',      // Starter
      'from-amber-500 to-orange-600',   // Bronze
      'from-gray-300 to-gray-500',      // Silver
      'from-yellow-400 to-orange-500',  // Gold
      'from-gray-600 to-gray-800',      // Platinum
      'from-blue-400 to-blue-600',      // Diamond
      'from-purple-500 to-pink-600',    // Elite
      'from-red-500 to-pink-600',       // Master
      'from-indigo-600 to-purple-700',  // Legend
      'from-gray-800 to-black'          // Supreme
    ];
    return gradients[index] || 'from-emerald-400 to-teal-600';
  };

  const getVipLevelIcon = (index) => {
    const icons = [
      '🚀',  // Starter
      '🥉',  // Bronze
      '🥈',  // Silver
      '🥇',  // Gold
      '💎',  // Platinum
      '💎',  // Diamond
      '👑',  // Elite
      '🏆',  // Master
      '⭐',  // Legend
      '👑'   // Supreme
    ];
    return icons[index] || '💎';
  };

  const handleJoinVip = async (vipLevelId, vipLevel) => {
    try {
      // Check if user has sufficient balance
      const userBalance = parseFloat(walletStats?.data?.balance) || 0;
      const levelAmount = parseFloat(vipLevel?.amount) || 0;
      
      if (userBalance < levelAmount) {
        // Show USDT deposit modal instead of error
        setVipToJoin(vipLevel);
        setShowUsdtDeposit(true);
        return;
      }

      const response = await vipAPI.joinVip(vipLevelId);
      if (response.data.success) {
        // Refresh data after successful VIP join
        window.location.reload();
      } else {
        alert(response.data.message || 'Failed to join VIP level');
      }
    } catch (error) {
      console.error('Error joining VIP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join VIP level. Please try again.';
      alert(errorMessage);
    }
  };

  const handleRefreshVipLevels = async () => {
    try {
      // Invalidate and refetch VIP levels
      await queryClient.invalidateQueries(['vipLevels']);
      await queryClient.invalidateQueries(['userVipStatus']);
      console.log('VIP data refreshed');
    } catch (error) {
      console.error('Error refreshing VIP data:', error);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'WITHDRAWAL':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'GROWTH':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'REFERRAL_BONUS':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-white text-lg font-semibold">Language selection</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-13z" />
              </svg>
            </div>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Balance Display Section */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h2>
              <p className="text-emerald-100">Your current balance and VIP status</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-100 mb-1">Available Balance</div>
              <div className="text-3xl font-bold">
                {walletLoading ? (
                  <div className="animate-pulse bg-emerald-400 h-8 w-32 rounded"></div>
                ) : (
                  formatCurrency(walletStats?.data?.balance || 0)
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-sm text-emerald-100 mb-1">VIP Status</div>
              <div className="text-lg font-bold">
                {userVipStatus?.data?.vipLevel ? userVipStatus.data.vipLevel.name : 'V0 - No VIP'}
              </div>
                </div>
            <div className="bg-white/10 rounded-lg p-4">
              <div className="text-sm text-emerald-100 mb-1">Daily Earnings</div>
              <div className="text-lg font-bold">
                {formatCurrency(userVipStatus?.data?.vipLevel?.dailyEarning || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Video Section */}
        <div className="bg-black rounded-lg overflow-hidden relative">
          <div className="aspect-video flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 text-white font-mono text-lg">01:25</div>
        </div>

        {/* News Section */}
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3">
            <h2 className="text-white text-lg font-semibold flex items-center">
              📰 NEWS
            </h2>
          </div>
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 bg-emerald-500 rounded"></div>
              </div>
              <div className="flex-1">
                <p className="text-gray-800 text-sm">Latest updates and announcements</p>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Levels Section - Improved Design */}
        <div className="bg-white rounded-lg overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h2 className="text-white text-xl font-bold flex items-center">
              <span className="text-2xl mr-3">💎</span>
              VIP INVESTMENT LEVELS
            </h2>
            <p className="text-purple-100 text-sm mt-1">Choose your investment level to start earning daily income</p>
          </div>
          
          {/* Current VIP Status Banner */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                  {userVipStatus?.data?.userVip ? userVipStatus.data.userVip.vipLevel.name.charAt(0) : 'V'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    Current VIP Status
                  </h3>
                  <p className="text-gray-600">
                    {userVipStatus?.data?.userVip ? userVipStatus.data.userVip.vipLevel.name : 'V0 - No VIP Joined'}
                  </p>
                  {userVipStatus?.data?.userVip && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      Member since {formatDate(userVipStatus.data.userVip.createdAt)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Daily Earnings</div>
                <div className="font-bold text-2xl text-emerald-600">
                  {formatCurrency(userVipStatus?.data?.userVip?.vipLevel?.dailyEarning || 0)}
                </div>
                {userVipStatus?.data?.userVip && (
                  <div className="text-xs text-gray-500 mt-1">
                    Total earned: {formatCurrency(userVipStatus.data.userVip.totalPaid || 0)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress to Next Level */}
            {userVipStatus?.data?.userVip && vipLevels?.data?.data && (
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress to next level:</span>
                  <span className="text-emerald-600 font-medium">
                    {(() => {
                      const currentIndex = vipLevels.data.data.findIndex(level => level.id === userVipStatus.data.userVip.vipLevel.id);
                      const nextLevel = vipLevels.data.data[currentIndex + 1];
                      if (nextLevel) {
                        const currentBalance = walletStats?.data?.balance || 0;
                        const needed = nextLevel.amount - currentBalance;
                        if (needed > 0) {
                          return `Need ${formatCurrency(needed)} more for ${nextLevel.name}`;
                        } else {
                          return `Ready for ${nextLevel.name}!`;
                        }
                      }
                      return 'Maximum level reached!';
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Error Display */}
            {(vipError || vipStatusError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="text-red-800 font-semibold mb-2">Error Loading VIP Data:</div>
                {vipError && (
                  <div className="text-red-600 text-sm mb-2">
                    VIP Levels Error: {vipError.message}
                  </div>
                )}
                {vipStatusError && (
                  <div className="text-red-600 text-sm">
                    VIP Status Error: {vipStatusError.message}
                  </div>
                )}
              </div>
            )}
            
            {vipLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
                <p className="text-gray-500 mt-4 text-lg">Loading VIP levels...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Temporary Debug Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-blue-800 font-semibold mb-2">Debug Information:</div>
                  <div className="text-blue-600 text-sm space-y-1">
                    <div>VIP Levels Loading: {vipLoading ? 'Yes' : 'No'}</div>
                    <div>VIP Levels Count: {vipLevels?.data?.data?.length || 0}</div>
                    <div>VIP Levels Data: {vipLevels?.data?.data ? 'Available' : 'Not Available'}</div>
                    <div>VIP Levels Type: {typeof vipLevels?.data?.data}</div>
                    <div>User VIP Status: {userVipStatus?.data?.userVip ? 'Has VIP' : 'No VIP'}</div>
                    <div>Wallet Balance: {walletStats?.data?.balance || 0}</div>
                    <div>VIP Levels Raw: {vipLevels?.data?.data ? (Array.isArray(vipLevels.data.data) ? 'Array with ' + vipLevels.data.data.length + ' items' : 'Not an array: ' + typeof vipLevels.data.data) : 'No data'}</div>
                  </div>
                  <button 
                    onClick={handleRefreshVipLevels}
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    Refresh VIP Data
                  </button>
                </div>
                
                {vipLevels?.data?.data && Array.isArray(vipLevels.data.data) ? vipLevels.data.data.map((level, index) => {
                  // Convert string amounts to numbers
                  const levelAmount = parseFloat(level.amount) || 0;
                  const levelDailyEarning = parseFloat(level.dailyEarning) || 0;
                  const userBalance = parseFloat(walletStats?.data?.balance) || 0;
                  
                  const isCurrentLevel = userVipStatus?.data?.userVip?.vipLevel?.id === level.id;
                  const canAfford = userBalance >= levelAmount;
                  const dailyReturn = levelAmount > 0 ? ((levelDailyEarning / levelAmount) * 100).toFixed(2) : '0';
                  
                  return (
                    <div 
                      key={level.id} 
                      className={`relative bg-white rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                        isCurrentLevel 
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg ring-2 ring-emerald-200' 
                          : canAfford
                            ? 'border-gray-200 hover:border-purple-300 hover:shadow-xl cursor-pointer transform hover:-translate-y-1'
                            : 'border-gray-200 bg-gray-50 opacity-75'
                      }`}
                      onClick={() => !isCurrentLevel && handleJoinVip(level.id, level)}
                    >
                      {/* Current Level Badge */}
                      {isCurrentLevel && (
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg z-10">
                          ✓ ACTIVE
                        </div>
                      )}
                      
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-6">
                        {/* Left Side - Badge and Level Info */}
                        <div className="flex items-center space-x-4">
                          {/* VIP Badge */}
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getVipLevelGradient(index)} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                            {getVipLevelIcon(index)}
                          </div>
                          
                          {/* Level Information */}
                          <div>
                            <div className="text-3xl font-bold text-gray-800">V{index + 1}</div>
                            <div className="text-red-600 font-semibold text-lg">{level.name} partner</div>
                          </div>
                      </div>
                      
                        {/* Right Side - Join Button */}
                        <div className="flex items-center space-x-3">
                          {/* Futuristic Device Icon */}
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </div>
                          
                          {/* Join Button */}
                      {!isCurrentLevel && (
                        <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinVip(level.id, level);
                              }}
                          disabled={!canAfford}
                              className={`px-6 py-3 rounded-lg font-bold transition-all duration-300 text-lg ${
                            canAfford 
                                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                              {canAfford ? 'Join Now' : 'Join and deposit money'}
                        </button>
                      )}
                      
                      {isCurrentLevel && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg">
                              ✓ Active
              </div>
            )}
          </div>
        </div>

                      {/* Card Content - Stats Grid */}
                      <div className="grid grid-cols-3 gap-6">
                        <div className="text-center bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-2">Daily Tasks</div>
                          <div className="text-2xl font-bold text-gray-800">1</div>
                        </div>
                        <div className="text-center bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-2">Daily Order</div>
                          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(levelDailyEarning)}</div>
                          <div className="text-xs text-gray-500 mt-1">{dailyReturn}% return</div>
              </div>
                        <div className="text-center bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600 mb-2">Investment</div>
                          <div className="text-2xl font-bold text-gray-800">{formatCurrency(levelAmount)}</div>
              </div>
            </div>
                      
                      {/* Balance Info for Unaffordable Levels */}
                      {!isCurrentLevel && !canAfford && (
                        <div className="mt-6 pt-4 border-t border-gray-200 bg-red-50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm text-gray-600">Your Current Balance</div>
                              <div className="text-lg font-bold text-red-600">
                                {formatCurrency(userBalance)}
                              </div>
              </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Amount Needed</div>
                              <div className="text-lg font-bold text-gray-800">
                                {formatCurrency(levelAmount - userBalance)}
                              </div>
              </div>
            </div>
          </div>
        )}
              </div>
                  );
                }) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💎</div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No VIP Levels Available</h3>
                    <p className="text-gray-600">VIP levels are currently being configured.</p>
            </div>
                )}
              </div>
            )}
          </div>
        </div>



        {/* Management Log */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="text-gray-800 font-medium mb-3">Management log</h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600">***5918</div>
                <div className="text-xs text-gray-500">Returned</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Time of use</div>
                <div className="text-xs text-gray-500">2.81 Hour</div>
                <div className="text-xs text-gray-500 mt-1">Current power</div>
                <div className="text-xs text-gray-500">58%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Portfolio Growth</CardTitle>
                <div className="flex space-x-2">
                  {['7d', '30d', '90d'].map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        timeRange === range
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {projectedEarnings?.data?.chartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectedEarnings.data.chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value) => [formatCurrency(value), 'Balance']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Loading chart data...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your crypto portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to="/deposit">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Make Deposit
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/withdraw">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  Request Withdrawal
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full">
                <Link to="/referral">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  Share Referral
                </Link>
              </Button>
              
              <Button asChild variant="ghost" className="w-full">
                <Link to="/profile">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* VIP Dashboard Section */}
        <div className="mb-8">
          <VipDashboard />
        </div>

        {/* Recent Transactions */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/transactions">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : transactions?.data?.transactions?.length > 0 ? (
              <div className="space-y-4">
                {transactions.data.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-4">
                    {getTransactionIcon(transaction.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500">No transactions yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Make your first deposit to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* USDT Deposit Modal */}
        {showUsdtDeposit && (
          <UsdtDeposit
            onClose={() => {
              setShowUsdtDeposit(false);
              setVipToJoin(null);
            }}
            vipLevel={vipToJoin}
          />
        )}
      </div>
  );
};

export default Dashboard;
