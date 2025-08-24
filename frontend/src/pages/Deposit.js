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
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('BEP20');
  const [depositMethod, setDepositMethod] = useState('direct'); // 'direct' or 'coinbase'
  const [showInstructions, setShowInstructions] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState(null);



  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: '',
      currency: 'USDT',
      network: 'BEP20',
      transactionHash: ''
    }
  });

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');
  const watchedNetwork = watch('network');
  const watchedTransactionHash = watch('transactionHash');

  // Fetch deposit history
  const { data: deposits, isLoading: depositsLoading } = useQuery({
    queryKey: ['deposits', { limit: 10, page: 1 }],
    queryFn: () => depositAPI.getMyDeposits({ limit: 10, page: 1 }),
  });

  // Fetch user's wallet addresses
  const { data: userAddresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['userWalletAddresses'],
    queryFn: () => depositAPI.getUserWalletAddresses(),
    enabled: depositMethod === 'direct'
  });

  // Fetch USDT addresses (fallback)
  const { data: usdtAddresses, isLoading: fallbackLoading } = useQuery({
    queryKey: ['usdt-addresses'],
    queryFn: depositAPI.getUsdtAddresses,
    enabled: depositMethod === 'direct' && (!userAddresses?.data || userAddresses.data.length === 0)
  });

  // Fetch pending deposits count
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-deposits-count'],
    queryFn: depositAPI.getPendingCount,
  });



  // Create USDT deposit mutation
  const createUsdtDepositMutation = useMutation({
    mutationFn: depositAPI.createUsdtDeposit,
    onSuccess: (data) => {
      setPendingDeposit(data.data);
      toast.success('Deposit created successfully! Please send the funds and provide transaction hash.');
      queryClient.invalidateQueries(['deposits']);
      queryClient.invalidateQueries(['pending-deposits-count']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create deposit');
    },
  });

  // Update transaction hash mutation
  const updateTransactionHashMutation = useMutation({
    mutationFn: ({ depositId, transactionHash }) => 
      depositAPI.updateTransactionHash(depositId, transactionHash),
    onSuccess: (data) => {
      toast.success('Transaction hash updated successfully!');
      queryClient.invalidateQueries(['deposits']);
      setPendingDeposit(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update transaction hash');
    },
  });

  // Verify deposit mutation
  const verifyDepositMutation = useMutation({
    mutationFn: (depositId) => depositAPI.verifyDeposit(depositId),
    onSuccess: (data) => {
      toast.success('Deposit verified successfully!');
      queryClient.invalidateQueries(['deposits']);
      setPendingDeposit(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to verify deposit');
    },
  });

  // Create Coinbase deposit mutation
  const createCoinbaseDepositMutation = useMutation({
    mutationFn: depositAPI.createDeposit,
    onSuccess: (data) => {
      if (data.data.coinbaseUrl) {
        window.location.href = data.data.coinbaseUrl;
      }
      queryClient.invalidateQueries(['deposits']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create deposit');
    },
  });

  const predefinedAmounts = [
    { amount: 30, currency: 'USDT', usd: 30 },
    { amount: 50, currency: 'USDT', usd: 50 },
    { amount: 100, currency: 'USDT', usd: 100 },
    { amount: 200, currency: 'USDT', usd: 200 },
    { amount: 500, currency: 'USDT', usd: 500 },
    { amount: 1000, currency: 'USDT', usd: 1000 },
  ];

  // Dynamic networks based on user addresses
  const networks = React.useMemo(() => {
    if (userAddresses?.data && Array.isArray(userAddresses.data) && userAddresses.data.length > 0) {
      // Use user's wallet addresses
      return userAddresses.data.map(addr => {
        const networkConfig = {
          'BSC': { name: 'BSC (BEP20)', description: 'Binance Smart Chain', fee: '~$0.5' },
          'POLYGON': { name: 'Polygon', description: 'Polygon Network', fee: '~$0.01' },
          'ETHEREUM': { name: 'Ethereum (ERC20)', description: 'Ethereum Mainnet', fee: '~$10-50' },
          'TRON': { name: 'TRON (TRC20)', description: 'TRON Network', fee: '~$1' }
        };
        
        const config = networkConfig[addr.network] || { 
          name: addr.network, 
          description: `${addr.network} Network`, 
          fee: '~$1' 
        };
        
        return {
          code: addr.network,
          name: config.name,
          description: config.description,
          fee: config.fee,
          address: addr.address,
          isUserAddress: true
        };
      });
    } else {
      // Fallback to default networks
      return [
        { code: 'BEP20', name: 'BSC (BEP20)', description: 'Binance Smart Chain', fee: '~$0.5' },
        { code: 'TRC20', name: 'TRON (TRC20)', description: 'TRON Network', fee: '~$1' },
        { code: 'ERC20', name: 'Ethereum (ERC20)', description: 'Ethereum Mainnet', fee: '~$10-50' },
        { code: 'POLYGON', name: 'Polygon', description: 'Polygon Network', fee: '~$0.01' },
      ];
    }
  }, [userAddresses]);

  const currencies = [
    { code: 'USDT', name: 'Tether USD', icon: '₮', method: 'direct' },
    { code: 'BTC', name: 'Bitcoin', icon: '₿', method: 'coinbase' },
    { code: 'ETH', name: 'Ethereum', icon: 'Ξ', method: 'coinbase' },
  ];

  const onSubmit = async (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (depositMethod === 'direct') {
      // USDT Direct Deposit
      createUsdtDepositMutation.mutate({
        amount: parseFloat(data.amount),
        network: data.network,
      });
    } else {
      // Coinbase Commerce Deposit
      createCoinbaseDepositMutation.mutate({
        amount: parseFloat(data.amount),
        currency: data.currency,
      });
    }
  };

  const handlePredefinedAmount = (amount, currency) => {
    setSelectedAmount(amount);
    setSelectedCurrency(currency);
    setValue('amount', amount.toString());
    setValue('currency', currency);
  };

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
    setValue('network', network);
  };

  const handleCurrencyChange = (currency) => {
    const currencyData = currencies.find(c => c.code === currency);
    setSelectedCurrency(currency);
    setValue('currency', currency);
    setDepositMethod(currencyData.method);
  };

  const handleVerifyDeposit = async (depositId) => {
    if (!watchedTransactionHash) {
      toast.error('Please provide transaction hash first');
      return;
    }

    // First update transaction hash
    await updateTransactionHashMutation.mutateAsync({
      depositId,
      transactionHash: watchedTransactionHash
    });

    // Then verify the deposit
    verifyDepositMutation.mutate(depositId);
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
      EXPIRED: { color: 'bg-gray-100 text-gray-800', text: 'Expired' },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getWalletAddress = (network) => {
    // First try to get from user addresses
    if (userAddresses?.data && Array.isArray(userAddresses.data)) {
      const userAddress = userAddresses.data.find(addr => addr.network === network);
      if (userAddress) {
        return userAddress.address;
      }
    }
    
    // Fallback to old addresses
    if (usdtAddresses?.data) {
      return usdtAddresses.data[network] || 'Not available';
    }
    
    return 'Loading...';
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

        {/* Manual Deposit Notice */}
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Manual Deposit Required
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Automatic detection is disabled. After sending USDT to your wallet address, you must manually submit your transaction hash for verification.
              </p>
            </div>
          </div>
        </div>

        {/* Pending Deposit Alert */}
        {pendingDeposit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Pending Deposit: {formatCurrency(pendingDeposit.amount, pendingDeposit.currency)}
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Please send {formatCurrency(pendingDeposit.amount, pendingDeposit.currency)} to the address below and provide the transaction hash.
                </p>
                
                {/* Wallet Address */}
                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-xs text-gray-600 mb-1">Send to this address:</p>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 break-all">
                      {getWalletAddress(pendingDeposit.network)}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(getWalletAddress(pendingDeposit.network));
                        toast.success('Address copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Manual Deposit Notice */}
                <div className="mt-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Manual Deposit Required
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          Automatic detection is disabled. You must manually submit your transaction hash after sending funds.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingDeposit(null)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Deposit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Deposit Funds</CardTitle>
                <CardDescription>
                  Choose your preferred deposit method and currency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Currency Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Select Currency & Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {currencies.map((currency) => (
                        <button
                          key={currency.code}
                          type="button"
                          onClick={() => handleCurrencyChange(currency.code)}
                          className={`p-4 border rounded-lg text-center transition-colors ${
                            watchedCurrency === currency.code
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-2xl mb-1">{currency.icon}</div>
                          <div className="font-medium">{currency.code}</div>
                          <div className="text-xs text-gray-500">{currency.name}</div>
                          <div className="text-xs text-blue-600 mt-1">
                            {currency.method === 'direct' ? 'Direct Transfer' : 'Coinbase'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Network Selection for USDT */}
                  {depositMethod === 'direct' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Select Network
                      </label>
                      
                      {/* Loading State */}
                      {addressesLoading && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                            <p className="text-sm text-gray-600">Loading your wallet addresses...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* User Addresses Status */}
                      {!addressesLoading && userAddresses?.data && Array.isArray(userAddresses.data) && userAddresses.data.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-green-800">✓ Personal Wallet Addresses Active</p>
                              <p className="text-xs text-green-700 mt-1">Using your unique deposit addresses for secure transactions</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Fallback Addresses Status */}
                      {!addressesLoading && (!userAddresses?.data || !Array.isArray(userAddresses.data) || userAddresses.data.length === 0) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-yellow-800">⚠️ Using Company Wallet Addresses</p>
                              <p className="text-xs text-yellow-700 mt-1">Personal addresses not available, using shared company addresses</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        {networks.map((network) => (
                          <button
                            key={network.code}
                            type="button"
                            onClick={() => handleNetworkChange(network.code)}
                            className={`p-3 border rounded-lg text-left transition-colors ${
                              watchedNetwork === network.code
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-medium">{network.name}</div>
                            <div className="text-xs text-gray-500">{network.description}</div>
                            <div className="text-xs text-green-600">Fee: {network.fee}</div>
                            {network.isUserAddress && (
                              <div className="text-xs text-blue-600 mt-1">✓ Your Address</div>
                            )}
                            {network.address && (
                              <div className="text-xs text-gray-500 mt-1 font-mono break-all">
                                {network.address.substring(0, 8)}...{network.address.substring(network.address.length - 6)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predefined Amounts */}
                  {watchedCurrency === 'USDT' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Quick Select (USDT)
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
                            <div className="font-medium">₮{preset.amount}</div>
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
                            value: depositMethod === 'direct' ? 30 : 0.0001,
                            message: `Minimum deposit amount is ${depositMethod === 'direct' ? '30 USDT' : '0.0001'}`
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
                    loading={createUsdtDepositMutation.isPending || createCoinbaseDepositMutation.isPending}
                    disabled={createUsdtDepositMutation.isPending || createCoinbaseDepositMutation.isPending || !watchedAmount}
                  >
                    {createUsdtDepositMutation.isPending || createCoinbaseDepositMutation.isPending
                      ? 'Creating Deposit...' 
                      : `Deposit ${watchedAmount ? formatCurrency(parseFloat(watchedAmount), watchedCurrency) : ''}`
                    }
                  </Button>

                  {/* Manual Deposit Button */}
                  {depositMethod === 'direct' && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-600 mb-2">Already sent USDT?</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // Navigate to manual deposit or show manual deposit form
                          toast.info('Please use the USDT Deposit button from the main menu to access manual deposits');
                        }}
                      >
                        Submit Transaction Hash
                      </Button>
                    </div>
                  )}
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
                        {depositMethod === 'direct' 
                          ? 'Direct USDT transfers require manual verification. Submit your transaction hash after sending funds to get credited.'
                          : 'All deposits are processed securely through Coinbase Commerce. Your funds will be credited to your wallet once the transaction is confirmed on the blockchain.'
                        }
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
                {depositMethod === 'direct' ? (
                  <>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Create Deposit</p>
                        <p className="text-xs text-gray-500">Select amount and network, get wallet address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Send USDT</p>
                        <p className="text-xs text-gray-500">Transfer USDT to the provided address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">3</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Manual Verification</p>
                        <p className="text-xs text-gray-500">Submit your transaction hash to verify and credit your deposit</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>

            {/* Instructions Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deposit Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full"
                >
                  {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
                </Button>
                
                {showInstructions && (
                  <div className="mt-4 space-y-4 text-sm">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                      <ul className="text-yellow-700 space-y-1 text-xs">
                        <li>• Minimum USDT deposit: 30 USDT</li>
                        <li>• Always double-check the wallet address</li>
                        <li>• Use the correct network (BEP20, TRC20, etc.)</li>
                        <li>• Manual verification required - submit transaction hash after sending</li>
                        <li>• Automatic detection is disabled</li>
                        {userAddresses?.data && Array.isArray(userAddresses.data) && userAddresses.data.length > 0 && (
                          <li>• ✓ Using your personal wallet addresses</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h4 className="font-medium text-blue-800 mb-2">Network Fees:</h4>
                      <ul className="text-blue-700 space-y-1 text-xs">
                        <li>• BEP20 (BSC): ~$0.5 - Recommended</li>
                        <li>• TRC20 (TRON): ~$1 - Fast</li>
                        <li>• ERC20 (Ethereum): ~$10-50 - Expensive</li>
                        <li>• Polygon: ~$0.01 - Very cheap</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Deposits Count */}
            {pendingCount?.data?.pendingCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Deposits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {pendingCount.data.pendingCount}
                    </div>
                    <p className="text-sm text-gray-600">deposits awaiting verification</p>
                  </div>
                </CardContent>
              </Card>
            )}

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
                            {deposit.network && ` • ${deposit.network}`}
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
