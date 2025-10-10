import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const WelcomeBanner = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user just logged in (within last 30 seconds)
    const loginTime = localStorage.getItem('lastLoginTime');
    const now = Date.now();
    const timeSinceLogin = now - (loginTime ? parseInt(loginTime) : 0);
    
    if (timeSinceLogin < 30000) { // 30 seconds
      setShowBanner(true);
      // Animate in after a short delay
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner || !user) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
      isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modern Welcome Card */}
      <div className={`relative max-w-4xl mx-4 max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl border backdrop-blur-xl transition-all duration-500 transform ${
        isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      } ${
        isDark 
          ? 'bg-gradient-to-br from-coinbase-dark-secondary via-coinbase-dark-tertiary to-coinbase-dark-secondary border-coinbase-dark-border' 
          : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200'
      }`}>
        
        {/* Enhanced Header with Gradient */}
        <div className={`relative overflow-hidden rounded-t-3xl ${
          isDark 
            ? 'bg-gradient-to-r from-coinbase-blue/20 via-coinbase-green/20 to-coinbase-blue/20 border-b border-coinbase-dark-border' 
            : 'bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 border-b border-gray-200'
        }`}>
          {/* Floating Elements */}
          <div className="absolute top-4 left-4 w-2 h-2 bg-coinbase-blue rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-1 h-1 bg-coinbase-green rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-4 left-8 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="p-6 md:p-8">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all duration-200 z-10 hover:scale-110 ${
                isDark 
                  ? 'text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Welcome Header */}
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-2xl flex items-center justify-center mx-auto shadow-2xl">
                  <span className="text-3xl md:text-4xl">🎉</span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-coinbase-green rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
                isDark ? 'text-coinbase-text-primary' : 'text-gray-900'
              }`}>
                Welcome to Token Rise!
              </h1>
              <p className={`text-lg md:text-xl font-semibold text-coinbase-blue mb-1`}>
                {user?.fullName || user?.email || 'User'}
              </p>
              <p className={`text-sm md:text-base ${
                isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'
              }`}>
                Ready to start your investment journey? 🚀
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-4 md:p-6 text-center`}>
              <div className="w-12 h-12 bg-gradient-to-r from-coinbase-green to-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className={`font-bold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                Daily Earnings
              </h3>
              <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Credited directly to your account
              </p>
            </div>

            <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-4 md:p-6 text-center`}>
              <div className="w-12 h-12 bg-gradient-to-r from-coinbase-blue to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className={`font-bold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                Flexible Packages
              </h3>
              <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                $10 to $200,000
              </p>
            </div>

            <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-4 md:p-6 text-center`}>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className={`font-bold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                Referral Program
              </h3>
              <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Up to 3 levels
              </p>
            </div>
          </div>

          {/* Account Details Card */}
          <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-dark-tertiary to-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'} border rounded-2xl p-6 md:p-8 mb-8`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                Your Account Details
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center">
                <div className={`text-xs md:text-sm font-medium mb-1 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  Full Name
                </div>
                <div className={`font-bold text-sm md:text-base ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  {user?.fullName || 'Not provided'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs md:text-sm font-medium mb-1 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  Email Address
                </div>
                <div className={`font-bold text-sm md:text-base ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                  {user?.email || 'Not provided'}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-xs md:text-sm font-medium mb-1 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                  Referral Code
                </div>
                <div className={`font-bold text-sm md:text-base text-coinbase-blue bg-coinbase-blue/10 px-3 py-1 rounded-lg inline-block`}>
                  {user?.referralCode || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Section */}
          <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6 md:p-8 mb-8`}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-coinbase-green to-green-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg md:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                Why Choose Token Rise?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-coinbase-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-semibold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Secure & Protected
                  </h4>
                  <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                    Your investment is fully protected with transparent tracking
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-coinbase-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-semibold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Fast Withdrawals
                  </h4>
                  <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                    Withdraw your profits anytime, fast and secure
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-semibold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Real-time Tracking
                  </h4>
                  <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                    Track your profits in real-time with our transparent system
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className={`font-semibold text-sm md:text-base mb-1 ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                    Referral Rewards
                  </h4>
                  <p className={`text-xs md:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                    Earn up to 3 levels (L1=10%, L2=5%, L3=2%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <p className={`text-sm md:text-base mb-6 ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
              Start staking today and grow your wealth with confidence!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-md mx-auto">
              <button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
              >
                🚀 Start Your Journey
              </button>
              <button
                onClick={handleClose}
                className={`flex-1 py-3 md:py-4 px-6 md:px-8 rounded-xl font-bold transition-all duration-200 text-sm md:text-base ${
                  isDark 
                    ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary border border-coinbase-dark-border'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                📚 Explore VIP Levels
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
