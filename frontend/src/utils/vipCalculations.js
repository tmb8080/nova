/**
 * VIP Upgrade Calculation Utilities
 * Functions to calculate upgrade costs and next VIP level information
 */

/**
 * Calculate the amount needed to upgrade to the next VIP level
 * @param {Array} vipLevels - Array of all VIP levels
 * @param {Object} currentVip - Current user's VIP status
 * @param {number} totalDeposits - User's total deposits
 * @returns {Object} Upgrade information
 */
export const calculateNextVipUpgrade = (vipLevels, currentVip, totalDeposits) => {
  if (!vipLevels || !Array.isArray(vipLevels)) {
    return null;
  }

  // Sort VIP levels by amount (ascending)
  const sortedLevels = [...vipLevels].sort((a, b) => parseFloat(a.amount) - parseFloat(b.amount));
  
  let currentVipAmount = 0;
  let currentVipLevel = null;
  
  if (currentVip && currentVip.vipLevel) {
    currentVipAmount = parseFloat(currentVip.totalPaid);
    currentVipLevel = currentVip.vipLevel;
  }

  // Find the next VIP level
  const nextVipLevel = sortedLevels.find(level => {
    const levelAmount = parseFloat(level.amount);
    return levelAmount > currentVipAmount;
  });

  if (!nextVipLevel) {
    return {
      hasNextLevel: false,
      message: 'You are already at the highest VIP level!',
      nextLevel: null,
      upgradeCost: 0,
      canAfford: true,
      missingAmount: 0,
      progressPercentage: 100
    };
  }

  const nextLevelAmount = parseFloat(nextVipLevel.amount);
  const upgradeCost = nextLevelAmount - currentVipAmount;
  
  // Calculate amount needed based on full VIP cost minus total deposits
  const fullVipCost = nextLevelAmount;
  const amountNeededForFullVip = Math.max(0, fullVipCost - totalDeposits);
  
  const canAfford = totalDeposits >= fullVipCost;
  const missingAmount = Math.max(0, upgradeCost - totalDeposits);
  
  // Calculate progress percentage (how much of the full VIP cost they have)
  const progressPercentage = totalDeposits > 0 ? Math.min(100, (totalDeposits / fullVipCost) * 100) : 0;



  return {
    hasNextLevel: true,
    nextLevel: nextVipLevel,
    upgradeCost,
    fullVipCost,
    amountNeededForFullVip,
    canAfford,
    missingAmount,
    progressPercentage,
    currentVipLevel,
    currentVipAmount,
    totalDeposits
  };
};

/**
 * Get all available upgrade options for a user
 * @param {Array} vipLevels - Array of all VIP levels
 * @param {Object} currentVip - Current user's VIP status
 * @param {number} totalDeposits - User's total deposits
 * @returns {Array} Array of upgrade options
 */
export const getUpgradeOptions = (vipLevels, currentVip, totalDeposits) => {
  if (!vipLevels || !Array.isArray(vipLevels)) {
    return [];
  }

  const currentVipAmount = currentVip ? parseFloat(currentVip.totalPaid) : 0;
  
  return vipLevels
    .filter(level => parseFloat(level.amount) > currentVipAmount)
    .map(level => {
      const levelAmount = parseFloat(level.amount);
      const upgradeCost = levelAmount - currentVipAmount;
      const fullVipCost = levelAmount;
      const amountNeededForFullVip = Math.max(0, fullVipCost - totalDeposits);
      const canAfford = totalDeposits >= fullVipCost;
      const missingAmount = Math.max(0, upgradeCost - totalDeposits);
      const progressPercentage = totalDeposits > 0 ? Math.min(100, (totalDeposits / fullVipCost) * 100) : 0;

      return {
        ...level,
        upgradeCost,
        fullVipCost,
        amountNeededForFullVip,
        canAfford,
        missingAmount,
        progressPercentage,
        isNextLevel: level.amount === Math.min(...vipLevels.filter(l => parseFloat(l.amount) > currentVipAmount).map(l => parseFloat(l.amount)))
      };
    })
    .sort((a, b) => a.upgradeCost - b.upgradeCost);
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get VIP level color gradient based on amount
 * @param {number} amount - VIP level amount
 * @returns {string} CSS gradient class
 */
export const getVipColor = (amount) => {
  if (amount >= 25000) return 'from-purple-500 to-pink-500';
  if (amount >= 12000) return 'from-yellow-400 to-orange-500';
  if (amount >= 6000) return 'from-blue-500 to-purple-500';
  if (amount >= 5000) return 'from-green-500 to-blue-500';
  if (amount >= 2000) return 'from-gray-400 to-gray-600';
  if (amount >= 1500) return 'from-purple-400 to-blue-500';
  if (amount >= 1000) return 'from-yellow-500 to-orange-400';
  if (amount >= 400) return 'from-gray-300 to-gray-500';
  if (amount >= 180) return 'from-orange-400 to-red-500';
  return 'from-green-400 to-blue-400';
};
