import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { vipAPI, walletAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import UsdtDeposit from '../components/UsdtDeposit';
import toast from 'react-hot-toast';

const VipSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedVip, setSelectedVip] = useState(null);
  const [showUsdtDeposit, setShowUsdtDeposit] = useState(false);
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
  const { data: walletStats, error: walletError, refetch: refetchWalletStats, isLoading: walletLoading } = useQuery({
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

  // Join VIP mutation
  const joinVipMutation = useMutation({
    mutationFn: (vipLevelId) => vipAPI.joinVip(vipLevelId),
    onSuccess: () => {
      toast.success('Successfully joined VIP level!');
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
    // Check if user has sufficient balance
    const userBalance = parseFloat(walletStats?.data?.data?.balance) || 0;
    const levelAmount = parseFloat(vipLevel?.amount) || 0;
    
    console.log('VIP join attempt:', {
      userBalance,
      levelAmount,
      walletStats: walletStats?.data?.data,
      vipLevel
    });
    
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
    
    setSelectedVip(vipLevel);
  };

  const confirmJoinVip = () => {
    if (selectedVip) {
      joinVipMutation.mutate(selectedVip.id);
      setSelectedVip(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getVipColor = (amount) => {
    if (amount >= 25000) return 'from-purple-500 to-pink-500';
    if (amount >= 12000) return 'from-yellow-400 to-orange-500';
    if (amount >= 6000) return 'from-blue-500 to-purple-500';
    if (amount >= 5000) return 'from-green-500 to-blue-500';
    if (amount >= 2000) return 'from-gray-400 to-gray-600';
    if (amount >= 1500) return 'from-purple-400 to-blue-500';
    if (amount >= 1000) return 'from-yellow-500 to-orange-400';
    if (amount >= 400) return 'from-gray-300 to-gray-500';
    if (amount >= 180) return 'from-orange-400 to-red-500';
    return 'from-green-400 to-blue-400';
  };

  if (vipLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading VIP levels...</p>
        </div>
      </div>
    );
  }

  if (vipError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading VIP Levels</h3>
          <p className="text-gray-300 mb-4">{vipError.message || 'Failed to load VIP levels'}</p>
          <Button onClick={() => refetchVipLevels()}>Retry</Button>
        </div>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">VIP Selection</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Choose Your VIP Level
          </h1>
          <p className="text-gray-300 text-base max-w-3xl mx-auto px-4 mb-6">
            Join a VIP level to start earning daily income. Each level offers guaranteed daily returns on your investment.
          </p>
          
          {/* Bicycle Benefits Highlight */}
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30 p-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <span className="text-3xl mr-3">🚲</span>
              <h3 className="text-lg font-semibold text-blue-300">Exclusive Bicycle Included!</h3>
            </div>
            <p className="text-sm text-blue-200 text-center">
              Every VIP level comes with a premium bicycle model. Higher levels include more advanced features and luxury options.
            </p>
          </div>
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg inline-block border border-blue-500/30">
            <div className="flex items-center space-x-4">
              <p className="text-blue-300 font-medium text-base">
                Your Current Balance: {walletLoading ? 'Loading...' : formatCurrency(walletStats?.data?.data?.balance || 0)}
              </p>
              <Button 
                onClick={() => {
                  refetchWalletStats();
                  refetchVipLevels();
                }}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>



        {/* VIP Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {vipLevels?.data?.data && Array.isArray(vipLevels.data.data) && vipLevels.data.data.length > 0 ? vipLevels.data.data.map((vip) => {
            const canAfford = walletStats?.data?.data?.balance >= vip.amount;
            const dailyReturn = ((vip.dailyEarning / vip.amount) * 100).toFixed(2);
            
            return (
              <div 
                key={vip.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getVipColor(vip.amount)} opacity-20`}></div>
                <div className="relative p-4 md:p-6">
                  <div className="text-lg md:text-xl font-bold text-center text-white mb-4">
                    {vip.name}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-white mb-2">
                      {formatCurrency(vip.amount)}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-green-400">
                      {formatCurrency(vip.dailyEarning)}/day
                    </div>
                    
                    {/* Bicycle Information */}
                    {vip.bicycleModel && (
                      <div className="mt-3 p-3 bg-blue-500/20 backdrop-blur-sm rounded-lg border border-blue-400/30">
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-2xl mr-2">🚲</span>
                          <span className="text-sm font-semibold text-blue-300">Included Bicycle</span>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-bold text-white mb-1">
                            {vip.bicycleModel}
                          </div>
                          <div className="text-xs text-blue-200">
                            {vip.bicycleColor}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative p-4 md:p-6">
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-300">Daily Return:</span>
                      <span className="font-semibold text-green-400 text-sm md:text-base">{dailyReturn}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-300">Monthly Earning:</span>
                      <span className="font-semibold text-white text-sm md:text-base">{formatCurrency(vip.dailyEarning * 30)}</span>
                    </div>
                    <div className="pt-3 md:pt-4">
                      <Button 
                        className={`w-full text-sm md:text-base ${
                          canAfford 
                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinVip(vip);
                        }}
                      >
                        {canAfford ? 'Join VIP' : 'Deposit & Join'}
                      </Button>
                    </div>
                    
                    {/* Balance Info for Unaffordable Levels */}
                    {!canAfford && (
                      <div className="mt-3 pt-3 border-t border-white/20 bg-blue-500/20 backdrop-blur-sm rounded-lg p-2 md:p-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="text-gray-300">Your Balance</div>
                            <div className="font-bold text-red-400">
                              {formatCurrency(walletStats?.data?.data?.balance || 0)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-300">Need</div>
                            <div className="font-bold text-white">
                              {formatCurrency(vip.amount - (walletStats?.data?.data?.balance || 0))}
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
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No VIP Levels Available</h3>
              <p className="text-gray-600 text-sm md:text-base">VIP levels are currently being configured.</p>
              <div className="mt-4 text-xs text-gray-500">
                <p>Debug info:</p>
                <p>vipLevels exists: {vipLevels ? 'Yes' : 'No'}</p>
                <p>vipLevels.data exists: {vipLevels?.data ? 'Yes' : 'No'}</p>
                <p>vipLevels.data.data exists: {vipLevels?.data?.data ? 'Yes' : 'No'}</p>
                <p>vipLevels.data.data is array: {Array.isArray(vipLevels?.data?.data) ? 'Yes' : 'No'}</p>
                <p>vipLevels.data.data length: {vipLevels?.data?.data?.length || 0}</p>
                <p>vipLevels.data type: {typeof vipLevels?.data}</p>
                <p>vipLevels.data keys: {vipLevels?.data ? Object.keys(vipLevels.data).join(', ') : 'none'}</p>
                <p>walletStats exists: {walletStats ? 'Yes' : 'No'}</p>
                <p>walletStats.data exists: {walletStats?.data ? 'Yes' : 'No'}</p>
                <p>walletStats.data.data.balance: {walletStats?.data?.data?.balance || 'undefined'}</p>
                <p>walletLoading: {walletLoading ? 'Yes' : 'No'}</p>
                <p>walletError: {walletError ? 'Yes' : 'No'}</p>
                <p>vipLoading: {vipLoading ? 'Yes' : 'No'}</p>
                <p>vipError: {vipError ? 'Yes' : 'No'}</p>
                <p>Full vipLevels: {JSON.stringify(vipLevels, null, 2)}</p>
              </div>
              <div className="mt-4">
                <Button onClick={() => refetchVipLevels()} variant="outline" size="sm">
                  Refresh VIP Levels
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bicycle Comparison Section */}
        <div className="mt-12 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">🚲 Bicycle Progression</h2>
            <p className="text-gray-300">See how bicycle quality improves with VIP levels</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {vipLevels?.data?.data?.slice(0, 6).map((vip, index) => (
              <div key={vip.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">🚲</span>
                  <div>
                    <div className="font-semibold text-white">{vip.name}</div>
                    <div className="text-sm text-blue-300">{vip.bicycleModel}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div><span className="text-blue-300">Color:</span> {vip.bicycleColor}</div>
                  <div className="text-xs text-gray-400 line-clamp-2">{vip.bicycleFeatures}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skip VIP Option */}
        <div className="text-center space-y-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base"
          >
            Skip for Now
          </Button>
          
          {/* Debug button */}
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={async () => {
                console.log('Testing VIP join with first level...');
                if (vipLevels?.data?.data && vipLevels.data.data.length > 0) {
                  const firstVip = vipLevels.data.data[0];
                  console.log('Testing with VIP level:', firstVip);
                  try {
                    const response = await vipAPI.joinVip(firstVip.id);
                    console.log('VIP join test response:', response);
                    alert('VIP join test successful!');
                  } catch (error) {
                    console.error('VIP join test error:', error);
                    alert(`VIP join test failed: ${error.response?.data?.message || error.message}`);
                  }
                } else {
                  alert('No VIP levels available for testing');
                }
              }}
              className="px-4 py-2 text-xs"
            >
              Test VIP Join
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedVip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full">
            <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Confirm VIP Purchase</h3>
            <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              <div className="flex justify-between text-sm md:text-base">
                <span>VIP Level:</span>
                <span className="font-semibold">{selectedVip.name}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span>Cost:</span>
                <span className="font-semibold">{formatCurrency(selectedVip.amount)}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span>Daily Earning:</span>
                <span className="font-semibold text-green-600">{formatCurrency(selectedVip.dailyEarning)}</span>
              </div>
              
              {/* Bicycle Information */}
              {selectedVip.bicycleModel && (
                <>
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-2">🚲</span>
                      <span className="font-semibold text-blue-600">Included Bicycle</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Model:</span>
                        <span className="font-semibold text-blue-600">{selectedVip.bicycleModel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Color:</span>
                        <span className="font-semibold">{selectedVip.bicycleColor}</span>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Features:</div>
                        <div className="text-sm text-blue-800">{selectedVip.bicycleFeatures}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="flex justify-between text-sm md:text-base">
                <span>Your Balance After:</span>
                <span className="font-semibold">
                  {formatCurrency((walletStats?.data?.balance || 0) - selectedVip.amount)}
                </span>
              </div>
            </div>
            <div className="flex space-x-2 md:space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedVip(null)}
                className="flex-1 text-sm md:text-base"
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmJoinVip}
                disabled={joinVipMutation.isLoading}
                className="flex-1 text-sm md:text-base"
              >
                {joinVipMutation.isLoading ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </div>
          </div>
        </div>
      )}

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

export default VipSelection;
