import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/Button';
import { depositAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import DepositHistory from './DepositHistory';

const UsdtDeposit = ({ onClose, vipLevel = null }) => {
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');
  const [amount, setAmount] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();

  // Fetch USDT addresses from API
  const { isLoading: addressesLoading } = useQuery({
    queryKey: ['usdtAddresses'],
    queryFn: () => depositAPI.getUsdtAddresses(),
  });

  // Fetch admin settings for minimum USDT amount
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminAPI.getSettings(),
  });

  const minUsdtAmount = adminSettings?.data?.minUsdtDepositAmount || 30;

  // Network configuration with updated addresses
  const networks = [
    { 
      key: 'TRC20', 
      name: 'Tron TRC20', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-blue-500',
      address: 'TJwzxqg5FbGRibyMRArrnSo828WppqvQjd'
    },
    { 
      key: 'ERC20', 
      name: 'Ethereum ERC20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-500',
      address: '0x1ecADEB88c63921B5cd9ac365C276f0a8e0360bD'
    },
    { 
      key: 'BEP20', 
      name: 'BSC BEP20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-yellow-500',
      address: '0x1ecADEB88c63921B5cd9ac365C276f0a8e0360bD'
    },
    { 
      key: 'POLYGON', 
      name: 'Polygon MATIC', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-600',
      address: '0x1ecADEB88c63921B5cd9ac365C276f0a8e0360bD'
    },
    { 
      key: 'ARBITRUM', 
      name: 'Arbitrum ARB', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-blue-600',
      address: '0x1ecADEB88c63921B5cd9ac365C276f0a8e0360bD'
    },
    { 
      key: 'OPTIMISM', 
      name: 'Optimism OP', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-red-500',
      address: '0x1ecADEB88c63921B5cd9ac365C276f0a8e0360bD'
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

  const handleDeposit = async () => {
    if (!selectedNetwork) {
      toast.error('Please select a network');
      return;
    }

    if (!amount || parseFloat(amount) < minUsdtAmount) {
      toast.error(`Please enter a valid amount (minimum ${minUsdtAmount} USDT)`);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create deposit record
      const depositData = {
        amount: parseFloat(amount),
        network: selectedNetwork
      };
      
      // Only include transactionHash if it's provided
      if (transactionHash) {
        depositData.transactionHash = transactionHash;
      }
      
      const response = await depositAPI.createUsdtDeposit(depositData);

      if (response.data.success) {
        toast.success('Deposit request created successfully! Please send the exact amount to the provided address and wait for confirmation.');
        onClose();
        // Refresh wallet stats
        queryClient.invalidateQueries(['walletStats']);
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create deposit request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNetworkChange = (network) => {
    setSelectedNetwork(network);
  };



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

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deposit Amount (USDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Minimum ${minUsdtAmount} USDT`}
              min={minUsdtAmount}
              step="0.01"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimum deposit: {minUsdtAmount} USDT
            </p>
          </div>

          {/* Transaction Hash Input (Optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Transaction Hash (Optional)
            </label>
            <input
              type="text"
              value={transactionHash}
              onChange={(e) => setTransactionHash(e.target.value)}
              placeholder="Enter transaction hash after sending payment"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 mt-1">
              You can add this later to speed up confirmation
            </p>
          </div>

          {/* VIP Level Info */}
          {vipLevel && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-4 mb-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-300">Join {vipLevel.name}</h3>
                <p className="text-blue-200 text-sm">
                  Deposit ${vipLevel.amount} to join this VIP level
                </p>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Recharge QR code</h3>
            {addressesLoading || settingsLoading ? (
              <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-lg mx-auto animate-pulse border border-white/20"></div>
            ) : (
              <div className="w-48 h-48 mx-auto">
                <img
                  src={qrCodeUrl}
                  alt="USDT Deposit QR Code"
                  className="w-full h-full rounded-lg border border-white/20 shadow-lg"
                />
              </div>
            )}
          </div>

          {/* Wallet Address */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <span className="text-white font-mono text-sm break-all">
                {walletAddress || 'Loading address...'}
              </span>
              <Button
                onClick={handleCopyAddress}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm ml-2 flex-shrink-0 shadow-lg"
              >
                Copy
              </Button>
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-4 text-sm text-gray-600 mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-orange-600">1.</span>
                  <span>
                    The minimum deposit amount is <span className="font-bold text-orange-600">{minUsdtAmount}USDT</span>. If the deposit amount is lower than the minimum, the deposit will not be credited.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-orange-600">2.</span>
                  <span>
                    <strong>Universal Support:</strong> Works with all major wallets (MetaMask, Trust Wallet, TronLink, Binance Wallet, etc.)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-orange-600">3.</span>
                  <span>
                    <strong>Recommended:</strong> Tron (TRC20) for lowest fees, BSC (BEP20) for balance
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-orange-600">4.</span>
                  <span>
                    <strong>Important:</strong> Double-check address format and network before sending
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-orange-600">5.</span>
                  <span>
                    Your deposit address will not change frequently. If there is any change, we will notify you through the APP announcement.
                  </span>
                </li>
              </ol>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <Button
              onClick={handleDeposit}
              disabled={isSubmitting || !selectedNetwork}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating Deposit...' : 'Create Deposit Request'}
            </Button>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowHistory(true)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              >
                View History
              </Button>
              <Button
                onClick={onClose}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
              >
                Close
              </Button>
            </div>
            
            {vipLevel && (
              <Button
                onClick={() => {
                  toast.success('Please complete your USDT deposit to join the VIP level');
                  onClose();
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                I've Made the Deposit
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Deposit History Modal */}
      {showHistory && (
        <DepositHistory onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
};

export default UsdtDeposit;
