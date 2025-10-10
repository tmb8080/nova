import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/api';
import CountdownTimer from '../components/ui/CountdownTimer';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [lastEarnings, setLastEarnings] = useState(null);

  // Fetch earning session status
  const { data: earningStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['earningStatus'],
    queryFn: taskAPI.getEarningStatus,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Check for completed task and show congratulations
  useEffect(() => {
    if (earningStatus?.data?.data?.lastEarnings && !showCongratulations) {
      setLastEarnings(earningStatus.data.data.lastEarnings);
      setShowCongratulations(true);
    }
  }, [earningStatus?.data?.data?.lastEarnings, showCongratulations]);

  // Fetch available tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['availableTasks'],
    queryFn: taskAPI.getAvailableTasks,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch task history
  const { data: taskHistory } = useQuery({
    queryKey: ['taskHistory'],
    queryFn: taskAPI.getTaskHistory,
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
    <div className={`min-h-screen ${isDark ? 'bg-coinbase-dark' : 'bg-gray-50'} pb-20 md:pb-0`}>
      {/* Enhanced Header */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Daily Tasks</h1>
                <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-500'}`}>Earn rewards with your VIP level</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-1 md:py-2 bg-coinbase-green/10 rounded-full">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-coinbase-green rounded-full animate-pulse"></div>
                <span className={`text-xs md:text-sm font-medium ${isDark ? 'text-coinbase-green' : 'text-green-600'}`}>Live</span>
              </div>
              <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg ${isDark ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary' : 'bg-gray-100 text-gray-600'} text-xs md:text-sm font-medium`}>
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className={`inline-flex items-center px-4 md:px-6 py-2 md:py-3 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-full border mb-6 md:mb-8 shadow-sm`}>
            <div className="w-2 h-2 md:w-3 md:h-3 bg-coinbase-blue rounded-full mr-2 md:mr-3 animate-pulse"></div>
            <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-xs md:text-sm font-medium`}>Daily Earning System</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4 md:mb-6`}>
            Start Your Daily Task
          </h1>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-base md:text-xl max-w-4xl mx-auto leading-relaxed px-4`}>
            Complete your daily earning session to receive rewards based on your VIP level. 
            <span className="text-coinbase-green font-semibold">Earnings are deposited immediately</span> when you start!
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 md:gap-8">
          {/* Main Earning Section */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-3xl shadow-2xl border overflow-hidden`}>
              {/* Enhanced Card Header */}
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/20 to-coinbase-green/20 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-4 md:px-8 py-4 md:py-6 border-b`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${earningStatus?.data?.data?.hasActiveSession ? 'bg-gradient-to-r from-coinbase-green to-green-500' : 'bg-gradient-to-r from-coinbase-blue to-blue-500'}`}>
                    {earningStatus?.data?.data?.hasActiveSession ? (
                        <span className="text-2xl md:text-3xl text-white animate-bounce">🚴</span>
                    ) : (
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                      <h2 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      Daily Earning Session
                      </h2>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm md:text-lg`}>
                        {earningStatus?.data?.data?.hasActiveSession ? 'Session in progress' : 'Ready to start'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-sm md:text-lg font-semibold ${earningStatus?.data?.data?.hasActiveSession ? 'bg-coinbase-green/20 text-coinbase-green' : 'bg-coinbase-blue/20 text-coinbase-blue'}`}>
                    {earningStatus?.data?.data?.hasActiveSession ? 'Active' : 'Ready'}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Card Content */}
              <div className="p-4 md:p-8">
              {statusLoading ? (
                  <div className="space-y-8">
                    <div className="flex items-center space-x-6 animate-pulse">
                      <div className={`w-20 h-20 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded-2xl`}></div>
                    <div className="flex-1">
                        <div className={`h-6 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded w-1/3 mb-3`}></div>
                        <div className={`h-4 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded w-1/2`}></div>
                      </div>
                      <div className={`h-12 ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded w-40`}></div>
                    </div>
                  </div>
                ) : earningStatus?.data?.data?.hasActiveSession ? (
                  <div className="space-y-8">
                    {/* Active Session Display */}
                    <div className={`${isDark ? 'bg-gradient-to-br from-coinbase-dark-tertiary to-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-gradient-to-br from-gray-50 to-white border-gray-200'} border rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-xl`}>
                      {/* Session Header */}
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
                        <div className="flex items-center space-x-4 md:space-x-6">
                          <div className="relative">
                            <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-coinbase-green to-green-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl">
                              <span className="text-3xl md:text-5xl animate-bounce">🚴</span>
                            </div>
                            <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-coinbase-green rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-pulse"></div>
                </div>
                        </div>
                        <div>
                            <h3 className={`text-xl md:text-3xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2 md:mb-3`}>
                              Session Active
                            </h3>
                            <div className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-coinbase-green rounded-full animate-pulse"></div>
                              <p className="text-coinbase-green font-semibold text-base md:text-xl">
                                Earnings: {formatCurrency(earningStatus.data.data.totalEarnings || earningStatus.data.data.dailyEarningRate)}
                          </p>
                        </div>
                      </div>
                        </div>
                        <div className="text-center">
                          <div className="bg-gradient-to-r from-coinbase-green/10 to-green-500/10 rounded-xl md:rounded-2xl p-4 md:p-6 border border-coinbase-green/20">
                            <div className="text-3xl md:text-5xl font-bold text-coinbase-green mb-1 md:mb-2 font-mono">
                              {earningStatus.data.data.remainingTime.minutes}m {earningStatus.data.data.remainingTime.seconds}s
                            </div>
                            <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm md:text-lg font-semibold`}>Time Remaining</div>
                      </div>
                    </div>
                      </div>
                      
                      {/* Enhanced Progress Section */}
                      <div className="mb-6 md:mb-8">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 md:mb-4 gap-2">
                          <div className="flex items-center space-x-2 md:space-x-3">
                            <div className="w-2 h-2 md:w-3 md:h-3 bg-coinbase-green rounded-full"></div>
                            <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-base md:text-xl font-semibold`}>Session Progress</span>
                          </div>
                          <div className="bg-gradient-to-r from-coinbase-green to-green-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-lg md:text-xl">
                            {earningStatus.data.data.progress.toFixed(1)}%
                          </div>
                        </div>
                        <div className={`w-full ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded-full h-4 md:h-6 shadow-inner`}>
                          <div 
                            className="bg-gradient-to-r from-coinbase-green via-green-400 to-green-500 h-4 md:h-6 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
                          style={{ width: `${earningStatus.data.data.progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
                            <div className="absolute right-0 top-0 w-1 md:w-2 h-full bg-white/30 rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 md:mt-2 text-xs md:text-sm">
                          <span className={`${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>0%</span>
                          <span className={`${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>100%</span>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 text-center`}>
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-coinbase-blue/20 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-coinbase-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Started At</div>
                          <div className={`font-bold text-sm md:text-base ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                            {new Date(earningStatus.data.data.startTime).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 text-center`}>
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-coinbase-green/20 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-coinbase-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                          <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Earning Rate</div>
                          <div className="font-bold text-sm md:text-base text-coinbase-green">
                            {formatCurrency(earningStatus.data.data.dailyEarningRate)}/hr
                      </div>
                    </div>

                        <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 text-center sm:col-span-2 lg:col-span-1`}>
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Total Earned</div>
                          <div className="font-bold text-base md:text-lg text-coinbase-green">
                            {formatCurrency(earningStatus.data.data.totalEarnings || 0)}
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
              ) : earningStatus?.data?.data?.isWeekend ? (
                  <div className="text-center py-16">
                    <div className="mb-10">
                      <div className={`w-32 h-32 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-100 border-gray-200'} rounded-3xl flex items-center justify-center mx-auto shadow-lg border`}>
                        <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                    <h3 className={`text-3xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
                      Weekend Restriction 🚫
                    </h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-8 text-lg leading-relaxed max-w-2xl mx-auto`}>
                    {earningStatus?.data?.data?.message || `Daily tasks are not available on ${earningStatus?.data?.data?.dayName || 'weekends'}. Please try again on weekdays (Monday to Friday).`}
                  </p>
                  
                    <div className={`${isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200'} border rounded-2xl p-6 max-w-md mx-auto`}>
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <span className="text-orange-600 text-2xl">📅</span>
                        <span className="text-orange-600 font-semibold text-lg">Weekend Notice</span>
                    </div>
                      <div className="text-orange-600 text-sm">
                      Daily tasks are only available Monday through Friday
                    </div>
                  </div>
                </div>
              ) : earningStatus?.data?.data?.cooldownRemaining ? (
                  <div className="text-center py-16">
                    <div className="mb-10">
                      <div className={`w-32 h-32 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-100 border-gray-200'} rounded-3xl flex items-center justify-center mx-auto shadow-lg border`}>
                        <div className="w-24 h-24 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                    <h3 className={`text-3xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
                      Task Completed! 🎉
                    </h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-8 text-lg leading-relaxed max-w-2xl mx-auto`}>
                    {earningStatus?.data?.data?.message || 'Great job! You have completed your daily task. You can start a new task once the cooldown period is over.'}
                  </p>
                  
                    {/* Enhanced Countdown Timer */}
                    <div className="mb-8">
                    <CountdownTimer
                      targetTime={new Date(Date.now() + earningStatus.data.data.cooldownRemaining.hours * 60 * 60 * 1000)}
                      size="xl"
                      className="text-center"
                      onComplete={() => {
                        queryClient.invalidateQueries(['earningStatus']);
                        toast.success('🎉 Ready to start your next daily task!');
                      }}
                    />
                  </div>
                  
                    <div className={`${isDark ? 'bg-coinbase-green/10 border-coinbase-green/20' : 'bg-green-50 border-green-200'} border rounded-2xl p-6 max-w-md mx-auto`}>
                      <div className="flex items-center justify-center space-x-3 mb-3">
                        <span className="text-coinbase-green text-2xl">💰</span>
                        <span className="text-coinbase-green font-semibold text-lg">Last Earnings</span>
                    </div>
                      <div className="text-3xl font-bold text-coinbase-green">
                      +{formatCurrency(earningStatus.data.data.lastEarnings || 0)}
                    </div>
                      <div className="text-sm text-coinbase-green mt-2">
                      Successfully deposited to your wallet
                    </div>
                  </div>
                </div>
              ) : (
                  <div className="text-center py-12 md:py-16">
                    <div className="mb-8 md:mb-10">
                      <div className={`w-24 h-24 md:w-32 md:h-32 ${isDark ? 'bg-gradient-to-br from-coinbase-dark-tertiary to-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-gradient-to-br from-gray-100 to-white border-gray-200'} rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto shadow-2xl border`}>
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-coinbase-blue to-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                    <h3 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-3 md:mb-4`}>
                      Ready to Start Daily Task
                    </h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-8 md:mb-10 text-base md:text-lg leading-relaxed max-w-2xl mx-auto px-4`}>
                    {earningStatus?.data?.data?.message || 'Click the button below to start your 1-hour earning cycle based on your VIP level. Earnings will be deposited to your wallet immediately!'}
                  </p>
                  
                    {/* Enhanced Start Button */}
                    <div className="relative mb-8 md:mb-12">
                  <button
                    onClick={() => startEarningMutation.mutate()}
                    disabled={startEarningMutation.isLoading}
                        className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white px-8 md:px-12 py-4 md:py-5 text-lg md:text-xl rounded-xl md:rounded-2xl shadow-2xl font-bold transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                        {startEarningMutation.isLoading ? (
                          <div className="flex items-center space-x-2 md:space-x-3 relative z-10">
                            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Starting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 md:space-x-3 relative z-10">
                            <span>🚀</span>
                            <span>Start Daily Task</span>
                          </div>
                        )}
                  </button>
                      
                      {/* Floating Elements */}
                      <div className="absolute -top-3 -left-3 md:-top-4 md:-left-4 w-6 h-6 md:w-8 md:h-8 bg-coinbase-blue/20 rounded-full animate-bounce"></div>
                      <div className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 w-4 h-4 md:w-6 md:h-6 bg-coinbase-green/20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    
                    {/* Additional Info Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
                      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 text-center`}>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-coinbase-blue/20 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-coinbase-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Duration</div>
                        <div className={`font-bold text-sm md:text-base ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>1 Hour</div>
                      </div>
                      
                      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 text-center`}>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-coinbase-green/20 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-coinbase-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Instant Deposit</div>
                        <div className="font-bold text-sm md:text-base text-coinbase-green">Immediate</div>
                      </div>
                      
                      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 text-center sm:col-span-2 lg:col-span-1`}>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>VIP Based</div>
                        <div className="font-bold text-sm md:text-base text-yellow-600">Higher = More</div>
                      </div>
                    </div>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-4 md:space-y-6 order-1 xl:order-2">
            {/* Quick Stats Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl md:rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/20 to-coinbase-green/20 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-4 md:px-6 py-3 md:py-4 border-b`}>
                <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Quick Stats</h3>
              </div>
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-coinbase-green/20 rounded-lg md:rounded-xl flex items-center justify-center">
                    <span className="text-coinbase-green text-lg md:text-xl">💰</span>
                  </div>
                  <div>
                    <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Today's Earnings</div>
                    <div className={`text-lg md:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      {earningStatus?.data?.data?.totalEarnings ? formatCurrency(earningStatus.data.data.totalEarnings) : '$0.00'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-coinbase-blue/20 rounded-lg md:rounded-xl flex items-center justify-center">
                    <span className="text-coinbase-blue text-lg md:text-xl">⏱️</span>
                  </div>
                            <div>
                    <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Session Status</div>
                    <div className={`text-lg md:text-xl font-bold ${earningStatus?.data?.data?.hasActiveSession ? 'text-coinbase-green' : 'text-coinbase-blue'}`}>
                      {earningStatus?.data?.data?.hasActiveSession ? 'Active' : 'Ready'}
                    </div>
                            </div>
                          </div>

                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-lg md:rounded-xl flex items-center justify-center">
                    <span className="text-yellow-600 text-lg md:text-xl">📊</span>
                  </div>
                  <div>
                    <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Tasks Completed</div>
                    <div className={`text-lg md:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                      {taskHistory?.data?.tasks?.length || 0}
                    </div>
                            </div>
                            </div>
                          </div>
                        </div>

            {/* VIP Benefits Card */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl md:rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green/20 to-green-500/20 border-coinbase-dark-border' : 'bg-gradient-to-r from-green-50 to-green-100 border-gray-200'} px-4 md:px-6 py-3 md:py-4 border-b`}>
                <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>VIP Benefits</h3>
              </div>
              <div className="p-4 md:p-6">
                <div className="text-center mb-4 md:mb-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-coinbase-green to-green-500 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <span className="text-2xl md:text-3xl text-white">👑</span>
                  </div>
                  <div className={`text-sm md:text-lg ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Higher VIP levels earn more</div>
                </div>
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Daily Rate:</span>
                    <span className="font-semibold text-coinbase-green">VIP Based</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Duration:</span>
                    <span className="font-semibold">1 Hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Frequency:</span>
                    <span className="font-semibold">Daily</span>
                  </div>
                          </div>
                              <button
                  onClick={() => navigate('/vip-selection')}
                  className="w-full mt-4 md:mt-6 bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white py-2.5 md:py-3 px-4 rounded-lg md:rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
                              >
                  Upgrade VIP Level
                              </button>
              </div>
                          </div>
                        </div>
                      </div>

        {/* Enhanced Task History Section */}
        {taskHistory?.data?.tasks?.length > 0 && (
          <div className="mt-12 md:mt-16">
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl md:rounded-3xl shadow-2xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/20 to-coinbase-green/20 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-4 md:px-8 py-4 md:py-6 border-b`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl md:rounded-2xl flex items-center justify-center">
                      <svg className="w-5 h-5 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg md:text-2xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Task History</h3>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm md:text-lg`}>Your completed daily earning sessions</p>
                    </div>
                  </div>
                  <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full ${isDark ? 'bg-coinbase-blue/20 text-coinbase-blue' : 'bg-blue-100 text-blue-600'} text-sm md:text-lg font-semibold`}>
                    {taskHistory.data.tasks.length} completed
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {taskHistory.data.tasks.slice(0, 6).map((userTask) => (
                    <div
                      key={userTask.id}
                      className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                    >
                      <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-coinbase-green to-green-500 rounded-lg md:rounded-xl flex items-center justify-center">
                          <span className="text-white text-lg md:text-xl">🚴</span>
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} text-sm md:text-lg`}>
                            {userTask.task.title}
                          </div>
                          <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                            {new Date(userTask.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                          Earnings deposited
                        </div>
                        <div className="font-bold text-coinbase-green text-lg md:text-xl">
                          +{formatCurrency(userTask.rewardEarned || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {taskHistory.data.tasks.length > 6 && (
                  <div className="text-center mt-6 md:mt-8">
                    <button className={`${isDark ? 'text-coinbase-text-secondary hover:text-coinbase-text-primary' : 'text-gray-600 hover:text-gray-900'} text-sm md:text-lg font-semibold transition-colors px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-gray-100 dark:hover:bg-coinbase-dark-tertiary`}>
                      View All Tasks ({taskHistory.data.tasks.length})
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Enhanced Congratulations Modal */}
      {showCongratulations && lastEarnings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border rounded-2xl md:rounded-3xl p-6 md:p-10 max-w-sm md:max-w-lg w-full text-center shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
            <div className="mb-6 md:mb-8">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-r from-coinbase-green to-green-500 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-lg">
                <span className="text-3xl md:text-5xl">🎉</span>
              </div>
              <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2 md:mb-3`}>Congratulations!</h2>
              <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-6 md:mb-8 text-sm md:text-lg px-2`}>Your daily task has been completed successfully! Earnings were deposited when you started the task.</p>
            </div>
            
            <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-8`}>
              <div className="text-2xl md:text-4xl font-bold text-coinbase-green mb-2 md:mb-3">
                +{formatCurrency(lastEarnings)}
              </div>
              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm md:text-lg`}>Added to your wallet</div>
            </div>
            
            {earningStatus?.data?.data?.cooldownRemaining && (
              <div className="mb-6 md:mb-8">
                <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm md:text-lg mb-3 md:mb-4`}>
                  Your next daily task will be available in:
                </div>
                <div className={`${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'} border rounded-xl md:rounded-2xl p-4 md:p-6`}>
                  <CountdownTimer
                    targetTime={new Date(Date.now() + earningStatus.data.data.cooldownRemaining.hours * 60 * 60 * 1000)}
                    size="large"
                    className="text-center"
                    showLabel={false}
                    onComplete={() => {
                      queryClient.invalidateQueries(['earningStatus']);
                      toast.success('🎉 Ready to start your next daily task!');
                      setShowCongratulations(false);
                    }}
                  />
                </div>
            </div>
            )}
            
            <button
              onClick={() => setShowCongratulations(false)}
              className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 text-sm md:text-lg"
            >
              Awesome! 🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;