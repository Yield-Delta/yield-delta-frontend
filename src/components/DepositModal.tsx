"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ArrowRight, Info, Shield, TrendingUp, Vault, DollarSign, CheckCircle2, Zap, X } from 'lucide-react';
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
import styles from './DepositModal.module.css';

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

const restoreBodyScroll = () => {
  const scrollY = document.body.dataset.scrollY;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  delete document.body.dataset.scrollY;

  if (!scrollY) return;

  try {
    window.scrollTo(0, parseInt(scrollY, 10));
  } catch (error) {
    console.warn('[DepositModal] Unable to restore scroll position:', error);
  }
}

export default function DepositModal({ vault, isOpen, onClose, onSuccess }: DepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const openedAtRef = useRef(0);
  // Get actual wallet connection
  const { address, isConnected } = useAccount();

  const router = useRouter();

  // State for selected deposit token
  const [selectedToken, setSelectedToken] = useState<string>('');

  // Approval state
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if ((depositMutation.isPending || depositMutation.isConfirming) && transactionStatus !== 'pending') {
      console.log('[DepositModal] Transaction pending...');
      setTransactionStatus('pending');
      setTransactionHash(null);
      setErrorMessage(null);
    }
  }, [depositMutation.isPending, depositMutation.isConfirming, transactionStatus]);

  // Watch for confirmed transaction success
  useEffect(() => {
    if (depositMutation.isConfirmed && depositMutation.hash && transactionStatus !== 'success') {
      console.log('[DepositModal] Transaction confirmed:', depositMutation.hash);
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
  }, [
    depositMutation.isConfirmed,
    depositMutation.hash,
    depositMutation.invalidateQueries,
    depositMutation.userBalance,
    transactionStatus,
    vault,
    router,
    onSuccess,
    handleClose,
  ]);

  // Watch for transaction errors
  useEffect(() => {
    const activeError = depositMutation.isError ? depositMutation.error : depositMutation.receiptError;
    if ((depositMutation.isError || depositMutation.isReceiptError) && activeError && transactionStatus !== 'error') {
      console.error('[DepositModal] Transaction failed:', activeError);

      // Handle specific error cases
      const error = activeError;
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
  }, [
    depositMutation.isError,
    depositMutation.isReceiptError,
    depositMutation.error,
    depositMutation.receiptError,
    transactionStatus,
  ]);

  // Add effect to track when the modal should be opening + handle body scroll
  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now();
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
      restoreBodyScroll();
    }

    // Cleanup on unmount
    return () => {
      restoreBodyScroll();
    };
  }, [isOpen, vault]);

  // Don't render if vault is null or modal is not open
  if (!mounted || !isOpen || !vault) {
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
  
  const tokenSymbol = selectedToken || primaryToken?.symbol || 'SEI';
  const projectedDaily = isValidAmount ? (parseFloat(depositAmount) * vault.apy / 365) : 0;
  const actionDisabled = !isValidAmount || depositMutation.isPending || depositMutation.isConfirming || transactionStatus === 'pending' || (needsApproval && !isApprovalConfirmed);

  const modalContent = (
    <div
      className={`${styles.overlay} deposit-modal-container`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000000,
        isolation: 'isolate',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 28px)',
        background: 'rgba(2, 3, 10, 0.84)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
      }}
      onClick={(e) => {
        console.log('[DepositModal] Backdrop clicked');
        if (Date.now() - openedAtRef.current < 500) {
          return;
        }
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      data-testid="modal-backdrop"
    >
      <style jsx global>{`
        .deposit-modal-container {
          min-height: 100dvh;
          font-family: var(--font-sans), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .deposit-modal-content {
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          width: min(590px, calc(100vw - 24px));
          max-height: min(90dvh, 760px);
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background:
            linear-gradient(180deg, rgba(12, 15, 28, 0.98), rgba(5, 7, 16, 0.98)),
            #060711;
          color: white;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.04),
            0 34px 130px rgba(0, 0, 0, 0.86);
          font-family: var(--font-sans), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .deposit-modal-content * {
          box-sizing: border-box;
          font-family: inherit;
        }

        .deposit-modal-container .modal-scrollable-content {
          position: relative;
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 1.25rem 1.25rem 1rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
        }

        .deposit-modal-container .modal-header-section {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .deposit-modal-container .modal-heading-cluster {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 0.8rem;
        }

        .deposit-modal-container .modal-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 0.65rem;
        }

        .deposit-modal-container .modal-title {
          margin: 0;
          color: rgba(255, 255, 255, 0.94);
          font-family: var(--font-display), var(--font-sans), ui-sans-serif, system-ui, sans-serif;
          font-size: clamp(1.45rem, 2.6vw, 2rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: 0;
        }

        .deposit-modal-container .modal-subtitle {
          margin-top: 0.45rem;
          color: rgba(255, 255, 255, 0.48);
          font-size: 0.88rem;
          line-height: 1.4;
          text-transform: capitalize;
        }

        .deposit-modal-container .modal-badge {
          display: inline-flex;
          align-items: center;
          min-height: 1.55rem;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.6rem;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 0.64rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .deposit-modal-container .modal-close-button {
          display: flex;
          height: 2.5rem;
          width: 2.5rem;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.64);
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }

        .deposit-modal-container .modal-close-button:hover {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .deposit-modal-container .evm-vault-icon {
          display: flex;
          height: 3rem;
          width: 3rem;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .deposit-modal-container .evm-metric-card,
        .deposit-modal-container .transaction-side,
        .deposit-modal-container .important-notice,
        .deposit-modal-container .apy-info-section,
        .deposit-modal-container .evm-info-tile {
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.045);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
        }

        .deposit-modal-container .evm-metric-card {
          min-width: 0;
          padding: 0.8rem;
        }

        .deposit-modal-container .evm-metrics-grid,
        .deposit-modal-container .evm-info-grid,
        .deposit-modal-container .modal-footer-grid {
          display: grid;
          gap: 0.65rem;
        }

        .deposit-modal-container .evm-metrics-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 1rem;
        }

        .deposit-modal-container .evm-info-grid,
        .deposit-modal-container .modal-footer-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .deposit-modal-container .evm-info-grid {
          margin-bottom: 1rem;
        }

        .deposit-modal-container .evm-metric-label {
          margin: 0 0 0.35rem;
          color: rgba(255, 255, 255, 0.36);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .deposit-modal-container .evm-metric-value {
          margin: 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.9);
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .deposit-modal-container .transaction-side,
        .deposit-modal-container .important-notice {
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .deposit-modal-container .amount-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: rgba(255, 255, 255, 0.56);
          font-size: 0.88rem;
          line-height: 1.25;
        }

        .deposit-modal-container .amount-label-row span:last-child {
          min-width: 0;
          overflow: hidden;
          text-align: right;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .deposit-modal-container .amount-input-card {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          min-height: 4.4rem;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.18);
          padding: 0.85rem 0.9rem;
        }

        .deposit-modal-container .evm-deposit-amount {
          min-width: 0;
          flex: 1;
          border: 0;
          background: transparent;
          color: rgba(255, 255, 255, 0.96);
          font-family: var(--font-display), var(--font-sans), system-ui, sans-serif;
          font-size: clamp(2.25rem, 6vw, 3.6rem);
          font-weight: 800;
          line-height: 0.95;
          outline: none;
        }

        .deposit-modal-container .evm-deposit-amount::placeholder {
          color: rgba(255, 255, 255, 0.16);
        }

        .deposit-modal-container .token-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 3.4rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 0.55rem 0.7rem;
          font-size: 0.86rem;
          font-weight: 800;
        }

        .deposit-modal-container .quick-deposit-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .deposit-modal-container .quick-deposit-button {
          min-height: 2.5rem;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(255, 255, 255, 0.055);
          color: rgba(255, 255, 255, 0.68);
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 0.78rem;
          font-weight: 700;
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
        }

        .deposit-modal-container .quick-deposit-button:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.09);
          color: white;
        }

        .deposit-modal-container .evm-info-tile {
          display: flex;
          min-height: 4.75rem;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem;
        }

        .deposit-modal-container .evm-info-icon {
          display: flex;
          height: 2.35rem;
          width: 2.35rem;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.065);
          color: #6ee7d8;
        }

        .deposit-modal-container .evm-info-label {
          margin: 0;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.76rem;
          line-height: 1.2;
        }

        .deposit-modal-container .evm-info-value {
          margin: 0.2rem 0 0;
          overflow: hidden;
          color: rgba(255, 255, 255, 0.88);
          font-size: 0.9rem;
          font-weight: 700;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .deposit-modal-container .important-notice h3 {
          margin: 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .deposit-modal-container .important-notice p {
          margin: 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .deposit-modal-container .apy-info-section {
          padding: 1rem;
          overflow: hidden;
        }

        .deposit-modal-container .apy-info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .deposit-modal-container .apy-label-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.58);
          font-size: 0.88rem;
          font-weight: 700;
        }

        .deposit-modal-container .apy-performance {
          color: rgba(255, 255, 255, 0.52);
          font-size: 0.86rem;
          line-height: 1.7;
          text-align: right;
          white-space: nowrap;
        }

        .deposit-modal-container .apy-info-section p {
          margin: 0;
        }

        .deposit-modal-container .apy-display-large {
          display: block;
          margin-top: 0.35rem;
          font-family: var(--font-display), var(--font-sans), system-ui, sans-serif;
          font-size: clamp(2rem, 5vw, 2.7rem);
          font-weight: 900;
          line-height: 0.95;
        }

        .deposit-modal-container .modal-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.09);
          background: rgba(0, 0, 0, 0.38);
          padding: 0.85rem;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        .deposit-modal-container .modal-footer button {
          min-height: 3rem;
          border-radius: 16px;
          border: 0;
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          cursor: pointer;
        }

        .deposit-modal-container .modal-cancel-button {
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.74);
        }

        .deposit-modal-container .modal-primary-button {
          color: #03110f;
          box-shadow: 0 16px 38px rgba(0, 245, 212, 0.18);
        }

        .deposit-modal-container .modal-approve-button {
          display: flex;
          min-height: 3rem;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 16px;
          background: #fbbf24;
          color: #080603;
          font-weight: 900;
        }

        .deposit-modal-container .transaction-status-panel {
          margin-top: 1rem;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.25);
          padding: 0.8rem;
        }

        .deposit-modal-container .transaction-status-row {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255, 255, 255, 0.88);
          font-size: 0.88rem;
          font-weight: 700;
        }

        @media (max-width: 640px) {
          .deposit-modal-container .evm-deposit-panel {
            width: 100%;
            max-height: 92dvh;
            border-radius: 24px;
          }
          .deposit-modal-container .evm-deposit-body {
            max-height: calc(92dvh - 92px);
            padding: 1rem;
          }
          .deposit-modal-container .evm-deposit-title {
            font-size: 1.35rem;
          }
          .deposit-modal-container .evm-deposit-amount {
            font-size: 2.65rem;
          }

          .deposit-modal-container .evm-metrics-grid,
          .deposit-modal-container .evm-info-grid,
          .deposit-modal-container .modal-footer-grid {
            gap: 0.5rem;
          }

          .deposit-modal-container .apy-info-row {
            align-items: flex-start;
          }
        }
      `}</style>

      <div
        className={`${styles.panel} deposit-modal-content`}
        style={{
          '--accent': vaultColor,
          boxShadow: `0 0 0 1px ${vaultColor}24, 0 34px 130px rgba(0,0,0,0.86), 0 0 80px ${vaultColor}24`,
        } as React.CSSProperties}
        onClick={(e) => {
          console.log('[DepositModal] Modal content clicked - preventing propagation');
          e.stopPropagation();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
      >
        <div className={styles.topRule} />
        <div className={styles.ambientGlow} />
        <div className={styles.texture} />

        <div className={`${styles.body} modal-scrollable-content`}>
          <div className={styles.grabber} />

          <header className={`${styles.header} modal-header-section`}>
            <div className={`${styles.headingCluster} modal-heading-cluster`}>
              <div
                className={`${styles.vaultIcon} evm-vault-icon`}
                style={{
                  borderColor: `${vaultColor}45`,
                }}
              >
                <Vault className="h-6 w-6" style={{ color: vaultColor }} />
              </div>
              <div className="min-w-0">
                <div className={`${styles.badgeRow} modal-badge-row`}>
                  <span className={`${styles.badge} modal-badge`}>
                    EVM Vault
                  </span>
                  <span
                    className={`${styles.badge} modal-badge`}
                    style={{ borderColor: `${vaultColor}38`, color: vaultColor, background: `${vaultColor}16` }}
                  >
                    {riskLevel} Risk
                  </span>
                </div>
                <h2 id="deposit-modal-title" className={`${styles.title} modal-title`}>
                  Deposit to {vault.name}
                </h2>
                <p className={`${styles.subtitle} modal-subtitle`}>
                  {vault.strategy.replace(/_/g, ' ')} · {vault.tokenA}/{vault.tokenB}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={depositMutation.isPending || depositMutation.isConfirming || transactionStatus === 'pending'}
              aria-label="Close deposit modal"
              className={`${styles.closeButton} modal-close-button`}
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <section className={`${styles.metricsGrid} evm-metrics-grid`}>
            <MetricCard label="APY" value={`${(vault.apy * 100).toFixed(1)}%`} color={vaultColor} />
            <MetricCard label="TVL" value={`$${formatCurrency(vault.tvl)}`} />
            <MetricCard label="Fee" value={`${(vault.fee / 10000).toFixed(2)}%`} />
          </section>

          <section className={`${styles.depositCard} transaction-side`}>
            <div className={`${styles.amountLabelRow} amount-label-row`}>
              <span>Deposit amount</span>
              <span className={styles.balanceText}>
                Balance {currentUserBalance.amount.toFixed(4)} {tokenSymbol}
                {currentUserBalance.isLoading && ' · loading'}
              </span>
            </div>

            <div className={`${styles.amountInputCard} amount-input-card`}>
              <input
                id="deposit-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className={`${styles.amountInput} evm-deposit-amount`}
              />
              <span
                className={`${styles.tokenPill} token-pill`}
                style={{ borderColor: `${vaultColor}38`, background: `${vaultColor}16`, color: vaultColor }}
              >
                {tokenSymbol}
              </span>
            </div>

            <div className={`${styles.quickGrid} quick-deposit-grid`}>
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => {
                    const amount = Math.max(0, currentUserBalance.amount * ratio);
                    setDepositAmount(amount > 0 ? amount.toFixed(4) : ratio === 1 ? currentUserBalance.amount.toString() : '');
                  }}
                  className={`${styles.quickButton} quick-deposit-button`}
                >
                  {ratio === 1 ? 'MAX' : `${Math.round(ratio * 100)}%`}
                </button>
              ))}
            </div>
          </section>

          <section className={`${styles.infoGrid} evm-info-grid`}>
            <InfoTile icon={<DollarSign className="h-4 w-4" />} label="Token Rule" value={requirementText} />
            <InfoTile icon={<TrendingUp className="h-4 w-4" />} label="Daily Estimate" value={`~${(projectedDaily * 100).toFixed(3)}%`} />
          </section>

          <section className={`${styles.notice} important-notice`}>
            <div className={styles.noticeHeader}>
              <Shield className="h-5 w-5" style={{ color: needsApproval ? '#f59e0b' : '#10b981' }} />
              <h3 className={styles.noticeTitle}>Transaction readiness</h3>
            </div>
            <p className={styles.noticeText}>
              {primaryToken?.isNative
                ? 'This vault accepts native SEI deposits directly from your wallet.'
                : `This vault requires ${primaryToken?.symbol || tokenSymbol}. ${needsApproval ? 'Approve token spending before depositing.' : 'Allowance is ready for this amount.'}`}
            </p>
            {needsApproval && !isApprovalConfirmed && (
              <p className={styles.approvalNote}>
                Approval required for {tokenInfo?.symbol || 'this token'} before the deposit transaction.
              </p>
            )}
          </section>

          <section className={`${styles.apyCard} apy-info-section`} style={{ borderColor: `${vaultColor}30`, background: `linear-gradient(135deg, ${vaultColor}12, rgba(255,255,255,0.035))` }}>
            <div className={`${styles.apyRow} apy-info-row`}>
              <div>
                <div className={`${styles.apyLabelRow} apy-label-row`}>
                  <Zap className="h-4 w-4" style={{ color: vaultColor }} />
                  Annual Percentage Yield
                </div>
                <strong className={`${styles.apyValue} apy-display-large`} style={{ color: vaultColor }}>
                  {(vault.apy * 100).toFixed(1)}%
                </strong>
              </div>
              <div className={`${styles.performance} apy-performance`}>
                <p className={styles.performanceTitle}>Performance</p>
                <p>Sharpe {vault.performance.sharpeRatio.toFixed(2)}</p>
                <p>Win {vault.performance.winRate.toFixed(0)}%</p>
              </div>
            </div>
          </section>

          {(transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') && (
            <section className={`${styles.statusPanel} transaction-status-panel`}>
              {transactionStatus === 'pending' && (
                <div className={`${styles.statusRow} transaction-status-row`}>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isApproving || isApprovalConfirming ? 'Approval is being processed...' : depositMutation.isConfirming ? 'Waiting for confirmation...' : 'Transaction is being processed...'}</span>
                </div>
              )}

              {transactionStatus === 'success' && (
                <div className={`${styles.statusRow} transaction-status-row`}>
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Transaction successful!</span>
                  {transactionHash && <span className="truncate text-xs opacity-75">{transactionHash}</span>}
                </div>
              )}

              {transactionStatus === 'error' && (
                <div className={`${styles.statusRow} transaction-status-row`}>
                  <Info className="h-5 w-5 shrink-0" />
                  <div className="min-w-0">
                    <p>Transaction failed</p>
                    {errorMessage && <p className="mt-1 truncate text-xs font-medium opacity-75">{errorMessage}</p>}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <footer className={`${styles.footer} modal-footer`}>
          <div className={`${styles.footerGrid} modal-footer-grid`}>
            <button
              onClick={handleClose}
              disabled={depositMutation.isPending || depositMutation.isConfirming || transactionStatus === 'pending'}
              className={`${styles.cancelButton} modal-cancel-button`}
            >
              {transactionStatus === 'success' ? 'Close' : 'Cancel'}
            </button>

            {needsApproval && !isApprovalConfirmed ? (
              <button
                onClick={handleApprove}
                disabled={!isValidAmount || isApproving || isApprovalConfirming}
                className={`${styles.approveButton} modal-approve-button`}
              >
                {isApproving || isApprovalConfirming ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {isApprovalConfirming ? 'Confirming...' : 'Approving...'}
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Approve {tokenInfo?.symbol || 'Token'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={transactionStatus === 'success' ? handleClose : handleDeposit}
                disabled={actionDisabled}
                className={`${styles.primaryButton} modal-primary-button`}
                style={{ background: `linear-gradient(135deg, ${vaultColor}, #10b981)`, boxShadow: `0 16px 40px ${vaultColor}32` }}
              >
                {depositMutation.isPending || depositMutation.isConfirming || transactionStatus === 'pending' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {depositMutation.isConfirming ? 'Confirming...' : 'Processing...'}
                  </>
                ) : transactionStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Success!
                  </>
                ) : transactionStatus === 'error' ? (
                  <>
                    <Info className="h-5 w-5" />
                    Error
                  </>
                ) : (
                  <>
                    Deposit Now
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={`${styles.metricCard} evm-metric-card`}>
      <p className={`${styles.metricLabel} evm-metric-label`}>{label}</p>
      <p className={`${styles.metricValue} evm-metric-value`} style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={`${styles.infoTile} evm-info-tile`}>
      <div className={`${styles.infoIcon} evm-info-icon`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`${styles.infoLabel} evm-info-label`}>{label}</p>
        <p className={`${styles.infoValue} evm-info-value`}>{value}</p>
      </div>
    </div>
  );
}
