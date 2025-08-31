import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const AdminWithdrawalHistory = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: withdrawalsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['adminWithdrawals', page, statusFilter, searchTerm],
    queryFn: async () => {
      const params = { 
        page, 
        limit: 20
      };
      
      // Only add filters if they have values
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      
      const response = await adminAPI.getWithdrawals(params);
      console.log('AdminWithdrawalHistory - API response:', response);
      return response;
    },
    keepPreviousData: true,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Extract data from API response with robust handling
  const withdrawals = useMemo(() => {
    if (!withdrawalsData) return [];
    
    // Debug logging
    console.log('AdminWithdrawalHistory - withdrawalsData:', withdrawalsData);
    console.log('AdminWithdrawalHistory - withdrawalsData type:', typeof withdrawalsData);
    console.log('AdminWithdrawalHistory - withdrawalsData.data:', withdrawalsData?.data);
    
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
  
  const pagination = withdrawalsData?.pagination || withdrawalsData?.data?.pagination || null;
  

  


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
        <Button onClick={() => window.location.reload()} className="bg-blue-500 hover:bg-blue-600">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Withdrawal History</h2>
          <Button
            onClick={() => {
              queryClient.invalidateQueries(['adminWithdrawals']);
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1"
          >
            🔄 Refresh
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, email, phone, wallet address..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
          />
          
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

      {/* Summary Stats */}
      {pagination && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white/10 rounded-lg p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-300">Total Withdrawals</div>
            <div className="text-lg md:text-2xl font-bold text-white">{pagination.totalItems}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-300">Current Page</div>
            <div className="text-lg md:text-2xl font-bold text-white">{pagination.currentPage}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-300">Total Pages</div>
            <div className="text-lg md:text-2xl font-bold text-white">{pagination.totalPages}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 md:p-4">
            <div className="text-xs md:text-sm text-gray-300">Items Per Page</div>
            <div className="text-lg md:text-2xl font-bold text-white">{pagination.itemsPerPage}</div>
          </div>
        </div>
      )}

      {/* Withdrawals List */}
      {!Array.isArray(withdrawals) || withdrawals.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-400">
            {!Array.isArray(withdrawals) ? 'Loading withdrawals...' : 'No withdrawals found'}
          </p>
          {!Array.isArray(withdrawals) && (
            <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg">
              <p className="text-yellow-400 text-sm">Debug: withdrawals is not an array</p>
              <p className="text-yellow-400 text-xs mt-2">Type: {typeof withdrawals}</p>
              <p className="text-yellow-400 text-xs">Value: {JSON.stringify(withdrawals)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.isArray(withdrawals) && withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="backdrop-blur-xl bg-white/10 border border-white/20">
              <div className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base md:text-lg font-semibold text-white">
                        {withdrawal.user.fullName || withdrawal.user.email || withdrawal.user.phone || 'User'}
                      </h3>
                      <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      {withdrawal.user.email && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📧</span>
                          <span className="text-white">{withdrawal.user.email}</span>
                        </div>
                      )}
                      {withdrawal.user.phone && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">📱</span>
                          <span className="text-white">{withdrawal.user.phone}</span>
                        </div>
                      )}
                      {withdrawal.user.fullName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">👤</span>
                          <span className="text-white">{withdrawal.user.fullName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">🆔</span>
                        <span className="text-white font-mono text-xs">ID: {withdrawal.user.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg md:text-xl font-bold text-white">
                      {formatCurrency(withdrawal.amount)}
                    </div>
                    <div className="text-sm text-gray-300">
                      {withdrawal.currency} • {withdrawal.network}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4">
                  <div>
                    <span className="text-gray-300 text-xs md:text-sm flex items-center gap-1">
                      <span>📅</span> Requested:
                    </span>
                    <p className="text-white text-xs md:text-sm mt-1">{formatDate(withdrawal.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-300 text-xs md:text-sm flex items-center gap-1">
                      <span>⚡</span> Processed:
                    </span>
                    <p className="text-white text-xs md:text-sm mt-1">
                      {withdrawal.processedAt ? formatDate(withdrawal.processedAt) : 'Not processed'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-300 text-xs md:text-sm flex items-center gap-1">
                      <span>🆔</span> Withdrawal ID:
                    </span>
                    <p className="text-white font-mono text-xs mt-1">{withdrawal.id.slice(0, 8)}...</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div>
                    <span className="text-gray-300 text-xs md:text-sm flex items-center gap-1">
                      <span>💳</span> Wallet Address:
                    </span>
                    <p className="text-white font-mono text-xs md:text-sm break-all mt-1">
                      {withdrawal.walletAddress}
                    </p>
                  </div>
                  {withdrawal.transactionHash && (
                    <div>
                      <span className="text-gray-300 text-xs md:text-sm flex items-center gap-1">
                        <span>🔗</span> Transaction Hash:
                      </span>
                      <p className="text-white font-mono text-xs md:text-sm break-all mt-1">
                        {withdrawal.transactionHash}
                      </p>
                    </div>
                  )}
                </div>
                
                {withdrawal.adminNotes && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300 text-xs md:text-sm flex items-center gap-1">
                      <span>📝</span> Admin Notes:
                    </span>
                    <p className="text-white text-xs md:text-sm mt-1">{withdrawal.adminNotes}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:space-x-2">
          <Button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 text-sm px-3 py-2"
          >
            Previous
          </Button>
          
          <span className="text-white text-sm">
            Page {page} of {pagination.totalPages}
          </span>
          
          <Button
            onClick={() => setPage(page + 1)}
            disabled={page === pagination.totalPages}
            className="bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 text-sm px-3 py-2"
          >
            Next
          </Button>
        </div>
      )}

      {/* Summary */}
      {pagination && (
        <div className="text-center text-xs md:text-sm text-gray-400">
          Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, pagination.totalItems)} of {pagination.totalItems} withdrawals
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawalHistory;
