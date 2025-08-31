import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { calculateNextVipUpgrade, formatCurrency, getVipColor } from '../utils/vipCalculations';

const VipUpgradeProgress = ({ vipLevels, currentVip, totalDeposits, onUpgradeClick, showUpgradeButton = true }) => {
  const upgradeInfo = calculateNextVipUpgrade(vipLevels, currentVip, totalDeposits);

  if (!upgradeInfo) {
    return null;
  }

  if (!upgradeInfo.hasNextLevel) {
    return (
      <Card className="backdrop-blur-xl bg-white/10 border border-green-500/30">
        <CardHeader className="text-center">
          <CardTitle className="text-green-400 flex items-center justify-center gap-2">
            <span className="text-2xl">🏆</span>
            Maximum VIP Level Achieved!
          </CardTitle>
          <CardDescription className="text-green-200">
            Congratulations! You have reached the highest VIP level available.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-green-500/20 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {currentVip?.vipLevel?.name || 'VIP'}
            </div>
            <div className="text-green-200">
              You're earning maximum daily returns!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { nextLevel, upgradeCost, fullVipCost, amountNeededForFullVip, canAfford, missingAmount, progressPercentage } = upgradeInfo;

  return (
    <Card className="backdrop-blur-xl bg-white/10 border border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center gap-2">
          <span className="text-xl">🚀</span>
          Next VIP Level
        </CardTitle>
        <CardDescription className="text-blue-200">
          Upgrade to {nextLevel.name} to increase your daily earnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Next Level Info */}
        <div className={`bg-gradient-to-r ${getVipColor(nextLevel.amount)} bg-opacity-20 rounded-lg p-4 border border-blue-400/30`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg font-bold text-white">{nextLevel.name}</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(nextLevel.amount)}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-300">Daily Earning</div>
              <div className="font-bold text-green-400">{formatCurrency(nextLevel.dailyEarning)}</div>
            </div>
            <div>
              <div className="text-gray-300">Monthly Earning</div>
              <div className="font-bold text-green-400">{formatCurrency(nextLevel.dailyEarning * 30)}</div>
            </div>
          </div>
        </div>

        {/* Upgrade Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Upgrade Progress</span>
            <span className="text-sm font-semibold text-white">{progressPercentage.toFixed(1)}%</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                canAfford ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-blue-500 to-blue-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          {/* Progress Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-300">Your Deposits</div>
              <div className="font-bold text-white">{formatCurrency(totalDeposits)}</div>
            </div>
            <div>
              <div className="text-gray-300">VIP Level Cost</div>
              <div className="font-bold text-white">{formatCurrency(fullVipCost)}</div>
            </div>
          </div>

          {/* Missing Amount */}
          {!canAfford && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-red-300 text-sm">Amount Needed</div>
                  <div className="font-bold text-red-400">{formatCurrency(amountNeededForFullVip)}</div>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {canAfford && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-300 text-sm">Ready to Upgrade!</div>
                  <div className="font-bold text-green-400">You have sufficient deposits</div>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showUpgradeButton && (
          <div className="flex gap-3 pt-2">
            {canAfford ? (
              <Button 
                onClick={() => onUpgradeClick && onUpgradeClick(nextLevel)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                <span className="mr-2">🚀</span>
                Upgrade to {nextLevel.name}
              </Button>
            ) : (
              <Button 
                asChild
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Link to="/vip-selection">
                  <span className="mr-2">💳</span>
                  Deposit & Upgrade
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VipUpgradeProgress;
