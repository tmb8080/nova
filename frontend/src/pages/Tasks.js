import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch earning session status
  const { data: earningStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['earningStatus'],
    queryFn: taskAPI.getEarningStatus,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Start earning session mutation
  const startEarningMutation = useMutation({
    mutationFn: taskAPI.startEarning,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.data.message);
        queryClient.invalidateQueries(['earningStatus']);
        queryClient.invalidateQueries(['walletStats']);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      // Check if error is about no VIP level and redirect
      if (error.response?.data?.message?.includes('No active VIP level')) {
        toast.error('Please join a VIP level first to start earning');
        navigate('/vip-selection');
      } else {
        toast.error('Failed to start earning session');
      }
    }
  });



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-20 md:pb-8">
        {/* Modern Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-4 sm:mb-6">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
            <span className="text-blue-300 text-xs sm:text-sm font-medium">Earning Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Daily Tasks
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto px-4">
            Complete tasks to earn additional rewards and bonuses. Start your earning journey today!
          </p>
        </div>

        {/* Modern Daily Earning Session */}
        <div className="relative mb-8 sm:mb-12">
          {/* Background Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl sm:rounded-3xl blur-3xl"></div>
          
          <Card className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                    {earningStatus?.data?.data?.hasActiveSession ? (
                      <span className={`text-lg sm:text-xl text-white ${earningStatus?.data?.data?.hasActiveSession ? 'animate-bounce' : ''}`}>🚴</span>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">
                      Daily Earning Session
                    </CardTitle>
                    <CardDescription className="text-gray-300 text-sm sm:text-base">
                      Start your 24-hour earning cycle to accumulate profits automatically
                    </CardDescription>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-500/30">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {statusLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 animate-pulse">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 sm:h-10 bg-gray-200 rounded w-24 sm:w-32"></div>
                  </div>
                </div>
              ) : earningStatus?.data?.data?.hasActiveSession ? (
                                <div className="space-y-4 sm:space-y-6">
                  {/* Active Session Display with Moving Bicycle */}
                  <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 relative overflow-hidden backdrop-blur-sm">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
                    
                    {/* Moving Bicycle Animation */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 animate-pulse">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
                        <span className="text-lg sm:text-xl lg:text-2xl animate-bounce">🚴</span>
                      </div>
                    </div>
                    
                    {/* Moving Bicycle Icon */}
                    <div className="absolute top-6 left-6 sm:top-10 sm:left-10 animate-bounce">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-xl">
                        <span className="text-lg sm:text-xl animate-spin">🚴</span>
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
                    
                                        {/* Enhanced Progress Bar */}
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

                    <div className="text-emerald-200 text-sm sm:text-base text-center">
                      Started: {new Date(earningStatus.data.data.startTime).toLocaleTimeString()}
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
                      onClick={() => startEarningMutation.mutate()}
                      disabled={startEarningMutation.isLoading}
                      className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl font-bold transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                    >
                      {startEarningMutation.isLoading ? 'Starting...' : '🚀 Start Earning'}
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={() => navigate('/profile')}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl font-bold transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                    >
                      💰 Withdraw Funds
                    </Button>
                  </div>
                  
                  <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-500/20 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="text-blue-300 font-semibold text-sm sm:text-base">24-Hour Cycle</h4>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm">Automatic earning cycle that runs continuously for 24 hours</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-500/20 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="text-green-300 font-semibold text-sm sm:text-base">Real-Time Profits</h4>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm">Watch your earnings accumulate in real-time as the session progresses</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-500/20 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h4 className="text-purple-300 font-semibold text-sm sm:text-base">Auto Payout</h4>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm">Automatic payout to your wallet when the earning session completes</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modern Earning Session Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-sm ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30' : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                  {earningStatus?.data?.data?.hasActiveSession ? (
                    <span className={`text-lg sm:text-xl lg:text-2xl text-white ${earningStatus?.data?.data?.hasActiveSession ? 'animate-bounce' : ''}`}>🚴</span>
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 ${earningStatus?.data?.data?.hasActiveSession ? 'text-blue-300' : 'text-red-300'}`}>
                  {earningStatus?.data?.data?.hasActiveSession ? 'Active' : 'Inactive'}
                </div>
                <div className="text-gray-300 text-sm sm:text-base">Session Status</div>
              </div>
            </div>
          </div>
          
          <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-sm ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30' : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                  {earningStatus?.data?.data?.hasActiveSession ? (
                    <span className={`text-lg sm:text-xl lg:text-2xl text-white ${earningStatus?.data?.data?.hasActiveSession ? 'animate-bounce' : ''}`}>🚴</span>
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 ${earningStatus?.data?.data?.hasActiveSession ? 'text-green-300' : 'text-red-300'}`}>
                  {formatCurrency(earningStatus?.data?.data?.currentEarnings || 0)}
                </div>
                <div className="text-gray-300 text-sm sm:text-base">Current Earnings</div>
              </div>
            </div>
          </div>
          
          <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-sm sm:col-span-2 lg:col-span-1 ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/30' : 'bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="text-center">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                  {earningStatus?.data?.data?.hasActiveSession ? (
                    <span className={`text-lg sm:text-xl lg:text-2xl text-white ${earningStatus?.data?.data?.hasActiveSession ? 'animate-bounce' : ''}`}>🚴</span>
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 ${earningStatus?.data?.data?.hasActiveSession ? 'text-purple-300' : 'text-red-300'}`}>
                  {formatCurrency(earningStatus?.data?.data?.dailyEarningRate || 0)}
                </div>
                <div className="text-gray-300 text-sm sm:text-base">Daily Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
