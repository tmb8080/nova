import React from 'react';

const ReferralStats = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const referralData = stats?.data || {};

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Referral Statistics</h2>
      
      <div className="space-y-4">
        {/* Referral Code */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">Your Referral Code</h3>
              <p className="text-2xl font-bold font-mono">{referralData.referralCode || 'N/A'}</p>
            </div>
            <button
              onClick={() => {
                if (referralData.referralCode) {
                  navigator.clipboard.writeText(referralData.referralCode);
                  // You can add toast notification here
                }
              }}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-900">
              {referralData.totalReferrals || 0}
            </p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">VIP Commissions</p>
            <p className="text-2xl font-bold text-green-600">
              ${parseFloat(referralData.totalBonuses || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Referral Link</p>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-white p-2 rounded border text-sm font-mono text-gray-800 break-all">
              {referralData.referralLink || `${window.location.origin}/register?ref=${referralData.referralCode || 'CODE'}`}
            </div>
            <button
              onClick={() => {
                const link = referralData.referralLink || `${window.location.origin}/register?ref=${referralData.referralCode || 'CODE'}`;
                navigator.clipboard.writeText(link);
                // You can add toast notification here
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => window.location.href = '/referral'}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            View Referral Tree
          </button>
          
          <button
            onClick={() => window.location.href = '/referral/history'}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Referral History
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferralStats;
