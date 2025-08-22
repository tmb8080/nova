import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { depositAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import DepositHistory from './DepositHistory';

const UsdtDeposit = ({ onClose, vipLevel = null }) => {
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  // Fetch USDT addresses from API
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['usdtAddresses'],
    queryFn: () => depositAPI.getUsdtAddresses(),
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

  // Force refresh status when component mounts
  useEffect(() => {
    // Clear any cached data and refetch
    queryClient.removeQueries(['automaticDetectionStatus']);
    refetchStatus();
  }, [queryClient, refetchStatus]);

  // Network configuration with updated addresses
  const networks = [
    { 
      key: 'TRC20', 
      name: 'Tron TRC20', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-blue-500',
      address: addressesData?.data?.TRC20 || 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK'
    },
    { 
      key: 'ERC20', 
      name: 'Ethereum ERC20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-500',
      address: addressesData?.data?.ERC20 || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    },
    { 
      key: 'BEP20', 
      name: 'BSC BEP20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-yellow-500',
      address: addressesData?.data?.BEP20 || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    },
    { 
      key: 'POLYGON', 
      name: 'Polygon MATIC', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-600',
      address: addressesData?.data?.POLYGON || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    },
    { 
      key: 'ARBITRUM', 
      name: 'Arbitrum ARB', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-blue-600',
      address: addressesData?.data?.ARBITRUM || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    },
    { 
      key: 'OPTIMISM', 
      name: 'Optimism OP', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-red-500',
      address: addressesData?.data?.OPTIMISM || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    }
  ];

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
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="p-4">

          {/* Network Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {networks.map((network) => (
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
              </button>
            ))}
          </div>

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
