import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vipAPI, walletAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

const VipDashboard = () => {
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Fetch VIP status
  const { data: vipStatus, isLoading: vipLoading } = useQuery({
    queryKey: ['vipStatus'],
    queryFn: () => vipAPI.getStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
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
    if (amount < 10) {
      toast.error('Minimum withdrawal amount is $10');
      return;
    }
    withdrawEarningsMutation.mutate(amount);
  };

  if (vipLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const vipData = vipStatus?.data?.data;

  if (!vipData?.userVip) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>VIP Membership</CardTitle>
          <CardDescription>Join a VIP level to start earning daily income</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💎</div>
            <h3 className="text-xl font-semibold mb-2">No VIP Membership</h3>
            <p className="text-gray-600 mb-6">
              Join a VIP level to unlock daily earnings and grow your income automatically.
            </p>
            <Button onClick={() => window.location.href = '/vip-selection'}>
              Choose VIP Level
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { userVip, activeSession, todayEarnings } = vipData;
  const canStartEarning = !activeSession && vipData.canStartEarning;

  return (
    <div className="space-y-6">
      {/* VIP Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>VIP {userVip.vipLevel.name}</span>
            <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Active
            </span>
          </CardTitle>
          <CardDescription>
            Daily earning potential: {formatCurrency(userVip.vipLevel.dailyEarning)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Investment</p>
              <p className="text-2xl font-bold">{formatCurrency(userVip.vipLevel.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Daily Earning</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(userVip.vipLevel.dailyEarning)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earning Session Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Earning Session</CardTitle>
          <CardDescription>
            Start your 24-hour earning session to receive daily income
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-semibold text-green-800">Session Active</p>
                  <p className="text-sm text-green-600">
                    Earning {formatCurrency(userVip.vipLevel.dailyEarning)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-800">
                    {formatTimeRemaining(activeSession.endsAt)}
                  </p>
                  <p className="text-xs text-green-600">Until completion</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
                  <p className="text-gray-600 mb-4">
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
                  <p className="text-gray-600 mb-2">
                    You can start earning again tomorrow
                  </p>
                  <p className="text-sm text-gray-500">
                    Each VIP level allows one earning session per day
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Withdrawal Card */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Earnings</CardTitle>
          <CardDescription>
            Withdraw your earned income to your main balance (minimum $10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Available Earnings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(todayEarnings)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Today's Total</p>
                <p className="font-semibold">{formatCurrency(todayEarnings)}</p>
              </div>
            </div>

            {todayEarnings >= 10 ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Withdrawal Amount ($)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount (min $10)"
                    min="10"
                    max={todayEarnings}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button 
                  onClick={handleWithdrawEarnings}
                  disabled={withdrawEarningsMutation.isLoading || !withdrawAmount || parseFloat(withdrawAmount) < 10}
                  className="w-full"
                >
                  {withdrawEarningsMutation.isLoading ? 'Processing...' : 'Withdraw to Main Balance'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600">
                  Minimum $10 earnings required for withdrawal
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VipDashboard;
