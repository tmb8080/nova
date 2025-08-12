import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { walletAPI, vipAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user wallet stats
  const { data: walletStats, isLoading: walletLoading } = useQuery({
    queryKey: ['walletStats'],
    queryFn: () => walletAPI.getStats(),
  });

  // Fetch user transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', { limit: 10 }],
    queryFn: () => walletAPI.getTransactions({ limit: 10, page: 1 }),
  });

  // Fetch user VIP status
  const { data: userVipStatus, error: vipStatusError } = useQuery({
    queryKey: ['userVipStatus'],
    queryFn: () => vipAPI.getStatus(),
    onSuccess: (data) => {
      console.log('VIP Status loaded:', data);
    },
    onError: (error) => {
      console.error('Error loading VIP status:', error);
    }
  });



  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

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
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Simple Header */}
      <div className="shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-12">
            <h1 className="text-lg font-bold text-gray-900">Trinity Metro</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Account Balance */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">Account Balance</div>
                <div className="text-2xl font-bold text-gray-900">
                  {walletLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                  ) : (
                    formatCurrency(walletStats?.data?.balance || 0)
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Available for investment</div>
          </div>

          {/* Investment Tier */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">Investment Tier</div>
                <div className="text-lg font-bold text-gray-900">
                  {userVipStatus?.data?.data?.userVip?.vipLevel ? userVipStatus.data.data.userVip.vipLevel.name : 'Standard'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Current membership level</div>
          </div>

          {/* Daily Returns */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">Daily Returns</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(userVipStatus?.data?.data?.userVip?.vipLevel?.dailyEarning || 0)}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Guaranteed daily earnings</div>
          </div>

          {/* Total Returns */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">Total Returns</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(userVipStatus?.data?.data?.userVip?.totalPaid || 0)}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">Lifetime earnings</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deposit Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Deposit Funds
                </CardTitle>
                <CardDescription>
                  Add funds to your account to start investing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Payment Network Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Network
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* TronLink Option */}
                      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800">TronLink</h4>
                            <p className="text-sm text-blue-600">USDT (TRC20)</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* MetaMask Option */}
                      <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4 cursor-pointer hover:border-orange-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-800">MetaMask</h4>
                            <p className="text-sm text-orange-600">USDT (ERC20)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deposit Amount (USDT)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-sm"
                    />
                  </div>

                  {/* TronLink Deposit Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-blue-800">TronLink Deposit</h4>
                        <p className="text-sm text-blue-600">USDT via TRC20 Network</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-600">Network</p>
                        <p className="font-semibold text-blue-800">TRC20</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-600 mb-2">Deposit Address (TRC20):</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <code className="flex-1 bg-gray-50 px-3 py-3 sm:py-2 rounded border text-xs sm:text-sm font-mono break-all">
                          TQn9Y2khDD95J42FQtQTdwVVRqQqHZxK9K
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto px-4 py-2 sm:py-1 border-blue-300 text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            navigator.clipboard.writeText('TQn9Y2khDD95J42FQtQTdwVVRqQqHZxK9K');
                            toast.success('TronLink address copied!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* MetaMask Deposit Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-orange-800">MetaMask Deposit</h4>
                        <p className="text-sm text-orange-600">USDT via ERC20 Network</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-orange-600">Network</p>
                        <p className="font-semibold text-orange-800">ERC20</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded-lg border border-orange-100">
                      <p className="text-sm text-gray-600 mb-2">Deposit Address (ERC20):</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <code className="flex-1 bg-gray-50 px-3 py-3 sm:py-2 rounded border text-xs sm:text-sm font-mono break-all">
                          0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto px-4 py-2 sm:py-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => {
                            navigator.clipboard.writeText('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
                            toast.success('MetaMask address copied!');
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                    
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Important:</p>
                        <ul className="mt-1 space-y-1">
                          <li>• TronLink: Send USDT via TRC20 network (lower fees)</li>
                          <li>• MetaMask: Send USDT via ERC20 network</li>
                          <li>• Minimum deposit amount: $30</li>
                          <li>• Deposits are credited within 10-30 minutes</li>
                          <li>• Double-check the address and network before sending</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Withdraw Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Withdraw Funds
                </CardTitle>
                <CardDescription>
                  Withdraw your earnings to your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-red-800">Available Balance</h4>
                        <p className="text-2xl font-bold text-red-900">
                          {walletLoading ? '...' : formatCurrency(walletStats?.data?.balance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Withdrawal Network Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Withdrawal Network
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* TronLink Withdrawal Option */}
                      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-blue-800">TronLink</h4>
                            <p className="text-sm text-blue-600">USDT (TRC20) - Lower Fees</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* MetaMask Withdrawal Option */}
                      <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4 cursor-pointer hover:border-orange-400 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-800">MetaMask</h4>
                            <p className="text-sm text-orange-600">USDT (ERC20)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Withdrawal Address
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your USDT wallet address"
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Withdrawal Amount (USDT)
                      </label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base sm:text-sm"
                      />
                    </div>
                    
                                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                       <div className="flex items-start">
                         <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <div className="text-sm text-blue-800">
                           <p className="font-medium">Withdrawal Info:</p>
                           <ul className="mt-1 space-y-1">
                             <li>• Minimum withdrawal: $10</li>
                             <li>• Processing time: 1-24 hours</li>
                             <li>• TronLink (TRC20): $1 USDT fee</li>
                             <li>• MetaMask (ERC20): $5 USDT fee</li>
                             <li>• Daily withdrawal limit: $1000</li>
                           </ul>
                         </div>
                       </div>
                     </div>
                    
                                         <Button 
                       className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white py-3 sm:py-2 text-base sm:text-sm"
                       disabled={walletLoading || (walletStats?.data?.balance || 0) < 10}
                     >
                       {walletLoading ? 'Loading...' : 'Withdraw Funds'}
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Overview of your account activity and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {walletLoading ? '...' : formatCurrency(walletStats?.data?.balance || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {transactionsLoading ? '...' : transactions?.data?.transactions?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Transactions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatDate(user?.createdAt || new Date())}
                    </div>
                    <div className="text-sm text-gray-600">Member Since</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Your latest account activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 animate-pulse">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                ) : transactions?.data?.transactions?.length > 0 ? (
                  <div className="space-y-4">
                    {transactions.data.transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                        <div className="text-sm font-medium">
                          <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500">No transactions yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Start investing to see your transaction history
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-13z" />
                  </svg>
                  Download Statement
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Help & Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </Button>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Verified</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phone Verified</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">KYC Status</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
