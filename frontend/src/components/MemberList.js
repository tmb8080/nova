import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { membersAPI } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const MemberList = () => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortBy, setSortBy] = useState('earnings');
  const [showStats, setShowStats] = useState(false);
  const [componentError, setComponentError] = useState(null);
  const scrollRef = useRef(null);

  // Fetch member data from API
  const { data: membersData, isLoading: membersLoading, error: membersError } = useQuery({
    queryKey: ['members', sortBy],
    queryFn: () => membersAPI.getPublicList({ 
      limit: 20, 
      sortBy: sortBy, 
      order: 'desc' 
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch member statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['memberStats'],
    queryFn: () => membersAPI.getStats(),
    refetchInterval: 60000, // Refresh every minute
  });

  const members = Array.isArray(membersData?.data) ? membersData.data : [];
  const stats = statsData?.data || {};

  // Debug logging (can be removed in production)
  // console.log('MemberList Debug:', {
  //   membersData,
  //   members,
  //   membersLength: members.length,
  //   isLoading: membersLoading,
  //   error: membersError
  // });

  // Duplicate the array to create seamless scrolling
  let duplicatedMembers = [];
  try {
    duplicatedMembers = members.length > 0 ? [...members, ...members] : [];
  } catch (error) {
    console.error('Error creating duplicated members array:', error);
    setComponentError(error);
    duplicatedMembers = []; // Set to empty array instead of returning
  }

  const getBadgeIcon = (badgeType) => {
    switch (badgeType) {
      case "purple-gold-crown":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case "orange-gold-star":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case "purple-gold-winged-crown":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-yellow-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case "bronze-w":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-amber-700 to-amber-900 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
        );
      case "blue-silver-diamond":
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-gray-400 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getVipLevelColor = (vipLevel) => {
    if (!vipLevel) return 'text-gray-400';
    
    const level = vipLevel.toLowerCase();
    if (level.includes('tera') || level.includes('giga') || level.includes('mega') || level.includes('ultimate')) {
      return 'text-purple-400';
    }
    if (level.includes('v8') || level.includes('v9') || level.includes('v10')) {
      return 'text-blue-400';
    }
    if (level.includes('v5') || level.includes('v6') || level.includes('v7')) {
      return 'text-green-400';
    }
    if (level.includes('v3') || level.includes('v4')) {
      return 'text-yellow-400';
    }
    return 'text-orange-400';
  };

  useEffect(() => {
    if (members.length === 0) return;
    
    try {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          // Reset to 0 when we reach the end of the original array
          if (nextIndex >= members.length) {
            return 0;
          }
          return nextIndex;
        });
      }, 3000); // Change every 3 seconds

      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error in members interval effect:', error);
      setComponentError(error);
    }
  }, [members.length]);

  useEffect(() => {
    if (scrollRef.current && members.length > 0) {
      try {
        const scrollHeight = scrollRef.current.scrollHeight / 2; // Since we duplicated the array
        const itemHeight = scrollHeight / members.length;
        const scrollTo = currentIndex * itemHeight;
        
        scrollRef.current.scrollTo({
          top: scrollTo,
          behavior: 'smooth'
        });
      } catch (error) {
        console.error('Error in scroll effect:', error);
        setComponentError(error);
      }
    }
  }, [currentIndex, members.length]);

  // Error boundary for component - must be after all hooks
  if (componentError) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-8 border shadow-lg overflow-hidden`}>
        <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green/20 to-coinbase-blue/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-green-100 to-blue-100 border-gray-200'} px-4 py-3 border-b`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Member List
          </h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-coinbase-red">Something went wrong with the member list.</p>
          <button 
            onClick={() => setComponentError(null)}
            className="mt-2 px-4 py-2 bg-coinbase-blue hover:bg-coinbase-blue-dark text-white rounded-lg transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (membersLoading) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-8 border shadow-lg overflow-hidden`}>
        <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green/20 to-coinbase-blue/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-green-100 to-blue-100 border-gray-200'} px-4 py-3 border-b`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Member List
          </h2>
        </div>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coinbase-blue mx-auto"></div>
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} mt-2`}>Loading members...</p>
        </div>
      </div>
    );
  }

  if (membersError) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-8 border shadow-lg overflow-hidden`}>
        <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green/20 to-coinbase-blue/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-green-100 to-blue-100 border-gray-200'} px-4 py-3 border-b`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Member List
          </h2>
        </div>
        <div className="p-8 text-center">
          <p className="text-coinbase-red">Failed to load members. Please try again later.</p>
          <p className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'} mt-2`}>Error: {membersError?.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  // Additional safety check - if we're not loading and have no members, show empty state
  if (!membersLoading && !membersError && members.length === 0) {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl p-8 border shadow-lg overflow-hidden`}>
        <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green/20 to-coinbase-blue/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-green-100 to-blue-100 border-gray-200'} px-4 py-3 border-b`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Member List
          </h2>
        </div>
        <div className="p-8 text-center">
          <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>No members found</p>
          <p className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'} mt-2`}>Be the first to join our VIP program!</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={`${isDark ? 'bg-coinbase-dark-secondary border-coinbase-dark-border' : 'bg-white border-gray-200'} rounded-xl border shadow-lg overflow-hidden`}>
      {/* Header with Stats Toggle */}
      <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green/20 to-coinbase-blue/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-green-100 to-blue-100 border-gray-200'} px-4 py-3 border-b`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
            </svg>
            Member List
            {stats.totalMembers && (
              <span className={`ml-2 text-sm ${isDark ? 'bg-coinbase-green/20 text-coinbase-green border-coinbase-green/30' : 'bg-green-100 text-green-800 border-green-200'} px-2 py-1 rounded-full border`}>
                {stats.totalMembers} members
              </span>
            )}
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`text-xs ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary' : 'bg-white border-gray-300 text-gray-900'} border rounded px-2 py-1`}
            >
              <option value="earnings">Sort by Earnings</option>
              <option value="vipLevel">Sort by VIP Level</option>
              <option value="createdAt">Sort by Join Date</option>
            </select>
            <button
              onClick={() => setShowStats(!showStats)}
              className={`text-xs ${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border text-coinbase-text-primary hover:bg-coinbase-dark-border' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'} border rounded px-2 py-1 transition-colors`}
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      {showStats && stats && (
        <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border-coinbase-dark-border' : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-gray-200'} p-4 border-b`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-coinbase-green">
                {stats.totalMembers || 0}
              </div>
              <div className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Total Members</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-coinbase-blue">
                {stats.activeMembers || 0}
              </div>
              <div className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Active VIP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-coinbase-green">
                {formatCurrency(stats.totalEarnings || 0)}
              </div>
              <div className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>Total Earnings</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'}`}>
                {stats.topEarner?.email || 'N/A'}
              </div>
              <div className={`text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
                Top: {formatCurrency(stats.topEarner?.totalEarnings || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Member List Container */}
      <div className="relative">
        <div 
          ref={scrollRef}
          className="max-h-64 overflow-hidden"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="space-y-0">
            {members.length > 0 && Array.isArray(duplicatedMembers) ? duplicatedMembers.map((member, index) => {
              // Safety check for member object
              if (!member || typeof member !== 'object') {
                return null;
              }
              
              return (
              <div 
                key={`${member.id || index}-${index}`}
                className={`flex items-center justify-between p-4 ${isDark ? 'border-coinbase-dark-border hover:bg-coinbase-dark-tertiary' : 'border-gray-200 hover:bg-gray-50'} border-b transition-all duration-200`}
              >
                {/* Left side - Number and Badge */}
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'} font-medium min-w-[2rem]`}>
                    #{index + 1}
                  </span>
                  {getBadgeIcon(member.badge)}
                </div>

                {/* Center - Member Info */}
                <div className="flex-1 ml-4">
                  <div className={`text-sm ${isDark ? 'text-coinbase-text-primary' : 'text-gray-900'} font-medium`}>
                    {member.fullName || member.email}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs font-semibold ${getVipLevelColor(member.vipLevel)}`}>
                      {member.vipLevel}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-coinbase-text-tertiary' : 'text-gray-500'}`}>
                      {formatDate(member.joinedAt)}
                    </span>
                  </div>
                  {member.referralCount > 0 && (
                    <div className="text-xs text-coinbase-blue mt-1">
                      {member.referralCount} referrals
                    </div>
                  )}
                </div>

                {/* Right side - Earnings */}
                <div className="text-right">
                  <div className={`${isDark ? 'bg-gradient-to-r from-coinbase-green to-coinbase-blue text-coinbase-dark' : 'bg-gradient-to-r from-green-500 to-blue-500 text-white'} px-3 py-1 rounded-full text-sm font-semibold shadow-lg`}>
                    {formatCurrency(member.totalEarnings)}
                  </div>
                  {member.todayEarnings > 0 && (
                    <div className="text-xs text-coinbase-green mt-1">
                      +{formatCurrency(member.todayEarnings)} today
                    </div>
                  )}
                </div>
              </div>
              );
            }) : (
              <div className="p-8 text-center">
                <p className={`${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>No members found</p>
              </div>
            )}
          </div>
        </div>

        {/* Scroll Indicator */}
        {members.length > 0 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              {members.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-coinbase-green' 
                      : isDark ? 'bg-coinbase-dark-border' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`${isDark ? 'bg-coinbase-dark-tertiary border-coinbase-dark-border' : 'bg-gray-50 border-gray-200'} px-4 py-3 border-t`}>
        <div className={`flex items-center justify-between text-xs ${isDark ? 'text-coinbase-text-secondary' : 'text-gray-600'}`}>
          <div className="flex items-center space-x-4">
            <span>🔄 Auto-refresh: 30s</span>
            <span>📊 Showing top {members.length} members</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>💎 VIP Levels</span>
            <span>💰 Real Earnings</span>
            <span>🏆 Live Rankings</span>
          </div>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error('Error rendering MemberList component:', error);
    setComponentError(error);
    return null;
  }
};

export default MemberList;
