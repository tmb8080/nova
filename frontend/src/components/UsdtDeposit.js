import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI, depositAPI, vipAPI } from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { toast } from 'react-hot-toast';

const UsdtDeposit = ({ onClose, vipToJoin }) => {
  const [selectedMethod, setSelectedMethod] = useState('BEP20-USDT');
  const [transactionHash, setTransactionHash] = useState('');
  const [amount, setAmount] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [autoDetectResult, setAutoDetectResult] = useState(null);
  const [showAutoDetectModal, setShowAutoDetectModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch company wallet addresses
  const { data: addresses, isLoading: addressesLoading, error: addressesError } = useQuery({
    queryKey: ['companyWalletAddresses'],
    queryFn: () => walletAPI.getCompanyWalletAddresses(),
    onSuccess: (data) => {
      console.log('✅ Addresses loaded successfully:', data);
    },
    onError: (error) => {
      console.log('❌ Error loading addresses:', error);
    }
  });

  // Deposit methods (TRON and Ethereum removed)
  const depositMethods = [
    { key: 'BEP20-USDT', name: 'BEP20-USDT', network: 'BEP20', currency: 'USDT', color: 'bg-yellow-500' },
    { key: 'BEP20-USDC', name: 'BEP20-USDC', network: 'BEP20', currency: 'USDC', color: 'bg-blue-500' },
    { key: 'POL-USDT', name: 'POL-USDT', network: 'POLYGON', currency: 'USDT', color: 'bg-purple-700' },
    { key: 'POL-USDC', name: 'POL-USDC', network: 'POLYGON', currency: 'USDC', color: 'bg-blue-700' }
  ];

  const selectedMethodData = depositMethods.find(method => method.key === selectedMethod);

  const copyToClipboard = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const getAddressForNetwork = (network) => {
    console.log('🔍 getAddressForNetwork called with network:', network);
    console.log('🔍 Network type:', typeof network);
    console.log('🔍 Network length:', network?.length);
    
    // Check if addresses exist and have the correct structure
    if (!addresses?.data?.data) {
      console.log('❌ No addresses data available');
      console.log('📦 Full addresses object:', addresses);
      return null;
    }
    
    // Access the actual addresses data
    const addressesData = addresses.data.data;
    
    console.log('📋 Available addresses:', addressesData);
    console.log('🔑 Available keys:', Object.keys(addressesData));
    console.log('🎯 Looking for network:', network);
    
    // Check if the network exists (case-insensitive)
    const networkKeys = Object.keys(addressesData);
    const foundKey = networkKeys.find(key => key.toUpperCase() === network.toUpperCase());
    
    if (foundKey) {
      console.log('✅ Found network (case-insensitive):', foundKey, '->', addressesData[foundKey]);
      return addressesData[foundKey];
    }
    
    // If no direct match, try alternative mappings
    console.log('❌ No direct match, trying alternative mappings');
    let mappedNetwork = null;
    
    switch (network) {
      case 'BEP20':
        mappedNetwork = 'BSC';
        break;
      case 'POLYGON':
        mappedNetwork = 'POLYGON';
        break;
      default:
        console.log('❌ No mapping found for network:', network);
        return null;
    }
    
    console.log('🔍 Trying mapped network:', mappedNetwork);
    
    if (mappedNetwork && addressesData[mappedNetwork]) {
      console.log('✅ Found mapped network:', mappedNetwork, '->', addressesData[mappedNetwork]);
      return addressesData[mappedNetwork];
    }
    
    console.log('❌ No mapping found for network:', network);
    console.log('🔍 Available networks in data:', Object.keys(addressesData));
    console.log('🔍 Network comparison:', {
      input: network,
      inputType: typeof network,
      available: Object.keys(addressesData),
      hasProperty: addressesData.hasOwnProperty(network),
      directAccess: addressesData[network]
    });
    return null;
  };

  const selectedAddress = getAddressForNetwork(selectedMethodData?.network);

  console.log('🎯 Selected method:', selectedMethod);
  console.log('📊 Selected method data:', selectedMethodData);
  console.log('📍 Selected address:', selectedAddress);
  console.log('⏳ Addresses loading:', addressesLoading);
  console.log('❌ Addresses error:', addressesError);
  console.log('📦 Full addresses response:', addresses);

  // Auto-fill transaction details mutation
  const autoFillTransactionMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🚀 Auto-fill mutation called with data:', data);
      try {
        // Try the user-facing auto-fill endpoint first
        console.log('🔍 Trying /deposit/auto-fill-transaction endpoint');
        return await depositAPI.autoFillTransaction(data);
      } catch (error) {
        console.log('❌ Auto-fill endpoint failed, trying transaction details endpoint');
        // Fallback to transaction details endpoint
        return await depositAPI.getTransactionDetails(data);
      }
    },
    onSuccess: (data) => {
      console.log('✅ Auto-fill mutation success:', data);
      const transactionData = data.data;
      console.log('Auto-fill transaction data:', transactionData);
      
      // Handle both auto-fill and transaction details response formats
      const isAutoFillResponse = transactionData.suggestedAmount !== undefined;
      const isTransactionDetailsResponse = transactionData.results !== undefined;
      
      console.log('Response type:', {
        isAutoFillResponse,
        isTransactionDetailsResponse,
        hasResults: !!transactionData.results,
        hasSuggestedAmount: !!transactionData.suggestedAmount
      });
      
      if (isTransactionDetailsResponse) {
        // Handle transaction details response format
        const foundResult = transactionData.results?.find(result => result.found);
        if (foundResult) {
          const processedData = {
            found: true,
            foundOnNetwork: foundResult.network,
            suggestedNetwork: foundResult.network,
            suggestedAmount: foundResult.details?.amount || 'N/A',
            recipientAddress: foundResult.details?.recipientAddress || 'N/A',
            senderAddress: foundResult.details?.senderAddress || 'N/A',
            blockNumber: foundResult.details?.blockNumber || 'N/A',
            isConfirmed: foundResult.details?.isConfirmed || false,
            isTokenTransfer: foundResult.details?.isTokenTransfer || false,
            companyAddresses: transactionData.companyAddresses || {},
            isRecipientMatching: false // Will be calculated below
          };
          
          // Check recipient matching with more detailed logging
          console.log('🔍 Detailed recipient matching check:');
          console.log('  - Transaction Recipient:', processedData.recipientAddress);
          console.log('  - Company Addresses:', processedData.companyAddresses);
          
          const isRecipientMatching = processedData.recipientAddress && processedData.companyAddresses && 
            Object.values(processedData.companyAddresses).some(companyAddr => {
              const matches = companyAddr.toLowerCase() === processedData.recipientAddress.toLowerCase();
              console.log(`  - Comparing: "${companyAddr.toLowerCase()}" === "${processedData.recipientAddress.toLowerCase()}" = ${matches}`);
              return matches;
            });
          
          console.log('  - Final isRecipientMatching:', isRecipientMatching);
          
          processedData.isRecipientMatching = isRecipientMatching;
          
          setAutoDetectResult(processedData);
          setIsAutoDetecting(false);
          
          if (isRecipientMatching) {
            toast.success(`✅ Transaction verified! Found on ${foundResult.network}`);
            
            // Auto-fill form
            if (processedData.suggestedAmount && processedData.suggestedAmount !== 'N/A') {
              setAmount(processedData.suggestedAmount.toString());
            }
            
            if (processedData.suggestedNetwork) {
              const networkMapping = {
                'BEP20': 'BEP20-USDT',
                'POLYGON': 'POL-USDT'
              };
              const mappedMethod = networkMapping[processedData.suggestedNetwork];
              if (mappedMethod) {
                setSelectedMethod(mappedMethod);
              }
            }
            
            // Automatically submit deposit with CONFIRMED status
            const depositData = {
              amount: parseFloat(processedData.suggestedAmount),
              currency: selectedMethodData.currency,
              network: selectedMethodData.network,
              transactionHash: transactionHash.trim(),
              status: 'CONFIRMED', // Auto-confirm when recipient matches
              autoConfirmed: true
            };
            
            console.log('🚀 Auto-submitting CONFIRMED deposit:', depositData);
            createDepositMutation.mutate(depositData);
            
            // Show success message
            toast.success(`🎉 Deposit automatically confirmed! ${processedData.suggestedAmount} ${selectedMethodData.currency} added to your wallet.`);
            
          } else {
            toast.warning(`⚠️ Transaction found on ${foundResult.network}, but recipient doesn't match our address`);
            
            // Auto-fill form for manual review
            if (processedData.suggestedAmount && processedData.suggestedAmount !== 'N/A') {
              setAmount(processedData.suggestedAmount.toString());
            }
            
            if (processedData.suggestedNetwork) {
              const networkMapping = {
                'BEP20': 'BEP20-USDT',
                'POLYGON': 'POL-USDT'
              };
              const mappedMethod = networkMapping[processedData.suggestedNetwork];
              if (mappedMethod) {
                setSelectedMethod(mappedMethod);
              }
            }
            
            // Open modal for manual review
            setShowAutoDetectModal(true);
          }
          
          return;
        }
      }
      
      // Handle auto-fill response format (original logic)
      setAutoDetectResult(transactionData);
      setIsAutoDetecting(false);
      
      if (transactionData.found) {
        // Auto-fill the form with transaction details
        if (transactionData.suggestedAmount && !isNaN(transactionData.suggestedAmount)) {
          setAmount(transactionData.suggestedAmount.toString());
        }
        
        if (transactionData.suggestedNetwork) {
          // Map the detected network to our method format
          const networkMapping = {
            'BEP20': 'BEP20-USDT',
            'TRC20': 'TRC20-USDT',
            'ERC20': 'ERC20-USDT',
            'POLYGON': 'POL-USDT'
          };
          const mappedMethod = networkMapping[transactionData.suggestedNetwork];
          if (mappedMethod) {
            setSelectedMethod(mappedMethod);
          }
        }
        
        // Check if recipient matches (handle case sensitivity)
        console.log('🔍 Checking recipient matching:');
        console.log('  - Recipient Address:', transactionData.recipientAddress);
        console.log('  - Company Addresses:', transactionData.companyAddresses);
        console.log('  - Original isRecipientMatching:', transactionData.isRecipientMatching);
        
        const isRecipientMatching = transactionData.isRecipientMatching || 
          (transactionData.recipientAddress && transactionData.companyAddresses && 
           Object.values(transactionData.companyAddresses).some(companyAddr => {
             const matches = companyAddr.toLowerCase() === transactionData.recipientAddress.toLowerCase();
             console.log(`  - Comparing: ${companyAddr.toLowerCase()} === ${transactionData.recipientAddress.toLowerCase()} = ${matches}`);
             return matches;
           }));
        
        console.log('  - Final isRecipientMatching:', isRecipientMatching);
        
        // Set auto-fill status
        if (isRecipientMatching) {
          toast.success(`✅ Transaction verified! Auto-filled: ${transactionData.suggestedAmount} USDT on ${transactionData.suggestedNetwork}`);
        } else {
          toast.warning(`⚠️ Transaction found on ${transactionData.foundOnNetwork}, but recipient doesn't match our address`);
        }
        
        // Update the result with the corrected matching status
        setAutoDetectResult({
          ...transactionData,
          isRecipientMatching: isRecipientMatching
        });
        
        // Always auto-fill the form regardless of recipient matching
        if (transactionData.suggestedAmount && !isNaN(transactionData.suggestedAmount)) {
          setAmount(transactionData.suggestedAmount.toString());
        }
        
        if (transactionData.suggestedNetwork) {
          // Map the detected network to our method format
          const networkMapping = {
            'BEP20': 'BEP20-USDT',
            'TRC20': 'TRC20-USDT',
            'ERC20': 'ERC20-USDT',
            'POLYGON': 'POL-USDT'
          };
          const mappedMethod = networkMapping[transactionData.suggestedNetwork];
          if (mappedMethod) {
            setSelectedMethod(mappedMethod);
          }
        }
      } else {
        // Show details even when not found
        toast.warning(`⚠️ Transaction not found on any network, but showing response details for debugging`);
        console.log('Auto-fill result (not found):', transactionData);
        
        // Set the result to show the "not found" details
        setAutoDetectResult({
          ...transactionData,
          found: false,
          isRecipientMatching: false,
          // Add some default values for display
          suggestedAmount: 'N/A',
          suggestedNetwork: 'N/A',
          recipientAddress: 'N/A',
          senderAddress: 'N/A',
          blockNumber: 'N/A'
        });
      }
    },
    onError: (error) => {
      console.log('❌ Auto-fill mutation error:', error);
      console.log('❌ Error response:', error.response);
      console.log('❌ Error data:', error.response?.data);
      
      // Check if the error response actually contains valid data
      if (error.response?.data?.success && error.response?.data?.data) {
        console.log('✅ Found valid data in error response, processing...');
        const transactionData = error.response.data.data;
        
        setAutoDetectResult(transactionData);
        setIsAutoDetecting(false);
        
        if (transactionData.found) {
          // Process the transaction data as if it was successful
          console.log('✅ Processing transaction data from error response');
          
          // Check if recipient matches (handle case sensitivity)
          console.log('🔍 Checking recipient matching:');
          console.log('  - Recipient Address:', transactionData.recipientAddress);
          console.log('  - Company Addresses:', transactionData.companyAddresses);
          console.log('  - Original isRecipientMatching:', transactionData.isRecipientMatching);
          
          const isRecipientMatching = transactionData.isRecipientMatching || 
            (transactionData.recipientAddress && transactionData.companyAddresses && 
             Object.values(transactionData.companyAddresses).some(companyAddr => {
               const matches = companyAddr.toLowerCase() === transactionData.recipientAddress.toLowerCase();
               console.log(`  - Comparing: ${companyAddr.toLowerCase()} === ${transactionData.recipientAddress.toLowerCase()} = ${matches}`);
               return matches;
             }));
          
          console.log('  - Final isRecipientMatching:', isRecipientMatching);
          
                  // Set auto-fill status and handle automatic confirmation
        if (isRecipientMatching) {
          toast.success(`✅ Transaction verified! Auto-filled: ${transactionData.suggestedAmount} USDT on ${transactionData.suggestedNetwork}`);
          
          // Auto-fill the form
          if (transactionData.suggestedAmount && !isNaN(transactionData.suggestedAmount)) {
            setAmount(transactionData.suggestedAmount.toString());
          }
          
          if (transactionData.suggestedNetwork) {
            // Map the detected network to our method format
            const networkMapping = {
              'BEP20': 'BEP20-USDT',
              'TRC20': 'TRC20-USDT',
              'ERC20': 'ERC20-USDT',
              'POLYGON': 'POL-USDT'
            };
            const mappedMethod = networkMapping[transactionData.suggestedNetwork];
            if (mappedMethod) {
              setSelectedMethod(mappedMethod);
            }
          }
          
          // Automatically submit deposit with CONFIRMED status
          const depositData = {
            amount: parseFloat(transactionData.suggestedAmount),
            currency: selectedMethodData.currency,
            network: selectedMethodData.network,
            transactionHash: transactionHash.trim(),
            status: 'CONFIRMED', // Auto-confirm when recipient matches
            autoConfirmed: true
          };
          
          console.log('🚀 Auto-submitting CONFIRMED deposit:', depositData);
          createDepositMutation.mutate(depositData);
          
          // Show success message
          toast.success(`🎉 Deposit automatically confirmed! ${transactionData.suggestedAmount} ${selectedMethodData.currency} added to your wallet.`);
          
        } else {
          toast.warning(`⚠️ Transaction found on ${transactionData.foundOnNetwork}, but recipient doesn't match our address`);
          
          // Auto-fill the form for manual review
          if (transactionData.suggestedAmount && !isNaN(transactionData.suggestedAmount)) {
            setAmount(transactionData.suggestedAmount.toString());
          }
          
          if (transactionData.suggestedNetwork) {
            // Map the detected network to our method format
            const networkMapping = {
              'BEP20': 'BEP20-USDT',
              'TRC20': 'TRC20-USDT',
              'ERC20': 'ERC20-USDT',
              'POLYGON': 'POL-USDT'
            };
            const mappedMethod = networkMapping[transactionData.suggestedNetwork];
            if (mappedMethod) {
              setSelectedMethod(mappedMethod);
            }
          }
          
          // Update the result with the corrected matching status
          setAutoDetectResult({
            ...transactionData,
            isRecipientMatching: isRecipientMatching
          });
          
          // Open modal for manual review
          setShowAutoDetectModal(true);
        }
        } else {
          // Show details even when not found
          toast.warning(`⚠️ Transaction not found on any network, but showing response details for debugging`);
          console.log('Auto-fill result (not found):', transactionData);
          
          // Set the result to show the "not found" details
          setAutoDetectResult({
            ...transactionData,
            found: false,
            isRecipientMatching: false,
            // Add some default values for display
            suggestedAmount: 'N/A',
            suggestedNetwork: 'N/A',
            recipientAddress: 'N/A',
            senderAddress: 'N/A',
            blockNumber: 'N/A'
          });
          
          // Automatically open the enhanced detection modal to show debug information
          setShowAutoDetectModal(true);
        }
      } else {
        // Real error - no valid data in response
        setAutoDetectResult(null);
        setIsAutoDetecting(false);
        const errorMessage = error.response?.data?.message || 'Failed to get transaction details';
        toast.error(`❌ ${errorMessage}`);
      }
    },
  });

  // Check transaction across all networks mutation (user-facing)
  const checkAllNetworksMutation = useMutation({
    mutationFn: (data) => depositAPI.getTransactionDetails(data),
    onSuccess: (response) => {
      const result = response.data.data;
      console.log('✅ Check all networks response:', result);
      
      // Handle transaction details response format
      const foundResult = result.results?.find(r => r.found);
      
      if (foundResult) {
        const processedData = {
          found: true,
          foundOnNetwork: foundResult.network,
          suggestedNetwork: foundResult.network,
          suggestedAmount: foundResult.details?.amount || 'N/A',
          recipientAddress: foundResult.details?.recipientAddress || 'N/A',
          senderAddress: foundResult.details?.senderAddress || 'N/A',
          blockNumber: foundResult.details?.blockNumber || 'N/A',
          isConfirmed: foundResult.details?.isConfirmed || false,
          isTokenTransfer: foundResult.details?.isTokenTransfer || false,
          companyAddresses: result.companyAddresses || {},
          networkResults: result.results || [],
          isRecipientMatching: false // Will be calculated below
        };
        
        // Check if recipient matches (handle case sensitivity)
        console.log('🔍 Checking recipient matching (cross-network):');
        console.log('  - Recipient Address:', processedData.recipientAddress);
        console.log('  - Company Addresses:', processedData.companyAddresses);
        
        const isRecipientMatching = processedData.recipientAddress && processedData.companyAddresses && 
          Object.values(processedData.companyAddresses).some(companyAddr => {
            const matches = companyAddr.toLowerCase() === processedData.recipientAddress.toLowerCase();
            console.log(`  - Comparing: ${companyAddr.toLowerCase()} === ${processedData.recipientAddress.toLowerCase()} = ${matches}`);
            return matches;
          });
        
        console.log('  - Final isRecipientMatching:', isRecipientMatching);
        
        // Update the result with the corrected matching status
        const updatedResult = {
          ...processedData,
          isRecipientMatching: isRecipientMatching
        };
        
        setAutoDetectResult(updatedResult);
        setIsAutoDetecting(false);
        
        if (isRecipientMatching) {
          toast.success(`✅ Transaction found and verified on ${foundResult.network}!`);
        } else {
          toast.warning(`⚠️ Transaction found on ${foundResult.network}, but recipient doesn't match our address`);
        }
        console.log('Cross-network check result:', updatedResult);
        
        // Automatically open the enhanced detection modal with full data
        setShowAutoDetectModal(true);
      } else {
        // Show details even when not found
        toast.warning(`⚠️ Transaction not found on any network, but showing response details for debugging`);
        console.log('Cross-network check result (not found):', result);
        
        // Set the result to show the "not found" details
        setAutoDetectResult({
          ...result,
          found: false,
          isRecipientMatching: false,
          // Add some default values for display
          suggestedAmount: 'N/A',
          suggestedNetwork: 'N/A',
          recipientAddress: 'N/A',
          senderAddress: 'N/A',
          blockNumber: 'N/A'
        });
        
        // Automatically open the enhanced detection modal to show debug information
        setShowAutoDetectModal(true);
      }
    },
    onError: (error) => {
      setIsAutoDetecting(false);
      toast.error(error.response?.data?.message || 'Failed to check transaction across networks');
    },
  });

  // Create deposit mutation
  const createDepositMutation = useMutation({
    mutationFn: (data) => {
      console.log('🚀 Creating deposit with data:', data);
      return depositAPI.createUsdtDeposit(data);
    },
    onSuccess: (response) => {
      console.log('✅ Deposit created successfully:', response);
      
      if (response.data?.autoConfirmed) {
        toast.success(`🎉 Deposit automatically confirmed! Amount has been added to your wallet.`);
        
        // If this deposit was for VIP upgrade, attempt VIP upgrade after successful deposit
        if (vipToJoin) {
          setTimeout(() => {
            attemptVipUpgrade();
          }, 1000);
        } else {
          // Close modal after auto-confirmation
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        toast.success('Deposit created successfully!');
        
        // For manual deposits, also attempt VIP upgrade if this was for VIP
        if (vipToJoin) {
          setTimeout(() => {
            attemptVipUpgrade();
          }, 1000);
        } else {
          // Close modal after manual deposit
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
      
      queryClient.invalidateQueries(['deposits']);
      queryClient.invalidateQueries(['wallet']); // Refresh wallet balance
      queryClient.invalidateQueries(['walletStats']); // Refresh wallet stats for VIP calculations
    },
    onError: (error) => {
      console.error('❌ Deposit creation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create deposit');
    },
  });

  // VIP upgrade mutation
  const vipUpgradeMutation = useMutation({
    mutationFn: (vipLevelId) => vipAPI.joinVip(vipLevelId),
    onSuccess: (data) => {
      const message = data?.data?.isUpgrade 
        ? `🎉 Successfully upgraded to ${data.data.vipLevel?.name || 'VIP level'}!`
        : '🎉 Successfully joined VIP level!';
      toast.success(message);
      queryClient.invalidateQueries(['walletStats']);
      queryClient.invalidateQueries(['vipStatus']);
      
      // Close modal after successful VIP upgrade
      setTimeout(() => {
        onClose();
      }, 2000);
    },
    onError: (error) => {
      console.error('VIP upgrade error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upgrade VIP level';
      toast.error(errorMessage);
      
      // Close modal even if VIP upgrade fails (deposit was successful)
      setTimeout(() => {
        onClose();
      }, 3000);
    },
  });

  // Function to attempt VIP upgrade after successful deposit
  const attemptVipUpgrade = () => {
    if (vipToJoin) {
      console.log('🚀 Attempting VIP upgrade for:', vipToJoin);
      vipUpgradeMutation.mutate(vipToJoin.id);
    }
  };

  // Function to trigger auto-fill (kept for compatibility but not used)
  const triggerAutoFill = (hash) => {
    console.log('🔍 triggerAutoFill called with hash:', hash);
    if (hash && /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      console.log('✅ Hash is valid, using checkAllNetworks instead');
      checkAllNetworks(hash);
    } else {
      console.log('❌ Hash is invalid or empty:', hash);
    }
  };

  // Function to check transaction across all networks
  const checkAllNetworks = (hash) => {
    if (hash && /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      setIsAutoDetecting(true);
      checkAllNetworksMutation.mutate({ transactionHash: hash });
    } else {
      toast.error('Please enter a valid transaction hash');
    }
  };

  // Handle transaction hash change with auto-detection
  const handleTransactionHashChange = (e) => {
    const hash = e.target.value.trim();
    setTransactionHash(hash);
    
    // Clear results if hash is empty or too short
    if (!hash || hash.length < 10) {
      setAutoDetectResult(null);
      return;
    }
    
    // Auto-trigger when a valid hash is entered (64 characters with or without 0x prefix)
    if (/^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      console.log('✅ Valid hash detected, calling checkAllNetworks (same as button)');
      // Use the same function as the Auto Detect button
      checkAllNetworks(hash);
    } else if (hash.length >= 64) {
      // If hash is 64+ characters but doesn't match pattern, show error
      console.log('❌ Invalid hash format detected');
      setAutoDetectResult({
        found: false,
        isRecipientMatching: false,
        suggestedAmount: 'N/A',
        suggestedNetwork: 'N/A',
        recipientAddress: 'N/A',
        senderAddress: 'N/A',
        blockNumber: 'N/A',
        error: 'Invalid transaction hash format'
      });
    }
  };

  const handleSubmit = () => {
    // Check if we have a valid transaction detected
    if (!autoDetectResult || !autoDetectResult.found) {
      toast.error('Please paste a valid transaction hash first');
      return;
    }

    // Check if recipient is valid
    if (!autoDetectResult.isRecipientMatching) {
      toast.error('❌ Invalid recipient address. This transaction was not sent to our wallet address.');
      return;
    }

    // Use the auto-detected amount
    const detectedAmount = autoDetectResult.suggestedAmount;
    if (!detectedAmount || detectedAmount === 'N/A' || parseFloat(detectedAmount) <= 0) {
      toast.error('Invalid transaction amount (must be greater than 0)');
      return;
    }

    if (!transactionHash.trim()) {
      toast.error('Please enter the transaction hash');
      return;
    }

    // Determine if this should be auto-confirmed based on recipient matching
    const shouldAutoConfirm = autoDetectResult.isRecipientMatching;

    const depositData = {
      amount: parseFloat(detectedAmount),
      currency: selectedMethodData.currency,
      network: selectedMethodData.network,
      transactionHash: transactionHash.trim(),
      status: shouldAutoConfirm ? 'CONFIRMED' : 'PENDING',
      autoConfirmed: shouldAutoConfirm
    };

    console.log('🚀 Creating deposit with auto-detected data:', depositData);
    console.log('🔍 Auto-confirmation check:', {
      isRecipientMatching: autoDetectResult.isRecipientMatching,
      shouldAutoConfirm,
      status: depositData.status,
      autoConfirmed: depositData.autoConfirmed
    });

    createDepositMutation.mutate(depositData);
  };

  // Handle manual deposit submission (for non-auto-detected transactions)
  const handleManualSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!transactionHash.trim()) {
      toast.error('Please enter the transaction hash');
      return;
    }

    const depositData = {
      amount: parseFloat(amount),
      currency: selectedMethodData.currency,
      network: selectedMethodData.network,
      transactionHash: transactionHash.trim(),
      status: 'PENDING',
      autoConfirmed: false
    };

    console.log('🚀 Creating manual deposit:', depositData);
    createDepositMutation.mutate(depositData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-xl bg-white/10 dark:bg-coinbase-dark-secondary/90 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20 dark:border-coinbase-dark-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-coinbase-dark-border sticky top-0 bg-white/5 dark:bg-coinbase-dark-secondary/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white dark:text-coinbase-text-primary">USDT Deposit</h2>
            {vipToJoin && (
              <div className="bg-gradient-to-r from-coinbase-blue to-coinbase-green text-white px-3 py-1 rounded-full text-xs font-semibold">
                VIP Upgrade
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 dark:hover:bg-coinbase-dark-tertiary rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-white dark:text-coinbase-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* VIP Upgrade Info */}
        {vipToJoin && (
          <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-coinbase-blue/10 to-coinbase-green/10 border border-coinbase-blue/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-coinbase-blue to-coinbase-green rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">VIP</span>
              </div>
              <div>
                <h3 className="text-white dark:text-coinbase-text-primary font-semibold">Upgrading to {vipToJoin.name}</h3>
                <p className="text-white/70 dark:text-coinbase-text-secondary text-sm">
                  After deposit confirmation, you'll automatically be upgraded to this VIP level
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-6">
          {/* Deposit Methods */}
          <div>
            <h3 className="text-lg font-semibold text-white dark:text-coinbase-text-primary mb-3">Select Deposit Method</h3>
            <div className="space-y-2">
              {depositMethods.map((method) => (
                <button
                  key={method.key}
                  onClick={() => setSelectedMethod(method.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedMethod === method.key
                      ? `${method.color} text-white border-transparent shadow-lg`
                      : 'bg-white/10 dark:bg-coinbase-dark-tertiary backdrop-blur-sm text-gray-300 dark:text-coinbase-text-secondary hover:text-white dark:hover:text-coinbase-text-primary hover:bg-white/20 dark:hover:bg-coinbase-dark-border border-white/20 dark:border-coinbase-dark-border'
                  }`}
                >
                  <span className="font-medium">{method.name}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {addressesLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coinbase-blue mx-auto"></div>
              <p className="text-gray-300 dark:text-coinbase-text-secondary mt-2">Loading wallet addresses...</p>
            </div>
          )}

          {/* Error State */}
          {addressesError && (
            <div className="bg-red-500/20 dark:bg-coinbase-red/20 backdrop-blur-sm border border-red-400/30 dark:border-coinbase-red/30 rounded-lg p-4">
              <p className="text-red-300 dark:text-coinbase-red">Error loading wallet addresses. Please try again.</p>
            </div>
          )}

          {/* QR Code and Address */}
          {!addressesLoading && !addressesError && selectedAddress && (
            <div>
              <h3 className="text-lg font-semibold text-white dark:text-coinbase-text-primary mb-3">Recharge QR Code</h3>
              <div className="bg-white/10 dark:bg-coinbase-dark-tertiary backdrop-blur-sm rounded-lg p-4 text-center border border-white/20 dark:border-coinbase-dark-border">
                {/* QR Code */}
                <div className="mb-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedAddress}`}
                    alt={`QR Code for ${selectedMethodData?.name}`}
                    className="mx-auto border border-white/20 dark:border-coinbase-dark-border rounded-lg bg-white"
                  />
                </div>

                {/* Wallet Address */}
                <div className="mb-4">
                  <div className="flex items-center justify-between bg-white/10 dark:bg-coinbase-dark-secondary backdrop-blur-sm p-3 rounded-lg border border-white/20 dark:border-coinbase-dark-border">
                    <span className="font-mono text-sm text-purple-300 dark:text-coinbase-blue break-all">
                      {selectedAddress}
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedAddress)}
                      className={`ml-2 px-3 py-1 rounded text-xs font-medium transition-colors ${
                        copiedAddress
                          ? 'bg-green-500/20 dark:bg-coinbase-green/20 text-green-300 dark:text-coinbase-green border border-green-400/30 dark:border-coinbase-green/30'
                          : 'bg-purple-500/20 dark:bg-coinbase-blue/20 text-purple-300 dark:text-coinbase-blue hover:bg-purple-500/30 dark:hover:bg-coinbase-blue/30 border border-purple-400/30 dark:border-coinbase-blue/30'
                      }`}
                    >
                      {copiedAddress ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Address Available */}
          {!addressesLoading && !addressesError && !selectedAddress && addresses?.data && (
            <div className="bg-yellow-500/20 dark:bg-coinbase-blue/20 backdrop-blur-sm border border-yellow-400/30 dark:border-coinbase-blue/30 rounded-lg p-4">
              <p className="text-yellow-300 dark:text-coinbase-blue">
                No wallet address available for {selectedMethodData?.name}. Please select a different method.
              </p>
            </div>
          )}

          {/* Deposit Instructions */}
          {selectedAddress && (
            <div className="bg-blue-500/20 dark:bg-coinbase-blue/20 backdrop-blur-sm border border-blue-400/30 dark:border-coinbase-blue/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-300 dark:text-coinbase-blue mb-3">📋 Deposit Instructions</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-500 dark:bg-coinbase-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-sm text-blue-300 dark:text-coinbase-blue font-medium">Select Network & Copy Address</p>
                    <p className="text-xs text-blue-200 dark:text-coinbase-text-secondary">Choose {selectedMethodData?.name} and copy the wallet address above</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-500 dark:bg-coinbase-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-sm text-blue-300 dark:text-coinbase-blue font-medium">Send Funds from Your Wallet</p>
                    <p className="text-xs text-blue-200 dark:text-coinbase-text-secondary">Open your crypto wallet (MetaMask, Trust Wallet, etc.) and send any amount of {selectedMethodData?.currency} to the copied address</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-500 dark:bg-coinbase-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-sm text-blue-300 dark:text-coinbase-blue font-medium">Get Transaction Hash</p>
                    <p className="text-xs text-blue-200 dark:text-coinbase-text-secondary">
                      <strong>Where to find Transaction Hash:</strong><br/>
                      • <strong>MetaMask:</strong> Click on the transaction → Copy "Transaction Hash"<br/>
                      • <strong>Trust Wallet:</strong> Tap transaction → Copy "TxID" or "Hash"<br/>
                      • <strong>Binance:</strong> Withdrawal history → Copy "Transaction ID"<br/>
                      • <strong>Other wallets:</strong> Look for "Tx Hash", "Transaction ID", or "Hash"
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <span className="bg-blue-500 dark:bg-coinbase-blue text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="text-sm text-blue-300 dark:text-coinbase-blue font-medium">Paste Hash & Submit</p>
                    <p className="text-xs text-blue-200 dark:text-coinbase-text-secondary">Paste the transaction hash below to auto-detect amount and network, then click "Submit Deposit"</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white dark:text-coinbase-text-primary">Transaction Details</h3>
            
            {/* Auto-Detected Amount Display */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-coinbase-text-secondary mb-2">
                Amount ({selectedMethodData?.currency})
              </label>
              <div className="w-full px-4 py-3 bg-white/10 dark:bg-coinbase-dark-tertiary backdrop-blur-sm border border-white/20 dark:border-coinbase-dark-border rounded-lg text-white dark:text-coinbase-text-primary">
                {autoDetectResult && autoDetectResult.found && autoDetectResult.suggestedAmount && autoDetectResult.suggestedAmount !== 'N/A' ? (
                  <div className="flex items-center justify-between">
                    <span className="text-white dark:text-coinbase-text-primary font-medium">
                      {autoDetectResult.suggestedAmount} {selectedMethodData?.currency}
                    </span>
                    <span className="text-green-400 dark:text-coinbase-green text-sm">✅ Auto-detected</span>
                  </div>
                ) : (
                  <span className="text-gray-400 dark:text-coinbase-text-tertiary">
                    {autoDetectResult && autoDetectResult.found ? 'Amount will be auto-filled from verified transaction' : 'Paste transaction hash to auto-detect amount'}
                  </span>
                )}
              </div>
            </div>

            {/* Transaction Hash Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 dark:text-coinbase-text-secondary mb-2">
                Transaction Hash
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={transactionHash}
                    onChange={handleTransactionHashChange}
                    placeholder="Paste or type transaction hash from your wallet"
                    className={`w-full px-4 py-3 bg-white/10 dark:bg-coinbase-dark-tertiary backdrop-blur-sm border rounded-lg text-white dark:text-coinbase-text-primary placeholder-gray-400 dark:placeholder-coinbase-text-tertiary focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-coinbase-blue focus:border-transparent ${
                      transactionHash && transactionHash.length >= 64
                        ? /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(transactionHash)
                          ? 'border-green-400 dark:border-coinbase-green focus:ring-green-500 dark:focus:ring-coinbase-green'
                          : 'border-red-400 dark:border-coinbase-red focus:ring-red-500 dark:focus:ring-coinbase-red'
                        : 'border-white/20 dark:border-coinbase-dark-border'
                    }`}
                  />
                  {transactionHash && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {transactionHash.length >= 64 ? (
                        /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(transactionHash) ? (
                          <span className="text-green-400 dark:text-coinbase-green text-sm">✅</span>
                        ) : (
                          <span className="text-red-400 dark:text-coinbase-red text-sm">❌</span>
                        )
                      ) : (
                        <span className="text-gray-400 dark:text-coinbase-text-tertiary text-sm">{transactionHash.length}/64</span>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => checkAllNetworks(transactionHash)}
                  loading={checkAllNetworksMutation.isPending}
                  disabled={!transactionHash}
                  className="whitespace-nowrap bg-gradient-to-r from-purple-500 to-blue-500 dark:from-coinbase-blue dark:to-coinbase-blue-dark text-white hover:from-purple-600 hover:to-blue-600 dark:hover:from-coinbase-blue-dark dark:hover:to-coinbase-blue border-0 shadow-lg"
                >
                  {checkAllNetworksMutation.isPending ? 'Checking...' : '🔍 Auto Detect'}
                </Button>
              </div>
              <p className="text-xs text-gray-400 dark:text-coinbase-text-tertiary mt-1">
                Find this in your wallet's transaction history or blockchain explorer
              </p>
              
              {/* Auto-detection Status */}
              {isAutoDetecting && (
                <div className="mt-2 p-2 bg-blue-500/20 dark:bg-coinbase-blue/20 border border-blue-400/30 dark:border-coinbase-blue/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 dark:border-coinbase-blue"></div>
                    <span className="text-sm text-blue-300 dark:text-coinbase-blue">Detecting transaction across networks...</span>
                  </div>
                </div>
              )}

              {/* Auto-detection Results */}
              {autoDetectResult && (
                <div className={`mt-2 p-3 rounded-lg border ${
                  autoDetectResult.found 
                    ? (autoDetectResult.isRecipientMatching 
                        ? 'bg-green-500/20 dark:bg-coinbase-green/20 border-green-400/30 dark:border-coinbase-green/30' 
                        : 'bg-yellow-500/20 dark:bg-coinbase-blue/20 border-yellow-400/30 dark:border-coinbase-blue/30')
                    : 'bg-red-500/20 dark:bg-coinbase-red/20 border-red-400/30 dark:border-coinbase-red/30'
                }`}>
                  {autoDetectResult.found && autoDetectResult.isRecipientMatching && createDepositMutation.isLoading && (
                    <div className="mb-2 p-2 bg-green-500/30 dark:bg-coinbase-green/30 border border-green-400/50 dark:border-coinbase-green/50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400 dark:border-coinbase-green"></div>
                        <span className="text-green-300 dark:text-coinbase-green text-sm font-medium">🔄 Auto-confirming deposit...</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`text-lg ${
                      autoDetectResult.found 
                        ? (autoDetectResult.isRecipientMatching ? 'text-green-400 dark:text-coinbase-green' : 'text-yellow-400 dark:text-coinbase-blue')
                        : 'text-red-400 dark:text-coinbase-red'
                    }`}>
                      {autoDetectResult.found 
                        ? (autoDetectResult.isRecipientMatching ? '✅' : '⚠️')
                        : '❌'
                      }
                    </span>
                    <span className={`text-sm font-medium ${
                      autoDetectResult.found 
                        ? (autoDetectResult.isRecipientMatching ? 'text-green-300 dark:text-coinbase-green' : 'text-yellow-300 dark:text-coinbase-blue')
                        : 'text-red-300 dark:text-coinbase-red'
                    }`}>
                      {autoDetectResult.found ? 'Transaction Detected' : 'Transaction Not Found'}
                    </span>
                  </div>
                  <div className={`text-xs space-y-1 ${
                    autoDetectResult.found 
                      ? (autoDetectResult.isRecipientMatching ? 'text-green-200 dark:text-coinbase-green' : 'text-yellow-200 dark:text-coinbase-blue')
                      : 'text-red-200 dark:text-coinbase-red'
                  }`}>
                    <div>Network: {autoDetectResult.foundOnNetwork || autoDetectResult.suggestedNetwork || 'N/A'}</div>
                    <div>Amount: {autoDetectResult.suggestedAmount || 'N/A'} USDT</div>
                    <div>Status: {autoDetectResult.found 
                      ? (autoDetectResult.isRecipientMatching ? 'Valid Recipient' : 'Invalid Recipient')
                      : 'Not Found'
                    }</div>
                    {autoDetectResult.found && (
                      <>
                        <div>Recipient: {autoDetectResult.recipientAddress?.substring(0, 10)}...{autoDetectResult.recipientAddress?.substring(-8)}</div>
                        <div>Sender: {autoDetectResult.senderAddress?.substring(0, 10)}...{autoDetectResult.senderAddress?.substring(-8)}</div>
                      </>
                    )}
                    {!autoDetectResult.found && (
                      <div className="text-xs text-red-300 dark:text-coinbase-red mt-2">
                        🔍 Check the enhanced detection modal for detailed debugging information
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-500/20 dark:bg-coinbase-blue/20 backdrop-blur-sm border border-yellow-400/30 dark:border-coinbase-blue/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-300 dark:text-coinbase-blue mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-200 dark:text-coinbase-text-secondary space-y-1 list-disc list-inside">
              <li>Paste transaction hash to auto-detect amount and network</li>
              <li>Any amount from verified transaction will be accepted</li>
              <li>Use only {selectedMethodData?.name} network - wrong network = lost funds</li>
              <li>Transaction hash is required for verification</li>
              <li>Amount will be automatically filled from detected transaction</li>
              <li>✅ Valid recipient transactions are auto-confirmed instantly</li>
              <li>⚠️ Invalid recipient transactions cannot be submitted</li>
              <li>Auto-confirmed deposits are added to wallet immediately</li>
              <li>Keep your transaction hash for support if needed</li>
            </ul>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              createDepositMutation.isLoading || 
              !autoDetectResult || 
              !autoDetectResult.found || 
              !autoDetectResult.isRecipientMatching || 
              !transactionHash.trim()
            }
            className={`w-full py-3 rounded-lg font-medium ${
              autoDetectResult && autoDetectResult.found && !autoDetectResult.isRecipientMatching
                ? 'bg-red-500 dark:bg-coinbase-red hover:bg-red-600 dark:hover:bg-coinbase-red/80 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 dark:from-coinbase-blue dark:to-coinbase-blue-dark hover:from-purple-700 hover:to-blue-700 dark:hover:from-coinbase-blue-dark dark:hover:to-coinbase-blue text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {createDepositMutation.isLoading ? (
              'Creating Deposit...'
            ) : autoDetectResult && autoDetectResult.found && autoDetectResult.isRecipientMatching && autoDetectResult.suggestedAmount ? (
              `Submit Deposit (${autoDetectResult.suggestedAmount} ${selectedMethodData?.currency})`
            ) : autoDetectResult && autoDetectResult.found && !autoDetectResult.isRecipientMatching ? (
              '❌ Invalid Recipient - Cannot Submit'
            ) : (
              'Submit Deposit'
            )}
          </Button>

          {/* Enhanced Detection Button */}
          <Button
            onClick={() => setShowAutoDetectModal(true)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 dark:from-coinbase-green dark:to-coinbase-green hover:from-green-600 hover:to-emerald-600 dark:hover:from-coinbase-green/80 dark:hover:to-coinbase-green/80 text-white py-3 rounded-lg font-medium"
          >
            🔍 Enhanced Transaction Detection
          </Button>
        </div>
      </div>

      {/* Enhanced Automatic Detection Modal */}
      {showAutoDetectModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAutoDetectModal(false);
            }
          }}
        >
          <div className="bg-white dark:bg-coinbase-dark-secondary rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-coinbase-dark-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-coinbase-blue/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-coinbase-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-coinbase-text-primary">
                      {autoDetectResult ? 'Transaction Results' : 'Enhanced Transaction Detection'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-coinbase-text-secondary">
                      {autoDetectResult 
                        ? 'Detailed analysis of your transaction hash'
                        : 'Paste any transaction hash to automatically detect details'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAutoDetectModal(false)}
                  className="text-gray-400 dark:text-coinbase-text-secondary hover:text-gray-600 dark:hover:text-coinbase-text-primary text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Transaction Hash Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-coinbase-text-primary">
                    Transaction Hash *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Paste or type transaction hash to auto-detect details"
                        value={transactionHash}
                        onChange={(e) => {
                          const hash = e.target.value.trim();
                          setTransactionHash(hash);
                          
                          // Clear results if hash is empty or too short
                          if (!hash || hash.length < 10) {
                            setAutoDetectResult(null);
                            return;
                          }
                          
                          // Auto-trigger when a valid hash is entered (64 characters with or without 0x prefix)
                          if (/^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(hash)) {
                            console.log('✅ Valid hash detected in modal, calling checkAllNetworks');
                            checkAllNetworks(hash);
                          } else if (hash.length >= 64) {
                            // If hash is 64+ characters but doesn't match pattern, show error
                            console.log('❌ Invalid hash format detected in modal');
                            setAutoDetectResult({
                              found: false,
                              isRecipientMatching: false,
                              suggestedAmount: 'N/A',
                              suggestedNetwork: 'N/A',
                              recipientAddress: 'N/A',
                              senderAddress: 'N/A',
                              blockNumber: 'N/A',
                              error: 'Invalid transaction hash format'
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-gray-50 dark:bg-coinbase-dark-tertiary border rounded-lg text-gray-900 dark:text-coinbase-text-primary placeholder-gray-500 dark:placeholder-coinbase-text-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-coinbase-blue focus:border-transparent ${
                          transactionHash && transactionHash.length >= 64
                            ? /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(transactionHash)
                              ? 'border-green-400 dark:border-coinbase-green focus:ring-green-500 dark:focus:ring-coinbase-green'
                              : 'border-red-400 dark:border-coinbase-red focus:ring-red-500 dark:focus:ring-coinbase-red'
                            : 'border-gray-200 dark:border-coinbase-dark-border'
                        }`}
                      />
                      {transactionHash && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {transactionHash.length >= 64 ? (
                            /^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/.test(transactionHash) ? (
                              <span className="text-green-600 dark:text-coinbase-green text-sm">✅</span>
                            ) : (
                              <span className="text-red-600 dark:text-coinbase-red text-sm">❌</span>
                            )
                          ) : (
                            <span className="text-gray-500 dark:text-coinbase-text-tertiary text-sm">{transactionHash.length}/64</span>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => checkAllNetworks(transactionHash)}
                      loading={checkAllNetworksMutation.isPending}
                      disabled={!transactionHash}
                      className="whitespace-nowrap bg-gradient-to-r from-purple-500 to-blue-500 dark:from-coinbase-blue dark:to-coinbase-blue-dark text-white hover:from-purple-600 hover:to-blue-600 dark:hover:from-coinbase-blue-dark dark:hover:to-coinbase-blue border-0 shadow-lg"
                    >
                      {checkAllNetworksMutation.isPending ? 'Checking...' : '🔍 Check All'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-coinbase-text-tertiary">
                    🔍 Paste transaction hash to automatically detect network, amount, and verify recipient. Any verified amount will be accepted.
                  </p>
                </div>

                {/* Loading State */}
                {isAutoDetecting && (
                  <div className="bg-blue-50 dark:bg-coinbase-blue/20 border border-blue-200 dark:border-coinbase-blue/30 rounded-lg p-4">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-coinbase-blue"></div>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-coinbase-blue">Searching Transaction</p>
                        <p className="text-xs text-blue-600 dark:text-coinbase-text-secondary">Checking across all supported networks...</p>
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

                {/* Auto-detection Results */}
                {autoDetectResult && (
                  <div className={`border rounded-lg p-4 ${
                    autoDetectResult.found
                      ? (autoDetectResult.isRecipientMatching 
                          ? 'bg-green-50 dark:bg-coinbase-green/20 border-green-200 dark:border-coinbase-green/30' 
                          : 'bg-yellow-50 dark:bg-coinbase-blue/20 border-yellow-200 dark:border-coinbase-blue/30')
                      : 'bg-red-50 dark:bg-coinbase-red/20 border-red-200 dark:border-coinbase-red/30'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`text-lg ${
                        autoDetectResult.found
                          ? (autoDetectResult.isRecipientMatching ? 'text-green-600 dark:text-coinbase-green' : 'text-yellow-600 dark:text-coinbase-blue')
                          : 'text-red-600 dark:text-coinbase-red'
                      }`}>
                        {autoDetectResult.found 
                          ? (autoDetectResult.isRecipientMatching ? '✅' : '⚠️')
                          : '❌'
                        }
                      </span>
                      <h4 className={`text-sm font-medium ${
                        autoDetectResult.found
                          ? (autoDetectResult.isRecipientMatching ? 'text-green-800 dark:text-coinbase-green' : 'text-yellow-800 dark:text-coinbase-blue')
                          : 'text-red-800 dark:text-coinbase-red'
                      }`}>
                        {autoDetectResult.found ? 'Transaction Auto-Detected' : 'Transaction Not Found - Debug Info'}
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className={autoDetectResult.isRecipientMatching ? 'text-green-700 dark:text-coinbase-green' : 'text-yellow-700 dark:text-coinbase-blue'}>Network:</span>
                        <span className={`ml-2 font-medium ${autoDetectResult.isRecipientMatching ? 'text-green-900 dark:text-coinbase-green' : 'text-yellow-900 dark:text-coinbase-blue'}`}>
                          {autoDetectResult.foundOnNetwork || autoDetectResult.suggestedNetwork}
                        </span>
                      </div>
                      <div>
                        <span className={autoDetectResult.isRecipientMatching ? 'text-green-700 dark:text-coinbase-green' : 'text-yellow-700 dark:text-coinbase-blue'}>Amount:</span>
                        <span className={`ml-2 font-medium ${autoDetectResult.isRecipientMatching ? 'text-green-900 dark:text-coinbase-green' : 'text-yellow-900 dark:text-coinbase-blue'}`}>
                          {autoDetectResult.suggestedAmount} USDT
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className={autoDetectResult.isRecipientMatching ? 'text-green-700 dark:text-coinbase-green' : 'text-yellow-700 dark:text-coinbase-blue'}>Recipient:</span>
                        <div className={`mt-1 font-mono text-xs break-all p-2 rounded border ${
                          autoDetectResult.isRecipientMatching ? 'bg-green-100 dark:bg-coinbase-green/20' : 'bg-yellow-100 dark:bg-coinbase-blue/20'
                        }`}>
                          {autoDetectResult.recipientAddress}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className={autoDetectResult.isRecipientMatching ? 'text-green-700 dark:text-coinbase-green' : 'text-yellow-700 dark:text-coinbase-blue'}>Sender:</span>
                        <div className={`mt-1 font-mono text-xs break-all p-2 rounded border ${
                          autoDetectResult.isRecipientMatching ? 'bg-green-100 dark:bg-coinbase-green/20' : 'bg-yellow-100 dark:bg-coinbase-blue/20'
                        }`}>
                          {autoDetectResult.senderAddress}
                        </div>
                      </div>
                      <div>
                        <span className={autoDetectResult.isRecipientMatching ? 'text-green-700 dark:text-coinbase-green' : 'text-yellow-700 dark:text-coinbase-blue'}>Block:</span>
                        <span className={`ml-2 font-medium ${autoDetectResult.isRecipientMatching ? 'text-green-900 dark:text-coinbase-green' : 'text-yellow-900 dark:text-coinbase-blue'}`}>
                          {autoDetectResult.blockNumber}
                        </span>
                      </div>
                      <div>
                        <span className={autoDetectResult.isRecipientMatching ? 'text-green-700 dark:text-coinbase-green' : 'text-yellow-700 dark:text-coinbase-blue'}>Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          autoDetectResult.isRecipientMatching 
                            ? 'bg-green-100 dark:bg-coinbase-green/20 text-green-800 dark:text-coinbase-green' 
                            : 'bg-red-100 dark:bg-coinbase-red/20 text-red-800 dark:text-coinbase-red'
                        }`}>
                          {autoDetectResult.isRecipientMatching ? '✓ Valid Recipient' : '✗ Invalid Recipient'}
                        </span>
                        {!autoDetectResult.isRecipientMatching && (
                          <div className="mt-1 text-xs text-red-600 dark:text-coinbase-red">
                            ⚠️ Transaction found but recipient doesn't match our addresses. Check the address analysis below.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Detailed Matching Information */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-coinbase-dark-border">
                      <div className="space-y-2 text-xs">
                        
                        
                        {/* Transaction Details */}
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-coinbase-text-secondary">Transaction Hash:</span>
                          <span className="font-mono text-gray-800 dark:text-coinbase-text-primary">{autoDetectResult.transactionHash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-coinbase-text-secondary">Found Status:</span>
                          <span className={`font-medium ${autoDetectResult.found ? 'text-green-600 dark:text-coinbase-green' : 'text-red-600 dark:text-coinbase-red'}`}>
                            {autoDetectResult.found ? '✓ FOUND' : '✗ NOT FOUND'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-coinbase-text-secondary">Found On Network:</span>
                          <span className="font-mono text-gray-800 dark:text-coinbase-text-primary">{autoDetectResult.foundOnNetwork || 'N/A'}</span>
                        </div>
                        
                        {/* Only show matching details if transaction was found */}
                        {autoDetectResult.found && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-coinbase-text-secondary">Transaction Recipient:</span>
                              <span className="font-mono text-gray-800 dark:text-coinbase-text-primary">{autoDetectResult.recipientAddress}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-coinbase-text-secondary">Our Company Addresses:</span>
                              <div className="text-right">
                                {autoDetectResult.companyAddresses && Object.entries(autoDetectResult.companyAddresses).map(([network, address]) => (
                                  <div key={network} className="font-mono text-gray-800 dark:text-coinbase-text-primary">
                                    {network}: {address}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-coinbase-text-secondary">Matching Result:</span>
                              <span className={`font-medium ${autoDetectResult.isRecipientMatching ? 'text-green-600 dark:text-coinbase-green' : 'text-red-600 dark:text-coinbase-red'}`}>
                                {autoDetectResult.isRecipientMatching ? '✓ MATCH FOUND' : '✗ NO MATCH'}
                              </span>
                            </div>
                            {autoDetectResult.companyAddresses && (
                              <div className="mt-2 p-2 bg-gray-50 dark:bg-coinbase-dark-tertiary rounded text-xs">
                                <div className="font-medium text-gray-700 dark:text-coinbase-text-primary mb-1">Address Comparison:</div>
                                {Object.entries(autoDetectResult.companyAddresses).map(([network, address]) => {
                                  const matches = address.toLowerCase() === autoDetectResult.recipientAddress?.toLowerCase();
                                  return (
                                    <div key={network} className={`flex justify-between ${matches ? 'text-green-600 dark:text-coinbase-green' : 'text-gray-500 dark:text-coinbase-text-tertiary'}`}>
                                      <span>{network}:</span>
                                      <span className="font-mono">{matches ? '✓ MATCH' : '✗ NO MATCH'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* Network Check Results */}
                        {autoDetectResult.networkResults && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-coinbase-blue/20 rounded text-xs">
                            <div className="font-medium text-blue-700 dark:text-coinbase-blue mb-1">Network Check Results:</div>
                            {Object.entries(autoDetectResult.networkResults).map(([network, result]) => (
                              <div key={network} className={`flex justify-between ${result.found ? 'text-green-600 dark:text-coinbase-green' : 'text-gray-500 dark:text-coinbase-text-tertiary'}`}>
                                <span>{network}:</span>
                                <span className="font-mono">{result.found ? '✓ FOUND' : '✗ NOT FOUND'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Detailed Recipient Analysis */}
                        {autoDetectResult.recipientAddress && autoDetectResult.companyAddresses && (
                          <div className="mt-2 p-2 bg-orange-50 dark:bg-coinbase-blue/20 rounded text-xs">
                            <div className="font-medium text-orange-700 dark:text-coinbase-blue mb-1">Recipient Address Analysis:</div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-orange-600 dark:text-coinbase-blue">Transaction Recipient:</span>
                                <span className="font-mono text-orange-800 dark:text-coinbase-text-primary break-all">
                                  {autoDetectResult.recipientAddress}
                                </span>
                              </div>
                              <div className="text-orange-600 dark:text-coinbase-blue font-medium">Company Addresses:</div>
                              {Object.entries(autoDetectResult.companyAddresses).map(([network, address]) => {
                                const matches = address.toLowerCase() === autoDetectResult.recipientAddress?.toLowerCase();
                                return (
                                  <div key={network} className={`flex justify-between ${matches ? 'text-green-600 dark:text-coinbase-green' : 'text-orange-500 dark:text-coinbase-text-tertiary'}`}>
                                    <span>{network}:</span>
                                    <div className="text-right">
                                      <div className="font-mono text-xs break-all">{address}</div>
                                      <div className={`text-xs ${matches ? 'text-green-600 dark:text-coinbase-green' : 'text-orange-500 dark:text-coinbase-text-tertiary'}`}>
                                        {matches ? '✓ MATCH' : '✗ NO MATCH'}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-coinbase-dark-border">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAutoDetectModal(false)}
                    className="border-gray-300 dark:border-coinbase-dark-border text-gray-700 dark:text-coinbase-text-primary hover:bg-gray-50 dark:hover:bg-coinbase-dark-tertiary"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      // Auto-fill the form if we have transaction details
                      if (autoDetectResult) {
                        // Auto-fill amount and network
                        if (autoDetectResult.suggestedAmount && !isNaN(autoDetectResult.suggestedAmount)) {
                          setAmount(autoDetectResult.suggestedAmount.toString());
                        }
                        
                        if (autoDetectResult.suggestedNetwork) {
                          const networkMapping = {
                            'BEP20': 'BEP20-USDT',
                            'TRC20': 'TRC20-USDT',
                            'ERC20': 'ERC20-USDT',
                            'POLYGON': 'POL-USDT'
                          };
                          const mappedMethod = networkMapping[autoDetectResult.suggestedNetwork];
                          if (mappedMethod) {
                            setSelectedMethod(mappedMethod);
                          }
                        }
                        
                        setShowAutoDetectModal(false);
                        toast.success(`✅ Form auto-filled with detected transaction details!`);
                      }
                    }}
                    disabled={!autoDetectResult || (autoDetectResult && !autoDetectResult.isRecipientMatching)}
                    className={`${
                      autoDetectResult?.isRecipientMatching 
                        ? 'bg-green-500 dark:bg-coinbase-green hover:bg-green-600 dark:hover:bg-coinbase-green/80' 
                        : autoDetectResult && !autoDetectResult.isRecipientMatching
                        ? 'bg-red-500 dark:bg-coinbase-red hover:bg-red-600 dark:hover:bg-coinbase-red/80 cursor-not-allowed'
                        : 'bg-yellow-500 dark:bg-coinbase-blue hover:bg-yellow-600 dark:hover:bg-coinbase-blue/80'
                    } text-white`}
                  >
                    {autoDetectResult?.isRecipientMatching 
                      ? 'Use Valid Transaction' 
                      : autoDetectResult && !autoDetectResult.isRecipientMatching
                      ? '❌ Invalid Recipient - Cannot Use'
                      : 'Use Detected Transaction'
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsdtDeposit;
