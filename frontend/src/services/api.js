import axios from 'axios';

// Configure axios defaults
const API_BASE_URL ="http://novanova.online/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  verifyEmail: (otp) => api.post('/auth/verify-email', { otp }),
  resendVerification: () => api.post('/auth/resend-verification'),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

// Wallet API
export const walletAPI = {
  getStats: () => api.get('/wallet/stats'),
  getProjectedEarnings: (params) => api.get('/wallet/projected-earnings', { params }),
  getCompanyWalletAddresses: () => api.get('/wallet/company-addresses'),
  getAdminSettings: () => api.get('/admin/settings'),
};

// Deposit API
export const depositAPI = {
  createDeposit: (data) => api.post('/deposit/create', data),
  getDeposits: (params) => api.get('/deposit/history', { params }),
  getMyDeposits: (params) => api.get('/deposit/my-deposits', { params }),
  getDepositDetails: (id) => api.get(`/deposit/${id}`),
  getUsdtAddresses: () => api.get('/deposit/usdt/addresses'),
  createUsdtDeposit: (data) => api.post('/deposit/usdt/create', data),
  preVerifyTransaction: (data) => api.post('/deposit/pre-verify', data),
  getTransactionDetails: (data) => api.post('/deposit/transaction-details', data),
  autoFillTransaction: (data) => api.post('/deposit/auto-fill-transaction', data),
  checkTransactionAllNetworks: (data) => api.post('/admin/check-transaction-all-networks', data),
  getPendingCount: () => api.get('/deposit/pending-count'),
  updateTransactionHash: (depositId, transactionHash) => api.patch(`/deposit/${depositId}/transaction-hash`, { transactionHash }),
  verifyDeposit: (depositId) => api.post(`/deposit/${depositId}/verify`),
  getAutomaticDetectionStatus: () => api.get('/deposit/automatic-detection-status'),
};

// Withdrawal API
export const withdrawalAPI = {
  createWithdrawal: (data) => api.post('/withdrawal/request', data),
  requestWithdrawal: (data) => api.post('/withdrawal/request', data),
  getWithdrawals: (params) => api.get('/withdrawal/history', { params }),
  getWithdrawalDetails: (id) => api.get(`/withdrawal/${id}`),
  getNetworkFees: (currency) => api.get(`/withdrawal/network-fees/${currency}`),
  previewFee: (amount) => api.post('/withdrawal/preview-fee', { amount }),
  getConfig: () => api.get('/withdrawal/config'),
};

// Referral API
export const referralAPI = {
  getStats: () => api.get('/referral/stats'),
  getHistory: (params) => api.get('/referral/history', { params }),
  getBonuses: (params) => api.get('/referral/bonuses', { params }),
  getTree: () => api.get('/referral/tree'),
  validateCode: (code) => api.get(`/referral/validate/${code}`),
};

// VIP API
export const vipAPI = {
  getLevels: () => api.get('/vip/levels'),
  joinVip: (vipLevelId) => api.post('/vip/join', { vipLevelId }),
  getStatus: () => api.get('/vip/status'),
  startEarning: () => api.post('/vip/start-earning'),
};

