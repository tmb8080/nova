import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vipAPI, walletAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const VipDashboard = ({ onDepositClick }) => {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Fetch VIP status
  const { data: vipStatus, isLoading: vipLoading } = useQuery({
    queryKey: ['vipStatus'],
    queryFn: () => vipAPI.getStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch VIP levels for upgrade options
  const { data: vipLevels, isLoading: vipLevelsLoading } = useQuery({
    queryKey: ['vipLevels'],
    queryFn: () => vipAPI.getLevels(),
  });

  // Fetch wallet stats to check balance
  const { data: walletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => walletAPI.getStats(),
  });

  // Start earning mutation
  const startEarningMutation = useMutation({
    mutationFn: () => vipAPI.startEarning(),
    onSuccess: () => {
      toast.success('Earning session started! You will earn in 24 hours.');
      queryClient.invalidateQueries(['vipStatus']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start earning session');
    },
  });

  // Withdraw earnings mutation
  const withdrawEarningsMutation = useMutation({
    mutationFn: (amount) => walletAPI.withdrawEarnings(amount),
    onSuccess: () => {
      toast.success('Earnings withdrawn to main balance!');
      setWithdrawAmount('');
      queryClient.invalidateQueries(['vipStatus']);
      queryClient.invalidateQueries(['walletStats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to withdraw earnings');
    },
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount);
  };

  const formatTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Completed';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const handleWithdrawEarnings = () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 2) {
      toast.error('Minimum withdrawal amount is $2');
      return;
    }
    withdrawEarningsMutation.mutate(amount);
  };

  // Calculate upgrade options
  const getUpgradeOptions = () => {
    if (!vipLevels?.data?.data || !userVip) return [];
    
    const currentVipAmount = parseFloat(userVip.totalPaid);
    const totalDeposits = parseFloat(walletStats?.data?.data?.totalDeposits) || 0;
    const totalBalance = parseFloat(walletStats?.data?.data?.balance) || 0;
    
    return vipLevels.data.data
      .filter(level => parseFloat(level.amount) > currentVipAmount)
      .map(level => {
        const fullVipCost = parseFloat(level.amount);
        const upgradeCost = fullVipCost - currentVipAmount;
        const amountNeededForFullVip = Math.max(0, fullVipCost - totalDeposits);
        const canAfford = totalDeposits >= fullVipCost;
        
        return {
          ...level,
          upgradeCost,
          fullVipCost,
          amountNeededForFullVip,
          canAfford,
          missingAmount: Math.max(0, upgradeCost - totalDeposits),
          totalDeposits,
          totalBalance
        };
      })
      .sort((a, b) => a.upgradeCost - b.upgradeCost);
  };

  if (vipLoading) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
        <div className="animate-pulse space-y-4">
          <div className={`h-4 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded w-1/4`}></div>
          <div className={`h-8 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded w-1/2`}></div>
        </div>
      </div>
    );
  }

  const vipData = vipStatus?.data?.data;

  if (!vipData?.userVip) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-8 border shadow-lg`}>
        <div className="text-center">
          <div className="text-6xl mb-4">💎</div>
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>No VIP Membership</h3>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>
            Join a VIP level to unlock daily earnings and grow your income automatically.
          </p>
          <div className={`${isDark ? 'bg-coinbase-blue/20 border-coinbase-blue/30' : 'bg-blue-50 border-blue-200'} p-4 rounded-lg mb-6 border`}>
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">🚲</span>
              <span className={`font-semibold ${isDark ? 'text-coinbase-blue' : 'text-blue-800'}`}>Exclusive Bicycle Included!</span>
            </div>
            <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-blue-700'}`}>
              Every VIP level comes with a premium bicycle model with advanced features
            </p>
          </div>
          <Button onClick={() => window.location.href = '/vip-selection'}>
            Choose VIP Level
          </Button>
        </div>
      </div>
    );
  }

  const { userVip, activeSession, todayEarnings } = vipData;
  const canStartEarning = !activeSession && vipData.canStartEarning;

  return (
    <div className="space-y-6">
      {/* VIP Status Card */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
              VIP {userVip.vipLevel.name}
            </h3>
            <span className={`text-sm ${isDark ? 'bg-coinbase-green/20 text-coinbase-green border-coinbase-green/30' : 'bg-green-100 text-green-800 border-green-200'} px-2 py-1 rounded-full border`}>
              Active
            </span>
          </div>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
            Daily earning potential: {formatCurrency(userVip.vipLevel.dailyEarning)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Investment</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{formatCurrency(userVip.vipLevel.amount)}</p>
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Daily Earning</p>
            <p className="text-2xl font-bold text-coinbase-green">
              {formatCurrency(userVip.vipLevel.dailyEarning)}
            </p>
          </div>
        </div>
          
          {/* Next Upgrade Preview */}
          {getUpgradeOptions().length > 0 && (
            <div className={`mb-4 p-3 ${isDark ? 'bg-coinbase-blue/20 border-coinbase-blue/30' : 'bg-blue-50 border-blue-200'} rounded-lg border`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-coinbase-blue' : 'text-blue-800'}`}>Next Upgrade</p>
                  <p className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-blue-600'}`}>
                    {getUpgradeOptions()[0].name} - {formatCurrency(getUpgradeOptions()[0].dailyEarning)}/day
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${isDark ? 'text-coinbase-blue' : 'text-blue-800'}`}>
                    {formatCurrency(getUpgradeOptions()[0].upgradeCost)}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-blue-600'}`}>
                    {getUpgradeOptions()[0].canAfford ? 'Can afford' : `Need ${formatCurrency(getUpgradeOptions()[0].missingAmount)} more`}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Bicycle Information */}
          {userVip.vipLevel.bicycleModel && (
            <div className={`border-t ${isDark ? 'border-coinbase-dark-border' : 'border-gray-200'} pt-4`}>
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-2">🚲</span>
                <h4 className={`font-semibold ${isDark ? 'text-coinbase-blue' : 'text-blue-600'}`}>Your VIP Bicycle</h4>
              </div>
              <div className={`${isDark ? 'bg-coinbase-blue/20 border-coinbase-blue/30' : 'bg-blue-50 border-blue-200'} p-4 rounded-lg border`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Model</p>
                    <p className={`font-semibold ${isDark ? 'text-coinbase-blue' : 'text-blue-800'}`}>{userVip.vipLevel.bicycleModel}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Color</p>
                    <p className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{userVip.vipLevel.bicycleColor}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Features</p>
                  <p className={`text-sm ${isDark ? 'text-coinbase-blue' : 'text-blue-800'}`}>{userVip.vipLevel.bicycleFeatures}</p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Earning Session Card */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
        <div className="mb-4">
          <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Daily Earning Session</h3>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
            Start your 24-hour earning session to receive daily income
          </p>
        </div>
        <div>
          {activeSession ? (
            <div className="space-y-4">
              <div className={`${isDark ? 'bg-coinbase-green/20 border-coinbase-green/30' : 'bg-green-50 border-green-200'} flex items-center justify-between p-4 rounded-lg border`}>
                <div>
                  <p className={`font-semibold ${isDark ? 'text-coinbase-green' : 'text-green-800'}`}>Session Active</p>
                  <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-green-600'}`}>
                    Earning {formatCurrency(userVip.vipLevel.dailyEarning)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isDark ? 'text-coinbase-green' : 'text-green-800'}`}>
                    {formatTimeRemaining(activeSession.endsAt)}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-green-600'}`}>Until completion</p>
                </div>
              </div>
              <div className={`w-full ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded-full h-2`}>
                <div 
                  className="bg-coinbase-green h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(0, Math.min(100, 
                      ((new Date() - new Date(activeSession.startedAt)) / 
                       (new Date(activeSession.endsAt) - new Date(activeSession.startedAt))) * 100
                    ))}%`
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              {canStartEarning ? (
                <div>
                  <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>
                    Ready to start your daily earning session
                  </p>
                  <Button 
                    onClick={() => startEarningMutation.mutate()}
                    disabled={startEarningMutation.isLoading}
                    className="px-8 py-3"
                  >
                    {startEarningMutation.isLoading ? 'Starting...' : 'Start Earning'}
                  </Button>
                </div>
              ) : (
                <div>
                  <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-2`}>
                    You can start earning again tomorrow
                  </p>
                  <p className={`text-sm ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                    Each VIP level allows one earning session per day
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Earnings Withdrawal Card */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
        <div className="mb-4">
          <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Daily Earnings</h3>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
            Withdraw your earned income to your main balance (minimum $2)
          </p>
        </div>
        <div className="space-y-4">
          <div className={`${isDark ? 'bg-coinbase-blue/20 border-coinbase-blue/30' : 'bg-blue-50 border-blue-200'} flex justify-between items-center p-4 rounded-lg border`}>
            <div>
              <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Available Earnings</p>
              <p className={`text-2xl font-bold ${isDark ? 'text-coinbase-blue' : 'text-blue-600'}`}>
                {formatCurrency(todayEarnings)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Today's Total</p>
              <p className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{formatCurrency(todayEarnings)}</p>
            </div>
          </div>

          {todayEarnings >= 2 ? (
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-coinbase-text-primary' : 'text-gray-700'} mb-1`}>
                  Withdrawal Amount ($)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (min $2)"
                  min="2"
                  max={todayEarnings}
                  className={`w-full px-3 py-2 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary' : 'bg-white border-gray-300 text-gray-900'} border rounded-md focus:outline-none focus:ring-2 focus:ring-coinbase-blue`}
                />
              </div>
              <Button 
                onClick={handleWithdrawEarnings}
                disabled={withdrawEarningsMutation.isLoading || !withdrawAmount || parseFloat(withdrawAmount) < 2}
                className="w-full"
              >
                {withdrawEarningsMutation.isLoading ? 'Processing...' : 'Withdraw to Main Balance'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Minimum $2 earnings required for withdrawal
              </p>
            </div>
          )}
        </div>
      </div>

      {/* VIP Upgrade Options */}
      {userVip && (
        <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>VIP Upgrade Options</h3>
              <span className={`text-sm ${isDark ? 'bg-coinbase-blue/20 text-coinbase-blue border-coinbase-blue/30' : 'bg-blue-100 text-blue-800 border-blue-200'} px-2 py-1 rounded-full border`}>
                {getUpgradeOptions().length} Available
              </span>
            </div>
            <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
              Upgrade to higher VIP levels for increased daily earnings
              <div className={`mt-2 p-2 ${isDark ? 'bg-coinbase-blue/20 border-coinbase-blue/30' : 'bg-blue-50 border-blue-200'} rounded text-xs border`}>
                <strong className={`${isDark ? 'text-coinbase-blue' : 'text-blue-700'}`}>Note:</strong> <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-blue-700'}`}>Only deposited funds can be used for VIP upgrades. Daily earnings and referral bonuses are not eligible.</span>
              </div>
            </p>
          </div>
          <div>
            {vipLevelsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className={`h-16 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded`}></div>
                <div className={`h-16 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded`}></div>
              </div>
            ) : getUpgradeOptions().length > 0 ? (
              <div className="space-y-3">
                {getUpgradeOptions().slice(0, 3).map((upgrade) => (
                  <div 
                    key={upgrade.id}
                    className={`p-4 rounded-lg border ${
                      upgrade.canAfford 
                        ? `${isDark ? 'bg-coinbase-green/20 border-coinbase-green/30' : 'bg-green-50 border-green-200'}` 
                        : `${isDark ? 'bg-coinbase-blue/20 border-coinbase-blue/30' : 'bg-orange-50 border-orange-200'}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">💎</div>
                        <div>
                          <h4 className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{upgrade.name}</h4>
                          <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                            Daily: {formatCurrency(upgrade.dailyEarning)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${isDark ? 'text-coinbase-green' : 'text-green-600'}`}>
                          {formatCurrency(upgrade.upgradeCost)}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>Upgrade Cost</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                        <span className="font-medium">Current VIP:</span> {formatCurrency(userVip.totalPaid)}
                        <span className="mx-2">→</span>
                        <span className="font-medium">New Total:</span> {formatCurrency(upgrade.amount)}
                      </div>
                      <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'} text-right`}>
                        <div>Deposits: {formatCurrency(upgrade.totalDeposits)}</div>
                        <div>Total Balance: {formatCurrency(upgrade.totalBalance)}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                        {upgrade.canAfford ? (
                          <Button
                            size="sm"
                            onClick={() => window.location.href = '/vip-selection'}
                            className="bg-coinbase-green hover:bg-coinbase-green/80 text-white"
                          >
                            Upgrade Now
                          </Button>
                        ) : (
                          <div className="text-right">
                            <div className={`text-sm ${isDark ? 'text-coinbase-blue' : 'text-orange-600'} font-medium`}>
                              Need {formatCurrency(upgrade.missingAmount)} more in deposits
                            </div>
                            <div className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'} mb-1`}>
                              (Daily earnings & bonuses not eligible)
                            </div>
                            <Button
                              size="sm"
                              onClick={onDepositClick || (() => window.location.href = '/deposit')}
                              className="bg-coinbase-blue hover:bg-coinbase-blue-dark text-white"
                            >
                              Deposit
                            </Button>
                          </div>
                        )}
                      </div>
                  </div>
                ))}
                
                {getUpgradeOptions().length > 3 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/vip-selection'}
                      className={`${isDark ? 'text-coinbase-blue border-coinbase-blue hover:bg-coinbase-blue/20' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}`}
                    >
                      View All {getUpgradeOptions().length} Upgrade Options
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>Maximum VIP Level Reached!</h3>
                <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  You're already at the highest available VIP level. Congratulations!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VipDashboard;
