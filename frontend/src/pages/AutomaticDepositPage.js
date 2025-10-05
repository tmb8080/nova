import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { depositAPI } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Layout from '../components/layout/Layout';
import toast from 'react-hot-toast';

const AutomaticDepositPage = () => {
  const [transactionHash, setTransactionHash] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [autoFillData, setAutoFillData] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState('all');

  // Auto-fill transaction details mutation
  const autoFillTransactionMutation = useMutation({
    mutationFn: (data) => {
      console.log('🚀 Auto-fill mutation called with data:', data);
      return depositAPI.autoFillTransaction(data);
    },
    onSuccess: (data) => {
      console.log('✅ Auto-fill mutation success:', data);
      const transactionData = data.data;
      console.log('Auto-fill transaction data:', transactionData);
      
      setAutoFillData(transactionData);
      setIsSearching(false);
      
      if (transactionData.found) {
        if (transactionData.isRecipientMatching) {
          toast.success(`✅ Transaction verified! Auto-filled: ${transactionData.suggestedAmount} USDT on ${transactionData.suggestedNetwork}`);
        } else {
          toast.warning(`⚠️ Transaction found on ${transactionData.foundOnNetwork}, but recipient doesn't match our address`);
        }
      } else {
        setAutoFillData(null);
        toast.error('❌ Transaction not found on any network');
      }
    },
    onError: (error) => {
      console.log('❌ Auto-fill mutation error:', error);
      setAutoFillData(null);
      setIsSearching(false);
      const errorMessage = error.response?.data?.message || 'Failed to get transaction details';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  // Check transaction across all networks mutation
  const checkAllNetworksMutation = useMutation({
    mutationFn: (data) => depositAPI.checkTransactionAllNetworks(data),
    onSuccess: (response) => {
      const result = response.data.data;
      setSearchResults(result);
      setIsSearching(false);
      
      if (result.found) {
        toast.success(`✅ Transaction found on ${result.foundOnNetwork}!`);
        console.log('Cross-network check result:', result);
      } else {
        toast.error('❌ Transaction not found on any network');
        console.log('Cross-network check result:', result);
      }
    },
    onError: (error) => {
      setIsSearching(false);
      toast.error(error.response?.data?.message || 'Failed to check transaction across networks');
    },
  });

  // Function to trigger auto-fill
  const triggerAutoFill = (hash) => {
    console.log('🔍 triggerAutoFill called with hash:', hash);
    if (hash && /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      console.log('✅ Hash is valid, triggering auto-fill mutation');
      setIsSearching(true);
      autoFillTransactionMutation.mutate({ transactionHash: hash });
    } else {
      console.log('❌ Hash is invalid or empty:', hash);
    }
  };

  // Function to check transaction across all networks
  const checkAllNetworks = (hash) => {
    if (hash && /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      setIsSearching(true);
      checkAllNetworksMutation.mutate({ transactionHash: hash });
    } else {
      toast.error('Please enter a valid transaction hash');
    }
  };

  // Handle input change with auto-detection
  const handleTransactionHashChange = (e) => {
    const hash = e.target.value.trim();
    setTransactionHash(hash);
    
    // Auto-trigger when a valid hash is entered
    if (hash && /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      console.log('✅ Valid hash detected, calling triggerAutoFill');
      triggerAutoFill(hash);
    } else {
      // Clear results if hash becomes invalid
      setAutoFillData(null);
      setSearchResults(null);
    }
  };

  // Helper functions for display
  const getNetworkIcon = (network) => {
    const icons = {
      'BSC': '🟡',
      'Polygon': '🟣',
      'BEP20': '🟡',
      'POLYGON': '🟣'
    };
    return icons[network] || '🌐';
  };

  const getNetworkColor = (network) => {
    const colors = {
      'BSC': 'text-yellow-400',
      'Polygon': 'text-purple-400',
      'BEP20': 'text-yellow-400',
      'POLYGON': 'text-purple-400'
    };
    return colors[network] || 'text-gray-400';
  };

  const formatAmount = (amount, isTokenTransfer = false) => {
    if (!amount) return '0.000000';
    if (isTokenTransfer) {
      return parseFloat(amount).toFixed(6);
    }
    return parseFloat(amount).toFixed(6);
  };

  const formatBlockNumber = (blockNumber) => {
    if (!blockNumber) return 'N/A';
    if (typeof blockNumber === 'string' && blockNumber.startsWith('0x')) {
      return parseInt(blockNumber, 16).toLocaleString();
    }
    return blockNumber.toLocaleString();
  };

  const getStatusBadge = (isValid) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isValid 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isValid ? '✓ Valid' : '✗ Invalid'}
      </span>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🔍 Automatic Transaction Detection</h1>
          <p className="text-gray-600 mt-1">
            Paste any transaction hash to automatically detect network, amount, and verify recipient address
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Detection Interface */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Hash Detection</CardTitle>
                <CardDescription>
                  Enter a transaction hash to automatically detect details across all supported networks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Transaction Hash Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">
                    Transaction Hash *
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Paste transaction hash to auto-detect details"
                      value={transactionHash}
                      onChange={handleTransactionHashChange}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => checkAllNetworks(transactionHash)}
                      loading={checkAllNetworksMutation.isPending}
                      disabled={!transactionHash}
                      className="whitespace-nowrap"
                    >
                      {checkAllNetworksMutation.isPending ? 'Checking...' : '🔍 Check All'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    🔍 Paste transaction hash to automatically detect network, amount, and verify recipient
                  </p>
                </div>

                {/* Loading State */}
                {isSearching && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Searching Transaction</p>
                        <p className="text-xs text-blue-600">Checking across all supported networks...</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-center space-x-2">
                      <div className="animate-pulse">🟡</div>
                      <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>🔵</div>
                      <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>🟣</div>
                      <div className="animate-pulse" style={{ animationDelay: '0.6s' }}>🔴</div>
                    </div>
                  </div>
                )}

                {/* Auto-fill Results */}
                {autoFillData && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-green-600 text-lg">✅</span>
                      <h4 className="text-sm font-medium text-green-800">Transaction Auto-Detected</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-green-700">Network:</span>
                        <span className="ml-2 font-medium text-green-900">{autoFillData.foundOnNetwork}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Amount:</span>
                        <span className="ml-2 font-medium text-green-900">{autoFillData.suggestedAmount} USDT</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-green-700">Recipient:</span>
                        <div className="mt-1 font-mono text-xs break-all bg-white p-2 rounded border">
                          {autoFillData.recipientAddress}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-green-700">Sender:</span>
                        <div className="mt-1 font-mono text-xs break-all bg-white p-2 rounded border">
                          {autoFillData.senderAddress}
                        </div>
                      </div>
                      <div>
                        <span className="text-green-700">Block:</span>
                        <span className="ml-2 font-medium text-green-900">{autoFillData.blockNumber}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Status:</span>
                        <span className="ml-2">{getStatusBadge(autoFillData.isRecipientMatching)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Network Results */}
                {searchResults && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-gray-600 text-lg">🔍</span>
                      <h4 className="text-sm font-medium text-gray-800">Detailed Network Results</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {searchResults.results.map((result, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getNetworkIcon(result.network)}</span>
                              <span className={`font-medium ${getNetworkColor(result.network)}`}>
                                {result.network}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {result.found ? (
                                <span className="text-green-600 text-sm font-medium">✅ Found</span>
                              ) : (
                                <span className="text-red-600 text-sm font-medium">❌ Not Found</span>
                              )}
                            </div>
                          </div>

                          {result.found && result.details ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Recipient:</span>
                                <p className="text-gray-900 font-mono break-all">{result.details.recipientAddress}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Sender:</span>
                                <p className="text-gray-900 font-mono break-all">{result.details.senderAddress}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <p className="text-gray-900 font-semibold">
                                  {formatAmount(result.details.amount, result.details.isTokenTransfer)}
                                  {result.details.isTokenTransfer && (
                                    <span className="text-gray-500 ml-1">(Token)</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Block:</span>
                                <p className="text-gray-900">{formatBlockNumber(result.details.blockNumber)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <p className={`font-medium ${result.details.isConfirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {result.details.isConfirmed ? 'Confirmed' : 'Pending'}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Gas Used:</span>
                                <p className="text-gray-900">{result.details.gasUsed ? parseInt(result.details.gasUsed, 16).toLocaleString() : 'N/A'}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-500 text-xs">
                              {result.error || 'Transaction not found on this network'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How it Works */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How Automatic Detection Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Paste Transaction Hash</p>
                    <p className="text-xs text-gray-500">Copy and paste any transaction hash from your wallet</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Automatic Detection</p>
                    <p className="text-xs text-gray-500">System searches across all supported networks</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Get Results</p>
                    <p className="text-xs text-gray-500">View network, amount, and recipient verification</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supported Networks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported Networks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🟡</span>
                    <span className="text-sm">BSC (BEP20)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🟣</span>
                    <span className="text-sm">Polygon</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500">•</span>
                    <p>Transaction hashes are 64 characters long (with or without 0x prefix)</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500">•</span>
                    <p>Valid recipient addresses will show as "Valid" status</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500">•</span>
                    <p>Amounts are automatically converted to USDT equivalent</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-500">•</span>
                    <p>Only confirmed transactions are considered valid</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AutomaticDepositPage;
