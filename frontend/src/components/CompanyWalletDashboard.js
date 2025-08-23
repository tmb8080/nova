import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companyWalletAPI } from '../services/api';
import toast from 'react-hot-toast';

const CompanyWalletDashboard = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('ALL');
  const [transactionLimit, setTransactionLimit] = useState(20);

  // Fetch company wallet overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['companyWalletOverview'],
    queryFn: () => companyWalletAPI.getOverview(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch company wallet details (admin only)
  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['companyWalletDetails'],
    queryFn: () => companyWalletAPI.getDetails(),
    refetchInterval: 30000,
    enabled: false, // Only fetch when needed
  });

  // Fetch company wallet transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['companyWalletTransactions', selectedNetwork, transactionLimit],
    queryFn: () => companyWalletAPI.getTransactions({ 
      network: selectedNetwork === 'ALL' ? undefined : selectedNetwork,
      limit: transactionLimit 
    }),
    refetchInterval: 30000,
    enabled: false, // Only fetch when needed
  });

  // Initialize company wallets
  const handleInitializeWallets = async () => {
    try {
      await companyWalletAPI.initialize();
      toast.success('Company wallets initialized successfully!');
      // Refetch data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to initialize company wallets');
    }
  };

  // Format amount with currency
  const formatAmount = (amount, currency = 'USDT') => {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get network color
  const getNetworkColor = (network) => {
    const colors = {
      'BSC': 'bg-yellow-500',
      'POLYGON': 'bg-purple-600',
      'ETHEREUM': 'bg-purple-500',
      'TRON': 'bg-blue-500'
    };
    return colors[network] || 'bg-gray-500';
  };

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Company Wallet Dashboard</h1>
        <button
          onClick={handleInitializeWallets}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Initialize Wallets
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Balance</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatAmount(overview?.data?.totalBalance || 0)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Deposits</h3>
          <p className="text-3xl font-bold text-blue-600">
            {formatAmount(overview?.data?.totalDeposits || 0)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Withdrawals</h3>
          <p className="text-3xl font-bold text-red-600">
            {formatAmount(overview?.data?.totalWithdrawals || 0)}
          </p>
        </div>
      </div>

      {/* Wallet Addresses */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Wallet Addresses</h2>
          <p className="text-gray-600 mt-1">Company wallet addresses for each network</p>
        </div>
        
        <div className="p-6">
          {overview?.data?.wallets?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.data.wallets.map((wallet) => (
                <div key={wallet.network} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getNetworkColor(wallet.network)}`}>
                      {wallet.network}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatAmount(wallet.balance)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address:</label>
                      <p className="text-sm font-mono text-gray-800 break-all">
                        {wallet.address}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Last Updated:</label>
                      <p className="text-sm text-gray-800">
                        {formatDate(wallet.lastUpdated)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No wallet addresses configured</p>
              <button
                onClick={handleInitializeWallets}
                className="mt-2 text-blue-600 hover:text-blue-700 underline"
              >
                Click here to initialize wallets
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <p className="text-gray-600 mt-1">Company wallet transaction history</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="ALL">All Networks</option>
                <option value="BSC">BSC</option>
                <option value="POLYGON">Polygon</option>
                <option value="ETHEREUM">Ethereum</option>
                <option value="TRON">Tron</option>
              </select>
              
              <select
                value={transactionLimit}
                onChange={(e) => setTransactionLimit(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : transactions?.data?.data?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From/To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.data.data.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === 'DEPOSIT' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatAmount(tx.amount, tx.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNetworkColor(tx.network)} text-white`}>
                          {tx.network}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-500">From: </span>
                            <span className="font-mono text-xs break-all">
                              {tx.fromAddress || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">To: </span>
                            <span className="font-mono text-xs break-all">
                              {tx.toAddress || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyWalletDashboard;
