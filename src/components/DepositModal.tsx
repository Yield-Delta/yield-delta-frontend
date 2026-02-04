"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowRight, Info, Shield, TrendingUp, Coins, Vault, DollarSign, Percent, CheckCircle2, Zap } from 'lucide-react';
import { useEnhancedVaultDeposit } from '@/hooks/useEnhancedVaultDeposit';
import {
  getTokenRequirementText,
  getPrimaryDepositToken,
  getTokenInfo
} from '@/utils/tokenUtils';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useTokenAllowance } from '@/hooks/useTokenBalance';
import { parseUnits } from 'viem';

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

interface VaultData {
  address: string;
  name: string;
  apy: number;
  tvl: number;
  strategy: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
  };
}

interface DepositModalProps {
  vault: VaultData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`
  }
  return `${amount.toFixed(0)}`
}

const getRiskLevel = (apy: number, strategy?: string): 'Low' | 'Medium' | 'High' => {
  const apyPercentage = apy * 100; // Convert decimal to percentage
  
  // Strategy-based risk adjustments
  const strategyRiskModifier = {
    'stable_max': -5,          // Stablecoin strategies are less risky
    'concentrated_liquidity': 5, // Concentrated liquidity has impermanent loss risk
    'arbitrage': 3,            // Arbitrage has execution risk
    'yield_farming': 2,        // Standard farming risk
    'hedge': 0,                // Hedge strategies are balanced
    'sei_hypergrowth': 8,      // High growth = high risk
    'blue_chip': -2,           // Blue chip assets are safer
    'delta_neutral': -3        // Delta neutral strategies reduce market risk
  };
  
  const modifier = strategy ? (strategyRiskModifier[strategy as keyof typeof strategyRiskModifier] || 0) : 0;
  const adjustedApy = apyPercentage + modifier;
  
  if (adjustedApy < 15) return 'Low'
  if (adjustedApy < 25) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) => {
  const colors = {
    concentrated_liquidity: '#00f5d4',
    yield_farming: '#9b5de5',
    arbitrage: '#ff206e',
    hedge: '#ffa500',
    stable_max: '#10b981',
    sei_hypergrowth: '#f59e0b',
    blue_chip: '#3b82f6',
    delta_neutral: '#8b5cf6',
  }
  return colors[strategy as keyof typeof colors] || '#00f5d4'
}

export default function DepositModal({ vault, isOpen, onClose, onSuccess }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Get actual wallet connection
  const { address, isConnected } = useAccount();

  const router = useRouter();

  // State for selected deposit token
  const [selectedToken, setSelectedToken] = useState<string>('');

  // Approval state
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Only create deposit mutation if vault has valid data
  const vaultData = vault && vault.address && vault.tokenA && vault.tokenB && vault.strategy ? {
    address: vault.address,
    tokenA: vault.tokenA,
    tokenB: vault.tokenB,
    strategy: vault.strategy,
    name: vault.name
  } : {
    // Fallback data to prevent errors when vault is null/incomplete
    address: '',
    tokenA: 'SEI',
    tokenB: 'USDC',
    strategy: 'stable_max',
    name: 'Default Vault'
  };
  
  const depositMutation = useEnhancedVaultDeposit(vaultData);

  // Approval contract hooks
  const { writeContract: writeApproval, data: approvalHash, isError: isApprovalError, error: approvalError } = useWriteContract();

  // Wait for approval transaction
  const { isLoading: isApprovalConfirming, isSuccess: isApprovalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Enhanced balance information available through depositMutation.userBalance

  // Get deposit info and token requirements (after hooks are initialized)
  const depositInfo = vault ? depositMutation.getDepositInfo() : null;
  // Token requirements are included in depositInfo - only call when vault exists and has valid data
  const primaryToken = (vault && vault.tokenA && vault.tokenB && vault.strategy) ? getPrimaryDepositToken(vault) : null;
  const requirementText = (vault && vault.tokenA && vault.tokenB && vault.strategy) ? getTokenRequirementText(vault) : 'Token requirements unavailable';
  
  // Get current user balance for the primary deposit token
  const currentUserBalance = depositInfo ? depositInfo.userBalance : { amount: 0, formatted: '0', isLoading: false };

  // Check allowance for ERC20 tokens
  const tokenInfo = primaryToken ? getTokenInfo(primaryToken.symbol) : null;
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    tokenInfo && !tokenInfo.isNative && tokenInfo.address ? tokenInfo.address : '',
    vault?.address || ''
  );

  // Update selected token when vault changes
  useEffect(() => {
    if (primaryToken && !selectedToken) {
      setSelectedToken(primaryToken.symbol);
    }
  }, [primaryToken, selectedToken]);

  // Check if approval is needed whenever amount or allowance changes
  useEffect(() => {
    if (!tokenInfo || tokenInfo.isNative || !depositAmount || parseFloat(depositAmount) <= 0) {
      setNeedsApproval(false);
      return;
    }

    const amountInWei = parseUnits(depositAmount, tokenInfo.decimals);
    const hasInsufficientAllowance = allowance < amountInWei;

    console.log('[DepositModal] 🔍 Allowance check:', {
      tokenSymbol: tokenInfo.symbol,
      tokenAddress: tokenInfo.address,
      tokenDecimals: tokenInfo.decimals,
      depositAmount: depositAmount,
      depositAmountInWei: amountInWei.toString(),
      currentAllowance: allowance.toString(),
      currentAllowanceFormatted: (Number(allowance) / Math.pow(10, tokenInfo.decimals)).toFixed(tokenInfo.decimals),
      needsApproval: hasInsufficientAllowance,
      comparison: hasInsufficientAllowance
        ? `❌ Allowance (${allowance.toString()}) < Amount (${amountInWei.toString()})`
        : `✅ Allowance (${allowance.toString()}) >= Amount (${amountInWei.toString()})`,
      vaultAddress: vault?.address,
      userAddress: address
    });

    setNeedsApproval(hasInsufficientAllowance);
  }, [depositAmount, allowance, tokenInfo, vault?.address, address]);

  // Handle approval confirmation
  useEffect(() => {
    if (isApprovalConfirmed && approvalHash) {
      console.log('[DepositModal] ✅ Approval transaction confirmed:', approvalHash);
      console.log('[DepositModal] Refetching allowance to verify approval...');

      // Refetch allowance immediately
      refetchAllowance();

      // Also refetch after a delay to ensure blockchain state is updated
      setTimeout(() => {
        console.log('[DepositModal] Secondary allowance refetch...');
        refetchAllowance();
      }, 2000);

      // Final refetch and state update
      setTimeout(() => {
        console.log('[DepositModal] Final allowance refetch...');
        refetchAllowance();

        setIsApproving(false);
        setTransactionStatus('idle');

        // Force needsApproval to false after successful approval
        // The allowance check useEffect will re-verify this
        setNeedsApproval(false);

        console.log('[DepositModal] ✅ Approval flow complete, you can now deposit');
      }, 3000);
    }
  }, [isApprovalConfirmed, approvalHash, refetchAllowance]);

  // Handle approval errors
  useEffect(() => {
    if (isApprovalError && approvalError) {
      console.error('[DepositModal] Approval failed:', approvalError);
      setIsApproving(false);
      setErrorMessage(`Approval failed: ${approvalError.message}`);
      setTransactionStatus('error');
    }
  }, [isApprovalError, approvalError]);

  // Define handleClose function early to avoid hoisting issues
  const handleClose = useCallback(() => {
    setDepositAmount('');
    setTransactionStatus('idle');
    setTransactionHash(null);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  // Watch for transaction pending state
  useEffect(() => {
    if (depositMutation.isPending && transactionStatus !== 'pending') {
      console.log('[DepositModal] Transaction pending...');
      setTransactionStatus('pending');
      setTransactionHash(null);
      setErrorMessage(null);
    }
  }, [depositMutation.isPending, transactionStatus]);

  // Watch for transaction success
  useEffect(() => {
    if (depositMutation.isSuccess && depositMutation.hash && transactionStatus !== 'success') {
      console.log('[DepositModal] Transaction successful:', depositMutation.hash);
      setTransactionHash(depositMutation.hash);
      setTransactionStatus('success');

      // Show success notification immediately
      onSuccess(depositMutation.hash);

      // Reset deposit amount but keep modal open to show success
      setDepositAmount('');

      // CRITICAL: Invalidate and refetch ALL relevant data after successful transaction
      // Wait 2 seconds for blockchain state to propagate
      setTimeout(() => {
        console.log('[DepositModal] Invalidating queries after successful deposit');

        // Invalidate vault queries (list and detail)
        depositMutation.invalidateQueries();

        // Refetch user balance
        depositMutation.userBalance.refetch();

        // Trigger refetch on the vault page by invalidating query client
        // This will cause TVL and position hooks to refetch when the page loads
        console.log('[DepositModal] All queries invalidated - data will refresh on vault page');
      }, 2000);

      // Give user time to see the success message before redirecting
      setTimeout(() => {
        if (vault) {
          router.push(`/vault?address=${vault.address}&tab=overview`);
        }
        handleClose();
      }, 3000);
    }
  }, [depositMutation, transactionStatus, vault, router, onSuccess, handleClose]);

  // Watch for transaction errors
  useEffect(() => {
    if (depositMutation.isError && depositMutation.error && transactionStatus !== 'error') {
      console.error('[DepositModal] Transaction failed:', depositMutation.error);

      // Handle specific error cases
      const error = depositMutation.error;
      let errorMessage = 'Unknown error occurred';

      if (error.message.includes('user rejected transaction')) {
        errorMessage = 'Transaction was rejected by the user';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this transaction';
      } else if (error.message.includes('Insufficient balance')) {
        errorMessage = 'Your wallet balance is too low for this deposit';
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorMessage = 'Transaction confirmation timed out. Please check SeiTrace to verify if your transaction was successful.';
      } else {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      setTransactionStatus('error');
    }
  }, [depositMutation.isError, depositMutation.error, transactionStatus]);

  // Add effect to track when the modal should be opening + handle body scroll
  useEffect(() => {
    if (isOpen) {
      if (vault) {
        console.log('✅ [DepositModal] Modal opened for vault:', vault.name);
        // Lock body scroll - use overflow hidden instead of position fixed to prevent layout shifts
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        // Store scroll position for restoration
        document.body.dataset.scrollY = String(scrollY);
      } else {
        console.error('❌ [DepositModal] ERROR: Modal is open but vault is null!');
      }
    } else {
      console.log('🛑 [DepositModal] Modal closed');
      // Unlock body scroll and restore position
      const scrollY = document.body.dataset.scrollY;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    }

    // Cleanup on unmount
    return () => {
      const scrollY = document.body.dataset.scrollY;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
      }
    };
  }, [isOpen, vault]);

  // Don't render if vault is null or modal is not open
  if (!isOpen || !vault) {
    return null;
  }

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy, vault.strategy);
  const isValidAmount = depositAmount && parseFloat(depositAmount) > 0;

  // Handle approval for ERC20 tokens
  const handleApprove = async () => {
    if (!isConnected || !address || !tokenInfo || !tokenInfo.address || !vault) {
      console.error('[DepositModal] Cannot approve: missing requirements');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      console.error('[DepositModal] Invalid deposit amount for approval');
      return;
    }

    try {
      setIsApproving(true);
      setTransactionStatus('pending');
      setErrorMessage(null);

      // Use MAX_UINT256 for unlimited approval (standard practice)
      const MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

      console.log('[DepositModal] Approving token with MAX approval:', {
        tokenAddress: tokenInfo.address,
        tokenSymbol: tokenInfo.symbol,
        tokenDecimals: tokenInfo.decimals,
        spender: vault.address,
        vaultName: vault.name,
        approvalAmount: 'MAX_UINT256 (unlimited)',
        depositAmount: depositAmount,
        depositAmountInWei: parseUnits(depositAmount, tokenInfo.decimals).toString(),
        currentAllowance: allowance.toString()
      });

      writeApproval({
        address: tokenInfo.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [vault.address as `0x${string}`, MAX_UINT256]
      });

      console.log('[DepositModal] Approval transaction submitted, waiting for confirmation...');
    } catch (error) {
      console.error('[DepositModal] Approval error:', error);
      setIsApproving(false);
      setErrorMessage(error instanceof Error ? error.message : 'Approval failed');
      setTransactionStatus('error');
    }
  };

  // Enhanced handleDeposit function with demo simulation
  const handleDeposit = async () => {
    // Check wallet connection first
    if (!isConnected || !address) {
      console.warn('🔒 [DepositModal] Wallet not connected, aborting deposit');
      setErrorMessage('Please connect your wallet to continue');
      return;
    }

    console.log('▶️ [DepositModal] handleDeposit initiated', {
      depositAmount,
      selectedToken,
      isValidAmount,
      vaultName: vault?.name,
      vaultAddress: vault?.address
    });

    if (!isValidAmount || !vault || !selectedToken) {
      console.warn('⚠️ [DepositModal] Invalid deposit params, aborting', {
        isValidAmount,
        vault: !!vault,
        selectedToken: !!selectedToken,
      });
      return;
    }

    // CRITICAL: Check allowance before deposit for ERC20 tokens
    if (tokenInfo && !tokenInfo.isNative) {
      const amountInWei = parseUnits(depositAmount, tokenInfo.decimals);
      console.log('🔍 [DepositModal] Pre-deposit allowance verification:', {
        tokenSymbol: tokenInfo.symbol,
        tokenAddress: tokenInfo.address,
        depositAmountInWei: amountInWei.toString(),
        currentAllowance: allowance.toString(),
        hasInsufficientAllowance: allowance < amountInWei,
        needsApproval: needsApproval
      });

      if (allowance < amountInWei) {
        const errorMsg = `Insufficient allowance. Current: ${allowance.toString()}, Required: ${amountInWei.toString()}. Please approve first.`;
        console.error('❌ [DepositModal] ' + errorMsg);
        setErrorMessage(errorMsg);
        setTransactionStatus('error');
        return;
      }

      console.log('✅ [DepositModal] Allowance check passed, proceeding with deposit');
    }

    // Don't manually set transaction status - let the useEffect hooks handle it
    console.log('🔄 [DepositModal] Initiating deposit, wagmi will manage transaction state');
    setTransactionHash(null);
    setErrorMessage(null);

    try {
      // Validate the deposit using enhanced validation
      const validation = depositMutation.validateDeposit({
        amount: depositAmount,
        tokenSymbol: selectedToken,
        vaultAddress: vault.address,
        recipient: address
      });

      if (!validation.isValid) {
        console.error('❌ [DepositModal] Validation failed:', validation.error);
        throw new Error(validation.error);
      }

      // Show warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('⚠️ [DepositModal] Deposit warnings:', validation.warnings);
      }

      console.log('✅ [DepositModal] Validation passed, calling deposit mutation...');

      // Execute the deposit - this will trigger wagmi's writeContract
      await depositMutation.deposit({
        amount: depositAmount,
        tokenSymbol: selectedToken,
        vaultAddress: vault.address,
        recipient: address
      });

      console.log('✅ [DepositModal] deposit() called successfully, wagmi will now handle the transaction');
      console.log('⏳ [DepositModal] Watch for depositMutation.isPending to become true');
    } catch (error) {
      console.error('❌ [DepositModal] Deposit initiation error:', error);

      // Handle immediate errors (validation, wallet issues, etc.)
      if (error instanceof Error) {
        let userFriendlyMessage = error.message;

        if (error.message.includes('user rejected transaction')) {
          userFriendlyMessage = 'Transaction was rejected by the user';
        } else if (error.message.includes('insufficient funds')) {
          userFriendlyMessage = 'Insufficient funds for this transaction';
        } else if (error.message.includes('Insufficient balance')) {
          userFriendlyMessage = 'Your wallet balance is too low for this deposit';
        } else if (error.message.includes('0xfde038e6') || error.message.includes('awaiting_internal_transactions')) {
          userFriendlyMessage = 'ERC20 transferFrom failed. Please ensure you have approved the vault contract and have sufficient token balance.';
        }

        console.error('💥 [DepositModal] Setting error message:', userFriendlyMessage);
        setErrorMessage(userFriendlyMessage);
      } else {
        console.error('💥 [DepositModal] Unknown error type:', error);
        setErrorMessage('Failed to initiate transaction');
      }

      setTransactionStatus('error');
    }
  };
  
  return (
    <>
      <style jsx>{`
        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0px); opacity: 0.6; }
          50% { transform: translateX(4px); opacity: 1; }
        }
        
        @keyframes textGlow {
          0% { 
            textShadow: 0 0 30px ${vaultColor}40, 0 4px 8px rgba(0,0,0,0.4);
            filter: brightness(1);
          }
          100% { 
            textShadow: 0 0 40px ${vaultColor}60, 0 4px 8px rgba(0,0,0,0.4);
            filter: brightness(1.1);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* ENHANCED MODAL SIZING - Force consistent width across all scenarios */
        .deposit-modal-container {
          width: 100% !important;
          height: 100vh !important;
          height: 100dvh !important; /* Use dynamic viewport height for mobile browsers */
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 10000 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 !important;
          padding: 20px !important;
          padding-left: env(safe-area-inset-left, 20px) !important;
          padding-right: env(safe-area-inset-right, 20px) !important;
          padding-top: env(safe-area-inset-top, 20px) !important;
          padding-bottom: env(safe-area-inset-bottom, 20px) !important;
          max-width: none !important;
          max-height: none !important;
          transform: none !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          -webkit-overflow-scrolling: touch !important;
        }

        .deposit-modal-content {
          width: 500px !important;
          max-width: 500px !important;
          min-width: 320px !important;
          max-height: 90vh !important;
          max-height: 90dvh !important; /* Use dynamic viewport height */
          position: relative !important;
          margin: 0 auto !important;
          transform: none !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Restore modal content width specifically */
        .deposit-modal-container .deposit-modal-content {
          width: 500px !important;
          max-width: 500px !important;
          max-height: 90vh !important;
          max-height: 90dvh !important;
        }

        /* Responsive handling for smaller screens - Enhanced */
        @media (max-width: 600px) {
          .deposit-modal-container {
            padding: 16px !important; /* Added padding to prevent modal cutoff on mobile */
            align-items: center !important;
            justify-content: center !important;
          }
          .deposit-modal-content {
            width: calc(100% - 32px) !important; /* Account for 16px padding on each side */
            max-width: calc(100% - 32px) !important;
            min-width: 280px !important;
            max-height: calc(100% - 32px) !important; /* Account for vertical padding */
            border-radius: 20px !important;
            margin: 0 !important; /* Removed margin since container now has padding */
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          /* Ensure scrollable content has proper padding - reduced for mobile */
          .modal-scrollable-content {
            padding: 1rem 0.75rem 0 0.75rem !important;
            max-height: calc(100vh - 180px) !important;
            max-height: calc(100dvh - 180px) !important;
            box-sizing: border-box !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
          }

          /* Reduce header padding on mobile */
          .modal-header-section {
            padding: 1rem !important;
            margin-bottom: 0.5rem !important;
          }

          /* Compact icon section on mobile */
          .modal-icons-container {
            margin-bottom: 0.5rem !important;
          }

          .modal-icon-box {
            padding: 12px !important;
            border-radius: 16px !important;
          }

          .modal-icon-box svg {
            width: 24px !important;
            height: 24px !important;
          }

          .modal-arrow-icon {
            margin: 0 12px !important;
          }

          /* Reduce title size on mobile */
          .modal-title {
            font-size: 1.375rem !important;
            margin-bottom: 0.5rem !important;
          }

          .modal-title svg {
            width: 20px !important;
            height: 20px !important;
          }

          /* Compact subtitle on mobile */
          .modal-subtitle {
            font-size: 0.875rem !important;
            margin-bottom: 0.5rem !important;
          }

          .modal-subtitle svg {
            width: 16px !important;
            height: 16px !important;
          }

          /* Reduce transaction section padding */
          .transaction-side {
            padding: 1rem !important;
          }

          /* Compact amount input */
          .amount-input-card input {
            font-size: 1.75rem !important;
          }

          /* Reduce APY section on mobile */
          .apy-display-large {
            font-size: 2rem !important;
          }

          /* Compact spacing throughout */
          .space-y-4 > * + * {
            margin-top: 0.75rem !important;
          }

          /* Compact quick deposit section on mobile */
          .quick-deposit-section {
            margin-bottom: 12px !important;
          }

          .quick-deposit-label {
            font-size: 0.9375rem !important;
            margin-bottom: 10px !important;
          }

          .quick-deposit-grid {
            gap: 10px !important;
          }

          .quick-deposit-amount {
            font-size: 1rem !important;
          }

          .quick-deposit-shares {
            font-size: 0.75rem !important;
          }

          /* Transaction flow spacing on mobile */
          .transaction-flow-container {
            margin-bottom: 12px !important;
          }

          .transaction-flow-section-title {
            font-size: 1rem !important;
            margin-bottom: 12px !important;
          }

          .transaction-flow-arrow-wrapper {
            padding: 0.375rem 0 !important;
          }

          /* Reduce quick deposit button padding */
          .quick-deposit-button {
            padding: 10px !important;
          }

          /* Compact footer */
          .modal-footer {
            padding: 0.75rem 1rem 1rem 1rem !important;
          }

          .modal-footer button {
            height: 44px !important;
            font-size: 0.9375rem !important;
          }

          /* Ensure transaction section has proper padding */
          .transaction-side {
            padding: 1rem 1rem !important;
          }

          /* Quick deposit section padding */
          .quick-deposit-section {
            padding: 0 !important;
          }

          /* Important notice padding */
          .important-notice {
            padding: 1rem !important;
          }

          /* APY info section padding */
          .apy-info-section {
            padding: 1rem !important;
          }
        }

        @media (max-width: 375px) {
          .deposit-modal-container {
            padding: 12px !important; /* Added padding to prevent modal cutoff on very small screens */
          }
          .deposit-modal-content {
            width: calc(100% - 24px) !important; /* Account for 12px padding on each side */
            max-width: calc(100% - 24px) !important;
            max-height: calc(100% - 24px) !important; /* Account for vertical padding */
            border-radius: 16px !important;
            margin: 0 !important; /* Removed margin since container now has padding */
            box-sizing: border-box !important;
          }

          .modal-scrollable-content {
            padding: 0.625rem 0.5rem 0.5rem 0.5rem !important;
            max-height: calc(92vh - 140px) !important;
            max-height: calc(92dvh - 140px) !important;
          }

          .modal-title {
            font-size: 1.125rem !important;
          }

          .apy-display-large {
            font-size: 1.5rem !important;
          }

          .modal-footer {
            padding: 0.625rem 0.75rem !important;
          }
        }
        
        /* Desktop size enforcement */
        @media (min-width: 601px) {
          .deposit-modal-content {
            width: 500px !important;
            max-width: 500px !important;
            max-height: 85vh !important;
          }
        }


        /* Trust indicators on mobile */
        @media (max-width: 600px) {
          .trust-indicators {
            gap: 12px !important;
            font-size: 0.8125rem !important;
          }

          .trust-indicators svg {
            width: 14px !important;
            height: 14px !important;
          }

          /* Reduce arrow container on mobile */
          .arrow-container {
            width: 36px !important;
            height: 36px !important;
          }

          .arrow-container svg {
            width: 18px !important;
            height: 18px !important;
          }

          /* Compact important notice on mobile */
          .important-notice {
            padding: 12px !important;
            margin-bottom: 12px !important;
          }

          .important-notice h4 {
            font-size: 0.9375rem !important;
          }

          .important-notice p {
            font-size: 0.8125rem !important;
          }

          /* Compact APY info section on mobile */
          .apy-info-section {
            padding: 10px !important;
          }

          .apy-label {
            font-size: 1rem !important;
          }

          .apy-daily {
            font-size: 1.125rem !important;
          }

          .apy-daily-label {
            font-size: 0.75rem !important;
          }

          .apy-meta {
            margin-top: 10px !important;
            padding-top: 10px !important;
            font-size: 0.8125rem !important;
          }
        }
      `}</style>
      <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center deposit-modal-container"
      onClick={(e) => {
        console.log('[DepositModal] Backdrop clicked');
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      data-testid="modal-backdrop"
    >
      <div
        className="rounded-3xl shadow-2xl flex flex-col deposit-modal-content"
        style={{
          background: `linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)`,
          backdropFilter: 'blur(24px) saturate(180%)',
          border: `2px solid rgba(255, 255, 255, 0.15)`,
          borderTop: `3px solid ${vaultColor}60`,
          borderLeft: `1px solid ${vaultColor}20`,
          borderRight: `1px solid ${vaultColor}20`,
          boxShadow: `0 32px 80px ${vaultColor}20, 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`,
          color: '#ffffff',
          animation: 'modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => {
          console.log('[DepositModal] Modal content clicked - preventing propagation');
          e.stopPropagation();
        }}
      >
        {/* Scrollable Content Area */}
        <div
          className="modal-scrollable-content"
          style={{
            flex: '1',
            overflow: 'auto',
            overflowX: 'hidden',
            padding: '1rem 1.25rem 0.5rem 1.25rem',
            minHeight: '0',
            maxHeight: 'calc(90vh - 100px)',
            boxSizing: 'border-box'
          }}
        >
            {/* Enhanced Modal Header */}
            <div className="modal-header-section" style={{
              background: `linear-gradient(135deg, ${vaultColor}08 0%, transparent 60%)`,
              borderRadius: '16px',
              padding: '1.25rem',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: '0.75rem'
            }}>
              {/* Background Animation */}
              <div 
                style={{
                  position: 'absolute',
                  inset: '0',
                  opacity: '0.2',
                  background: `radial-gradient(ellipse at center, ${vaultColor}15 0%, transparent 70%)`,
                  animation: 'pulse 3s ease-in-out infinite'
                }}
              />
              
              {/* Icon Section */}
              <div className="modal-icons-container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                position: 'relative'
              }}>
                <div
                  className="modal-icon-box"
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}20, ${vaultColor}10)`,
                    border: `2px solid ${vaultColor}40`,
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: `0 0 40px ${vaultColor}30, 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    animation: 'float 2s ease-in-out infinite'
                  }}
                >
                  <Vault style={{ width: '32px', height: '32px', color: vaultColor }} />
                </div>
                <ArrowRight
                  className="modal-arrow-icon"
                  style={{
                    margin: '0 16px',
                    opacity: '0.6',
                    color: vaultColor,
                    animation: 'slideRight 2s ease-in-out infinite'
                  }}
                />
                <div
                  className="modal-icon-box"
                  style={{
                    background: `linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.1))`,
                    border: '2px solid rgba(34, 197, 94, 0.4)',
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: `0 0 40px rgba(34, 197, 94, 0.3), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    animation: 'float 2s ease-in-out infinite 0.5s'
                  }}
                >
                  <TrendingUp style={{ width: '32px', height: '32px', color: '#22c55e' }} />
                </div>
              </div>

              {/* Enhanced Title */}
              <h2
                className="modal-title"
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '900',
                  marginBottom: '0.75rem',
                  lineHeight: '1.2',
                  color: '#ffffff',
                  textShadow: `0 0 30px ${vaultColor}60, 0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.6)`,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                  position: 'relative',
                  animation: 'textGlow 3s ease-in-out infinite alternate'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <Shield style={{
                    width: '24px',
                    height: '24px',
                    color: vaultColor,
                    filter: 'drop-shadow(0 0 10px currentColor)'
                  }} />
                  Deposit to {vault.name}
                  <Coins style={{
                    width: '24px',
                    height: '24px',
                    color: vaultColor,
                    filter: 'drop-shadow(0 0 10px currentColor)',
                    animation: 'spin 4s linear infinite'
                  }} />
                </div>
              </h2>

              {/* Enhanced Subtitle */}
              <div style={{ textAlign: 'center' }}>
                <p
                  className="modal-subtitle"
                  style={{
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.125rem)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '0.75rem',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}
                >
                  <DollarSign style={{ width: '20px', height: '20px', opacity: '0.8' }} />
                  Earn yield by providing liquidity to this vault
                  <Percent style={{ width: '20px', height: '20px', opacity: '0.8' }} />
                </p>
                
                {/* Trust Indicators */}
                <div className="trust-indicators" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  fontSize: '0.875rem',
                  opacity: '0.8',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px', color: '#22c55e' }} />
                    <span>Audited</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
                    <span>Secure</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap style={{ width: '16px', height: '16px', color: vaultColor }} />
                    <span>{(vault.apy * 100).toFixed(1)}% APY</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4" style={{ color: '#ffffff' }}>
              {/* Transaction Flow Section - Simplified Layout */}
              <div className="transaction-flow-container mb-4">
                <div className="space-y-4">
                  
                  {/* You will deposit */}
                  <div className="transaction-side p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.08) !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    backdropFilter: 'blur(8px) !important',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1) !important'
                  }}>
                    <h3 className="transaction-flow-section-title text-lg font-bold mb-4 opacity-90">You will deposit</h3>
                    <div className="amount-input-card relative">
                      <input
                        id="deposit-amount"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        style={{
                          color: '#ffffff',
                          fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                          fontWeight: '800',
                          textAlign: 'left',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          width: '100%',
                          fontFamily: 'inherit',
                          padding: '0',
                          margin: '0'
                        }}
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xl font-bold opacity-80">{selectedToken || primaryToken?.symbol || 'SEI'}</span>
                    </div>
                    <div className="text-sm opacity-60 mt-2">Balance: {currentUserBalance.amount.toFixed(4)} {selectedToken || 'SEI'}</div>
                  </div>

                  {/* SHARE CALCULATION UI HIDDEN - Share calculations not working as expected */}
                  {/* Arrow - Centered between sections */}
                  {/* <div className="transaction-flow-arrow-wrapper flex justify-center py-2">
                    <div className="arrow-container w-10 h-10 rounded-full flex items-center justify-center" style={{
                      backgroundColor: `${vaultColor}20`,
                      border: `1px solid ${vaultColor}40`
                    }}>
                      <ArrowRight className="w-5 h-5" style={{ color: vaultColor }} />
                    </div>
                  </div> */}

                  {/* You will receive - HIDDEN: Share calculations not displaying as expected */}
                  {/* <div className="transaction-side p-6 rounded-2xl" style={{
                    background: 'rgba(255, 255, 255, 0.08) !important',
                    border: '1px solid rgba(255, 255, 255, 0.12) !important',
                    backdropFilter: 'blur(8px) !important',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1) !important'
                  }}>
                    <h3 className="transaction-flow-section-title text-lg font-bold mb-4 opacity-90">You will receive</h3>
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{
                        color: vaultColor,
                        fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                        fontWeight: '800',
                        marginBottom: '4px',
                        lineHeight: '1.2'
                      }}>
                        {depositAmount && parseFloat(depositAmount) > 0
                          ? parseFloat(depositAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '0.00'
                        }
                      </div>
                      <div style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        opacity: '0.9'
                      }}>{vault.name} Shares</div>
                    </div>
                    <div className="text-sm opacity-60 mt-2">
                      Rate: 1 {primaryToken?.symbol || 'Token'} ≈ 1 share
                    </div>
                  </div> */}

                </div>
              </div>

              {/* Preset Amount Cards - Compact Layout */}
              <div className="quick-deposit-section" style={{ marginBottom: '16px' }}>
                <div className="quick-deposit-label" style={{
                  display: 'block',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '12px',
                  opacity: '0.9',
                  color: '#ffffff'
                }}>Quick deposit amounts</div>
                <div className="quick-deposit-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px'
                }}>
                  {[1, 5, 10, 14.83].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDepositAmount(amount.toString())}
                      className="quick-deposit-button"
                      style={{
                        background: depositAmount === amount.toString()
                          ? `linear-gradient(135deg, ${vaultColor}20, ${vaultColor}10)`
                          : 'rgba(255, 255, 255, 0.08)',
                        border: depositAmount === amount.toString()
                          ? `2px solid ${vaultColor}`
                          : '1px solid rgba(255, 255, 255, 0.12)',
                        backdropFilter: 'blur(8px)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        padding: '12px',
                        borderRadius: '12px',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        width: '100%',
                        fontFamily: 'inherit',
                        display: 'block'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <div className="quick-deposit-amount" style={{
                        color: depositAmount === amount.toString() ? vaultColor : '#ffffff',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        marginBottom: '2px'
                      }}>
                        {amount} {selectedToken || primaryToken?.symbol || 'SEI'}
                      </div>
                      {/* HIDDEN: Share preview not displaying correctly */}
                      {/* <div className="quick-deposit-shares" style={{
                        color: '#ffffff',
                        opacity: '0.6',
                        fontSize: '0.8rem'
                      }}>
                        ~{amount.toLocaleString()} shares
                      </div> */}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contract Limitation Warning */}
              <div className="important-notice" style={{
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 193, 7, 0.08))',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Info style={{ width: '20px', height: '20px', color: '#ffc107' }} />
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>Important Notice</span>
                </div>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5',
                  margin: '0 0 12px 0'
                }}>
                  <strong>Token Requirements:</strong> {requirementText}
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5',
                  margin: '0 0 12px 0'
                }}>
                  <strong>Your Balance:</strong> {currentUserBalance.amount.toFixed(4)} {primaryToken?.symbol || 'tokens'}
                  {currentUserBalance.isLoading && ' (Loading...)'}
                </p>
                {needsApproval && !isApprovalConfirmed && (
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 193, 7, 1)',
                    lineHeight: '1.5',
                    margin: '0 0 12px 0',
                    fontWeight: '600'
                  }}>
                    <strong>⚠️ Approval Required:</strong> You need to approve the vault contract to spend your {tokenInfo?.symbol} tokens before depositing. Click &ldquo;Approve {tokenInfo?.symbol}&rdquo; button below.
                  </p>
                )}
                <p style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.4',
                  margin: '0'
                }}>
                  {primaryToken?.isNative
                    ? 'This vault accepts native SEI deposits directly from your wallet.'
                    : `This vault requires ${primaryToken?.symbol} tokens. ${needsApproval ? 'You will need to approve token spending in a separate transaction before depositing.' : 'Make sure you have sufficient balance.'}`
                  }
                </p>
              </div>

              {/* Enhanced Yield Display */}
              <div className="apy-info-section" style={{
                background: `linear-gradient(135deg, ${vaultColor}15, ${vaultColor}08)`,
                border: `1px solid ${vaultColor}30`,
                backdropFilter: 'blur(12px)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px ${vaultColor}10`,
                borderRadius: '16px',
                padding: '12px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background gradient accent */}
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  width: '100px',
                  height: '100px',
                  background: `radial-gradient(circle, ${vaultColor}20 0%, transparent 70%)`,
                  borderRadius: '50%',
                  transform: 'translate(30px, -30px)'
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', position: 'relative' }}>
                  <div style={{ flex: '1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Info style={{ width: '20px', height: '20px', opacity: '0.7', color: vaultColor }} />
                      <span className="apy-label" style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        opacity: '0.9',
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>Annual Percentage Yield</span>
                    </div>
                    <div
                      className="apy-display-large"
                      style={{
                      color: vaultColor,
                      textShadow: `0 0 20px ${vaultColor}40, 0 2px 4px rgba(0,0,0,0.4)`,
                      fontSize: '3rem',
                      fontWeight: '900',
                      lineHeight: '1',
                      letterSpacing: '-0.02em',
                      fontFamily: 'inherit'
                    }}>
                      {(vault.apy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', paddingLeft: '24px' }}>
                    <div className="apy-daily-label" style={{
                      fontSize: '0.8rem',
                      opacity: '0.7',
                      marginBottom: '2px',
                      color: '#ffffff',
                      fontWeight: '500'
                    }}>Expected daily</div>
                    <div className="apy-daily" style={{
                      color: vaultColor,
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      textShadow: `0 0 10px ${vaultColor}30`
                    }}>
                      ~{((vault.apy / 365) * 100).toFixed(3)}%
                    </div>
                  </div>
                </div>


                <div className="apy-meta" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield style={{ 
                        width: '16px', 
                        height: '16px', 
                        color: riskLevel === 'Low' ? '#22c55e' : riskLevel === 'Medium' ? '#f59e0b' : '#ef4444'
                      }} />
                      <span style={{ 
                        color: '#ffffff', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>{riskLevel} Risk</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ 
                        color: '#ffffff', 
                        fontWeight: '600',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}>{formatCurrency(vault.tvl)} TVL</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    opacity: '0.6',
                    color: '#ffffff',
                    fontWeight: '500',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    {vault.strategy.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Status Section */}
          {(transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') && (
            <div style={{
              padding: '1rem 1.5rem',
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              margin: '1rem 0 0 0',
              borderRadius: '12px 12px 0 0',
            }}>
              {transactionStatus === 'pending' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ffffff',
                  fontWeight: '600',
                }}>
                  <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                  <span>Transaction is being processed...</span>
                </div>
              )}

              {transactionStatus === 'success' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#22c55e',
                  fontWeight: '600',
                }}>
                  <CheckCircle2 style={{ width: '20px', height: '20px' }} />
                  <span>Transaction successful!</span>
                  {transactionHash && (
                    <span style={{ fontSize: '0.875rem', opacity: '0.8', marginLeft: '0.5rem' }}>
                      Hash: {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}
                    </span>
                  )}
                </div>
              )}

              {transactionStatus === 'error' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ef4444',
                  fontWeight: '600',
                }}>
                  <Info style={{ width: '20px', height: '20px' }} />
                  <span>Transaction failed</span>
                  {errorMessage && (
                    <span style={{ fontSize: '0.875rem', opacity: '0.8', marginLeft: '0.5rem' }}>
                      {errorMessage}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fixed Action Buttons at Bottom */}
          <div
            className="modal-footer"
            style={{
              flexShrink: 0,
              padding: '0.75rem 1rem 1rem 1rem',
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 80%, transparent 100%)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0 0 24px 24px'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={handleClose}
                disabled={depositMutation.isPending || transactionStatus === 'pending'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {transactionStatus === 'success' ? 'Close' : 'Cancel'}
              </button>
              {/* Show Approve button if ERC20 token needs approval */}
              {needsApproval && !isApprovalConfirmed ? (
                <button
                  onClick={handleApprove}
                  disabled={!isValidAmount || isApproving || isApprovalConfirming}
                  style={{
                    background: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`,
                    border: 'none',
                    color: '#000000',
                    borderRadius: '16px',
                    boxShadow: `0 12px 40px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isApproving || isApprovalConfirming ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                      {isApprovalConfirming ? 'Confirming...' : 'Approving...'}
                    </>
                  ) : (
                    <>
                      <Shield style={{ width: '20px', height: '20px' }} />
                      Approve {tokenInfo?.symbol || 'Token'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={transactionStatus === 'success' ? handleClose : handleDeposit}
                  disabled={!isValidAmount || depositMutation.isPending || transactionStatus === 'pending' || (needsApproval && !isApprovalConfirmed)}
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor} 0%, ${vaultColor}dd 100%)`,
                    border: 'none',
                    color: '#000000',
                    borderRadius: '16px',
                    boxShadow: `0 12px 40px ${vaultColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (!isValidAmount || (needsApproval && !isApprovalConfirmed)) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {depositMutation.isPending || transactionStatus === 'pending' ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                      {transactionStatus === 'pending' ? 'Processing...' : 'Deposit Now'}
                    </>
                  ) : transactionStatus === 'success' ? (
                    <>
                      <CheckCircle2 style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                      Success!
                    </>
                  ) : transactionStatus === 'error' ? (
                    <>
                      <Info style={{ width: '20px', height: '20px', color: '#ef4444' }} />
                      Error
                    </>
                  ) : (
                    'Deposit Now'
                  )}
                </button>
              )}
            </div>
          </div>
      </div>
    </div>
    </>
  );
}
