import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { withdrawalAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const UsdtWithdrawal = ({ onClose }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [withdrawalAddress, setWithdrawalAddress] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const queryClient = useQueryClient();

  // Fetch admin settings
  const { data: adminSettings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminAPI.getSettings(),
  });

  const minWithdrawalAmount = adminSettings?.data?.minWithdrawalAmount || 10;

  // Currency options
  const currencies = [
    { key: 'USDT', name: 'USDT', icon: '💎', color: 'bg-green-500', description: 'Tether USD' },
    { key: 'USDC', name: 'USDC', icon: '🔵', color: 'bg-blue-500', description: 'USD Coin' },
    { key: 'USDT_USDC', name: 'USDT/USDC', icon: '🔄', color: 'bg-purple-500', description: 'Mixed Stablecoins' }
  ];

  // Fetch network fees for selected currency
  const { data: networkFees } = useQuery({
    queryKey: ['networkFees', selectedCurrency],
    queryFn: () => withdrawalAPI.getNetworkFees(selectedCurrency),
    enabled: !!selectedCurrency
  });

  // Network configuration with dynamic fees
  const networks = [
    { key: 'TRC20', name: 'Tron TRC20', color: 'bg-blue-500', supportedCurrencies: ['USDT'] },
    { key: 'BEP20', name: 'BSC BEP20', color: 'bg-yellow-500', supportedCurrencies: ['USDT', 'USDC'] },
    { key: 'POLYGON', name: 'Polygon MATIC', color: 'bg-purple-600', supportedCurrencies: ['USDT', 'USDC'] },
    { key: 'ARBITRUM', name: 'Arbitrum ARB', color: 'bg-blue-600', supportedCurrencies: ['USDT', 'USDC'] },
    { key: 'OPTIMISM', name: 'Optimism OP', color: 'bg-red-500', supportedCurrencies: ['USDT', 'USDC'] },
    { key: 'ERC20', name: 'Ethereum ERC20', color: 'bg-purple-500', supportedCurrencies: ['USDT', 'USDC'] }
  ];

  // Get fee for a network
  const getNetworkFee = (networkKey) => {
    if (!networkFees) return 0;
    
    // The API returns an array directly, not nested under data
    const feesData = Array.isArray(networkFees) ? networkFees : [];
    
    const network = feesData.find(n => n.network === networkKey);
    return network ? network.fee : 0;
  };

  const selectedNetworkData = networks.find(network => network.key === selectedNetwork);
  const selectedCurrencyData = currencies.find(currency => currency.key === selectedCurrency);
  
  // Filter networks based on selected currency
  const availableNetworks = networks.filter(network => 
    network.supportedCurrencies.includes(selectedCurrency) || 
    (selectedCurrency === 'USDT_USDC' && network.supportedCurrencies.includes('USDT'))
  );
  
  // Auto-select first available network if current selection is not supported
  useEffect(() => {
    if (!availableNetworks.find(network => network.key === selectedNetwork)) {
      setSelectedNetwork(availableNetworks[0]?.key || 'TRC20');
    }
  }, [selectedCurrency, selectedNetwork, availableNetworks]);

  // Withdrawal mutation
  const withdrawalMutation = useMutation({
    mutationFn: (data) => withdrawalAPI.createWithdrawal(data),
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully! Please wait for admin approval.');
      queryClient.invalidateQueries(['walletStats']);
      queryClient.invalidateQueries(['transactions']);
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit withdrawal request');
    },
  });

  const handleWithdrawal = () => {
    if (!withdrawalAddress.trim() || !withdrawalAmount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount < minWithdrawalAmount) {
      toast.error(`Minimum withdrawal amount is $${minWithdrawalAmount}`);
      return;
    }

    withdrawalMutation.mutate({
      amount: amount,
      currency: selectedCurrency,
      walletAddress: withdrawalAddress,
      network: selectedNetwork
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">Crypto Withdrawal</h2>
          <div className="w-10"></div>
        </div>

        <div className="p-4">
          {/* Currency Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Currency
            </label>
            <div className="grid grid-cols-3 gap-3">
              {currencies.map((currency) => (
                <button
                  key={currency.key}
                  onClick={() => setSelectedCurrency(currency.key)}
                  className={`p-4 rounded-xl text-center transition-all duration-200 ${
                    selectedCurrency === currency.key
                      ? `${currency.color} text-white shadow-lg transform scale-105`
                      : 'bg-white/10 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">{currency.icon}</div>
                  <div className="text-sm font-semibold">{currency.name}</div>
                  <div className="text-xs opacity-75">{currency.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Network Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Select Network
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableNetworks.map((network) => (
                <button
                  key={network.key}
                  onClick={() => setSelectedNetwork(network.key)}
                  className={`p-3 rounded-lg text-left transition-all duration-200 ${
                    selectedNetwork === network.key
                      ? `${network.color} text-white shadow-lg transform scale-105`
                      : 'bg-white/10 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <div className="text-sm font-medium">{network.name}</div>
                  <div className="text-xs opacity-75">${getNetworkFee(network.key)} fee</div>
                </button>
              ))}
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Withdrawal Address
              </label>
              <input
                type="text"
                value={withdrawalAddress}
                onChange={(e) => setWithdrawalAddress(e.target.value)}
                placeholder={`Enter your ${selectedCurrencyData?.name || 'crypto'} wallet address`}
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Withdrawal Amount ({selectedCurrencyData?.name || 'USDT'})
              </label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Enter amount"
                min={minWithdrawalAmount}
                step="0.01"
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Fee Information */}
            {selectedNetworkData && selectedCurrencyData && (
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-3">
                <div className="text-sm text-blue-300">
                  <p className="font-medium">Currency: {selectedCurrencyData.name}</p>
                  <p className="font-medium">Network: {selectedNetworkData.name}</p>
                  <p>Fee: ${getNetworkFee(selectedNetwork)} {selectedCurrencyData.name}</p>
                  <p>Processing time: 1-24 hours</p>
                  {selectedCurrency === 'USDT_USDC' && (
                    <p className="text-xs text-blue-400 mt-1">
                      💡 Mixed withdrawal: You'll receive a combination of USDT and USDC
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={handleWithdrawal}
                disabled={withdrawalMutation.isLoading || !withdrawalAddress.trim() || !withdrawalAmount}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg"
              >
                {withdrawalMutation.isLoading ? 'Processing...' : 'Submit Withdrawal'}
              </Button>
              <Button 
                onClick={onClose} 
                className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsdtWithdrawal;
