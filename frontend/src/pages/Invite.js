import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { referralAPI } from '../services/api';
import InvitedFriendsList from '../components/InvitedFriendsList';
import toast from 'react-hot-toast';

const Invite = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Fetch referral statistics including invited friends
  const { data: referralStats, isLoading: referralLoading } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => referralAPI.getStats(),


  });



  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };



  return (
    <div className={`min-h-screen ${isDark ? 'bg-coinbase-dark' : 'bg-white'} pb-20 md:pb-0`}>
      {/* Coinbase-style Header */}
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-coinbase-blue rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Token Rise</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-coinbase-green rounded-full animate-pulse"></div>
              <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Coinbase-style Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 dark:from-coinbase-blue/20 dark:to-coinbase-green/20 rounded-full border border-gray-200 dark:border-coinbase-dark-border mb-6">
            <div className="w-2 h-2 bg-coinbase-green rounded-full mr-2 animate-pulse"></div>
            <span className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm font-medium`}>Referral System</span>
          </div>
          <h1 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} mb-4`}>
            Invite Friends
          </h1>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-lg max-w-3xl mx-auto leading-relaxed`}>
            Share the opportunity and earn rewards for every successful referral
          </p>
        </div>



        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Actions & Guide */}
          <div className="xl:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Quick Actions</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Share & Earn</p>
                  </div>
                      </div>
                    </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => {
                    const text = `Join Token Rise and start earning with daily task sessions! Use my referral link: ${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
                    navigator.clipboard.writeText(text);
                    toast.success('Message copied to clipboard!');
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDark
                      ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Copy Message</span>
                </button>
                
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Join Token Rise',
                        text: 'Start earning with daily task sessions!',
                        url: url
                      });
                    } else {
                      navigator.clipboard.writeText(url);
                      toast.success('Link copied to clipboard!');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Share Link</span>
                </button>
                
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user?.referralCode || 'USER123');
                        toast.success('Referral code copied!');
                      }}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    isDark
                      ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Code</span>
                    </button>
                  </div>
                </div>

            {/* How It Works */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>How It Works</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Step-by-step guide</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-coinbase-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Share Your Link</h4>
                      <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Send your referral link to friends</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-coinbase-blue rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Friend Joins</h4>
                      <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>They sign up using your link</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-coinbase-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Earn Together</h4>
                      <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Both earn from daily tasks</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Get Commission</h4>
                      <p className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Earn 10% on their VIP investments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3 space-y-8">
            {/* Complete Referral Link Card - First Priority */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-4 sm:px-6 py-4 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Complete Referral Link</h3>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-xs sm:text-sm`}>Your main sharing link - copy and share anywhere</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl sm:text-2xl font-bold">🔗</div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Full Referral Link - Primary Focus */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      value={`${window.location.origin}/register?ref=${user?.referralCode || 'user'}`}
                      readOnly
                      className={`w-full px-3 sm:px-4 py-3 sm:py-4 pr-24 sm:pr-32 border ${isDark ? 'border-coinbase-dark-border bg-coinbase-dark-secondary text-coinbase-text-primary focus:ring-coinbase-blue' : 'border-gray-200 bg-white text-gray-900 focus:ring-coinbase-blue'} rounded-lg text-sm sm:text-base font-mono focus:ring-2 focus:border-transparent`}
                    />
                    <button
                      onClick={copyReferralLink}
                      className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold flex items-center space-x-1 sm:space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Copy Link</span>
                      <span className="sm:hidden">Copy</span>
                    </button>
                  </div>
                </div>

                {/* Quick Share Options */}
                <div className="mb-6">
                  <label className={`block text-xs sm:text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-3`}>Quick Share Options</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const text = `Join Token Rise and start earning with daily task sessions! Use my referral link: ${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
                        navigator.clipboard.writeText(text);
                        toast.success('Message copied to clipboard!');
                      }}
                      className={`py-3 rounded-lg flex items-center justify-center space-x-2 font-semibold transition-all duration-200 ${
                        isDark
                          ? 'bg-coinbase-dark-tertiary text-coinbase-text-secondary hover:bg-coinbase-dark-border hover:text-coinbase-text-primary'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Copy Message</span>
                    </button>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join Token Rise',
                            text: 'Start earning with daily task sessions!',
                            url: url
                          });
                        } else {
                          navigator.clipboard.writeText(url);
                          toast.success('Link copied to clipboard!');
                        }
                      }}
                      className="bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white py-3 rounded-lg flex items-center justify-center space-x-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Referral Code Display */}
                <div className="mb-6">
                  <label className={`block text-xs sm:text-sm font-medium ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-3`}>Your Referral Code</label>
                  <div className={`flex items-center justify-between p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <div className="flex-1">
                      <div className={`text-lg font-mono font-bold ${isDark ? 'text-coinbase-text-primary bg-coinbase-dark-secondary border-coinbase-dark-border' : 'text-gray-900 bg-white border-gray-200'} px-3 py-2 rounded-lg border`}>
                        {user?.referralCode || 'USER123'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(user?.referralCode || 'USER123');
                        toast.success('Referral code copied!');
                      }}
                      className="ml-3 bg-gradient-to-r from-coinbase-blue to-coinbase-green hover:from-coinbase-blue-dark hover:to-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Code</span>
                    </button>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg p-4 border`}>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-coinbase-green rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className={`font-semibold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Referral Benefits</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-coinbase-green rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-700'}`}>You earn <strong className="text-coinbase-green">10% commission</strong> on referrals</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-coinbase-green rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-700'}`}>Both earn from <strong className="text-coinbase-green">Daily Task Earnings</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-coinbase-green rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-700'}`}>Multi-level rewards <strong className="text-coinbase-green">(5% & 2%)</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-coinbase-green rounded-full"></div>
                      <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-700'}`}>Higher VIP levels = <strong className="text-coinbase-green">More earnings</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Statistics Card - Second Priority */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-4 sm:px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Referral Stats</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-xs sm:text-sm`}>Your earning performance</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                  {referralLoading ? (
                    <>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className={`h-16 sm:h-20 ${isDark ? 'bg-coinbase-dark-tertiary' : 'bg-gray-200'} rounded-lg`}></div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className={`flex flex-col items-center p-3 sm:p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Direct</span>
                        <span className={`${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} font-bold text-lg sm:text-xl`}>{referralStats?.data?.directReferrals || 0}</span>
                      </div>
                      <div className={`flex flex-col items-center p-3 sm:p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Indirect</span>
                        <span className={`${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} font-bold text-lg sm:text-xl`}>{referralStats?.data?.indirectReferrals || 0}</span>
                      </div>
                      <div className={`flex flex-col items-center p-3 sm:p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Total</span>
                        <span className="text-coinbase-green font-bold text-lg sm:text-xl">
                          ${(referralStats?.data?.totalBonuses || 0).toFixed(0)}
                        </span>
                      </div>
                      <div className={`flex flex-col items-center p-3 sm:p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Level 1</span>
                        <span className="text-coinbase-blue font-bold text-lg sm:text-xl">
                          ${(referralStats?.data?.level1Bonuses || 0).toFixed(0)}
                        </span>
                      </div>
                      <div className={`flex flex-col items-center p-3 sm:p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Level 2</span>
                        <span className="text-blue-500 font-bold text-lg sm:text-xl">
                          ${(referralStats?.data?.level2Bonuses || 0).toFixed(0)}
                        </span>
                      </div>
                      <div className={`flex flex-col items-center p-3 sm:p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mb-1`}>Level 3</span>
                        <span className="text-purple-500 font-bold text-lg sm:text-xl">
                          ${(referralStats?.data?.level3Bonuses || 0).toFixed(0)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Invited Friends Section */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Your Invited Friends</h3>
                      <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Track your referrals and their VIP levels</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">👥</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {referralLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className={`h-20 ${isDark ? 'bg-coinbase-dark-tertiary' : 'bg-gray-200'} rounded-xl`}></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <InvitedFriendsList referralStats={referralStats} />
                )}
              </div>
            </div>

            {/* Earning System Overview */}
            <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-2xl shadow-xl border overflow-hidden`}>
              <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-50 to-green-50 border-gray-200'} px-6 py-4 border-b`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    </div>
                    <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>Earning System</h3>
                    <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} text-sm`}>Commission structure overview</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className={`flex justify-between items-center p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Daily Tasks</span>
                    <span className="font-medium text-coinbase-green">24h Sessions</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Direct Commission</span>
                    <span className="font-medium text-coinbase-blue">10%</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Level 2 Commission</span>
                    <span className="font-medium text-blue-500">5%</span>
                  </div>
                  <div className={`flex justify-between items-center p-4 ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} rounded-lg border`}>
                    <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Level 3 Commission</span>
                    <span className="font-medium text-purple-500">2%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;
