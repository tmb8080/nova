import React from 'react';

const VipStatus = ({ status, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const vipData = status?.data || {};
  const userVip = vipData.userVip;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">VIP Status</h2>
      
      {userVip ? (
        <div className="space-y-4">
          {/* Current VIP Level */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current Level</h3>
                <p className="text-2xl font-bold">{userVip.vipLevel.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Daily Earning</p>
                <p className="text-lg font-semibold">
                  ${parseFloat(userVip.vipLevel.dailyEarning || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* VIP Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Investment Amount</p>
              <p className="text-lg font-semibold text-gray-900">
                ${parseFloat(userVip.vipLevel.amount || 0).toFixed(2)}
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Daily Return</p>
              <p className="text-lg font-semibold text-green-600">
                {userVip.vipLevel.amount > 0 
                  ? ((parseFloat(userVip.vipLevel.dailyEarning) / parseFloat(userVip.vipLevel.amount)) * 100).toFixed(2)
                  : '0'
                }%
              </p>
            </div>
          </div>

          {/* Join Date */}
          <div className="text-center text-sm text-gray-500">
            Member since {new Date(userVip.createdAt).toLocaleDateString()}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">👑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No VIP Level Joined</h3>
          <p className="text-gray-500 mb-4">
            Join a VIP level to start earning daily income
          </p>
          <button
            onClick={() => window.location.href = '/vip-selection'}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            View VIP Levels
          </button>
        </div>
      )}
    </div>
  );
};

export default VipStatus;
