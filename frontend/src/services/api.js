import axios from 'axios';

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
};

// Wallet API
export const walletAPI = {
  getStats: () => api.get('/wallet/stats'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  getProjectedEarnings: (params) => api.get('/wallet/projected-earnings', { params }),
  withdrawEarnings: (amount) => api.post('/wallet/withdraw-earnings', { amount }),
};

// Deposit API
export const depositAPI = {
  createDeposit: (data) => api.post('/deposit/create', data),
  getDeposits: (params) => api.get('/deposit/history', { params }),
  getMyDeposits: (params) => api.get('/deposit/my-deposits', { params }),
  getDepositDetails: (id) => api.get(`/deposit/${id}`),
  getUsdtAddresses: () => api.get('/deposit/usdt/addresses'),
  createUsdtDeposit: (data) => api.post('/deposit/usdt/create', data),
  getPendingCount: () => api.get('/deposit/pending-count'),
  updateTransactionHash: (depositId, transactionHash) => api.patch(`/deposit/${depositId}/transaction-hash`, { transactionHash }),
};

// Withdrawal API
export const withdrawalAPI = {
  createWithdrawal: (data) => api.post('/withdrawal/request', data),
  getWithdrawals: (params) => api.get('/withdrawal/history', { params }),
  getWithdrawalDetails: (id) => api.get(`/withdrawal/${id}`),
  getNetworkFees: (currency) => api.get(`/withdrawal/network-fees/${currency}`),
};

// Referral API
export const referralAPI = {
  getStats: () => api.get('/referral/stats'),
  getHistory: (params) => api.get('/referral/history', { params }),
  getBonuses: (params) => api.get('/referral/bonuses', { params }),
  getTree: () => api.get('/referral/tree'),
  validateCode: (code) => api.post('/referral/validate', { code }),
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
  stopEarning: () => api.post('/tasks/stop-earning'),
  getEarningHistory: () => api.get('/tasks/earning-history'),
  getAvailableTasks: () => api.get('/tasks/available'),
  startTask: (taskId) => api.post(`/tasks/start/${taskId}`),
  completeTask: (taskId) => api.post(`/tasks/complete/${taskId}`),
  getTaskHistory: () => api.get('/tasks/history'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId) => api.patch(`/admin/users/${userId}/toggle-status`),
  getWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  getPendingWithdrawals: () => api.get('/admin/withdrawals/pending'),
  processWithdrawal: (id, data) => api.patch(`/admin/withdrawals/${id}/process`, data),
  getDeposits: (params) => api.get('/admin/deposits', { params }),
  getPendingDeposits: () => api.get('/admin/deposits/pending'),
  processDeposit: (id, data) => api.patch(`/admin/deposits/${id}/process`, data),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings) => api.patch('/admin/settings', settings),
  getReferralTree: () => api.get('/admin/referral-tree'),
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

export default api;
