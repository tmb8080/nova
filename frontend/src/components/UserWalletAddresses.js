import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { depositAPI } from '../services/api';
import toast from 'react-hot-toast';

const UserWalletAddresses = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('ALL');
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Fetch user's wallet addresses
  const { data: userAddresses, isLoading, refetch } = useQuery({
    queryKey: ['userWalletAddresses'],
    queryFn: () => depositAPI.getUserWalletAddresses(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Copy address to clipboard
  const copyToClipboard = async (address, network) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(network);
      toast.success(`${network} address copied to clipboard!`);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  // Get network info
  const getNetworkInfo = (network) => {
    const networkInfo = {
      'BSC': {
        name: 'BSC BEP20',
        description: 'Binance Smart Chain',
        currency: 'USDT/USDC',
        color: 'bg-yellow-500',
        icon: '🟡'
      },
      'POLYGON': {
        name: 'Polygon MATIC',
        description: 'Polygon Network',
        currency: 'USDT/USDC',
        color: 'bg-purple-600',
        icon: '🟣'
      },
      'ETHEREUM': {
        name: 'Ethereum ERC20',
        description: 'Ethereum Mainnet',
        currency: 'USDT/USDC',
        color: 'bg-purple-500',
        icon: '🔷'
      },
      'TRON': {
        name: 'Tron TRC20',
        description: 'Tron Network',
        currency: 'USDT',
        color: 'bg-blue-500',
        icon: '🔵'
      }
    };
    
    return networkInfo[network] || {
      name: network,
      description: 'Unknown Network',
      currency: 'USDT',
      color: 'bg-gray-500',
      icon: '⚫'
    };
  };

  // Filter addresses by network
  const filteredAddresses = userAddresses?.data?.filter(addr => 
    selectedNetwork === 'ALL' || addr.network === selectedNetwork
  ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Wallet Addresses</h1>
          <p className="text-gray-600 mt-1">Use these addresses to deposit funds to your account</p>
        </div>
        
        <button
          onClick={() => refetch()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Network Filter */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Network:</label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All Networks</option>
            <option value="BSC">BSC</option>
            <option value="POLYGON">Polygon</option>
            <option value="ETHEREUM">Ethereum</option>
            <option value="TRON">Tron</option>
          </select>
        </div>
      </div>

      {/* Addresses Grid */}
      {filteredAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAddresses.map((address) => {
            const networkInfo = getNetworkInfo(address.network);
            
            return (
              <div key={address.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                {/* Network Header */}
                <div className={`${networkInfo.color} text-white p-4 rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{networkInfo.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold">{networkInfo.name}</h3>
                        <p className="text-sm opacity-90">{networkInfo.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-90">Currency</p>
                      <p className="font-semibold">{networkInfo.currency}</p>
                    </div>
                  </div>
                </div>

                {/* Address Content */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Address:
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-50 p-3 rounded-lg border">
                          <p className="font-mono text-sm text-gray-800 break-all">
                            {address.address}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(address.address, address.network)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            copiedAddress === address.network
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {copiedAddress === address.network ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QR Code:
                      </label>
                      <div className="bg-gray-50 p-4 rounded-lg border">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${address.address}`}
                          alt={`QR Code for ${address.network}`}
                          className="mx-auto"
                        />
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">How to use:</h4>
                      <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Copy the address above or scan the QR code</li>
                        <li>Send {networkInfo.currency} from your wallet to this address</li>
                        <li>Funds will be automatically credited to your account</li>
                        <li>Transaction may take a few minutes to process</li>
                      </ol>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600 font-medium">Active</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Created: {new Date(address.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🔐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallet Addresses Found</h3>
          <p className="text-gray-500 mb-4">
            It seems you don't have any wallet addresses yet. Please contact support.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="text-yellow-400 text-xl">⚠️</div>
          <div>
            <h4 className="text-sm font-semibold text-yellow-800 mb-1">Important Notice</h4>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Only send {filteredAddresses.length > 0 ? getNetworkInfo(filteredAddresses[0].network).currency : 'USDT'} to these addresses</li>
              <li>Sending other cryptocurrencies may result in permanent loss</li>
              <li>Ensure you're using the correct network when sending funds</li>
              <li>Keep your private keys secure and never share them</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserWalletAddresses;
