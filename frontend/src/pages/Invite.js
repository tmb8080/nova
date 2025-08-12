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
  const [email, setEmail] = useState('');

  // Fetch referral stats
  const { data: referralStats, isLoading: statsLoading } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => referralAPI.getStats(),
  });

  // Send invitation mutation
  const sendInvitationMutation = useMutation({
    mutationFn: (data) => referralAPI.sendInvitation(data),
    onSuccess: () => {
      toast.success('Invitation sent successfully!');
      setEmail('');
      queryClient.invalidateQueries(['referralStats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    },
  });

  const handleEmailInvite = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    sendInvitationMutation.mutate({ email: email.trim(), type: 'email' });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Simple Header */}
      <div className="shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-12">
            <h1 className="text-lg font-bold text-gray-900">Trinity Metro</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invite Friends</h1>
          <p className="text-gray-600">Share the opportunity and earn rewards for every successful referral</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Referral Link */}
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Link</CardTitle>
                <CardDescription>
                  Share this link with friends to earn rewards when they join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={`${window.location.origin}/register?ref=${user?.referralCode || 'user'}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <Button onClick={copyReferralLink}>
                    Copy Link
                  </Button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <p>• Earn $10 for each successful referral</p>
                  <p>• Your friend gets $5 bonus on signup</p>
                  <p>• Both of you earn from their investments</p>
                </div>
              </CardContent>
            </Card>

            {/* Email Invite */}
            <Card>
              <CardHeader>
                <CardTitle>Invite by Email</CardTitle>
                <CardDescription>
                  Send invitation to friends via email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={sendInvitationMutation.isLoading}
                  >
                    {sendInvitationMutation.isLoading ? 'Sending...' : 'Send Email Invite'}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
