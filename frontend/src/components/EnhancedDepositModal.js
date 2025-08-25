import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { depositAPI } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import toast from 'react-hot-toast';

const EnhancedDepositModal = ({ isOpen, onClose, onSuccess }) => {
  const [autoFillStatus, setAutoFillStatus] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: '',
      network: 'BEP20',
      transactionHash: ''
    }
  });

  const watchedAmount = watch('amount');
  const watchedNetwork = watch('network');
  const watchedTransactionHash = watch('transactionHash');

  // Auto-fill transaction details mutation
  const autoFillTransactionMutation = useMutation({
    mutationFn: depositAPI.autoFillTransaction,
    onSuccess: (data) => {
      const transactionInfo = data.data;
      console.log('Auto-fill transaction data:', transactionInfo);
      
      if (transactionInfo.found) {
        setTransactionData(transactionInfo);
        
        // Auto-fill the form with transaction details
        if (transactionInfo.suggestedAmount && !isNaN(transactionInfo.suggestedAmount)) {
          setValue('amount', transactionInfo.suggestedAmount.toString());
        }
        
        if (transactionInfo.suggestedNetwork) {
          setValue('network', transactionInfo.suggestedNetwork);
        }
        
        // Set auto-fill status
        if (transactionInfo.isRecipientMatching) {
          setAutoFillStatus('success');
          toast.success(`✅ Transaction verified! Auto-filled: ${transactionInfo.suggestedAmount} USDT on ${transactionInfo.suggestedNetwork}`);
        } else {
          setAutoFillStatus('warning');
          toast.warning(`⚠️ Transaction found on ${transactionInfo.foundOnNetwork}, but recipient doesn't match our address`);
        }
      } else {
        setAutoFillStatus('error');
        setTransactionData(null);
        toast.error('❌ Transaction not found on any network');
      }
    },
    onError: (error) => {
      setAutoFillStatus('error');
      setTransactionData(null);
      const errorMessage = error.response?.data?.message || 'Failed to get transaction details';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  // Create USDT deposit mutation
  const createUsdtDepositMutation = useMutation({
    mutationFn: depositAPI.createUsdtDeposit,
    onSuccess: (data) => {
      toast.success('✅ Deposit created successfully!');
      onSuccess(data.data);
      onClose();
      reset();
      setTransactionData(null);
      setAutoFillStatus(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create deposit');
    },
  });

  // Auto-trigger when transaction hash is entered
  useEffect(() => {
    if (watchedTransactionHash && /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(watchedTransactionHash)) {
      const timer = setTimeout(() => {
        autoFillTransactionMutation.mutate({ transactionHash: watchedTransactionHash });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchedTransactionHash]);

  const onSubmit = async (data) => {
    if (!data.amount || parseFloat(data.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!data.transactionHash || data.transactionHash.trim() === '') {
      toast.error('Please provide the transaction hash');
      return;
    }

    setIsLoading(true);
    try {
      await createUsdtDepositMutation.mutateAsync({
        amount: parseFloat(data.amount),
        network: data.network,
        transactionHash: data.transactionHash.trim()
      });
    } catch (error) {
      console.error('Deposit creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    reset();
    setTransactionData(null);
    setAutoFillStatus(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create USDT Deposit</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Hash Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Transaction Hash *
              </label>
              <Input
                type="text"
                placeholder="Paste transaction hash to auto-fill details"
                error={errors.transactionHash?.message}
                {...register('transactionHash', {
                  required: 'Transaction hash is required',
                  pattern: {
                    value: /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/,
                    message: 'Please enter a valid transaction hash'
                  }
                })}
              />
              <p className="text-xs text-gray-500">
                🔍 Paste transaction hash to automatically fill network and amount
              </p>
            </div>

            {/* Auto-fill Status */}
            {autoFillStatus && (
              <div className={`p-3 rounded-lg ${
                autoFillStatus === 'success' 
                  ? 'bg-green-50 border border-green-200'
                  : autoFillStatus === 'warning'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                {autoFillStatus === 'success' && (
                  <div className="flex items-center text-green-800">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transaction verified and form auto-filled
                  </div>
                )}
                {autoFillStatus === 'warning' && (
                  <div className="flex items-center text-yellow-800">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Transaction found but recipient doesn't match our address
                  </div>
                )}
                {autoFillStatus === 'error' && (
                  <div className="flex items-center text-red-800">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Transaction not found or error occurred
                  </div>
                )}
              </div>
            )}

            {/* Transaction Details Display */}
            {transactionData && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Network:</span>
                    <span className="ml-2 font-medium">{transactionData.foundOnNetwork}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Amount:</span>
                    <span className="ml-2 font-medium">{transactionData.suggestedAmount} USDT</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Recipient:</span>
                    <span className="ml-2 font-mono text-xs break-all">{transactionData.recipientAddress}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Sender:</span>
                    <span className="ml-2 font-mono text-xs break-all">{transactionData.senderAddress}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Block:</span>
                    <span className="ml-2 font-medium">{transactionData.blockNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      transactionData.isRecipientMatching 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transactionData.isRecipientMatching ? '✓ Valid' : '✗ Invalid'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Network Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Network *
              </label>
              <select
                {...register('network', { required: 'Network is required' })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BEP20">BEP20 (BSC)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="POLYGON">POLYGON</option>
                <option value="TRC20">TRC20 (TRON)</option>
              </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Amount (USDT) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="30"
                placeholder="Enter amount in USDT"
                error={errors.amount?.message}
                {...register('amount', {
                  required: 'Amount is required',
                  min: {
                    value: 30,
                    message: 'Minimum deposit amount is 30 USDT'
                  }
                })}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              loading={isLoading || autoFillTransactionMutation.isPending}
              disabled={isLoading || autoFillTransactionMutation.isPending || !watchedAmount || !watchedTransactionHash}
            >
              {isLoading 
                ? 'Creating Deposit...' 
                : autoFillTransactionMutation.isPending
                ? 'Auto-filling...'
                : `Create Deposit ${watchedAmount ? `(${watchedAmount} USDT)` : ''}`
              }
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDepositModal;
