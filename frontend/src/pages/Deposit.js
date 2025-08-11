import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { depositAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';

const Deposit = () => {
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: '',
      currency: 'BTC'
    }
  });

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');

  // Fetch deposit history
  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits', { limit: 10, page: 1 }],
    queryFn: () => depositAPI.getDeposits({ limit: 10, page: 1 }),
  });

  // Create deposit mutation
  const createDepositMutation = useMutation({
    mutationFn: depositAPI.createDeposit,
    onSuccess: (data) => {
      // Redirect to Coinbase Commerce checkout
      if (data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
      queryClient.invalidateQueries(['deposits']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create deposit');
    },
  });

  const predefinedAmounts = [
    { amount: 0.001, currency: 'BTC', usd: 50 },
    { amount: 0.002, currency: 'BTC', usd: 100 },
    { amount: 0.005, currency: 'BTC', usd: 250 },
    { amount: 0.01, currency: 'BTC', usd: 500 },
    { amount: 0.02, currency: 'BTC', usd: 1000 },
    { amount: 0.05, currency: 'BTC', usd: 2500 },
  ];

  const currencies = [
    { code: 'BTC', name: 'Bitcoin', icon: '₿' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ' },
    { code: 'USDT', name: 'Tether', icon: '₮' },
  ];

  const onSubmit = async (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    createDepositMutation.mutate({
      amount: parseFloat(data.amount),
      currency: data.currency,
    });
  };

  const handlePredefinedAmount = (amount, currency) => {
    setSelectedAmount(amount);
    setSelectedCurrency(currency);
    setValue('amount', amount.toString());
    setValue('currency', currency);
  };

  const formatCurrency = (amount, currency) => {
    if (currency === 'BTC') {
      return `₿${amount.toFixed(8)}`;
    } else if (currency === 'ETH') {
      return `Ξ${amount.toFixed(6)}`;
    } else if (currency === 'USDT') {
      return `₮${amount.toFixed(2)}`;
    }
    return `${amount} ${currency}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      CONFIRMED: { color: 'bg-green-100 text-green-800', text: 'Confirmed' },
      FAILED: { color: 'bg-red-100 text-red-800', text: 'Failed' },
      CANCELLED: { color: 'bg-gray-100 text-gray-800', text: 'Cancelled' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Make a Deposit</h1>
          <p className="text-gray-600 mt-1">
            Fund your wallet with cryptocurrency to start earning
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deposit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Funds</CardTitle>
                <CardDescription>
                  Choose an amount and currency to deposit into your wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Currency Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Select Currency
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {currencies.map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => {
                            setValue('currency', currency.code);
                            setSelectedCurrency(currency.code);
                          }}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            watchedCurrency === currency.code
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-2xl mb-1">{currency.icon}</div>
                          <div className="font-medium">{currency.code}</div>
                          <div className="text-xs text-gray-500">{currency.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Predefined Amounts */}
                  {watchedCurrency === 'BTC' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Quick Select (BTC)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {predefinedAmounts.map((preset) => (
                          <button
                            key={`${preset.amount}-${preset.currency}`}
                            type="button"
                            onClick={() => handlePredefinedAmount(preset.amount, preset.currency)}
                            className={`p-3 border rounded-lg text-center transition-colors ${
                              selectedAmount === preset.amount && selectedCurrency === preset.currency
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium">₿{preset.amount}</div>
                            <div className="text-xs text-gray-500">≈ ${preset.usd}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Amount */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Or Enter Custom Amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        placeholder={`Enter amount in ${watchedCurrency}`}
                        error={errors.amount?.message}
                        {...register('amount', {
                          required: 'Amount is required',
                          min: {
                            value: 0.0001,
                            message: 'Minimum deposit amount is 0.0001'
                          }
                        })}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">
                          {currencies.find(c => c.code === watchedCurrency)?.icon}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    loading={createDepositMutation.isPending}
                    disabled={createDepositMutation.isPending || !watchedAmount}
                  >
                    {createDepositMutation.isPending 
                      ? 'Creating Deposit...' 
                      : `Deposit ${watchedAmount ? formatCurrency(parseFloat(watchedAmount), watchedCurrency) : ''}`
                    }
                  </Button>
                </form>

                {/* Security Notice */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">
                        Secure Payments
                      </h3>
                      <p className="text-xs text-blue-700 mt-1">
                        All deposits are processed securely through Coinbase Commerce. Your funds will be credited to your wallet once the transaction is confirmed on the blockchain.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deposit Info & History */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How Deposits Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Choose Amount</p>
                    <p className="text-xs text-gray-500">Select or enter the amount you want to deposit</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Secure Payment</p>
                    <p className="text-xs text-gray-500">Complete payment through Coinbase Commerce</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start Earning</p>
                    <p className="text-xs text-gray-500">Your balance grows daily with our profit-sharing system</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Deposits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                {depositsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : deposits?.data?.deposits?.length > 0 ? (
                  <div className="space-y-4">
                    {deposits.data.deposits.slice(0, 5).map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium">
                            {formatCurrency(deposit.amount, deposit.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(deposit.createdAt)}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(deposit.status)}
                        </div>
                      </div>
                    ))}
                    
                    {deposits.data.deposits.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm">
                          View All Deposits
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <p className="text-gray-500 text-sm">No deposits yet</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Make your first deposit to start earning
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Deposit;
