import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { withdrawalAPI } from '../services/api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const WithdrawalHistory = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const {
    data: withdrawalsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['withdrawals', page, statusFilter],
    queryFn: () => withdrawalAPI.getWithdrawals({ page, limit: 10, status: statusFilter || undefined }),
    keepPreviousData: true,
    retry: 3,
    retryDelay: 1000
  });

  // Ensure withdrawals is always an array and handle different response structures
  const withdrawals = React.useMemo(() => {
    if (!withdrawalsData) return [];
    
    // Handle different possible response structures
    if (Array.isArray(withdrawalsData)) {
      return withdrawalsData;
    }
    
    if (withdrawalsData.data && Array.isArray(withdrawalsData.data)) {
      return withdrawalsData.data;
    }
    
    if (withdrawalsData.data && withdrawalsData.data.data && Array.isArray(withdrawalsData.data.data)) {
      return withdrawalsData.data.data;
    }
    
    // If it's an object with a data property that's not an array, it might be a single item
    if (withdrawalsData.data && typeof withdrawalsData.data === 'object' && !Array.isArray(withdrawalsData.data)) {
      return [withdrawalsData.data];
    }
    
    return [];
  }, [withdrawalsData]);
    
  const pagination = withdrawalsData?.pagination || withdrawalsData?.data?.pagination;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'COMPLETED':
        return 'bg-green-500/20 text-green-400';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-white/10 rounded-lg p-4">
              <div className="h-4 bg-white/20 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 mb-4">Failed to load withdrawal history</div>
        <div className="text-gray-400 text-sm mb-4">
          Error: {error.message || 'Unknown error occurred'}
        </div>
        <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Withdrawal History</h2>
        
        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && false && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 text-yellow-300 text-sm">
          <div>Debug Info:</div>
          <div>Raw Data Type: {typeof withdrawalsData}</div>
          <div>Raw Data: {JSON.stringify(withdrawalsData, null, 2)}</div>
          <div>Withdrawals Array Length: {withdrawals.length}</div>
          <div>Is Array: {Array.isArray(withdrawals).toString()}</div>
          <div>Pagination: {JSON.stringify(pagination, null, 2)}</div>
        </div>
      )}

      {/* Withdrawals List */}
      {withdrawals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">No withdrawals found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal, index) => (
            <Card key={withdrawal.id || index} className="backdrop-blur-xl bg-white/10 border border-white/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-white">
                      {formatCurrency(withdrawal.amount)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {withdrawal.currency} • {withdrawal.network || 'N/A'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-3 py-1 rounded-full ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {formatDate(withdrawal.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-gray-300 text-sm">Wallet Address:</span>
                    <p className="text-white font-mono text-sm break-all">
                      {withdrawal.walletAddress || 'N/A'}
                    </p>
                  </div>
                  {withdrawal.transactionHash && (
                    <div>
                      <span className="text-gray-300 text-sm">Transaction Hash:</span>
                      <p className="text-white font-mono text-sm break-all">
                        {withdrawal.transactionHash}
                      </p>
                    </div>
                  )}
                </div>
                
                {withdrawal.adminNotes && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300 text-sm">Admin Notes:</span>
                    <p className="text-white text-sm mt-1">{withdrawal.adminNotes}</p>
                  </div>
                )}
                
                {withdrawal.processedAt && (
                  <div className="mt-4 text-xs text-gray-400">
                    Processed on: {formatDate(withdrawal.processedAt)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
          >
            Previous
          </Button>
          
          <span className="text-white">
            Page {page} of {pagination.totalPages}
          </span>
          
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}

      {/* Summary */}
      {pagination && (
        <div className="text-center text-sm text-gray-400">
          Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.totalItems)} of {pagination.totalItems} withdrawals
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistory;
