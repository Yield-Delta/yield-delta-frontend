"use client"

import React, { useState, useEffect, useCallback } from 'react';
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
      className="fixed inset-0 z-[10000000] flex items-end justify-center bg-[#02030a]/82 px-0 backdrop-blur-xl sm:items-center sm:px-4 deposit-modal-container"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000000,
        isolation: 'isolate',
      }}
      onClick={(e) => {
        console.log('[DepositModal] Backdrop clicked');
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      data-testid="modal-backdrop"
    >
      <style jsx>{`
        @media (max-width: 640px) {
          .evm-deposit-panel {
            width: 100%;
            max-height: 94dvh;
            border-radius: 28px 28px 0 0;
          }
          .evm-deposit-body {
            max-height: calc(94dvh - 92px);
            padding: 1rem;
          }
          .evm-deposit-title {
            font-size: 1.35rem;
          }
          .evm-deposit-amount {
            font-size: 2.65rem;
          }
        }
      `}</style>

      <div
        className="evm-deposit-panel relative flex w-full max-w-[590px] flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#060711] text-white shadow-[0_-28px_90px_rgba(0,0,0,0.72)] sm:max-h-[88dvh] sm:rounded-[30px] sm:shadow-[0_34px_130px_rgba(0,0,0,0.86)] deposit-modal-content"
        style={{
          boxShadow: `0 0 0 1px ${vaultColor}24, 0 34px 130px rgba(0,0,0,0.86), 0 0 80px ${vaultColor}24`,
        }}
        onClick={(e) => {
          console.log('[DepositModal] Modal content clicked - preventing propagation');
          e.stopPropagation();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="deposit-modal-title"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${vaultColor}, #10b981, transparent)` }} />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl" style={{ background: `${vaultColor}24` }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.075]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />

        <div className="evm-deposit-body modal-scrollable-content relative flex-1 overflow-y-auto px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20 sm:hidden" />

          <header className="mb-5 flex items-start justify-between gap-4 modal-header-section">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  background: `linear-gradient(135deg, ${vaultColor}2e, rgba(16,185,129,0.08))`,
                  borderColor: `${vaultColor}45`,
                  boxShadow: `0 16px 38px ${vaultColor}20`,
                }}
              >
                <Vault className="h-6 w-6" style={{ color: vaultColor }} />
              </div>
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-300">
                    EVM Vault
                  </span>
                  <span
                    className="rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em]"
                    style={{ borderColor: `${vaultColor}38`, color: vaultColor, background: `${vaultColor}16` }}
                  >
                    {riskLevel} Risk
                  </span>
                </div>
                <h2 id="deposit-modal-title" className="evm-deposit-title text-balance text-2xl font-bold leading-tight text-white modal-title" style={{ fontFamily: 'var(--font-display)' }}>
                  Deposit to {vault.name}
                </h2>
                <p className="mt-1 text-sm text-white/45 modal-subtitle">
                  {vault.strategy.replace(/_/g, ' ')} · {vault.tokenA}/{vault.tokenB}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={depositMutation.isPending || depositMutation.isConfirming || transactionStatus === 'pending'}
              aria-label="Close deposit modal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <section className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
            <MetricCard label="APY" value={`${(vault.apy * 100).toFixed(1)}%`} color={vaultColor} />
            <MetricCard label="TVL" value={`$${formatCurrency(vault.tvl)}`} />
            <MetricCard label="Fee" value={`${(vault.fee / 10000).toFixed(2)}%`} />
          </section>

          <section className="mb-4 rounded-3xl border border-white/10 bg-white/[0.045] p-4 transaction-side">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-white/60">Deposit amount</span>
              <span className="truncate text-right text-white/45">
                Balance {currentUserBalance.amount.toFixed(4)} {tokenSymbol}
                {currentUserBalance.isLoading && ' · loading'}
              </span>
            </div>

            <div className="flex items-end gap-3 amount-input-card">
              <input
                id="deposit-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="evm-deposit-amount min-w-0 flex-1 bg-transparent text-5xl font-bold leading-none text-white outline-none placeholder:text-white/18"
                style={{ fontFamily: 'var(--font-display)' }}
              />
              <span
                className="mb-1 rounded-2xl border px-3 py-2 text-sm font-bold"
                style={{ borderColor: `${vaultColor}38`, background: `${vaultColor}16`, color: vaultColor }}
              >
                {tokenSymbol}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 quick-deposit-grid">
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => {
                    const amount = Math.max(0, currentUserBalance.amount * ratio);
                    setDepositAmount(amount > 0 ? amount.toFixed(4) : ratio === 1 ? currentUserBalance.amount.toString() : '');
                  }}
                  className="quick-deposit-button min-h-10 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {ratio === 1 ? 'MAX' : `${Math.round(ratio * 100)}%`}
                </button>
              ))}
            </div>
          </section>

          <section className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
            <InfoTile icon={<DollarSign className="h-4 w-4" />} label="Token Rule" value={requirementText} />
            <InfoTile icon={<TrendingUp className="h-4 w-4" />} label="Daily Estimate" value={`~${(projectedDaily * 100).toFixed(3)}%`} />
          </section>

          <section className="mb-4 rounded-3xl border border-white/10 bg-white/[0.035] p-4 important-notice">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: needsApproval ? '#f59e0b' : '#10b981' }} />
              <h3 className="font-bold text-white">Transaction readiness</h3>
            </div>
            <p className="text-sm leading-6 text-white/55">
              {primaryToken?.isNative
                ? 'This vault accepts native SEI deposits directly from your wallet.'
                : `This vault requires ${primaryToken?.symbol || tokenSymbol}. ${needsApproval ? 'Approve token spending before depositing.' : 'Allowance is ready for this amount.'}`}
            </p>
            {needsApproval && !isApprovalConfirmed && (
              <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm font-semibold text-amber-200">
                Approval required for {tokenInfo?.symbol || 'this token'} before the deposit transaction.
              </p>
            )}
          </section>

          <section className="rounded-3xl border p-4 apy-info-section" style={{ borderColor: `${vaultColor}30`, background: `linear-gradient(135deg, ${vaultColor}12, rgba(255,255,255,0.035))` }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/58">
                  <Zap className="h-4 w-4" style={{ color: vaultColor }} />
                  Annual Percentage Yield
                </div>
                <strong className="block text-4xl leading-none apy-display-large" style={{ color: vaultColor, fontFamily: 'var(--font-display)' }}>
                  {(vault.apy * 100).toFixed(1)}%
                </strong>
              </div>
              <div className="text-right text-sm text-white/50">
                <p className="font-semibold text-white/80">Performance</p>
                <p>Sharpe {vault.performance.sharpeRatio.toFixed(2)}</p>
                <p>Win {vault.performance.winRate.toFixed(0)}%</p>
              </div>
            </div>
          </section>

          {(transactionStatus === 'pending' || transactionStatus === 'success' || transactionStatus === 'error') && (
            <section className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
              {transactionStatus === 'pending' && (
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{isApproving || isApprovalConfirming ? 'Approval is being processed...' : depositMutation.isConfirming ? 'Waiting for confirmation...' : 'Transaction is being processed...'}</span>
                </div>
              )}

              {transactionStatus === 'success' && (
                <div className="flex min-w-0 items-center gap-3 text-sm font-semibold text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>Transaction successful!</span>
                  {transactionHash && <span className="truncate text-xs opacity-75">{transactionHash}</span>}
                </div>
              )}

              {transactionStatus === 'error' && (
                <div className="flex min-w-0 items-start gap-3 text-sm font-semibold text-red-300">
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

        <footer className="modal-footer relative shrink-0 border-t border-white/10 bg-black/45 p-4 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClose}
              disabled={depositMutation.isPending || depositMutation.isConfirming || transactionStatus === 'pending'}
              className="min-h-12 rounded-2xl border border-white/12 bg-white/[0.05] font-bold text-white/72 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {transactionStatus === 'success' ? 'Close' : 'Cancel'}
            </button>

            {needsApproval && !isApprovalConfirmed ? (
              <button
                onClick={handleApprove}
                disabled={!isValidAmount || isApproving || isApprovalConfirming}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 font-black text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 font-black text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
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
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className="truncate text-base font-bold text-white" style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-emerald-300">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/38">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}
