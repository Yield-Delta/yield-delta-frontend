"use client"

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, ArrowRight, Info, Shield, TrendingDown } from 'lucide-react';
import { useWriteContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatEther } from 'viem';
import { useAppStore } from '@/stores/appStore';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import SEIVault from '@/lib/abis/SEIVault';

interface VaultData {
  address: string;
  name: string;
  apy: number;
  tvl: number;
  strategy: string;
  tokenA: string;
  tokenB: string;
  fee: number;
}

interface WithdrawModalProps {
  vault: VaultData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txHash: string) => void;
  userShares?: string; // User's current shares in the vault
  userValue?: string; // Current value of user's position
  lockTimeRemaining?: string; // Seconds remaining until unlock (0 = unlocked)
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

// Utility function for formatting lock time - keeping for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formatLockTimeRemaining = (seconds: number): string => {
  if (seconds === 0) return 'Unlocked';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s remaining`;
  } else {
    return `${secs}s remaining`;
  }
}

export default function WithdrawModal({
  vault,
  isOpen,
  onClose,
  onSuccess,
  userShares = '0',
  userValue = '0',
  lockTimeRemaining = '0'
}: WithdrawModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const addNotification = useAppStore((state) => state.addNotification);

  // Fetch user's SEI balance for gas fee validation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _seiBalance = useTokenBalance('SEI');

  // Ensure component is mounted (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  const { writeContract, data: hash, error, isError } = useWriteContract();

  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2,
    timeout: 60_000,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[WithdrawModal] Modal opening with vault:', vault?.name);
      console.log('[WithdrawModal] Received userShares (Wei):', userShares);
      console.log('[WithdrawModal] Received userValue (Ether):', userValue);
      console.log('[WithdrawModal] Formatted shares display:', parseFloat(formatEther(BigInt(userShares))).toFixed(4));
      setWithdrawAmount('');
      setTransactionStatus('idle');
      setErrorMessage(null);
    } else {
      console.log('[WithdrawModal] Modal closed');
    }
  }, [isOpen, vault?.name, userShares, userValue]);

  // Handle transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      setTransactionStatus('success');
      addNotification({
        type: 'success',
        title: 'Withdrawal Successful',
        message: `Successfully withdrew from ${vault?.name}`,
      });
      onSuccess(hash);

      // Trigger page refresh to update vault position data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isConfirmed, hash, vault?.name, addNotification, onSuccess]);

  // Handle errors
  useEffect(() => {
    if (isError || isReceiptError) {
      // Determine which error to use
      const activeError = isError ? error : receiptError;

      console.error('[WithdrawModal] ❌ Transaction error detected:', {
        isError,
        isReceiptError,
        writeContractError: error,
        receiptError: receiptError,
        activeErrorMessage: activeError?.message,
        activeErrorName: activeError?.name,
        activeErrorCause: activeError?.cause,
        receipt: receipt,
        receiptStatus: receipt?.status
      });

      setTransactionStatus('error');

      let errorMsg = 'Withdrawal failed. Please try again.';

      // Check receipt status first - if status is 'reverted', the transaction failed on-chain
      if (receipt && receipt.status === 'reverted') {
        errorMsg = 'Transaction reverted on-chain. The withdrawal may have failed due to contract validation (insufficient shares, lock period, etc.)';
      } else if (activeError?.message) {
        const errorMessage = activeError.message;

        // Parse common error messages
        if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
          errorMsg = 'Transaction was rejected by user';
        } else if (errorMessage.includes('insufficient')) {
          errorMsg = 'Insufficient balance or shares';
        } else if (errorMessage.includes('execution reverted')) {
          // Try to extract revert reason
          const revertMatch = errorMessage.match(/reason="([^"]+)"/);
          if (revertMatch) {
            errorMsg = `Transaction reverted: ${revertMatch[1]}`;
          } else if (errorMessage.includes('locked') || errorMessage.includes('24 hours')) {
            errorMsg = 'Assets are still locked. Please wait 24 hours after your deposit.';
          } else if (errorMessage.includes('Insufficient shares')) {
            errorMsg = 'Insufficient shares to withdraw the requested amount.';
          } else if (errorMessage.includes('Invalid SEI chain')) {
            errorMsg = 'Please connect to SEI Testnet (Atlantic-2) to withdraw.';
          } else if (errorMessage.includes('Insufficient contract balance')) {
            errorMsg = 'Vault has insufficient balance. Please contact support.';
          } else {
            errorMsg = 'Transaction reverted. This may be due to: lock period not expired, insufficient shares, or wrong network.';
          }
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          errorMsg = `Transaction confirmation timed out. Check transaction status on block explorer: ${hash?.substring(0, 10)}...`;
        } else if (errorMessage.includes('TransactionReceiptNotFoundError')) {
          errorMsg = 'Transaction receipt not found. The transaction may still be pending or failed silently.';
        } else {
          // Truncate very long error messages
          errorMsg = errorMessage.length > 200 ? errorMessage.substring(0, 200) + '...' : errorMessage;
        }
      } else if (isReceiptError && !activeError) {
        // Receipt error with no error object - likely a reverted transaction
        errorMsg = 'Transaction failed. The withdrawal may have been reverted by the contract.';
      }

      setErrorMessage(errorMsg);
      addNotification({
        type: 'error',
        title: 'Withdrawal Failed',
        message: errorMsg,
      });
    }
  }, [isError, isReceiptError, error, receiptError, receipt, hash, addNotification]);

  if (!vault || !isOpen || !mounted) return null;

  const vaultColor = getVaultColor(vault.strategy);

  const handleWithdraw = async () => {
    if (!isConnected || !address) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setErrorMessage('Please enter a valid withdrawal amount');
      return;
    }

    const sharesInWei = parseUnits(withdrawAmount, 18);
    const userSharesInWei = BigInt(userShares);

    if (sharesInWei > userSharesInWei) {
      setErrorMessage('Insufficient shares. You cannot withdraw more than you own.');
      return;
    }

    // Check lock period before attempting transaction
    const lockSeconds = parseInt(lockTimeRemaining);
    if (lockSeconds > 0) {
      const hours = Math.floor(lockSeconds / 3600);
      const minutes = Math.floor((lockSeconds % 3600) / 60);
      setErrorMessage(`Assets are locked for 24 hours after deposit. Time remaining: ${hours}h ${minutes}m`);
      return;
    }

    try {
      setTransactionStatus('pending');
      setErrorMessage(null);

      console.log('[WithdrawModal] 🚀 Initiating withdrawal transaction:', {
        vaultAddress: vault.address,
        shares: sharesInWei.toString(),
        sharesInEther: withdrawAmount,
        owner: address,
        recipient: address,
        userSharesAvailable: userSharesInWei.toString(),
        hasEnoughShares: sharesInWei <= userSharesInWei
      });

      writeContract({
        address: vault.address as `0x${string}`,
        abi: SEIVault,
        functionName: 'seiOptimizedWithdraw',
        args: [sharesInWei, address as `0x${string}`, address as `0x${string}`],
      });

      console.log('[WithdrawModal] ✅ writeContract called successfully');
    } catch (err) {
      console.error('[WithdrawModal] ❌ Withdrawal error:', err);
      setTransactionStatus('error');
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
    }
  };

  const handleMaxWithdraw = () => {
    // Convert userShares from wei to ether for display
    const sharesInEther = formatEther(BigInt(userShares));
    setWithdrawAmount(sharesInEther);
  };

  // Debug: Log the conversion process
  console.log('[WithdrawModal] userShares string:', userShares);
  console.log('[WithdrawModal] userShares as BigInt:', BigInt(userShares).toString());
  console.log('[WithdrawModal] userShares formatted as Ether:', formatEther(BigInt(userShares)));

  const userSharesDisplay = parseFloat(formatEther(BigInt(userShares))).toFixed(4);
  const userValueDisplay = parseFloat(userValue).toFixed(2);

  const modalContent = (
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

        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }

        .withdraw-modal-container {
          width: 100vw !important;
          height: 100vh !important;
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
          box-sizing: border-box !important;
        }

        .withdraw-modal-content {
          width: 500px !important;
          max-width: 500px !important;
          min-width: 320px !important;
          max-height: 85vh !important;
          position: relative !important;
          margin: 0 !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
        }

        @media (max-width: 600px) {
          .withdraw-modal-container {
            padding: 8px !important;
            align-items: flex-start !important;
            padding-top: 16px !important;
          }
          .withdraw-modal-content {
            width: calc(100vw - 16px) !important;
            max-width: calc(100vw - 16px) !important;
            min-width: 280px !important;
            max-height: 92vh !important;
          }
        }

        @media (max-width: 375px) {
          .withdraw-modal-content {
            width: calc(100vw - 12px) !important;
            max-width: calc(100vw - 12px) !important;
            max-height: 94vh !important;
          }
        }

        @media (min-width: 601px) {
          .withdraw-modal-content {
            width: 500px !important;
            max-width: 500px !important;
            max-height: 85vh !important;
          }
        }
      `}</style>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center withdraw-modal-container"
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          zIndex: 10000,
          width: '100vw',
          height: '100vh',
          margin: '0',
          padding: '20px',
          boxSizing: 'border-box'
        }}
        onClick={onClose}
      >
        <div
          className="rounded-3xl shadow-2xl flex flex-col withdraw-modal-content"
          style={{
            background: `linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)`,
            backdropFilter: 'blur(24px) saturate(180%)',
            border: `2px solid rgba(255, 255, 255, 0.15)`,
            borderTop: `3px solid ${vaultColor}60`,
            borderLeft: `1px solid ${vaultColor}20`,
            borderRight: `1px solid ${vaultColor}20`,
            maxHeight: '85vh',
            height: 'auto',
            minWidth: '280px',
            zIndex: 10001,
            position: 'relative',
            margin: '0',
            boxShadow: `0 32px 80px ${vaultColor}20, 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.1)`,
            color: '#ffffff',
            borderRadius: '24px',
            animation: 'modalEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            flexShrink: 0
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable Content Area */}
          <div
            className="modal-scrollable-content"
            style={{
              flex: '1',
              overflow: 'auto',
              padding: '1rem 1rem 0 1rem',
              minHeight: '0',
              maxHeight: 'calc(80vh - 200px)'
            }}
          >
            {/* Enhanced Modal Header */}
            <div style={{
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem',
                position: 'relative'
              }}>
                <div
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}20, ${vaultColor}10)`,
                    border: `2px solid ${vaultColor}40`,
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: `0 0 40px ${vaultColor}30, 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)`,
                    animation: 'float 2s ease-in-out infinite'
                  }}
                >
                  <TrendingDown style={{ width: '32px', height: '32px', color: vaultColor }} />
                </div>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '900',
                  marginBottom: '0.5rem',
                  lineHeight: '1.2',
                  color: '#ffffff',
                  textShadow: `0 0 30px ${vaultColor}60, 0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.6)`,
                  letterSpacing: '-0.02em',
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                Withdraw from Vault
              </h2>

              {/* Subtitle - Vault Name */}
              <p style={{
                fontSize: 'clamp(0.9rem, 2.5vw, 1.125rem)',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                {vault.name}
              </p>
            </div>

            {/* User Position Summary */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                {/* HIDDEN: Share count display - shares not calculated as expected */}
                {/* <div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>Your Shares</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '700', color: '#ffffff' }}>{userSharesDisplay}</p>
                </div> */}
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>Current Value (SEI)</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '700', color: vaultColor }}>{userValueDisplay} SEI</p>
                </div>
              </div>
            </div>

            {/* Withdrawal Amount Input */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>
                  Withdrawal Amount (Shares)
                </label>
                <button
                  onClick={handleMaxWithdraw}
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}30, ${vaultColor}20)`,
                    border: `1px solid ${vaultColor}50`,
                    color: vaultColor,
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  MAX
                </button>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '1rem',
                position: 'relative'
              }}>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  disabled={transactionStatus === 'pending'}
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
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.5rem' }}>
                Available: {userSharesDisplay} shares
              </p>
            </div>

            {/* Info Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 193, 7, 0.08))',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              backdropFilter: 'blur(12px)',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Info style={{ width: '20px', height: '20px', color: '#ffc107', flexShrink: 0, marginTop: '0.125rem' }} />
                <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                  <p style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>
                    Withdrawing shares will convert them back to your deposited tokens. The value may have changed based on vault performance.
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Current APY: {(vault.apy * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <p style={{ fontSize: '0.875rem', color: '#ef4444' }}>{errorMessage}</p>
              </div>
            )}

            {/* Transaction Status */}
            {transactionStatus === 'pending' && (
              <div style={{
                background: `linear-gradient(135deg, ${vaultColor}20, ${vaultColor}10)`,
                border: `1px solid ${vaultColor}40`,
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Loader2 style={{ width: '20px', height: '20px', color: vaultColor }} className="animate-spin" />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ffffff' }}>
                    {isConfirming ? 'Confirming withdrawal...' : 'Processing withdrawal...'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Please wait while your transaction is confirmed
                  </p>
                </div>
              </div>
            )}

            {transactionStatus === 'success' && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <Shield style={{ width: '20px', height: '20px', color: '#22c55e' }} />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ffffff' }}>Withdrawal successful!</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Your tokens have been returned to your wallet
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Action Buttons at Bottom */}
          <div style={{
            flexShrink: 0,
            padding: '0.75rem 1rem 1rem 1rem',
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 80%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '0 0 24px 24px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <button
                onClick={onClose}
                disabled={transactionStatus === 'pending'}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  borderRadius: '16px',
                  backdropFilter: 'blur(8px)',
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: transactionStatus === 'pending' ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  opacity: transactionStatus === 'pending' ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (transactionStatus !== 'pending') {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={
                  !isConnected ||
                  transactionStatus === 'pending' ||
                  transactionStatus === 'success' ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0
                }
                style={{
                  background: `linear-gradient(135deg, ${vaultColor} 0%, ${vaultColor}dd 100%)`,
                  border: 'none',
                  color: '#000000',
                  borderRadius: '16px',
                  boxShadow: `0 12px 40px ${vaultColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                  height: '48px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: (!isConnected || transactionStatus === 'pending' || transactionStatus === 'success' || !withdrawAmount || parseFloat(withdrawAmount) <= 0) ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: (!isConnected || transactionStatus === 'pending' || transactionStatus === 'success' || !withdrawAmount || parseFloat(withdrawAmount) <= 0) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (isConnected && transactionStatus !== 'pending' && transactionStatus !== 'success' && withdrawAmount && parseFloat(withdrawAmount) > 0) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {transactionStatus === 'pending' ? (
                  <>
                    <Loader2 style={{ width: '20px', height: '20px' }} className="animate-spin" />
                    Processing...
                  </>
                ) : transactionStatus === 'success' ? (
                  'Withdrawn!'
                ) : (
                  <>
                    Withdraw
                    <ArrowRight style={{ width: '20px', height: '20px' }} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
