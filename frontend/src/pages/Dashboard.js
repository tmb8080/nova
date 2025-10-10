import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI, referralAPI, vipAPI, taskAPI, announcementsAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import VipDashboard from '../components/VipDashboard';
import VipUpgradeProgress from '../components/VipUpgradeProgress';
import UsdtDeposit from '../components/UsdtDeposit';
import MemberList from '../components/MemberList';
import WelcomeBanner from '../components/ui/WelcomeBanner';
import AnnouncementCard from '../components/ui/AnnouncementCard';
import { toast } from 'react-hot-toast';
import { calculateNextVipUpgrade } from '../utils/vipCalculations';
import { useTheme } from '../contexts/ThemeContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [showUsdtDeposit, setShowUsdtDeposit] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [vipToJoin, setVipToJoin] = useState(null);
  const [previousBalance, setPreviousBalance] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState(new Set());

  // Fetch wallet stats
  const { data: walletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => walletAPI.getStats(),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
    refetchIntervalInBackground: true,
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

  // Fetch active announcements
  const { data: announcements, isLoading: announcementsLoading, error: announcementsError } = useQuery({
    queryKey: ['activeAnnouncements'],
    queryFn: () => announcementsAPI.getActiveAnnouncements(),
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
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
        toast(`Balance updated! ${formatCurrency(difference)}`);
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

  const handleAnnouncementDismiss = (announcementId) => {
    setDismissedAnnouncements(prev => new Set([...prev, announcementId]));
  };

  return (
    <>
      <WelcomeBanner />
      <div className="min-h-screen bg-white dark:bg-coinbase-dark pb-20 md:pb-0 md:pt-16">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Announcements Section - At the very top */}
        <div className="mb-8">
          <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
            📢 Announcements
          </h2>
          
          {announcementsLoading ? (
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-coinbase-dark-border rounded mb-2"></div>
                <div className="h-4 bg-gray-300 dark:bg-coinbase-dark-border rounded w-3/4"></div>
              </div>
            </div>
          ) : announcementsError ? (
            <div className={`${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'} border rounded-xl p-6`}>
              <p className={`${isDark ? 'text-red-400' : 'text-red-600'} text-sm`}>
                Error loading announcements: {announcementsError.message}
              </p>
            </div>
          ) : announcements?.data?.data && announcements.data.data.length > 0 ? (
            <div className="space-y-4">
              {announcements.data.data
                .filter(announcement => !dismissedAnnouncements.has(announcement.id))
                .map((announcement) => (
                  <AnnouncementCard
                    key={announcement.id}
                    announcement={announcement}
                    onDismiss={handleAnnouncementDismiss}
                  />
                ))}
            </div>
          ) : (
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-xl p-6`}>
              <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>
                No announcements at this time.
              </p>
            </div>
          )}
        </div>

          {/* Coinbase-style Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-coinbase-text-primary mb-2">
                Dashboard
              </h1>
                <p className="text-gray-600 dark:text-coinbase-text-secondary">
                Monitor your portfolio performance and investment opportunities
              </p>
            </div>
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
                className="bg-coinbase-blue hover:bg-coinbase-blue-dark text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Balance Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg transition-all duration-200 hover:shadow-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Total Balance</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    {formatCurrency(walletStats?.data?.data?.balance || 0)}
                  </p>
                </div>
                <div className={`w-12 h-12 ${isDark ? 'bg-coinbase-blue/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-coinbase-blue' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Deposits Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg transition-all duration-200 hover:shadow-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Total Deposits</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    {formatCurrency(walletStats?.data?.data?.totalDeposits || 0)}
                  </p>
                </div>
                <div className={`w-12 h-12 ${isDark ? 'bg-coinbase-green/20' : 'bg-green-100'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-coinbase-green' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
              </div>
            </div>

            {/* Total Withdrawals Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg transition-all duration-200 hover:shadow-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Total Withdrawals</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    {formatCurrency(walletStats?.data?.data?.totalWithdrawals || 0)}
                  </p>
          </div>
                <div className={`w-12 h-12 ${isDark ? 'bg-coinbase-red/20' : 'bg-red-100'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-coinbase-red' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </div>
                    </div>
                  </div>
                  
            {/* VIP Level Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg transition-all duration-200 hover:shadow-xl`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Current VIP</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    {userVipStatus?.data?.data?.userVip ? userVipStatus.data.data.userVip.vipLevel.name : 'V0'}
                  </p>
                </div>
                <div className={`w-12 h-12 ${isDark ? 'bg-coinbase-blue/20' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isDark ? 'text-coinbase-blue' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* VIP Dashboard Section */}
            <div className="lg:col-span-2">
              <VipDashboard onDepositClick={() => setShowDepositModal(true)} />
        </div>
        </div>

        {/* VIP Levels Section */}
          <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-8 border shadow-lg mb-8`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center mb-2`}>
                  <svg className="w-6 h-6 mr-3 text-coinbase-blue" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  VIP Investment Levels
                </h2>
                <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  Choose your investment level to start earning daily income
                </p>
              </div>
            </div>
            
            {/* VIP Upgrade Progress */}
            <div className="mb-8">
            <VipUpgradeProgress 
              vipLevels={vipLevels?.data?.data || []}
              currentVip={userVipStatus?.data?.data?.userVip}
              totalDeposits={parseFloat(walletStats?.data?.data?.totalDeposits) || 0}
              onUpgradeClick={(nextLevel) => handleJoinVip(nextLevel.id, nextLevel)}
              onDepositClick={(nextLevel) => {
                setVipToJoin(nextLevel);
                setShowUsdtDeposit(true);
              }}
              showUpgradeButton={true}
            />
          </div>

            {/* VIP Levels Grid */}
            {vipLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-coinbase-blue mx-auto mb-4"></div>
                <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-lg`}>Loading VIP levels...</p>
              </div>
            ) : vipError ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">❌</div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>Error Loading VIP Levels</h3>
                <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>{vipError.message || 'Failed to load VIP levels'}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-coinbase-blue hover:bg-coinbase-blue-dark text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : !vipLevels?.data?.data || !Array.isArray(vipLevels.data.data) || vipLevels.data.data.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-4">📋</div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>No VIP Levels Available</h3>
                <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>VIP levels data is empty or not available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vipLevels.data.data.slice(0, 6).map((level, index) => {
                  const levelAmount = parseFloat(level.amount) || 0;
                  const levelDailyEarning = parseFloat(level.dailyEarning) || 0;
                  const totalDeposits = parseFloat(walletStats?.data?.data?.totalDeposits) || 0;
                  
                  const isCurrentLevel = userVipStatus?.data?.data?.userVip?.vipLevel?.id === level.id;
                  const amountNeeded = Math.max(0, levelAmount - totalDeposits);
                  const canAfford = totalDeposits >= levelAmount;
                  const dailyReturn = levelAmount > 0 ? ((levelDailyEarning / levelAmount) * 100).toFixed(2) : '0';
                  
                  return (
                    <div 
                      key={level.id} 
                      className={`relative ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-xl p-6 border transition-all duration-200 hover:shadow-lg ${
                        isCurrentLevel 
                          ? 'border-coinbase-green bg-green-50 dark:bg-coinbase-green/10' 
                          : 'hover:border-coinbase-blue/50'
                      }`}
                    >
                      {/* Current Level Badge */}
                      {isCurrentLevel && (
                        <div className="absolute -top-2 -right-2 bg-coinbase-green text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg z-10">
                          ✓ ACTIVE
                        </div>
                      )}
                      
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-xl bg-coinbase-blue flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            V{index + 1}
                          </div>
                          <div>
                            <div className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{level.name}</div>
                            <div className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>VIP Level {index + 1}</div>
                          </div>
                        </div>
                      
                        {/* Join Button */}
                        <div className="flex items-center space-x-2">
                          {!isCurrentLevel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinVip(level.id, level);
                              }}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                                canAfford 
                                  ? 'bg-coinbase-blue hover:bg-coinbase-blue-dark text-white' 
                                  : `${isDark ? 'bg-coinbase-dark-border hover:bg-coinbase-dark-border' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-coinbase-text-primary' : 'text-gray-700'}`
                              }`}
                            >
                              {canAfford ? 'Join' : 'Deposit'}
                            </button>
                          )}
                      
                          {isCurrentLevel && (
                            <div className="bg-coinbase-green text-white px-4 py-2 rounded-lg font-medium text-sm">
                              ✓ Active
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className={`text-center ${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-lg p-4 border`}>
                          <div className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Daily Return</div>
                          <div className="text-lg font-bold text-coinbase-green">{dailyReturn}%</div>
                        </div>

                        <div className={`text-center ${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-lg p-4 border`}>
                          <div className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Investment</div>
                          <div className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{formatCurrency(levelAmount)}</div>
                        </div>
                      </div>
                      
                      {/* Balance Info for Unaffordable Levels */}
                      {!isCurrentLevel && !canAfford && (
                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-coinbase-dark-border bg-coinbase-dark-secondary' : 'border-gray-200 bg-gray-100'} rounded-lg p-3`}>
                          <div className="flex justify-between items-center text-xs">
                            <div>
                              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Your Deposits</div>
                              <div className={`font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                                {formatCurrency(totalDeposits)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Amount Needed</div>
                              <div className="font-bold text-coinbase-blue">
                                {formatCurrency(amountNeeded)}
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
          
          {/* View More Button */}
          {vipLevels?.data?.data && vipLevels.data.data.length > 6 && (
              <div className="text-center mt-8">
              <Link 
                to="/vip-selection"
                  className="bg-coinbase-blue hover:bg-coinbase-blue-dark text-white px-6 py-3 rounded-lg inline-flex items-center transition-all duration-200"
              >
                <span>View All VIP Levels</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
                <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mt-2`}>
                Showing 6 of {vipLevels.data.data.length} VIP levels
              </p>
            </div>
          )}
        </div>

          {/* Member List Section */}
          <div className="mb-8">
            <MemberList />
          </div>
          
        {/* USDT Deposit Modal for VIP Upgrades */}
        {showUsdtDeposit && (
          <UsdtDeposit
            onClose={() => {
              setShowUsdtDeposit(false);
              setVipToJoin(null);
            }}
            vipToJoin={vipToJoin}
          />
        )}

        {/* Regular Deposit Modal */}
        {showDepositModal && (
          <UsdtDeposit
            onClose={() => setShowDepositModal(false)}
          />
        )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;