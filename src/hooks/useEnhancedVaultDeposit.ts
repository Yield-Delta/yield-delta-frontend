/**
 * Enhanced vault deposit hook that supports both native SEI and ERC20 token deposits
 */

import { useWriteContract, useAccount, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { useEffect } from 'react';
import { parseUnits } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';
import { VAULT_QUERY_KEYS } from './useVaults';
import { 
  getVaultTokenRequirements, 
  vaultAcceptsNativeSEI, 
  isNativeSEIVault,
  getPrimaryDepositToken,
  hasInsufficientBalance
} from '@/utils/tokenUtils';
import { useTokenBalance } from './useTokenBalance';
import SEIVault from '@/lib/abis/SEIVault';

// ERC20 ABI for approve function
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable'
  }
] as const;

interface VaultDepositParams {
  amount: string;
  tokenSymbol: string;
  vaultAddress: string;
  recipient?: string;
}

interface DepositValidation {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  requiredApproval?: {
    tokenAddress: string;
    amount: string;
  };
}

export function useEnhancedVaultDeposit(vaultData: {
  address: string;
  tokenA: string;
  tokenB: string;
  strategy: string;
  name: string;
}) {
  const { writeContract, data: hash, error, isPending, isSuccess, isError } = useWriteContract();
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  // Log hook initialization and vault data
  console.log('🚀 [useEnhancedVaultDeposit] Hook initialized for vault:', {
    name: vaultData.name,
    address: vaultData.address,
    strategy: vaultData.strategy,
    tokenA: vaultData.tokenA,
    tokenB: vaultData.tokenB,
  });

  // Log wallet and network status
  console.log('🌐 [useEnhancedVaultDeposit] Wallet & Network Status:', {
    userAddress,
    chainId,
    expectedChainId: 1328, // SEI Atlantic-2
    isCorrectNetwork: chainId === 1328,
    vaultAddress: vaultData.address
  });

  // Add network warning
  if (chainId !== 1328) {
    console.warn('⚠️ [useEnhancedVaultDeposit] NETWORK MISMATCH!', {
      currentChainId: chainId,
      expectedChainId: 1328,
      currentNetwork: chainId === 1 ? 'Ethereum Mainnet' : 
                     chainId === 11155111 ? 'Sepolia' :
                     chainId === 713715 ? 'SEI Devnet (Arctic)' :
                     chainId === 1328 ? 'SEI Atlantic-2 Testnet' : 'Unknown',
      requiredNetwork: 'SEI Atlantic-2 Testnet'
    });
  }

  // Monitor transaction receipt with timeout and confirmation settings
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2, // Wait for 2 confirmations for better reliability on SEI
    timeout: 60_000, // 60 second timeout to prevent infinite waiting
    pollingInterval: 1_000, // Poll every 1 second for faster feedback on SEI
  });

  // Monitor transaction state changes
  useEffect(() => {
    if (hash) {
      console.log('🆔 [Transaction] Hash generated:', hash);
    }
  }, [hash]);

  useEffect(() => {
    if (isPending) {
      console.log('⏳ [Transaction] Status: PENDING - Waiting for user confirmation...');
    }
  }, [isPending]);

  useEffect(() => {
    if (isSuccess) {
      console.log('✅ [Transaction] Status: SUCCESS - Transaction submitted to network');
      console.log('🔍 [Transaction] Hash:', hash);
    }
  }, [isSuccess, hash]);

  useEffect(() => {
    if (isError) {
      console.error('❌ [Transaction] Status: ERROR - Transaction failed');
      console.error('💥 [Transaction] Error:', error);
    }
  }, [isError, error]);

  useEffect(() => {
    if (isConfirming) {
      console.log('⏳ [Transaction] Status: CONFIRMING - Waiting for network confirmation...');
      console.log('🔍 [Transaction] Hash:', hash);
    }
  }, [isConfirming, hash]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      console.log('🎉 [Transaction] Status: CONFIRMED - Transaction confirmed on network!');
      console.log('📄 [Transaction] Receipt:', receipt);
      console.log('⛽ [Transaction] Gas used:', receipt.gasUsed?.toString());
      console.log('🏁 [Transaction] Block number:', receipt.blockNumber?.toString());
    }
  }, [isConfirmed, receipt]);

  useEffect(() => {
    if (isReceiptError && receiptError) {
      console.error('❌ [Transaction] Receipt ERROR:', receiptError);

      // Handle specific error types
      const errorMessage = receiptError.message || String(receiptError);

      if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        console.error('⏱️ [Transaction] TIMEOUT: Transaction took too long to confirm');
        console.error('💡 [Transaction] This could be due to:');
        console.error('   - Network congestion on SEI testnet');
        console.error('   - RPC endpoint issues');
        console.error('   - Transaction stuck in mempool');
        console.error('🔍 [Transaction] Check transaction status on SeiTrace:',
          hash ? `https://seitrace.com/atlantic-2/tx/${hash}` : 'N/A');

        addNotification({
          type: 'error',
          title: 'Transaction Timeout',
          message: `Transaction confirmation timed out after 60 seconds. Check SeiTrace for transaction status: ${hash?.substring(0, 10)}...`
        });
      } else {
        console.error('💥 [Transaction] Receipt error details:', {
          message: errorMessage,
          hash,
          error: receiptError
        });
      }
    }
  }, [isReceiptError, receiptError, hash, addNotification]);

  // Enhanced logging for transaction states (current snapshot)
  console.log('📊 [useEnhancedVaultDeposit] Current Transaction State:', {
    hash,
    isPending,
    isSuccess,
    isError,
    isConfirming,
    isConfirmed,
    isReceiptError,
    error: error?.message,
    receiptError: receiptError?.message,
    hasReceipt: !!receipt
  });

  // Validate vault data before using it
  const hasValidVaultData = vaultData.address && vaultData.tokenA && vaultData.tokenB && vaultData.strategy;

  // Get token requirements for this vault - only if vault data is valid
  const tokenRequirements = hasValidVaultData ? getVaultTokenRequirements(vaultData) : {
    primaryToken: { symbol: 'SEI', name: 'SEI', decimals: 18, isNative: true },
    secondaryToken: { symbol: 'USDC', name: 'USD Coin', decimals: 6, isNative: false, address: '0x4fCF1784B31630811181f670Aea7A7bEF803eaED' },
    requiresBothTokens: false,
    supportsNativeSEI: true
  };
  const primaryToken = hasValidVaultData ? getPrimaryDepositToken(vaultData) : tokenRequirements.primaryToken;
  
  // Get user's balance for the primary token
  const userBalance = useTokenBalance(primaryToken.symbol);

  // Log token requirements and user balance
  console.log('ℹ️ [useEnhancedVaultDeposit] Token Info:', {
    primaryToken,
    userBalance: {
      balance: userBalance.balance,
      formatted: userBalance.formatted,
      isLoading: userBalance.isLoading,
    },
    tokenRequirements,
  });

  /**
   * Validate deposit parameters
   */
  const validateDeposit = (params: VaultDepositParams): DepositValidation => {
    console.log('🔍 [validateDeposit] Starting validation with params:', {
      vaultAddress: params.vaultAddress,
      amount: params.amount,
      tokenSymbol: params.tokenSymbol,
      userAddress,
      chainId
    });

    if (!userAddress) {
      console.error('❌ [validateDeposit] Wallet not connected');
      return { isValid: false, error: 'Wallet not connected' };
    }

    if (!params.vaultAddress || !params.amount || !params.tokenSymbol) {
      console.error('❌ [validateDeposit] Missing required parameters:', {
        vaultAddress: !!params.vaultAddress,
        amount: !!params.amount,
        tokenSymbol: !!params.tokenSymbol
      });
      return { isValid: false, error: 'Missing required parameters' };
    }

    // Check if vault address is valid for testnet
    const validTestnetVaults = [
      // DEPLOYED VAULTS - SEI Atlantic-2 Testnet (Chain ID 1328)
      '0x1ec7d0E455c0Ca2Ed4F2c27bc8F7E3542eeD6565', // Concentrated Liquidity Vault (DEPLOYED Nov 21 2025)
      '0xbCB883594435D92395fA72D87845f87BE78d202E', // Stable Max USDC Vault (DEPLOYED Nov 26 2025)
      '0xB8Ab030551dabC4FA99864111AAbA7F82281EbD8', // Delta Neutral Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
      '0x0Ea885EcA3c738be522b256261C4a13eF4225fD4', // Yield Farming Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
      '0xa079a2881233B8bBBd185DdEA5c0a5f484cD4E7b', // Active Trading Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
    ];

    const isValidVault = validTestnetVaults.some(addr => 
      addr.toLowerCase() === params.vaultAddress.toLowerCase()
    );

    console.log('🔍 [validateDeposit] Vault validation:', {
      vaultAddress: params.vaultAddress,
      isValidVault,
      validVaults: validTestnetVaults.slice(0, 2) // Show first 2 (new vaults)
    });

    if (!isValidVault) {
      console.error('❌ [validateDeposit] Invalid vault address:', params.vaultAddress);
      return {
        isValid: false,
        error: `Vault address ${params.vaultAddress} is not deployed on SEI Atlantic-2 testnet (Chain ID 1328)`
      };
    }

    // Check if the token is supported by this vault
    const tokenSymbol = params.tokenSymbol.toUpperCase();
    const vaultTokenA = vaultData.tokenA.toUpperCase();
    const vaultTokenB = vaultData.tokenB.toUpperCase();
    const isNativeVault = isNativeSEIVault(vaultData);

    console.log('🔍 [validateDeposit] Token validation:', {
      tokenSymbol,
      vaultTokenA,
      vaultTokenB,
      isNativeVault,
      vaultData
    });

    if (tokenSymbol !== vaultTokenA && tokenSymbol !== vaultTokenB) {
      console.error('❌ [validateDeposit] Token not supported by vault');
      return {
        isValid: false,
        error: `This vault does not accept ${tokenSymbol}. It accepts ${vaultTokenA} and ${vaultTokenB}.`
      };
    }

    // Additional validation for native vs ERC20 vault types
    const depositTokenInfo = primaryToken;
    console.log('🔍 [validateDeposit] Vault type validation:', {
      depositTokenIsNative: depositTokenInfo.isNative,
      isNativeVault,
      depositTokenInfo
    });

    if (depositTokenInfo.isNative && !isNativeVault) {
      console.error('❌ [validateDeposit] Cannot deposit native SEI to ERC20 vault');
      return {
        isValid: false,
        error: 'Cannot deposit native SEI to an ERC20-only vault. Please select an appropriate vault.'
      };
    }

    if (!depositTokenInfo.isNative && isNativeVault) {
      console.error('❌ [validateDeposit] Cannot deposit ERC20 to native vault');
      return {
        isValid: false,
        error: 'Cannot deposit ERC20 tokens to a native SEI vault. Please select an appropriate vault.'
      };
    }

    // Validate balance
    const balanceCheck = hasInsufficientBalance(
      params.amount,
      userBalance.balance,
      primaryToken
    );

    console.log('🔍 [validateDeposit] Balance validation:', {
      requestedAmount: params.amount,
      userBalance: userBalance.balance,
      primaryToken: primaryToken.symbol,
      sufficient: !balanceCheck.insufficient,
      balanceLoading: userBalance.isLoading,
      balanceError: userBalance.error
    });

    if (balanceCheck.insufficient) {
      console.error('❌ [validateDeposit] Insufficient balance:', balanceCheck.message);
      return {
        isValid: false,
        error: balanceCheck.message
      };
    }

    const warnings: string[] = [];

    // Check if user is depositing the optimal token
    if (tokenSymbol !== primaryToken.symbol) {
      warnings.push(
        `You're depositing ${tokenSymbol}, but ${primaryToken.symbol} is the primary token for this vault.`
      );
    }

    // For ERC20 tokens, check if approval is needed
    let requiredApproval: DepositValidation['requiredApproval'];
    if (!primaryToken.isNative && primaryToken.address) {
      const amountInWei = parseUnits(params.amount, primaryToken.decimals);
      requiredApproval = {
        tokenAddress: primaryToken.address,
        amount: amountInWei.toString()
      };
      
      warnings.push(
        `This deposit requires ERC20 token approval. You'll need to approve ${primaryToken.symbol} spending first.`
      );
    }

    console.log('✅ [validateDeposit] Validation successful!', {
      warnings: warnings.length,
      requiredApproval: !!requiredApproval,
      tokenSymbol,
      primaryToken: primaryToken.symbol
    });

    return {
      isValid: true,
      warnings,
      requiredApproval
    };
  };

  /**
   * Approve ERC20 token spending
   */
  const approveToken = async (tokenAddress: string, amount: string): Promise<void> => {
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    console.log('[useEnhancedVaultDeposit] Approving token:', {
      tokenAddress,
      amount,
      spender: vaultData.address
    });

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [vaultData.address as `0x${string}`, BigInt(amount)]
    });
  };

  /**
   * Execute vault deposit
   */
  const deposit = async (params: VaultDepositParams): Promise<void> => {
    console.log('🚀 [deposit] Starting deposit process:', {
      params,
      userAddress,
      chainId,
      vaultData
    });

    if (!userAddress) {
      console.error('❌ [deposit] Wallet not connected');
      throw new Error('Wallet not connected');
    }

    // Validate deposit
    console.log('🔍 [deposit] Running validation...');
    const validation = validateDeposit(params);
    if (!validation.isValid) {
      console.error('❌ [deposit] Validation failed:', validation.error);
      throw new Error(validation.error);
    }
    console.log('✅ [deposit] Validation passed');

    const tokenInfo = primaryToken;
    const amountInWei = parseUnits(params.amount, tokenInfo.decimals);
    const recipient = params.recipient || userAddress;

    console.log('🔍 [deposit] Deposit details:', {
      vaultAddress: params.vaultAddress,
      amount: params.amount,
      tokenSymbol: params.tokenSymbol,
      amountInWei: amountInWei.toString(),
      tokenInfo,
      recipient,
      isNative: tokenInfo.isNative
    });

    try {
      // Determine if this is a native SEI vault or ERC20 vault
      const isNativeVault = isNativeSEIVault(vaultData);

      console.log('🔍 [deposit] Vault type determination:', {
        isNativeVault,
        tokenIsNative: tokenInfo.isNative,
        vaultData,
        willSendValue: tokenInfo.isNative && isNativeVault
      });

      if (tokenInfo.isNative && isNativeVault) {
        // Native SEI deposit to a native SEI vault
        console.log('💰 [deposit] Executing native SEI deposit with msg.value');
        console.log('📋 [deposit] Contract call params:', {
          address: params.vaultAddress,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei.toString(), recipient],
          value: amountInWei.toString()
        });

        writeContract({
          address: params.vaultAddress as `0x${string}`,
          abi: SEIVault,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei, recipient as `0x${string}`],
          value: amountInWei // Send SEI as value for native deposits
        });

        console.log('✅ [deposit] Native SEI writeContract called - transaction will be processed by wagmi');
      } else if (!tokenInfo.isNative && !isNativeVault) {
        // ERC20 token deposit to an ERC20 vault - requires prior approval
        console.log('🏦 [deposit] Executing ERC20 deposit (requires approval)');
        console.log('📋 [deposit] Contract call params:', {
          address: params.vaultAddress,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei.toString(), recipient],
          value: '0 (no ETH for ERC20)'
        });

        writeContract({
          address: params.vaultAddress as `0x${string}`,
          abi: SEIVault,
          functionName: 'seiOptimizedDeposit',
          args: [amountInWei, recipient as `0x${string}`]
          // NO value property for ERC20 deposits - this is critical!
        });

        console.log('✅ [deposit] ERC20 writeContract called - transaction will be processed by wagmi');
      } else {
        // Mismatched vault and token types
        const errorMsg = isNativeVault
          ? 'This vault only accepts native SEI deposits'
          : `This vault only accepts ERC20 tokens, not native SEI`;
        console.error('❌ [deposit] Vault/token type mismatch:', {
          isNativeVault,
          tokenIsNative: tokenInfo.isNative,
          errorMsg
        });
        throw new Error(errorMsg);
      }

      console.log('⏳ [deposit] writeContract called, wagmi will handle the transaction flow');
      // Don't return anything - let wagmi's state management handle the rest
      // The component will track state via isPending, isSuccess, isError, and hash
    } catch (err) {
      console.error('[useEnhancedVaultDeposit] Deposit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      addNotification({
        type: 'error',
        title: 'Deposit Failed',
        message: errorMessage
      });

      throw err;
    }
  };

  /**
   * Get deposit information for UI
   */
  const getDepositInfo = () => {
    return {
      vaultName: vaultData.name,
      primaryToken,
      tokenRequirements,
      userBalance: {
        amount: userBalance.balance,
        formatted: userBalance.formatted,
        isLoading: userBalance.isLoading
      },
      supportsNativeSEI: vaultAcceptsNativeSEI(vaultData),
      requiresBothTokens: tokenRequirements.requiresBothTokens
    };
  };

  return {
    // Main functions
    deposit,
    approveToken,
    validateDeposit,

    // Deposit info
    getDepositInfo,

    // Transaction state
    hash,
    error,
    isPending,
    isSuccess,
    isError,

    // Balance info
    userBalance,

    // Helper to invalidate queries after successful deposit
    invalidateQueries: () => {
      console.log('[useEnhancedVaultDeposit] Invalidating vault queries for:', vaultData.address);

      // Invalidate vault detail query (specific vault data)
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.detail(vaultData.address) });

      // Invalidate vault lists query (all vaults data)
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() });

      // Invalidate user positions for this vault (if user address is available)
      if (userAddress) {
        queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.positions(userAddress) });
      }

      console.log('[useEnhancedVaultDeposit] All vault queries invalidated - TVL and position will auto-refetch');
    }
  };
}