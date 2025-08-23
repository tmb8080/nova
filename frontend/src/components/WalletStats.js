import React from 'react';

const WalletStats = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    }).format(amount || 0);
  };

  const walletData = stats?.data || {};

  return (
    <>
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-lg shadow-md text-white">
        <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
        <p className="text-3xl font-bold">{formatCurrency(walletData.balance)}</p>
        <p className="text-green-100 text-sm mt-1">Available for investment</p>
      </div>

      {/* Total Deposits Card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-lg shadow-md text-white">
        <h3 className="text-lg font-semibold mb-2">Total Deposits</h3>
        <p className="text-3xl font-bold">{formatCurrency(walletData.totalDeposits)}</p>
        <p className="text-blue-100 text-sm mt-1">All time deposits</p>
      </div>

      {/* Total Withdrawals Card */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 rounded-lg shadow-md text-white">
        <h3 className="text-lg font-semibold mb-2">Total Withdrawals</h3>
        <p className="text-3xl font-bold">{formatCurrency(walletData.totalWithdrawals)}</p>
        <p className="text-purple-100 text-sm mt-1">All time withdrawals</p>
      </div>
    </>
  );
};

export default WalletStats;
