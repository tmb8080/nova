import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import MobileBottomNav from '../components/MobileBottomNav';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [depositAdminNotes, setDepositAdminNotes] = useState('');
  const [depositTransactionHash, setDepositTransactionHash] = useState('');

  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['dashboard', 'deposits', 'withdrawals', 'users', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (location.pathname === '/admin' && !location.search) {
      // If we're on /admin without any search params, set to dashboard
      setActiveTab('dashboard');
    }
  }, [location.search, location.pathname]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin?tab=${tabId}`);
    }
  };

  // Fetch admin data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await adminAPI.getStats();
      console.log('Stats response:', response);
      return response.data.data; // Return the nested data from the API response
    },
    enabled: !!user?.isAdmin, // Only run if user is admin
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  const { data: pendingWithdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['pendingWithdrawals'],
    queryFn: async () => {
      const response = await adminAPI.getPendingWithdrawals();
      console.log('Pending withdrawals response:', response);
      return response.data.data || response.data; // Handle both nested and direct responses
    },
    enabled: !!user?.isAdmin, // Only run if user is admin
    refetchInterval: 15000, // Auto-refresh every 15 seconds for withdrawals
    refetchIntervalInBackground: true,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const response = await adminAPI.getUsers({ page: 1, limit: 50 });
      console.log('Users response:', response);
      return response.data.data || response.data; // Handle both nested and direct responses
    },
    enabled: !!user?.isAdmin, // Only run if user is admin
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const response = await adminAPI.getSettings();
      console.log('Settings response:', response);
      return response.data.data || response.data; // Handle both nested and direct responses
    },
    enabled: !!user?.isAdmin, // Only run if user is admin
  });

  // Fetch deposits data
  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ['adminDeposits'],
    queryFn: async () => {
      const response = await adminAPI.getDeposits({ page: 1, limit: 50 });
      console.log('Deposits response:', response);
      return response.data.data; // Return the nested data from the API response
    },
    enabled: !!user?.isAdmin, // Only run if user is admin
    refetchInterval: 10000, // Auto-refresh every 10 seconds for deposits
    refetchIntervalInBackground: true,
  });

  const { data: pendingDeposits, isLoading: pendingDepositsLoading } = useQuery({
    queryKey: ['pendingDeposits'],
    queryFn: async () => {
      const response = await adminAPI.getPendingDeposits();
      console.log('Pending deposits response:', response);
      return response.data.data; // Return the nested data from the API response
    },
    enabled: !!user?.isAdmin, // Only run if user is admin
    refetchInterval: 5000, // Auto-refresh every 5 seconds for pending deposits
    refetchIntervalInBackground: true,
  });

  // Mutations
  const processWithdrawalMutation = useMutation({
    mutationFn: ({ id, action, adminNotes, transactionHash }) => 
      adminAPI.processWithdrawal(id, { action, adminNotes, transactionHash }),
    onSuccess: () => {
      toast.success('Withdrawal processed successfully!');
      queryClient.invalidateQueries(['pendingWithdrawals']);
      setSelectedWithdrawal(null);
      setAdminNotes('');
      setTransactionHash('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId) => adminAPI.toggleUserStatus(userId),
    onSuccess: () => {
      toast.success('User status updated successfully!');
      queryClient.invalidateQueries(['adminUsers']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (settings) => adminAPI.updateSettings(settings),
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries(['adminSettings']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  const processDepositMutation = useMutation({
    mutationFn: ({ id, action, adminNotes, transactionHash }) => 
      adminAPI.processDeposit(id, { action, adminNotes, transactionHash }),
    onSuccess: () => {
      toast.success('Deposit processed successfully!');
      queryClient.invalidateQueries(['pendingDeposits']);
      queryClient.invalidateQueries(['adminDeposits']);
      setSelectedDeposit(null);
      setDepositAdminNotes('');
      setDepositTransactionHash('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process deposit');
    },
  });

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">You don't have admin privileges.</p>
          <Button onClick={() => logout()}>Logout</Button>
        </div>
      </div>
    );
  }

  const handleProcessWithdrawal = (action) => {
    if (!selectedWithdrawal) return;

    processWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      action,
      adminNotes,
      transactionHash: action === 'approve' ? transactionHash : undefined
    });
  };

  const handleProcessDeposit = (action) => {
    if (!selectedDeposit) return;

    processDepositMutation.mutate({
      id: selectedDeposit.id,
      action,
      adminNotes: depositAdminNotes,
      transactionHash: action === 'approve' ? depositTransactionHash : undefined
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💰' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user?.fullName}</span>
              <Button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>



      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">System Overview</h2>
              <Button
                onClick={() => {
                  queryClient.invalidateQueries(['adminStats']);
                  queryClient.invalidateQueries(['pendingWithdrawals']);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                🔄 Refresh Data
              </Button>
            </div>
            
            {statsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/10 rounded-lg p-6">
                      <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
                      <div className="h-8 bg-white/20 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
                         ) : (
               <div className="space-y-6">
                 {/* Main Stats Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">Total Users</div>
                     <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
                     <div className="text-xs text-gray-400 mt-1">
                       {stats?.activeUsers || 0} active • {stats?.todayUsers || 0} today
                     </div>
                   </div>
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">Total Deposits</div>
                     <div className="text-2xl font-bold text-white">{formatCurrency(stats?.totalDeposits || 0)}</div>
                     <div className="text-xs text-gray-400 mt-1">
                       {stats?.depositCount || 0} transactions • {formatCurrency(stats?.todayDeposits || 0)} today
                     </div>
                   </div>
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">Pending Withdrawals</div>
                     <div className="text-2xl font-bold text-yellow-400">{formatCurrency(stats?.pendingWithdrawals || 0)}</div>
                     <div className="text-xs text-gray-400 mt-1">
                       {stats?.pendingWithdrawalCount || 0} requests
                     </div>
                   </div>
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">System Balance</div>
                     <div className="text-2xl font-bold text-green-400">{formatCurrency(stats?.systemBalance || 0)}</div>
                     <div className="text-xs text-gray-400 mt-1">
                       Net position
                     </div>
                   </div>
                 </div>

                 {/* Detailed Stats Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">VIP Users</div>
                     <div className="text-xl font-bold text-purple-400">{stats?.vipUsers || 0}</div>
                     <div className="text-xs text-gray-400 mt-1">Active VIP members</div>
                   </div>
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">Total Earnings</div>
                     <div className="text-xl font-bold text-blue-400">{formatCurrency(stats?.totalEarnings || 0)}</div>
                     <div className="text-xs text-gray-400 mt-1">User earnings</div>
                   </div>
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm">Referral Bonuses</div>
                     <div className="text-xl font-bold text-emerald-400">{formatCurrency(stats?.totalReferralBonus || 0)}</div>
                     <div className="text-xs text-gray-400 mt-1">Total paid</div>
                   </div>
                 </div>

                 {/* Transaction Summary */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm mb-4">Deposit Summary</div>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-gray-400 text-sm">Confirmed:</span>
                         <span className="text-white font-medium">{formatCurrency(stats?.confirmedDeposits || 0)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400 text-sm">Pending:</span>
                         <span className="text-yellow-400 font-medium">{formatCurrency(stats?.pendingDeposits || 0)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400 text-sm">Today:</span>
                         <span className="text-green-400 font-medium">{formatCurrency(stats?.todayDeposits || 0)}</span>
                       </div>
                     </div>
                   </div>
                   <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                     <div className="text-gray-300 text-sm mb-4">Withdrawal Summary</div>
                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-gray-400 text-sm">Completed:</span>
                         <span className="text-white font-medium">{formatCurrency(stats?.completedWithdrawals || 0)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400 text-sm">Pending:</span>
                         <span className="text-yellow-400 font-medium">{formatCurrency(stats?.pendingWithdrawals || 0)}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-400 text-sm">Today:</span>
                         <span className="text-red-400 font-medium">{formatCurrency(stats?.todayWithdrawals || 0)}</span>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Pending Withdrawals</h2>
            
            {withdrawalsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="h-4 bg-white/20 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
                         ) : !pendingWithdrawals?.data || pendingWithdrawals.data.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-400">No pending withdrawals</p>
              </div>
                         ) : (
               <div className="space-y-4">
                 {(Array.isArray(pendingWithdrawals?.data) ? pendingWithdrawals.data : []).map((withdrawal) => (
                  <div key={withdrawal.id} className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{withdrawal.user.fullName}</h3>
                        <p className="text-gray-300">{withdrawal.user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{formatCurrency(withdrawal.amount)}</div>
                        <div className="text-sm text-gray-300">{withdrawal.currency} • {withdrawal.network}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-300 text-sm">Wallet Address:</span>
                        <p className="text-white font-mono text-sm break-all">{withdrawal.walletAddress}</p>
                      </div>
                      <div>
                        <span className="text-gray-300 text-sm">Requested:</span>
                        <p className="text-white">{formatDate(withdrawal.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Process
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'deposits' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Deposit Management</h2>
            
            {depositsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="h-4 bg-white/20 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !deposits || deposits.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <p className="text-gray-400">No deposits found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(Array.isArray(deposits) ? deposits : []).map((deposit) => (
                  <div key={deposit.id} className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{deposit.user.fullName}</h3>
                        <p className="text-gray-300">{deposit.user.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-white">{formatCurrency(deposit.amount)}</div>
                        <div className="text-sm text-gray-300">{deposit.currency} • {deposit.network}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          deposit.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                          deposit.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {deposit.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-gray-300 text-sm">Transaction Hash:</span>
                        <p className="text-white font-mono text-sm break-all">{deposit.transactionHash || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-gray-300 text-sm">Submitted:</span>
                        <p className="text-white">{formatDate(deposit.createdAt)}</p>
                      </div>
                    </div>
                    
                    {deposit.adminNotes && (
                      <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <span className="text-gray-300 text-sm">Admin Notes:</span>
                        <p className="text-white text-sm mt-1">{deposit.adminNotes}</p>
                      </div>
                    )}
                    
                    {deposit.status === 'PENDING' && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setSelectedDeposit(deposit)}
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          Process
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            
            {usersLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="h-4 bg-white/20 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
                         ) : (
               <div className="space-y-4">
                 {(Array.isArray(users?.data) ? users.data : []).map((user) => (
                  <div key={user.id} className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{user.fullName}</h3>
                        <p className="text-gray-300">{user.email}</p>
                        <p className="text-sm text-gray-400">Joined: {formatDate(user.createdAt)}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-300">Balance</div>
                          <div className="text-lg font-bold text-white">{formatCurrency(user.wallet?.balance || 0)}</div>
                        </div>
                        <Button
                          onClick={() => toggleUserStatusMutation.mutate(user.id)}
                          disabled={toggleUserStatusMutation.isLoading}
                          className={`${
                            user.isActive 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {user.isActive ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">System Settings</h2>
            
            {settingsLoading ? (
              <div className="animate-pulse">
                <div className="bg-white/10 rounded-lg p-6">
                  <div className="h-4 bg-white/20 rounded w-1/4 mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-3 bg-white/20 rounded w-1/2"></div>
                    <div className="h-3 bg-white/20 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-white/10 rounded-lg p-6 border border-white/20">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const settings = {
                    minDepositAmount: parseFloat(formData.get('minDepositAmount')),
                    minWithdrawalAmount: parseFloat(formData.get('minWithdrawalAmount')),
                    isDepositEnabled: formData.get('isDepositEnabled') === 'on',
                    isWithdrawalEnabled: formData.get('isWithdrawalEnabled') === 'on',
                  };
                  updateSettingsMutation.mutate(settings);
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Deposit Amount
                      </label>
                      <input
                        type="number"
                        name="minDepositAmount"
                        defaultValue={settings?.data?.minDepositAmount || 30}
                        step="0.01"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Withdrawal Amount
                      </label>
                      <input
                        type="number"
                        name="minWithdrawalAmount"
                        defaultValue={settings?.data?.minWithdrawalAmount || 20}
                        step="0.01"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isDepositEnabled"
                          defaultChecked={settings?.data?.isDepositEnabled}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-300">Enable Deposits</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="isWithdrawalEnabled"
                          defaultChecked={settings?.data?.isWithdrawalEnabled}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-300">Enable Withdrawals</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isLoading}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {updateSettingsMutation.isLoading ? 'Updating...' : 'Update Settings'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Withdrawal Processing Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Process Withdrawal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional notes about this withdrawal"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Hash (for approval)
                  </label>
                  <input
                    type="text"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash if approving"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => handleProcessWithdrawal('approve')}
                  disabled={processWithdrawalMutation.isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleProcessWithdrawal('reject')}
                  disabled={processWithdrawalMutation.isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setSelectedWithdrawal(null);
                    setAdminNotes('');
                    setTransactionHash('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Processing Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Process Deposit</h3>
              
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm">User:</span>
                    <span className="text-white font-medium">{selectedDeposit.user.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm">Amount:</span>
                    <span className="text-white font-bold">{formatCurrency(selectedDeposit.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm">Currency:</span>
                    <span className="text-white">{selectedDeposit.currency} • {selectedDeposit.network}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={depositAdminNotes}
                    onChange={(e) => setDepositAdminNotes(e.target.value)}
                    placeholder="Optional notes about this deposit"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Transaction Hash (for approval)
                  </label>
                  <input
                    type="text"
                    value={depositTransactionHash}
                    onChange={(e) => setDepositTransactionHash(e.target.value)}
                    placeholder="Enter transaction hash if approving"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button
                  onClick={() => handleProcessDeposit('approve')}
                  disabled={processDepositMutation.isLoading}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleProcessDeposit('reject')}
                  disabled={processDepositMutation.isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setSelectedDeposit(null);
                    setDepositAdminNotes('');
                    setDepositTransactionHash('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};

export default AdminPanel;
