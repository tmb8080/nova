import React from 'react';
import { Link } from 'react-router-dom';
import { calculateNextVipUpgrade, formatCurrency } from '../utils/vipCalculations';
import { useTheme } from '../contexts/ThemeContext';

const VipUpgradeProgress = ({ vipLevels, currentVip, totalDeposits, onUpgradeClick, onDepositClick, showUpgradeButton = true }) => {
  const { isDark } = useTheme();
  const upgradeInfo = calculateNextVipUpgrade(vipLevels, currentVip, totalDeposits);

  if (!upgradeInfo) {
    return null;
  }

  if (!upgradeInfo.hasNextLevel) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-coinbase-green rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏆</span>
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-2`}>
            Maximum VIP Level Achieved!
          </h3>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-4`}>
            Congratulations! You have reached the highest VIP level available.
          </p>
          <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
            <div className="text-2xl font-bold text-coinbase-green mb-2">
              {currentVip?.vipLevel?.name || 'VIP'}
            </div>
            <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
              You're earning maximum daily returns!
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { nextLevel, upgradeCost, fullVipCost, amountNeededForFullVip, canAfford, missingAmount, progressPercentage } = upgradeInfo;

  return (
    <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}>
      <div className="mb-6">
        <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center gap-2 mb-2`}>
          <div className="w-8 h-8 bg-coinbase-blue rounded-lg flex items-center justify-center">
            <span className="text-sm">🚀</span>
          </div>
          Next VIP Level
        </h3>
        <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
          Upgrade to {nextLevel.name} to increase your daily earnings
        </p>
      </div>
      <div className="space-y-4">
        {/* Next Level Info */}
        <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{nextLevel.name}</div>
            <div className="text-xl font-bold text-coinbase-blue">{formatCurrency(nextLevel.amount)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Daily Earning</div>
              <div className="font-bold text-coinbase-green">{formatCurrency(nextLevel.dailyEarning)}</div>
            </div>
            <div>
              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Monthly Earning</div>
              <div className="font-bold text-coinbase-green">{formatCurrency(nextLevel.dailyEarning * 30)}</div>
            </div>
          </div>
        </div>

        {/* Upgrade Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Upgrade Progress</span>
            <span className={`text-sm font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{progressPercentage.toFixed(1)}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className={`w-full ${isDark ? 'bg-coinbase-dark-border' : 'bg-gray-200'} rounded-full h-2`}>
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                canAfford ? 'bg-coinbase-green' : 'bg-coinbase-blue'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Progress Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Your Deposits</div>
              <div className={`font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{formatCurrency(totalDeposits)}</div>
            </div>
            <div>
              <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>VIP Level Cost</div>
              <div className={`font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>{formatCurrency(fullVipCost)}</div>
            </div>
          </div>

          {/* Missing Amount */}
          {!canAfford && (
            <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Amount Needed</div>
                  <div className="font-bold text-coinbase-blue">{formatCurrency(amountNeededForFullVip)}</div>
                </div>
                <div className="w-8 h-8 bg-coinbase-blue rounded-full flex items-center justify-center">
                  <span className="text-sm">💰</span>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {canAfford && (
            <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Ready to Upgrade!</div>
                  <div className="font-bold text-coinbase-green">You have sufficient deposits</div>
                </div>
                <div className="w-8 h-8 bg-coinbase-green rounded-full flex items-center justify-center">
                  <span className="text-sm">✅</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showUpgradeButton && (
          <div className="pt-4">
            {canAfford ? (
              <button 
                onClick={() => onUpgradeClick && onUpgradeClick(nextLevel)}
                className="w-full btn-primary flex items-center justify-center"
              >
                <span className="mr-2">🚀</span>
                Upgrade to {nextLevel.name}
              </button>
            ) : (
              onDepositClick ? (
                <button 
                  onClick={() => onDepositClick(nextLevel)}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <span className="mr-2">💳</span>
                  Deposit & Upgrade
                </button>
              ) : (
                <Link 
                  to="/vip-selection"
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <span className="mr-2">💳</span>
                  Deposit & Upgrade
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VipUpgradeProgress;
