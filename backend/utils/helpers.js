const crypto = require('crypto');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure random string
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Format currency amount
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(amount);
};

// Format crypto amount
const formatCrypto = (amount, currency) => {
  const decimals = {
    'BTC': 8,
    'ETH': 8,
    'USDT': 6
  };
  
  return parseFloat(amount).toFixed(decimals[currency] || 8);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format (basic)
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

// Generate referral link
const generateReferralLink = (baseUrl, referralCode) => {
  return `${baseUrl}/register?ref=${referralCode}`;
};

// Calculate percentage
const calculatePercentage = (amount, percentage) => {
  return (parseFloat(amount) * parseFloat(percentage)).toFixed(8);
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Generate transaction reference
const generateTransactionRef = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TMB-${timestamp}-${random}`.toUpperCase();
};

// Validate crypto address (flexible validation for any wallet address)
const isValidCryptoAddress = (address, currency) => {
  // Basic validation - check if address is not empty and has reasonable length
  if (!address || typeof address !== 'string' || address.trim().length < 10) {
    return false;
  }

  const trimmedAddress = address.trim();
  
  // Common wallet address patterns
  const patterns = {
    // Bitcoin addresses
    'BTC': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
    
    // Ethereum-style addresses (0x + 40 hex characters) - used for ETH, USDT, USDC on multiple networks
    'ETH': /^0x[a-fA-F0-9]{40}$/,
    'USDT': /^0x[a-fA-F0-9]{40}$|^T[A-Za-z1-9]{33}$/, // Support both Ethereum-style and TRON addresses
    'USDC': /^0x[a-fA-F0-9]{40}$/, // USDC uses Ethereum-style addresses
    
    // TRON addresses (T + 33 characters)
    'TRON': /^T[A-Za-z1-9]{33}$/,
    
    // Generic patterns for common cryptocurrencies
    'GENERIC_ETH': /^0x[a-fA-F0-9]{40}$/, // Any Ethereum-style address
    'GENERIC_TRON': /^T[A-Za-z1-9]{33}$/, // Any TRON-style address
    'GENERIC_BTC': /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/ // Any Bitcoin-style address
  };
  
  // If we have a specific pattern for this currency, use it
  if (patterns[currency]) {
    return patterns[currency].test(trimmedAddress);
  }
  
  // If no specific pattern, check against common patterns
  // This allows any valid wallet address format
  return patterns['GENERIC_ETH'].test(trimmedAddress) || 
         patterns['GENERIC_TRON'].test(trimmedAddress) || 
         patterns['GENERIC_BTC'].test(trimmedAddress);
};

// Calculate time difference
const getTimeDifference = (date1, date2) => {
  const diff = Math.abs(new Date(date2) - new Date(date1));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes };
};

// Format date for display
const formatDate = (date, format = 'short') => {
  const options = {
    short: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  };
  
  return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(new Date(date));
};

// Generate pagination metadata
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

// Sleep function for delays
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Retry function with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
};

module.exports = {
  generateOTP,
  generateSecureToken,
  formatCurrency,
  formatCrypto,
  isValidEmail,
  isValidPhone,
  generateReferralLink,
  calculatePercentage,
  sanitizeInput,
  generateTransactionRef,
  isValidCryptoAddress,
  getTimeDifference,
  formatDate,
  generatePagination,
  sleep,
  retryWithBackoff
};
