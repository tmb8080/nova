import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { withdrawalAPI } from '../services/api';

const WithdrawalHistoryPreview = () => {
  // Fetch recent withdrawals (limit to 5)
  const { data: withdrawals, isLoading, error } = useQuery({
    queryKey: ['withdrawals', { limit: 5, page: 1 }],
    queryFn: () => withdrawalAPI.getWithdrawals({ limit: 5, page: 1 }),
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error('WithdrawalHistoryPreview API Error:', error);
    }
  });

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'text-yellow-400 bg-yellow-400/20',
      'APPROVED': 'text-blue-400 bg-blue-400/20',
      'COMPLETED': 'text-green-400 bg-green-400/20',
      'REJECTED': 'text-red-400 bg-red-400/20',
      'FAILED': 'text-red-400 bg-red-400/20'
    };
    return colors[status] || 'text-gray-400 bg-gray-400/20';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': '⏳',
      'APPROVED': '✅',
      'COMPLETED': '🎉',
      'REJECTED': '❌',
      'FAILED': '💥'
    };
    return icons[status] || '❓';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-slate-700/50 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    console.error('WithdrawalHistoryPreview Error:', error);
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-sm">Failed to load withdrawal history</div>
        <div className="text-gray-500 text-xs mt-1">
          {error.message || 'Please try again later'}
        </div>
      </div>
    );
  }

  // Ensure recentWithdrawals is always an array with fallback handling
  let recentWithdrawals = [];
  
  if (withdrawals && withdrawals.success && Array.isArray(withdrawals.data)) {
    recentWithdrawals = withdrawals.data;
  } else if (Array.isArray(withdrawals?.data)) {
    recentWithdrawals = withdrawals.data;
  } else if (Array.isArray(withdrawals)) {
    recentWithdrawals = withdrawals;
  }
  
  // Debug logging (remove in production)
  console.log('WithdrawalHistoryPreview - withdrawals:', withdrawals);
  console.log('WithdrawalHistoryPreview - withdrawals.data:', withdrawals?.data);
  console.log('WithdrawalHistoryPreview - recentWithdrawals:', recentWithdrawals);
  console.log('WithdrawalHistoryPreview - isArray:', Array.isArray(recentWithdrawals));

  if (recentWithdrawals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">💸</div>
        <div className="text-gray-400 text-sm">No withdrawal history yet</div>
        <div className="text-gray-500 text-xs mt-1">Your withdrawal requests will appear here</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.isArray(recentWithdrawals) && recentWithdrawals.slice(0, 5).map((withdrawal) => (
        <div key={withdrawal.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/30 hover:bg-slate-700/50 transition-all duration-200">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getStatusColor(withdrawal.status)}`}>
              {getStatusIcon(withdrawal.status)}
            </div>
            <div>
              <div className="font-medium text-white">
                {withdrawal.currency} Withdrawal
              </div>
              <div className="text-sm text-gray-400">
                {formatDate(withdrawal.createdAt)} • {withdrawal.network || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {withdrawal.walletAddress.substring(0, 8)}...{withdrawal.walletAddress.substring(withdrawal.walletAddress.length - 6)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-lg text-white">
              {formatCurrency(withdrawal.amount)}
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(withdrawal.status)}`}>
              {withdrawal.status}
            </div>
          </div>
        </div>
      ))}
      
      {Array.isArray(recentWithdrawals) && recentWithdrawals.length >= 5 && (
        <div className="text-center pt-2">
          <div className="text-gray-400 text-xs">
            Showing 5 most recent withdrawals
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalHistoryPreview;
