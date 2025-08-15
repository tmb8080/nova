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
  const [activeTab, setActiveTab] = useState('earning'); // 'earning' or 'tasks'

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

  // Fetch available tasks
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['availableTasks'],
    queryFn: taskAPI.getAvailableTasks,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch task history
  const { data: taskHistory, isLoading: historyLoading } = useQuery({
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

  // Start task mutation
  const startTaskMutation = useMutation({
    mutationFn: ({ taskId }) => taskAPI.startTask(taskId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.data.message);
        queryClient.invalidateQueries(['availableTasks']);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start task');
    }
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId }) => taskAPI.completeTask(taskId),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.data.message);
        queryClient.invalidateQueries(['availableTasks']);
        queryClient.invalidateQueries(['taskHistory']);
        queryClient.invalidateQueries(['walletStats']);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete task');
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

  const getTaskIcon = (taskType) => {
    const icons = {
      DAILY_LOGIN: '🔐',
      REFERRAL: '👥',
      DEPOSIT: '💰',
      VIP_UPGRADE: '👑',
      SOCIAL_SHARE: '📱',
      SURVEY: '📝',
      WATCH_VIDEO: '📺',
      CUSTOM: '🎯'
    };
    return icons[taskType] || '📋';
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'text-yellow-400',
      IN_PROGRESS: 'text-blue-400',
      COMPLETED: 'text-green-400',
      FAILED: 'text-red-400'
    };
    return colors[status] || 'text-gray-400';
  };

  const getStatusBg = (status) => {
    const colors = {
      PENDING: 'bg-yellow-500/20 border-yellow-500/30',
      IN_PROGRESS: 'bg-blue-500/20 border-blue-500/30',
      COMPLETED: 'bg-green-500/20 border-green-500/30',
      FAILED: 'bg-red-500/20 border-red-500/30'
    };
    return colors[status] || 'bg-gray-500/20 border-gray-500/30';
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
            Tasks & Rewards
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto px-4">
            Complete tasks to earn additional rewards and bonuses. Start your earning journey today!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-800/50 rounded-xl p-1 backdrop-blur-sm border border-slate-700/50">
            <button
              onClick={() => setActiveTab('earning')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'earning'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              🚴 Earning Sessions
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'tasks'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              📋 Daily Tasks
            </button>
          </div>
        </div>

        {/* Earning Sessions Tab */}
        {activeTab === 'earning' && (
          <div className="space-y-8">
            {/* Modern Daily Earning Session */}
            <div className="relative">
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
                      <div className="bg-gradient-to-br from-emerald-900/50 to-green-900/50 border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5"></div>
                        
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
                      </div>
                      
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6">Ready to Start Earning</h3>
                      <p className="text-gray-300 mb-8 sm:mb-12 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed px-4">
                        {earningStatus?.data?.data?.message || 'Click the button below to start your 24-hour earning cycle and begin accumulating profits automatically'}
                      </p>
                      
                      <Button
                        size="lg"
                        onClick={() => startEarningMutation.mutate()}
                        disabled={startEarningMutation.isLoading}
                        className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-2xl font-bold transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
                      >
                        {startEarningMutation.isLoading ? 'Starting...' : '🚀 Start Earning'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-8">
            {/* Task Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300 mb-2">
                    {tasksData?.data?.length || 0}
                  </div>
                  <div className="text-gray-300 text-sm">Available Tasks</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300 mb-2">
                    {taskHistory?.data?.completedCount || 0}
                  </div>
                  <div className="text-gray-300 text-sm">Completed Tasks</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-6 border border-purple-500/30 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300 mb-2">
                    {formatCurrency(taskHistory?.data?.totalEarned || 0)}
                  </div>
                  <div className="text-gray-300 text-sm">Total Earned</div>
                </div>
              </div>
            </div>

            {/* Available Tasks */}
            <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Available Tasks</CardTitle>
                <CardDescription className="text-gray-300">
                  Complete tasks to earn rewards that will be added to your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-24 bg-gray-700 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : tasksData?.data?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tasksData.data.map((task) => (
                      <div
                        key={task.id}
                        className={`p-6 rounded-xl border backdrop-blur-sm transition-all duration-200 ${getStatusBg(task.status)}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getTaskIcon(task.type)}</div>
                            <div>
                              <h3 className="font-semibold text-white">{task.title}</h3>
                              <p className="text-sm text-gray-300">{task.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-400">
                              {formatCurrency(task.reward)}
                            </div>
                            <div className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            {task.isRepeatable && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs">
                                🔄 Repeatable
                              </span>
                            )}
                          </div>
                          <div className="space-x-2">
                            {task.canStart && (
                              <Button
                                size="sm"
                                onClick={() => startTaskMutation.mutate({ taskId: task.id })}
                                disabled={startTaskMutation.isLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Start
                              </Button>
                            )}
                            {task.canComplete && (
                              <Button
                                size="sm"
                                onClick={() => completeTaskMutation.mutate({ taskId: task.id })}
                                disabled={completeTaskMutation.isLoading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Complete
                              </Button>
                            )}
                            {task.status === 'COMPLETED' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📋</div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Tasks Available</h3>
                    <p className="text-gray-300">Check back later for new tasks and rewards!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task History */}
            {taskHistory?.data?.tasks?.length > 0 && (
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 shadow-2xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-white">Task History</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your completed tasks and earned rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {taskHistory.data.tasks.slice(0, 5).map((userTask) => (
                      <div
                        key={userTask.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-slate-700/30 border border-slate-600/30"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">{getTaskIcon(userTask.task.type)}</div>
                          <div>
                            <div className="font-medium text-white">{userTask.task.title}</div>
                            <div className="text-sm text-gray-300">
                              Completed: {new Date(userTask.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">
                            +{formatCurrency(userTask.rewardEarned)}
                          </div>
                          <div className="text-xs text-gray-400">Added to wallet</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
