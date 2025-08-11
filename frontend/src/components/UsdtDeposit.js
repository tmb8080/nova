import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { depositAPI, adminAPI } from '../services/api';
import toast from 'react-hot-toast';

const UsdtDeposit = ({ onClose, vipLevel = null }) => {
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');

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

  const minUsdtAmount = adminSettings?.data?.minUsdtDepositAmount || 30;

  const walletAddress = addressesData?.data?.[selectedNetwork] || '';
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

  const formatAddress = (address) => {
    if (address.length > 20) {
      return `${address.substring(0, 20)}...`;
    }
    return address;
  };

  // Network configuration
  const networks = [
    { 
      key: 'TRC20', 
      name: 'Tron TRC20', 
      currencies: 'USDT/TRX',
      minAmount: minUsdtAmount,
      color: 'bg-blue-500'
    },
    { 
      key: 'BEP20', 
      name: 'BNB BEP20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-yellow-500'
    },
    { 
      key: 'ERC20', 
      name: 'Ethereum ERC20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-500'
    },
    { 
      key: 'POLYGON', 
      name: 'Polygon ERC20', 
      currencies: 'USDT/USDC',
      minAmount: minUsdtAmount,
      color: 'bg-purple-600'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">USDT Deposit</h2>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="p-4">
          {/* Network Selection */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {networks.map((network) => (
              <button
                key={network.key}
                onClick={() => handleNetworkChange(network.key)}
                className={`p-3 rounded-lg text-left transition-colors ${
                  selectedNetwork === network.key
                    ? `${network.color} text-white shadow-sm`
                    : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="text-sm font-medium">{network.name}</div>
                <div className="text-xs opacity-75">【{network.currencies}】</div>
              </button>
            ))}
          </div>

          {/* VIP Level Info */}
          {vipLevel && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-center">
                <h3 className="font-semibold text-blue-800">Join {vipLevel.name}</h3>
                <p className="text-blue-600 text-sm">
                  Deposit ${vipLevel.amount} to join this VIP level
                </p>
              </div>
            </div>
          )}

          {/* QR Code Section */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-4">Recharge QR code</h3>
            {addressesLoading || settingsLoading ? (
              <div className="w-48 h-48 bg-gray-200 rounded-lg mx-auto animate-pulse"></div>
            ) : (
              <div className="w-48 h-48 mx-auto">
                <img
                  src={qrCodeUrl}
                  alt="USDT Deposit QR Code"
                  className="w-full h-full rounded-lg border"
                />
              </div>
            )}
          </div>

          {/* Wallet Address */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <span className="text-gray-800 font-mono text-sm break-all">
                {walletAddress || 'Loading address...'}
              </span>
              <Button
                onClick={handleCopyAddress}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm ml-2 flex-shrink-0"
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
                    Please select the corresponding network to deposit. Otherwise, it cannot be retrieved.
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2 text-orange-600">3.</span>
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
              onClick={onClose}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white"
            >
              Close
            </Button>
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
    </div>
  );
};

export default UsdtDeposit;
