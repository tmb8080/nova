import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { depositAPI, adminAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import DepositHistory from './DepositHistory';

const UsdtDeposit = ({ onClose, vipLevel = null }) => {

  
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  

  // Fetch user's wallet addresses from API
  const userWalletAddressesQuery = useQuery({
    queryKey: ['userWalletAddresses'],
    queryFn: () => depositAPI.getUserWalletAddresses(),
    retry: 1,
    onError: (error) => {
      console.error('❌ Error fetching user wallet addresses:', error);
    },
    onSuccess: (data) => {
      
    }
  });

  // Fetch USDT addresses from API (fallback)
  const usdtAddressesQuery = useQuery({
    queryKey: ['usdtAddresses'],
    queryFn: () => depositAPI.getUsdtAddresses(),
    enabled: false, // We'll control this manually after defining the variables
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  // Fetch admin settings for minimum USDT amount
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminAPI.getSettings(),
  });

  // Fetch automatic detection status
  const { data: detectionStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['automaticDetectionStatus'],
    queryFn: () => depositAPI.getAutomaticDetectionStatus(),
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 0, // Always consider data stale
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const minUsdtAmount = adminSettings?.data?.minUsdtDepositAmount || 30;
  const isDetectionRunning = detectionStatus?.data?.isRunning || false;

  // Extract wallet addresses from the API response
  const userAddresses = userWalletAddressesQuery.data;
  const addressesData = usdtAddressesQuery.data;
  
  // Parse the nested response structure correctly
  const userAddressesData = userAddresses?.data?.data || [];
  const fallbackAddressesData = addressesData?.data?.data || [];

  // Check if we have valid user addresses data
  const hasValidUserAddresses = userAddressesData && 
    Array.isArray(userAddressesData) && 
    userAddressesData.length > 0 && 
    userAddressesData.every(addr => addr.address && addr.network);

  const hasValidFallbackAddresses = fallbackAddressesData && 
    Object.keys(fallbackAddressesData).length > 0;

  // Hardcoded fallback addresses as last resort
  const hardcodedFallbackAddresses = {
    TRC20: 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK',
    BEP20: '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
    ERC20: '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
    POLYGON: '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
  };

  // Use API data if available, otherwise use hardcoded addresses
  const effectiveFallbackAddresses = fallbackAddressesData || hardcodedFallbackAddresses;
  const hasEffectiveFallbackAddresses = Object.keys(effectiveFallbackAddresses).length > 0;

  // Now enable the fallback query if needed - do this immediately
  useEffect(() => {
    if (!hasValidUserAddresses && !fallbackAddressesData && !usdtAddressesQuery.isLoading) {
      
      queryClient.invalidateQueries(['usdtAddresses']);
    }
  }, [hasValidUserAddresses, fallbackAddressesData, usdtAddressesQuery.isLoading, queryClient]);

  // Network configuration with user's wallet addresses
  const networks = hasValidUserAddresses ? userAddressesData.map(addr => {
    const networkConfig = {
      'BSC': { name: 'BSC BEP20', currencies: 'USDT/USDC', color: 'bg-yellow-500', key: 'BEP20' },
      'POLYGON': { name: 'Polygon MATIC', currencies: 'USDT/USDC', color: 'bg-purple-600', key: 'POLYGON' },
      'ETHEREUM': { name: 'Ethereum ERC20', currencies: 'USDT/USDC', color: 'bg-purple-500', key: 'ERC20' },
      'TRON': { name: 'Tron TRC20', currencies: 'USDT', color: 'bg-blue-500', key: 'TRC20' }
    };

    const config = networkConfig[addr.network] || { 
      name: addr.network, 
      currencies: 'USDT', 
      color: 'bg-gray-500',
      key: addr.network 
    };

    return {
      key: config.key,
      name: config.name,
      currencies: config.currencies,
      minAmount: minUsdtAmount,
      color: config.color,
      address: addr.address,
      isUserAddress: true,
      network: addr.network
    };
  }) : [
    // Fallback to old addresses ONLY if user addresses are not available
    { 
      key: 'TRC20', 
      name: 'Tron TRC20', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-blue-500',
      address: effectiveFallbackAddresses.TRC20 || 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK',
      isUserAddress: false,
      network: 'TRON'
    },
    { 
      key: 'ERC20', 
      name: 'Ethereum ERC20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-500',
      address: effectiveFallbackAddresses.ERC20 || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      isUserAddress: false,
      network: 'ETHEREUM'
    },
    { 
      key: 'BEP20', 
      name: 'BSC BEP20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-yellow-500',
      address: effectiveFallbackAddresses.BEP20 || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      isUserAddress: false,
      network: 'BSC'
    },
    { 
      key: 'POLYGON', 
      name: 'Polygon MATIC', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-600',
      address: effectiveFallbackAddresses.POLYGON || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09',
      isUserAddress: false,
      network: 'POLYGON'
    }
  ];

  // Loading state variables - define before useEffect hooks
  const isLoading = userWalletAddressesQuery.isLoading || settingsLoading;
  const shouldShowLoading = isLoading && !hasValidUserAddresses;



  // Force refresh status when component mounts
  useEffect(() => {
    // Clear any cached data and refetch
    queryClient.removeQueries(['automaticDetectionStatus']);
    refetchStatus();
  }, [queryClient, refetchStatus]);

  // Get the selected network's address
  const selectedNetworkData = networks.find(network => network.key === selectedNetwork);
  const walletAddress = selectedNetworkData?.address || '';
  const qrCodeUrl = walletAddress ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}` : '';

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success('Wallet address copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
  };

  if (shouldShowLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center min-h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-center text-white mt-4">Loading wallet addresses...</p>
        </div>
      </div>
    );
  }

  // Show error if no addresses available
  if (!hasValidUserAddresses && !hasEffectiveFallbackAddresses) {
    // If we're still loading, don't show error yet
    if (userWalletAddressesQuery.isLoading || settingsLoading) {
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-center min-h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-center text-white mt-4">Loading wallet addresses...</p>
          </div>
        </div>
      );
    }

    // Show error only after loading is complete
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md p-8 border border-white/20 shadow-2xl">
          <div className="text-center">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-white mb-2">No Wallet Addresses Available</h3>
            <p className="text-gray-300 mb-4">Unable to load wallet addresses. Please try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return <DepositHistory onClose={() => setShowHistory(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">USDT Deposit</h2>
          <div className="w-10 flex items-center justify-center">
            {(userWalletAddressesQuery.isLoading || settingsLoading) && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
          </div>
        </div>

        <div className="p-4">

          {/* Loading Message */}
          {(userWalletAddressesQuery.isLoading || settingsLoading) && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                <span className="text-blue-300 text-sm">Loading your wallet addresses...</span>
              </div>
            </div>
          )}

          {/* Network Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {networks && networks.length > 0 ? (
              networks.map((network) => (
                <button
                  key={network.key}
                  onClick={() => handleNetworkChange(network.key)}
                  className={`p-3 rounded-lg text-left transition-all duration-200 ${
                    selectedNetwork === network.key
                      ? `${network.color} text-white shadow-lg transform scale-105`
                      : 'bg-white/10 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <div className="text-sm font-medium">{network.name}</div>
                  <div className="text-xs opacity-75">【{network.currencies}】</div>
                  {network.isUserAddress && (
                    <div className="text-xs opacity-75 mt-1 text-green-400">Address</div>
                  )}
                </button>
              ))
            ) : (
              // Show loading placeholders
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-3 bg-white/20 rounded w-3/4"></div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Fallback Address Notice */}
          {!hasValidUserAddresses && hasEffectiveFallbackAddresses && (
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-yellow-400 font-semibold">System Deposit Addresses</h4>
                  <p className="text-yellow-300 text-sm">Using system deposit addresses. Personal addresses will be available once your account is fully configured.</p>
                </div>
              </div>
            </div>
          )}

          {/* QR Code and Wallet Address */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recharge QR code</h3>
            
            {/* QR Code */}
            <div className="flex justify-center mb-4">
              {qrCodeUrl ? (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-48 h-48 bg-white rounded-lg p-2"
                />
              ) : (
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">Loading QR Code...</span>
                </div>
              )}
            </div>

            {/* Wallet Address */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm break-all font-mono">
                  {walletAddress || 'Loading address...'}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="ml-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                >
                  Copy
                </button>
              </div>
              {selectedNetworkData?.isUserAddress && (
                <div className="text-green-400 text-xs mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                 deposit address
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 mb-4">
            <h4 className="text-orange-400 font-semibold mb-2">Important Notes</h4>
            <ol className="text-orange-300 text-sm space-y-1">
              <li>1. The minimum deposit amount is <strong>{minUsdtAmount} USDT</strong>. If the deposit amount is lower than the minimum, the deposit will not be credited.</li>
              <li>2. Universal Support: Works with all major wallets (MetaMask, Trust Wallet, TronLink, Binance Wallet, etc.)</li>
              <li>3. Recommended: Tron (TRC20) for lowest fees, BSC (BEP20) for balance</li>
              <li>4. Important: Double-check address format and network before sending</li>
              <li>5. Your deposit address will not change frequently. If there is any change, we will notify you through the APP announcement.</li>
            </ol>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-6">
            <h4 className="text-blue-400 font-semibold mb-2">Instructions</h4>
            <ol className="text-blue-300 text-sm space-y-1">
              <li>1. Scan the QR code to deposit.</li>
              <li>2. Copy the wallet address on the page to deposit.</li>
              <li>3. After the transfer is completed, please wait 1-3 minutes for the funds to be automatically credited to your account.</li>
            </ol>
            <p className="text-blue-300 text-sm mt-2">
              If the funds have not been credited within 5 minutes, please contact customer service.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              View History
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UsdtDeposit;
