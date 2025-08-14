import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { referralAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const Invite = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch referral stats
  const { data: referralStats, isLoading: statsLoading } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => referralAPI.getStats(),
  });

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20 md:pb-0">
      {/* Modern Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white">Trinity Metro</h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Modern Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">Referral System</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Invite Friends
          </h1>
          <p className="text-gray-300 text-base max-w-2xl mx-auto">
            Share the opportunity and earn rewards for every successful referral
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Referral Link - Redesigned */}
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <div className="bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-indigo-600/80 backdrop-blur-sm p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Your Referral Link</h3>
                      <p className="text-blue-100 text-sm">Share and earn rewards together</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">🎯</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Referral Code Display */}
                <div className="mb-6">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl border border-blue-400/30">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-300 mb-1">Your Referral Code</div>
                      <div className="text-lg font-mono font-bold text-white bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                        {user?.referralCode || 'USER123'}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(user?.referralCode || 'USER123');
                        toast.success('Referral code copied!');
                      }}
                      className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Code</span>
                    </Button>
                  </div>
                </div>

                {/* Full Referral Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Complete Referral Link</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={`${window.location.origin}/register?ref=${user?.referralCode || 'user'}`}
                      readOnly
                      className="w-full px-4 py-3 pr-24 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-sm font-mono text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      onClick={copyReferralLink}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Link</span>
                    </Button>
                  </div>
                </div>

                {/* Quick Share Options */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Quick Share</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => {
                        const text = `Join Trinity Metro using my referral link and get $5 bonus! ${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
                        navigator.clipboard.writeText(text);
                        toast.success('Message copied to clipboard!');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Copy Message</span>
                    </Button>
                    <Button
                      onClick={() => {
                        const url = `${window.location.origin}/register?ref=${user?.referralCode || 'user'}`;
                        if (navigator.share) {
                          navigator.share({
                            title: 'Join Trinity Metro',
                            text: 'Use my referral link and get $5 bonus!',
                            url: url
                          });
                        } else {
                          navigator.clipboard.writeText(url);
                          toast.success('Link copied to clipboard!');
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>Share</span>
                    </Button>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-green-800">Referral Benefits</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700">You earn <strong>$10</strong> per referral</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700">Friend gets <strong>$5</strong> bonus</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700">Both earn from investments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {statsLoading ? '...' : referralStats?.data?.totalReferrals || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Referrals</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {statsLoading ? '...' : referralStats?.data?.activeReferrals || 0}
                    </div>
                    <div className="text-sm text-gray-600">Active Referrals</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {statsLoading ? '...' : formatCurrency(referralStats?.data?.totalEarnings || 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Earnings</div>
                  </div>
                </CardContent>
              </Card>
            </div>


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Share Your Link</h4>
                    <p className="text-sm text-gray-600">Send your referral link to friends</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Friend Joins</h4>
                    <p className="text-sm text-gray-600">They sign up using your link</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Earn Rewards</h4>
                    <p className="text-sm text-gray-600">Both of you get bonuses</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rewards Info */}
            <Card>
              <CardHeader>
                <CardTitle>Rewards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Signup Bonus</span>
                  <span className="font-medium text-green-600">$5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Referral Bonus</span>
                  <span className="font-medium text-green-600">$10</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Commission</span>
                  <span className="font-medium text-green-600">5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invite;
