import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI, referralAPI, vipAPI, taskAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import VipDashboard from '../components/VipDashboard';
import UsdtDeposit from '../components/UsdtDeposit';
import MemberList from '../components/MemberList';
import { toast } from 'react-hot-toast';
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
  const [previousBalance, setPreviousBalance] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch wallet stats
  const { data: walletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => walletAPI.getStats(),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchIntervalInBackground: true,
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
    refetchInterval: 15000, // Auto-refresh every 15 seconds
    refetchIntervalInBackground: true,
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
  });

  // Fetch user VIP status
  const { data: userVipStatus, error: vipStatusError } = useQuery({
    queryKey: ['userVipStatus'],
    queryFn: () => vipAPI.getStatus(),
  });

  // Fetch earning session status
  const { data: earningStatus, isLoading: earningStatusLoading } = useQuery({
    queryKey: ['earningStatus'],
    queryFn: taskAPI.getEarningStatus,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Monitor balance changes
  useEffect(() => {
    if (walletStats?.data?.data?.balance && previousBalance !== null && walletStats.data.data.balance !== previousBalance) {
      const newBalance = parseFloat(walletStats.data.data.balance);
      const oldBalance = parseFloat(previousBalance);
      const difference = newBalance - oldBalance;
      
      if (difference > 0) {
        toast.success(`Balance updated! +${formatCurrency(difference)}`);
      } else if (difference < 0) {
        toast.info(`Balance updated! ${formatCurrency(difference)}`);
      }
    }
    
    if (walletStats?.data?.data?.balance) {
      setPreviousBalance(walletStats.data.data.balance);
    }
  }, [walletStats?.data?.data?.balance, previousBalance]);

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
      const userBalance = parseFloat(walletStats?.data?.data?.balance) || 0;
      const levelAmount = parseFloat(vipLevel?.amount) || 0;
      
              if (userBalance < levelAmount) {
          // Show deposit prompt for insufficient balance
          const shouldDeposit = window.confirm(
            `You need ${formatCurrency(levelAmount - userBalance)} more to join ${vipLevel.name}.\n\nWould you like to deposit funds to your wallet?`
          );
          
          if (shouldDeposit) {
            setVipToJoin(vipLevel);
            setShowUsdtDeposit(true);
          }
          return;
        }

        const response = await vipAPI.joinVip(vipLevelId);
      
              if (response.data.success) {
          toast.success('Successfully joined VIP level!');
          // Refresh data after successful VIP join
          queryClient.invalidateQueries(['walletStats']);
          queryClient.invalidateQueries(['userVipStatus']);
          queryClient.invalidateQueries(['vipLevels']);
        } else {
          toast.error(response.data.message || 'Failed to join VIP level');
        }
    } catch (error) {
      console.error('Error joining VIP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to join VIP level. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleRefreshVipLevels = async () => {
    try {
      // Invalidate and refetch VIP levels
      await queryClient.invalidateQueries(['vipLevels']);
      await queryClient.invalidateQueries(['userVipStatus']);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Dashboard Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">Investment Dashboard</span>
          </div>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Investment Dashboard
            </h1>
            <button
              onClick={async () => {
                setIsRefreshing(true);
                await Promise.all([
                  queryClient.invalidateQueries(['walletStats']),
                  queryClient.invalidateQueries(['transactions']),
                  queryClient.invalidateQueries(['userVipStatus'])
                ]);
                toast.success('Balance and transactions refreshed!');
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <p className="text-gray-300 text-base max-w-2xl mx-auto">
            Monitor your portfolio performance and investment opportunities
          </p>
        </div>



        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Video Section */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm p-4">
                <h3 className="text-white font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Platform Introduction
                </h3>
              </div>
              <div className="aspect-video bg-gradient-to-br from-slate-800/50 to-purple-900/50 flex items-center justify-center relative">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30">
                  <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-mono border border-white/20">
                  01:25
                </div>
              </div>
            </div>
          </div>

          {/* News Section */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-2xl border border-white/20">
              <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-sm px-6 py-4">
                <h3 className="text-white font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  Latest News
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-blue-400/30">
                      <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">New VIP Levels Available</h4>
                      <p className="text-sm text-gray-300">We've added exciting new investment tiers with higher returns</p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 border border-green-400/30">
                      <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">System Maintenance Complete</h4>
                      <p className="text-sm text-gray-300">All systems are now running smoothly with improved performance</p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Member List Section */}
        <div className="mb-8">
          <MemberList />
        </div>

        {/* VIP Levels Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-white/20 mb-8">
          <div className="bg-gradient-to-r from-purple-600/80 via-blue-600/80 to-indigo-700/80 backdrop-blur-sm px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center mb-2">
                  <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  VIP Investment Levels
                </h2>
                <p className="text-purple-100">Choose your investment level to start earning daily income</p>
              </div>
              <div className="hidden lg:block">
                <div className="text-right text-white">
                  <div className="text-sm opacity-90">Current Members</div>
                  <div className="text-2xl font-bold">1,247</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Current VIP Status Banner */}
          <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 backdrop-blur-sm border-b border-emerald-400/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                  {userVipStatus?.data?.data?.userVip ? userVipStatus.data.data.userVip.vipLevel.name.charAt(0) : 'V'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    Current VIP Status
                  </h3>
                  <p className="text-gray-300">
                    {userVipStatus?.data?.data?.userVip ? userVipStatus.data.data.userVip.vipLevel.name : 'V0 - No VIP Joined'}
                  </p>
                                      {userVipStatus?.data?.data?.userVip && (
                      <p className="text-xs text-emerald-400 font-medium mt-1">
                        Member since {formatDate(userVipStatus.data.data.userVip.createdAt)}
                      </p>
                    )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">Daily Earnings</div>
                <div className="font-bold text-2xl text-emerald-400">
                  {formatCurrency(userVipStatus?.data?.data?.userVip?.vipLevel?.dailyEarning || 0)}
                </div>
                                  {userVipStatus?.data?.data?.userVip && (
                    <div className="text-xs text-gray-400">
                      Total: {formatCurrency(userVipStatus.data.data.userVip.totalPaid || 0)}
                    </div>
                  )}
              </div>
            </div>
            
            {/* Progress to Next Level */}
            {userVipStatus?.data?.data?.userVip && vipLevels?.data?.data && (
              <div className="mt-4 pt-4 border-t border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress to next level:</span>
                  <span className="text-emerald-600 font-medium">
                    {(() => {
                      const currentIndex = vipLevels.data.data.findIndex(level => level.id === userVipStatus.data.data.userVip.vipLevel.id);
                      const nextLevel = vipLevels.data.data[currentIndex + 1];
                      if (nextLevel) {
                        const currentBalance = walletStats?.data?.data?.balance || 0;
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

          <div className="p-8">
           
            
            {vipLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-lg">Loading VIP levels...</p>
              </div>
            ) : vipError ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">❌</div>
                <h3 className="text-lg font-semibold text-white mb-2">Error Loading VIP Levels</h3>
                <p className="text-gray-300 mb-4">{vipError.message || 'Failed to load VIP levels'}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : !vipLevels?.data?.data || !Array.isArray(vipLevels.data.data) || vipLevels.data.data.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-white mb-2">No VIP Levels Available</h3>
                <p className="text-gray-300 mb-4">VIP levels data is empty or not available</p>
                <div className="text-sm text-gray-400">
                  Debug info: vipLevels = {JSON.stringify(vipLevels, null, 2)}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {vipLevels.data.data.slice(0, 6).map((level, index) => {
                  // Convert string amounts to numbers
                  const levelAmount = parseFloat(level.amount) || 0;
                  const levelDailyEarning = parseFloat(level.dailyEarning) || 0;
                  const userBalance = parseFloat(walletStats?.data?.data?.balance) || 0;
                  
                  const isCurrentLevel = userVipStatus?.data?.data?.userVip?.vipLevel?.id === level.id;
                  const canAfford = userBalance >= levelAmount;
                  const dailyReturn = levelAmount > 0 ? ((levelDailyEarning / levelAmount) * 100).toFixed(2) : '0';
                  
                  return (
                    <div 
                      key={level.id} 
                      className={`relative backdrop-blur-xl bg-white/10 rounded-lg p-2 md:p-4 border transition-all duration-300 hover:shadow-2xl ${
                        isCurrentLevel 
                          ? 'border-emerald-400 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 shadow-2xl ring-2 ring-emerald-400/30' 
                          : 'border-white/20 hover:border-purple-400/50 hover:shadow-3xl cursor-pointer transform hover:-translate-y-1'
                      }`}
                    >
                      {/* Current Level Badge */}
                      {isCurrentLevel && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10">
                          ✓ ACTIVE
                        </div>
                      )}
                      
                      {/* Compact Card Layout */}
                      <div className="flex items-center justify-between mb-2 md:mb-4">
                        {/* Left Side - Badge and Level Info */}
                        <div className="flex items-center space-x-2 md:space-x-3">
                          {/* VIP Badge */}
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${getVipLevelGradient(index)} flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg`}>
                            {getVipLevelIcon(index)}
                          </div>
                          
                          {/* Level Information */}
                          <div>
                            <div className="text-base md:text-xl font-bold text-white">V{index + 1}</div>
                            <div className="text-red-400 font-semibold text-xs md:text-sm">{level.name}</div>
                          </div>
                        </div>
                      
                        {/* Right Side - Join Button */}
                        <div className="flex items-center space-x-2">
                          {/* Join Button - Always Clickable */}
                          {!isCurrentLevel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinVip(level.id, level);
                              }}
                              className={`px-2 py-1 md:px-4 md:py-2 rounded-lg font-semibold transition-all duration-300 text-xs md:text-sm ${
                                canAfford 
                                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                              }`}
                            >
                              {canAfford ? 'Join' : 'Deposit'}
                            </button>
                          )}
                      
                          {isCurrentLevel && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-2 py-1 md:px-4 md:py-2 rounded-lg font-semibold text-xs md:text-sm shadow-md">
                              ✓ Active
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact Stats Grid */}
                      <div className="grid grid-cols-3 gap-1 md:gap-3">
                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-1.5 md:p-3 border border-white/20">
                          <div className="text-xs text-gray-300 mb-1">Daily Tasks</div>
                          <div className="text-sm md:text-lg font-bold text-white">1</div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-1.5 md:p-3 border border-white/20">
                          <div className="text-xs text-gray-300 mb-1">Daily Earnings</div>
                          <div className="text-sm md:text-lg font-bold text-emerald-400">{formatCurrency(levelDailyEarning)}</div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-1.5 md:p-3 border border-white/20">
                          <div className="text-xs text-gray-300 mb-1">Investment</div>
                          <div className="text-sm md:text-lg font-bold text-white">{formatCurrency(levelAmount)}</div>
                        </div>
                      </div>
                      
                      {/* Compact Balance Info for Unaffordable Levels */}
                      {!isCurrentLevel && !canAfford && (
                        <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-white/20 bg-blue-500/20 backdrop-blur-sm rounded-lg p-1.5 md:p-3">
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <div className="text-gray-300">Your Balance</div>
                              <div className="font-bold text-red-400">
                                {formatCurrency(userBalance)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-gray-300">Need</div>
                              <div className="font-bold text-white">
                                {formatCurrency(levelAmount - userBalance)}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
            )}
          </div>
          
          {/* View More Button */}
          {vipLevels?.data?.data && vipLevels.data.data.length > 6 && (
            <div className="text-center mt-8">
              <Link 
                to="/vip-selection"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <span>View All VIP Levels</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <p className="text-sm text-gray-500 mt-2">
                Showing 6 of {vipLevels.data.data.length} VIP levels
              </p>
            </div>
          )}
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

        
                {/* Task/Earning Session Section */}
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-white/20 mb-8">
          <div className="bg-gradient-to-r from-emerald-600/80 via-green-600/80 to-teal-700/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center mb-2">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Daily Earning Session
                </h2>
                <p className="text-emerald-100 text-sm sm:text-base">Monitor your active earning session and track real-time profits</p>
              </div>
              <div className="sm:hidden lg:block">
                <div className="text-center sm:text-right text-white">
                  <div className="text-xs sm:text-sm opacity-90">Session Status</div>
                  <div className="text-lg sm:text-2xl font-bold">
                    {earningStatus?.data?.data?.hasActiveSession ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 lg:p-8">

            
            {earningStatusLoading ? (
              <div className="text-center py-8 sm:py-16">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm sm:text-lg">Loading earning session...</p>
              </div>
            ) : earningStatus?.data?.data?.hasActiveSession === true ? (
                              <div className="space-y-4 sm:space-y-6">
                  {/* Active Session Display */}
                  <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 relative overflow-hidden backdrop-blur-sm">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
                    
                    {/* Moving Animation */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 animate-pulse">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                        <span className="text-lg sm:text-xl lg:text-2xl animate-bounce">🚴</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                      <div className="flex items-center space-x-3 sm:space-x-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl">
                          <span className="text-2xl sm:text-3xl lg:text-4xl animate-bounce">🚴</span>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">Earning Session Active</h3>
                          <p className="text-emerald-300 font-semibold text-sm sm:text-base lg:text-lg">
                            Current Earnings: {formatCurrency(earningStatus.data.data.currentEarnings)}
                          </p>
                        </div>
                      </div>
                      <div className="text-center sm:text-right">
                        <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mb-1 sm:mb-2">
                          {earningStatus.data.data.remainingTime.hours}h {earningStatus.data.data.remainingTime.minutes}m
                        </div>
                        <div className="text-emerald-200 text-sm sm:text-base">Time Remaining</div>
                      </div>
                    </div>
                  
                                      {/* Progress Bar */}
                    <div className="mb-6 sm:mb-8">
                      <div className="flex justify-between text-sm sm:text-base text-emerald-200 mb-3 sm:mb-4">
                        <span className="font-semibold">Session Progress</span>
                        <span className="font-bold text-emerald-400">{earningStatus.data.data.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-xl sm:rounded-2xl h-4 sm:h-6 shadow-inner backdrop-blur-sm">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-green-600 h-4 sm:h-6 rounded-xl sm:rounded-2xl transition-all duration-500 shadow-lg relative overflow-hidden"
                          style={{ width: `${earningStatus.data.data.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                      <div className="text-emerald-200 text-sm sm:text-base">
                        Started: {new Date(earningStatus.data.data.startTime).toLocaleTimeString()}
                      </div>
                      <div className="text-emerald-200 text-sm sm:text-base">
                        Daily Rate: {formatCurrency(earningStatus.data.data.dailyEarningRate)}
                      </div>
                    </div>
                </div>
              </div>
                          ) : (
                <div className="text-center py-8 sm:py-16">
                  <div className="relative mb-8 sm:mb-12">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto shadow-2xl border border-red-500/30">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                    {/* Animated rings */}
                    <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto rounded-full border-2 border-red-500/30 animate-ping"></div>
                    <div className="absolute inset-0 w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 mx-auto rounded-full border-2 border-red-500/20 animate-ping" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6">Ready to Start Earning</h3>
                  <p className="text-gray-300 mb-8 sm:mb-12 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed px-4">
                    {earningStatus?.data?.data?.message || 'Click the button below to start your 24-hour earning cycle and begin accumulating profits automatically'}
                  </p>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <Button
                      size="lg"
                      onClick={() => window.location.href = '/tasks'}
                      className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl font-bold transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                    >
                      🚀 Go to Tasks
                    </Button>
                  </div>
                </div>
              )}
          </div>
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
