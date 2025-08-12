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
  const { data: vipLevels, isLoading: vipLoading } = useQuery({
    queryKey: ['vipLevels'],
    queryFn: () => vipAPI.getLevels(),
  });

  // Fetch wallet stats to check balance
  const { data: walletStats } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => walletAPI.getStats(),
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
      toast.error(error.response?.data?.message || 'Failed to join VIP level');
    },
  });

  const handleJoinVip = (vipLevel) => {
    // Check if user has sufficient balance
    const userBalance = parseFloat(walletStats?.data?.balance) || 0;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading VIP levels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">
            Choose Your VIP Level
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Join a VIP level to start earning daily income. Each level offers guaranteed daily returns on your investment.
          </p>
          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-blue-50 rounded-lg inline-block">
            <p className="text-blue-800 font-medium text-sm md:text-base">
              Your Current Balance: {formatCurrency(walletStats?.data?.balance || 0)}
            </p>
          </div>
        </div>



        {/* VIP Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {vipLevels?.data?.data && Array.isArray(vipLevels.data.data) ? vipLevels.data.data.map((vip) => {
            const canAfford = walletStats?.data?.balance >= vip.amount;
            const dailyReturn = ((vip.dailyEarning / vip.amount) * 100).toFixed(2);
            
            return (
              <Card 
                key={vip.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer hover:shadow-xl`}
                onClick={() => handleJoinVip(vip)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getVipColor(vip.amount)} opacity-10`}></div>
                <CardHeader className="relative p-4 md:p-6">
                  <CardTitle className="text-lg md:text-xl font-bold text-center">
                    {vip.name}
                  </CardTitle>
                  <CardDescription className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {formatCurrency(vip.amount)}
                    </div>
                    <div className="text-base md:text-lg font-semibold text-green-600">
                      {formatCurrency(vip.dailyEarning)}/day
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative p-4 md:p-6">
                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-600">Daily Return:</span>
                      <span className="font-semibold text-green-600 text-sm md:text-base">{dailyReturn}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs md:text-sm text-gray-600">Monthly Earning:</span>
                      <span className="font-semibold text-sm md:text-base">{formatCurrency(vip.dailyEarning * 30)}</span>
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
                      <div className="mt-3 pt-3 border-t border-gray-200 bg-blue-50 rounded-lg p-2 md:p-3">
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="text-gray-600">Your Balance</div>
                            <div className="font-bold text-red-600">
                              {formatCurrency(walletStats?.data?.balance || 0)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-600">Need</div>
                            <div className="font-bold text-gray-800">
                              {formatCurrency(vip.amount - (walletStats?.data?.balance || 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="col-span-full text-center py-8 md:py-12">
              <div className="text-4xl md:text-6xl mb-3 md:mb-4">💎</div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">No VIP Levels Available</h3>
              <p className="text-gray-600 text-sm md:text-base">VIP levels are currently being configured.</p>
            </div>
          )}
        </div>

        {/* Skip VIP Option */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
            className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base"
          >
            Skip for Now
          </Button>
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
