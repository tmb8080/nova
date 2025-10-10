import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { vipAPI, walletAPI } from '../services/api';
import UsdtDeposit from '../components/UsdtDeposit';
import VipUpgradeProgress from '../components/VipUpgradeProgress';
import { formatCurrency } from '../utils/vipCalculations';
import toast from 'react-hot-toast';

const VipSelection = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [selectedVip, setSelectedVip] = useState(null);
  const [showUsdtDeposit, setShowUsdtDeposit] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [vipToJoin, setVipToJoin] = useState(null);

  // Fetch VIP levels
  const { data: vipLevels, isLoading: vipLoading, error: vipError, refetch: refetchVipLevels } = useQuery({
    queryKey: ['vipLevels'],
    queryFn: () => vipAPI.getLevels(),
    onSuccess: (data) => {
      console.log('VIP levels loaded:', data);
      console.log('VIP levels data structure:', data?.data);
      console.log('VIP levels array:', data?.data?.data);
      console.log('Full response structure:', JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      console.error('Error loading VIP levels:', error);
    },
  });

  // Fetch wallet stats to check balance
  const { data: walletStats, refetch: refetchWalletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => {
      console.log('Executing wallet stats query...');
      return walletAPI.getStats();
    },
    onSuccess: (data) => {
      console.log('Wallet stats loaded:', data);
      console.log('Balance from wallet stats:', data?.data?.data?.balance);
      console.log('Full wallet stats response:', JSON.stringify(data, null, 2));
    },
    onError: (error) => {
      console.error('Error loading wallet stats:', error);
    },
    // Ensure fresh data
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Fetch current VIP status
  const { data: vipStatus } = useQuery({
    queryKey: ['vipStatus'],
    queryFn: () => vipAPI.getStatus(),
    onSuccess: (data) => {
      console.log('VIP status loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading VIP status:', error);
    },
  });

  // Join VIP mutation
  const joinVipMutation = useMutation({
    mutationFn: (vipLevelId) => vipAPI.joinVip(vipLevelId),
    onSuccess: (data) => {
      const message = data?.data?.isUpgrade 
        ? `Successfully upgraded to ${data.data.vipLevel?.name || 'VIP level'}!`
        : 'Successfully joined VIP level!';
      toast.success(message);
      queryClient.invalidateQueries(['walletStats']);
      queryClient.invalidateQueries(['vipStatus']);
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('VIP join error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to join VIP level';
      toast.error(errorMessage);
    },
  });

  const handleJoinVip = (vipLevel) => {
    const totalDeposits = parseFloat(walletStats?.data?.data?.totalDeposits) || 0;
    const levelAmount = parseFloat(vipLevel?.amount) || 0;
    const currentVip = vipStatus?.data?.data?.userVip;
    
    // Calculate if this is an upgrade
    let isUpgrade = false;
    let paymentAmount = levelAmount;
    let currentVipAmount = 0;
    
    if (currentVip) {
      isUpgrade = true;
      currentVipAmount = parseFloat(currentVip.totalPaid);
      paymentAmount = levelAmount - currentVipAmount;
      
      console.log('Upgrade calculation:', {
        currentVipLevel: currentVip.vipLevel.name,
        currentVipAmount,
        newVipAmount: levelAmount,
        paymentAmount,
        isUpgrade
      });
      
      if (paymentAmount <= 0) {
        toast.error(`Cannot downgrade from ${currentVip.vipLevel.name} to ${vipLevel.name}`);
        return;
      }
    }
    
    console.log('VIP join/upgrade attempt:', {
      totalDeposits,
      levelAmount,
      paymentAmount,
      isUpgrade,
      currentVipAmount,
      walletStats: walletStats?.data?.data,
      vipLevel
    });
    
    if (totalDeposits < paymentAmount) {
      // Show deposit prompt for insufficient deposited balance
      const message = isUpgrade 
        ? `You need ${formatCurrency(paymentAmount - totalDeposits)} more in deposits to upgrade from ${currentVip.vipLevel.name} to ${vipLevel.name}.\n\nDaily earnings and referral bonuses cannot be used for VIP upgrades.\n\nWould you like to deposit funds to your wallet?`
        : `You need ${formatCurrency(levelAmount - totalDeposits)} more in deposits to join ${vipLevel.name}.\n\nDaily earnings and referral bonuses cannot be used for VIP upgrades.\n\nWould you like to deposit funds to your wallet?`;
      
      const shouldDeposit = window.confirm(message);
      
      if (shouldDeposit) {
        setVipToJoin(vipLevel);
        setShowUsdtDeposit(true);
      }
      return;
    }
    
    setSelectedVip({ ...vipLevel, isUpgrade, paymentAmount, currentVipAmount });
  };

  const confirmJoinVip = () => {
    if (selectedVip) {
      joinVipMutation.mutate(selectedVip.id);
      setSelectedVip(null);
    }
  };



  if (vipLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-coinbase-dark' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coinbase-blue mx-auto"></div>
          <p className={`mt-4 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Loading VIP levels...</p>
        </div>
      </div>
    );
  }

  if (vipError) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-coinbase-dark' : 'bg-white'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className={`text-lg font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>Error Loading VIP Levels</h3>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>{vipError.message || 'Failed to load VIP levels'}</p>
          <button onClick={() => refetchVipLevels()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-coinbase-dark' : 'bg-white'} pb-20 md:pb-0`}>
      {/* Coinbase-style Header */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-coinbase-blue rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Token Rise</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-coinbase-green rounded-full animate-pulse"></div>
              <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center px-4 py-2 ${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} rounded-full border mb-6`}>
            <div className="w-2 h-2 bg-coinbase-blue rounded-full mr-2 animate-pulse"></div>
            <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm font-medium`}>VIP Selection</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
            Choose Your VIP Level
          </h1>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-base max-w-3xl mx-auto px-4 mb-8`}>
            Join a VIP level to start earning daily income. Each level offers guaranteed daily returns on your investment.
          </p>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar - Wallet Info & Quick Actions */}
          <div className="xl:col-span-1 space-y-6">
            {/* Wallet Balance Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Wallet Balance</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Your available funds</p>
                  </div>
                </div>
            </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Deposited Balance</span>
                    <span className={`${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} font-bold text-lg`}>
                      {walletLoading ? 'Loading...' : formatCurrency(walletStats?.data?.data?.totalDeposits || 0)}
                    </span>
          </div>
                  <div className={`flex justify-between items-center p-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Withdrawable Balance</span>
                    <span className="text-coinbase-green font-bold text-lg">
                      {walletLoading ? 'Loading...' : formatCurrency(
                    (parseFloat(walletStats?.data?.data?.totalEarnings || 0) + 
                     parseFloat(walletStats?.data?.data?.totalReferralBonus || 0) + 
                     parseFloat(walletStats?.data?.data?.dailyEarnings || 0))
                  )}
                    </span>
                  </div>
                  <div className={`${isDark ? 'bg-coinbase-blue/10 border-coinbase-blue/20' : 'bg-blue-50 border-blue-200'} rounded-lg p-3 border`}>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-coinbase-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                        Only deposited amounts can be used for VIP purchases
                      </span>
                    </div>
              </div>
              <button 
                onClick={() => {
                  refetchWalletStats();
                  refetchVipLevels();
                }}
                    className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
              </button>
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
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Manage your account</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Make Deposit</span>
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDark
                      ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">

        {/* VIP Upgrade Progress Section */}
        {vipStatus?.data?.data?.userVip ? (
          <div className="mb-8">
            <VipUpgradeProgress 
              vipLevels={vipLevels?.data?.data || []}
              currentVip={vipStatus.data.data.userVip}
              totalDeposits={parseFloat(walletStats?.data?.data?.totalDeposits) || 0}
              onUpgradeClick={(nextLevel) => handleJoinVip(nextLevel)}
                  onDepositClick={(nextLevel) => {
                    setVipToJoin(nextLevel);
                    setShowUsdtDeposit(true);
                  }}
              showUpgradeButton={true}
            />
          </div>
        ) : (
          <div className="mb-8">
                <VipUpgradeProgress 
                  vipLevels={vipLevels?.data?.data || []}
                  currentVip={null}
                  totalDeposits={parseFloat(walletStats?.data?.data?.totalDeposits) || 0}
                  onUpgradeClick={(nextLevel) => handleJoinVip(nextLevel)}
                  onDepositClick={(nextLevel) => {
                    setVipToJoin(nextLevel);
                    setShowUsdtDeposit(true);
                  }}
                  showUpgradeButton={true}
                />
          </div>
        )}

        {/* VIP Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {vipLevels?.data?.data && Array.isArray(vipLevels.data.data) && vipLevels.data.data.length > 0 ? vipLevels.data.data.map((vip) => {
            const currentVip = vipStatus?.data?.data?.userVip;
            const totalDeposits = parseFloat(walletStats?.data?.data?.totalDeposits) || 0;
            const levelAmount = parseFloat(vip.amount);
            
            // Calculate VIP cost and amount needed
            let isUpgrade = false;
            let fullVipCost = levelAmount;
            let amountNeeded = Math.max(0, fullVipCost - totalDeposits);
            let canAfford = totalDeposits >= fullVipCost;
            let isLowerLevel = false;
            
            if (currentVip) {
              isUpgrade = true;
              const currentVipAmount = parseFloat(currentVip.totalPaid);
              const upgradeCost = levelAmount - currentVipAmount;
              isLowerLevel = upgradeCost <= 0;
              // For upgrade, we still use the full VIP cost for display
              amountNeeded = Math.max(0, fullVipCost - totalDeposits);
              canAfford = totalDeposits >= fullVipCost && !isLowerLevel;
            }
            
            const dailyReturn = ((vip.dailyEarning / vip.amount) * 100).toFixed(2);
            
            return (
              <div 
                key={vip.id} 
                className={`relative overflow-hidden transition-all duration-300 ${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border ${
                  currentVip && currentVip.vipLevel.id === vip.id 
                    ? 'border-coinbase-green shadow-lg shadow-coinbase-green/20 hover:scale-105' 
                    : isLowerLevel 
                      ? 'border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed' 
                      : 'hover:scale-105 hover:shadow-lg'
                }`}
              >
                <div className="relative p-4 md:p-6">
                  {/* Current VIP Level Badge */}
                  {currentVip && currentVip.vipLevel.id === vip.id && (
                    <div className="absolute top-2 right-2 bg-coinbase-green text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                      Current VIP
                    </div>
                  )}
                  
                  {/* Lower Level Badge */}
                  {isLowerLevel && (
                    <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full font-semibold z-10">
                      Lower Level
                    </div>
                  )}
                  
                  <div className={`text-lg md:text-xl font-bold text-center ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
                    {vip.name}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-coinbase-blue mb-2">
                      {formatCurrency(vip.amount)}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-coinbase-green">
                      {formatCurrency(vip.dailyEarning)}/day
                    </div>
                  </div>
                </div>
                <div className="relative p-4 md:p-6">
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Daily Return:</span>
                      <span className="font-semibold text-coinbase-green text-sm md:text-base">{dailyReturn}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Monthly Earning:</span>
                      <span className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} text-sm md:text-base`}>{formatCurrency(vip.dailyEarning * 30)}</span>
                    </div>
                    <div className="pt-3 md:pt-4">
                      <button 
                        className={`w-full text-sm md:text-base px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          isLowerLevel
                            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50'
                            : canAfford 
                              ? 'btn-primary' 
                              : 'btn-secondary'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLowerLevel) {
                            handleJoinVip(vip);
                          }
                        }}
                        disabled={isLowerLevel}
                      >
                        {isLowerLevel 
                          ? 'Lower Level'
                          : isUpgrade 
                            ? (canAfford ? 'Upgrade VIP' : 'Deposit & Upgrade')
                            : (canAfford ? 'Join VIP' : 'Deposit & Join')
                        }
                      </button>
                    </div>
                    
                    {/* Upgrade Info */}
                    {isUpgrade && !isLowerLevel && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-coinbase-dark-border bg-gray-50 dark:bg-coinbase-dark-tertiary rounded-lg p-2 md:p-3">
                        <div className="text-center mb-2">
                          <div className="text-xs text-gray-600 dark:text-coinbase-text-secondary font-semibold">VIP Upgrade</div>
                          <div className="text-xs text-gray-600 dark:text-coinbase-text-secondary">
                            From {currentVip.vipLevel.name} to {vip.name}
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="text-gray-600 dark:text-coinbase-text-secondary">Your Deposits</div>
                            <div className="font-bold text-coinbase-green">
                              {formatCurrency(totalDeposits)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600 dark:text-coinbase-text-secondary">VIP Level Cost</div>
                            <div className="font-bold text-gray-900 dark:text-coinbase-text-primary">
                              {formatCurrency(fullVipCost)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-600 dark:text-coinbase-text-secondary">Amount Needed</div>
                            <div className="font-bold text-coinbase-blue">
                              {formatCurrency(amountNeeded)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Lower Level Message */}
                    {isLowerLevel && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-coinbase-dark-border bg-gray-50 dark:bg-coinbase-dark-tertiary rounded-lg p-2 md:p-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-600 dark:text-coinbase-text-secondary font-semibold mb-1">Cannot Downgrade</div>
                          <div className="text-xs text-gray-500 dark:text-coinbase-text-tertiary">
                            You cannot downgrade from {currentVip.vipLevel.name} to {vip.name}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Balance Info for Unaffordable Levels */}
                    {!canAfford && !isLowerLevel && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-coinbase-dark-border bg-gray-50 dark:bg-coinbase-dark-tertiary rounded-lg p-2 md:p-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="text-gray-600 dark:text-coinbase-text-secondary">Your Deposits</div>
                            <div className="font-bold text-gray-900 dark:text-coinbase-text-primary">
                              {formatCurrency(totalDeposits)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-600 dark:text-coinbase-text-secondary">Amount Needed</div>
                            <div className="font-bold text-coinbase-blue">
                              {formatCurrency(amountNeeded)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full text-center py-8 md:py-12">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">💎</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-coinbase-text-primary mb-2">No VIP Levels Available</h3>
              <p className="text-gray-600 dark:text-coinbase-text-secondary text-sm md:text-base">VIP levels are currently being configured.</p>
              <div className="mt-4">
                <button onClick={() => refetchVipLevels()} className="btn-primary">
                  Refresh VIP Levels
                </button>
              </div>
            </div>
          )}
        </div>

          </div>
        </div>

        {/* Skip VIP Option */}
        <div className="text-center space-y-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className={`px-6 md:px-8 py-2 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all duration-200 ${
              isDark
                ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Skip for Now
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedVip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl p-4 md:p-6 max-w-md w-full border`}>
            <h3 className={`text-lg md:text-xl font-bold mb-3 md:mb-4 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Confirm VIP Purchase</h3>
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600 dark:text-coinbase-text-secondary">VIP Level:</span>
                <span className="font-semibold text-gray-900 dark:text-coinbase-text-primary">{selectedVip.name}</span>
              </div>
              
              {selectedVip.isUpgrade && (
                <>
                  <div className="bg-gray-50 dark:bg-coinbase-dark-tertiary p-3 rounded-lg border border-gray-200 dark:border-coinbase-dark-border">
                    <div className="text-sm font-semibold text-gray-900 dark:text-coinbase-text-primary mb-2">VIP Upgrade</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-coinbase-text-secondary">Current VIP:</span>
                        <span className="font-semibold text-coinbase-green">{formatCurrency(selectedVip.currentVipAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-coinbase-text-secondary">Upgrade Cost:</span>
                        <span className="font-semibold text-coinbase-green">{formatCurrency(selectedVip.paymentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-coinbase-text-secondary">New Total:</span>
                        <span className="font-semibold text-coinbase-green">{formatCurrency(selectedVip.amount)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600 dark:text-coinbase-text-secondary">{selectedVip.isUpgrade ? 'Upgrade Cost:' : 'Cost:'}</span>
                <span className="font-semibold text-gray-900 dark:text-coinbase-text-primary">{formatCurrency(selectedVip.isUpgrade ? selectedVip.paymentAmount : selectedVip.amount)}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600 dark:text-coinbase-text-secondary">Daily Earning:</span>
                <span className="font-semibold text-coinbase-green">{formatCurrency(selectedVip.dailyEarning)}</span>
              </div>
              
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600 dark:text-coinbase-text-secondary">Your Balance After:</span>
                <span className="font-semibold text-gray-900 dark:text-coinbase-text-primary">
                  {formatCurrency((walletStats?.data?.data?.balance || 0) - (selectedVip.isUpgrade ? selectedVip.paymentAmount : selectedVip.amount))}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 md:space-x-3">
              <button 
                onClick={() => setSelectedVip(null)}
                className={`flex-1 text-sm md:text-base rounded-lg font-semibold transition-all duration-200 ${
                  isDark
                    ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button 
                onClick={confirmJoinVip}
                disabled={joinVipMutation.isLoading}
                className="flex-1 text-sm md:text-base bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {joinVipMutation.isLoading ? 'Processing...' : (selectedVip.isUpgrade ? 'Confirm Upgrade' : 'Confirm Purchase')}
              </button>
            </div>
          </div>
        </div>
      )}

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
  );
};

export default VipSelection;
