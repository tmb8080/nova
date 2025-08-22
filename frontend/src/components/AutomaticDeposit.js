import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { depositAPI } from '../services/api';
import toast from 'react-hot-toast';

const AutomaticDeposit = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('TRC20');

  // Fetch USDT addresses from API
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['usdtAddresses'],
    queryFn: () => depositAPI.getUsdtAddresses(),
  });

  // Fetch admin settings for minimum amounts
  const { data: adminSettings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => depositAPI.getAdminSettings(),
  });

  const minUsdtAmount = adminSettings?.data?.minUsdtDepositAmount || 30;

  // Network configuration with addresses
  const networks = [
    { 
      key: 'TRC20', 
      name: 'TRC20-USDT', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-blue-500',
      address: addressesData?.data?.TRC20 || 'TUF38LTyPaqfdanHBpGMs5Xid6heLcxxpK'
    },
    { 
      key: 'BEP20', 
      name: 'BEP20-USDT', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-yellow-500',
      address: addressesData?.data?.BEP20 || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    },
    { 
      key: 'ERC20', 
      name: 'ERC20-USDT', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-purple-500',
      address: addressesData?.data?.ERC20 || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
    },
    { 
      key: 'POL', 
      name: 'POL-USDT', 
      currencies: 'USDT',
      minAmount: minUsdtAmount,
      color: 'bg-purple-600',
      address: addressesData?.data?.POLYGON || '0x9d78BbBF2808fc88De78cd5c9021A01f897DAb09'
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-white">USDT</h2>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>

        <div className="p-4">
          {/* Network Selection */}
          <div className="grid grid-cols-2 gap-2 mb-6">
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
                  copy
                </button>
              </div>
            </div>
          </div>

          {/* Notes and Instructions */}
          <div className="space-y-4">
            <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
              <h4 className="text-yellow-400 font-semibold mb-2">Notes</h4>
              <ul className="text-yellow-300 text-sm space-y-1">
                <li>• The minimum deposit amount is {minUsdtAmount} USDT.</li>
                <li>• Please select the correct deposit method (TRC20, POL, ERC20, BEP20) (USDT/USDC).</li>
              </ul>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
              <h4 className="text-blue-400 font-semibold mb-2">Instructions</h4>
              <ol className="text-blue-300 text-sm space-y-1">
                <li>1: Scan the QR code to deposit.</li>
                <li>2: Copy the wallet address on the page to deposit.</li>
                <li>3: After the transfer is completed, please wait 1-3 minutes for the funds to be automatically credited to your account.</li>
              </ol>
              <p className="text-blue-300 text-sm mt-2">
                If the funds have not been credited within 5 minutes, please contact customer service.
              </p>
            </div>
          </div>

          {/* Customer Service Button */}
          <div className="fixed bottom-4 right-4">
            <button className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-600 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomaticDeposit;