// Task API
export const taskAPI = {
  getEarningStatus: () => api.get('/tasks/earning-status'),
  startEarning: () => api.post('/tasks/start-earning'),
  getEarningHistory: () => api.get('/tasks/earning-history'),
  getAvailableTasks: () => api.get('/tasks/available'),
  startTask: (taskId) => api.post(`/tasks/start/${taskId}`),
  getTaskHistory: () => api.get('/tasks/history'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getDeposits: (params) => api.get('/admin/deposits', { params }),
  getPendingDeposits: () => api.get('/admin/deposits/pending'),
  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
  getWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  getWithdrawalHistory: (params) => api.get('/admin/withdrawals/history', { params }),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
  getVipMembers: (params) => api.get('/admin/vip-members', { params }),
  getReferralTree: (userId, depth = 3) => api.get(`/admin/users/${userId}/referral-tree`, { params: { depth } }),
  processWithdrawal: (withdrawalId, action, data) => api.patch(`/admin/withdrawals/${withdrawalId}/process`, { action, ...data }),
  updateWithdrawal: (withdrawalId, data) => api.put(`/admin/withdrawals/${withdrawalId}`, data),
  processDeposit: (depositId, action, data) => api.post(`/admin/deposits/${depositId}/${action}`, data),
  verifyTransaction: (data) => api.post('/admin/verify-transaction', data),
  checkTransactionBlockchain: (data) => api.post('/admin/check-transaction-blockchain', data),
  checkTransactionAllNetworks: (data) => api.post('/admin/check-transaction-all-networks', data),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  // VIP management
  getVipLevels: () => api.get('/admin/vip-levels'),
  getVipLevel: (id) => api.get(`/admin/vip-levels/${id}`),
  createVipLevel: (data) => api.post('/admin/vip-levels', data),
  updateVipLevel: (id, data) => api.put(`/admin/vip-levels/${id}`, data),
  deleteVipLevel: (id) => api.delete(`/admin/vip-levels/${id}`),
  // Withdrawal fee tiers
  getWithdrawalFeeTiers: () => api.get('/admin/withdrawal-fee-tiers'),
  createWithdrawalFeeTier: (data) => api.post('/admin/withdrawal-fee-tiers', data),
  updateWithdrawalFeeTier: (id, data) => api.put(`/admin/withdrawal-fee-tiers/${id}`, data),
  deleteWithdrawalFeeTier: (id) => api.delete(`/admin/withdrawal-fee-tiers/${id}`),
  validateWithdrawalFeeTiers: () => api.get('/admin/withdrawal-fee-tiers/validate'),
};

// Company Wallet API
export const companyWalletAPI = {
  getOverview: () => api.get('/company-wallet/overview'),
  getDetails: () => api.get('/company-wallet/details'),
  getTransactions: (params) => api.get('/company-wallet/transactions', { params }),
  initialize: () => api.post('/company-wallet/initialize'),
};

// Public API (no authentication required)
export const publicAPI = {
  getVipLevels: () => api.get('/vip/public/levels'),
  getReferralRates: () => api.get('/vip/public/referral-rates')
};

// Generic API helpers
export const apiHelpers = {
  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      return error.response.data?.message || 'An error occurred';
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    } else {
      return 'An unexpected error occurred';
    }
  },

  // Format API response
  formatResponse: (response) => {
    return {
      data: response.data,
      success: true,
      message: response.data?.message || 'Success',
    };
  },

  // Create query string from object
  createQueryString: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    return searchParams.toString();
  },

  // Upload file helper
  uploadFile: (endpoint, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
};

// Get wallet addresses for deposits
export const getWalletAddresses = async () => {
  try {
    const response = await api.get('/wallet/addresses');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet addresses:', error);
    throw error;
  }
};

// Get company wallet addresses for deposits (updated)
export const getCompanyWalletAddresses = async () => {
  try {
    const response = await api.get('/wallet/company-addresses');
    return response.data;
  } catch (error) {
    console.error('Error fetching company wallet addresses:', error);
    throw error;
  }
};

// Members API
export const membersAPI = {
  getPublicList: (params = {}) => api.get('/members/public', { params }),
  getStats: () => api.get('/members/stats'),
};

// Announcements API
export const announcementsAPI = {
  // Get all announcements for users
  getAnnouncements: (params = {}) => api.get('/announcements', { params }),
  // Get active announcements for home page
  getActiveAnnouncements: () => api.get('/announcements/active'),
  // Admin functions
  getAllAnnouncements: (params = {}) => api.get('/admin/announcements', { params }),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/admin/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`),
  toggleAnnouncement: (id) => api.patch(`/admin/announcements/${id}/toggle`),
};

export default api;
