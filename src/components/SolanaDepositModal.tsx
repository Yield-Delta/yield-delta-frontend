'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Coins,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSolanaWallet } from '@/hooks/useSolanaWallet'
import { useSolanaVault } from '@/hooks/useSolanaVault'
import styles from './SolanaDepositModal.module.css'

interface SolanaVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  tokenMint?: string
  tokenDecimals?: number
  vaultMint?: string
}

interface SolanaDepositModalProps {
  vault: SolanaVaultData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (txSignature: string) => void
}

const SOL_PRICE_USD = 100
const QUICK_AMOUNTS = [0.25, 0.5, 0.75, 1]

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return `${amount.toFixed(0)}`
}

const formatStrategy = (strategy: string) => (
  strategy
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
)

const getRiskLevel = (apy: number): 'Low' | 'Medium' | 'High' => {
  const apyPercentage = apy * 100
  if (apyPercentage < 15) return 'Low'
  if (apyPercentage < 25) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) => {
  const colors: Record<string, string> = {
    concentrated_liquidity: '#9945ff',
    yield_farming: '#14f195',
    stable_max: '#00d4ff',
    margin: '#ff6b6b',
    leveraged: '#ffd93d',
    staked_sol: '#8b5cf6',
    stablecoin_lending: '#00d4ff',
    sol_staking: '#14f195',
    lp_auto_compound: '#9945ff',
    volatility_rebalancing: '#f59e0b',
    delta_neutral: '#22d3ee',
    ai_meta_vault: '#ff206e',
    experimental_sandbox: '#ff6b6b',
    experimental: '#ff6ef7',
  }
  return colors[strategy] || '#9945ff'
}

export default function SolanaDepositModal({
  vault,
  isOpen,
  onClose,
  onSuccess,
}: SolanaDepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const openedAtRef = useRef(0)

  const { address: walletAddress, isConnected: isWalletConnected, balance } = useSolanaWallet()
  const { deposit, isDepositing } = useSolanaVault()

  const vaultColor = vault ? getVaultColor(vault.strategy) : '#9945ff'
  const riskLevel = vault ? getRiskLevel(vault.apy) : 'Medium'
  const depositToken = vault?.depositToken || 'SOL'
  const numericBalance = Number.parseFloat(balance || '0')
  const numericAmount = Number.parseFloat(depositAmount || '0')
  const maxAmount = Math.max(0, numericBalance - 0.01)
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const exceedsBalance = isWalletConnected && isValidAmount && numericAmount > maxAmount
  const canDeposit = isValidAmount && !exceedsBalance && transactionStatus !== 'pending' && !isDepositing && isWalletConnected

  const projectedValue = useMemo(() => numericAmount * SOL_PRICE_USD, [numericAmount])
  const projectedDailyYield = useMemo(() => {
    if (!vault || !isValidAmount) return 0
    return (projectedValue * vault.apy) / 365
  }, [isValidAmount, projectedValue, vault])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now()
      setTransactionStatus('idle')
      setErrorMessage(null)
      setShowSuccess(false)
      setTxSignature(null)
      setDepositAmount('')
    }
  }, [isOpen])

  const handleDeposit = async () => {
    if (!canDeposit || !walletAddress || !vault) return

    setTransactionStatus('pending')
    setErrorMessage(null)

    try {
      let signature: string

      if (vault.tokenMint && vault.vaultMint) {
        const result = await deposit(
          {
            address: vault.address,
            name: vault.name,
            apy: vault.apy,
            tvl: vault.tvl,
            strategy: vault.strategy,
            depositToken: vault.depositToken,
            tokenMint: vault.tokenMint,
            tokenDecimals: vault.tokenDecimals ?? 9,
            vaultMint: vault.vaultMint,
          },
          depositAmount
        )
        signature = result.signature
      } else {
        // Vault not yet initialized on-chain — simulate for UI testing
        await new Promise(resolve => setTimeout(resolve, 1500))
        signature = `sim-${walletAddress.slice(0, 8)}-${Date.now()}`
      }

      setTxSignature(signature)
      setTransactionStatus('success')
      setShowSuccess(true)
      onSuccess(signature)
    } catch (err) {
      setTransactionStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Transaction failed. Please try again.')
    }
  }

  const setAmountFromRatio = (ratio: number) => {
    if (!Number.isFinite(maxAmount) || maxAmount <= 0) return
    setDepositAmount((maxAmount * ratio).toFixed(4))
  }

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          className={styles.overlay}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000000,
            isolation: 'isolate',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 28px)',
          }}
        >
          <style jsx>{`
            .solana-deposit-shell {
              width: min(560px, calc(100vw - 24px));
              max-height: min(90dvh, 740px);
              border-radius: 28px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              background:
                linear-gradient(180deg, rgba(12, 15, 28, 0.98), rgba(5, 7, 16, 0.98)),
                #060711;
              color: white;
              box-shadow:
                0 0 0 1px rgba(255, 255, 255, 0.04),
                0 32px 120px rgba(0, 0, 0, 0.84);
            }

            .solana-deposit-body {
              max-height: min(90dvh, 740px);
              scrollbar-width: thin;
              scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
            }

            @media (max-width: 640px) {
              .solana-deposit-shell {
                width: 100%;
                max-height: 92dvh;
                border-radius: 24px;
              }

              .solana-deposit-body {
                max-height: 92dvh;
              }
            }
          `}</style>

          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (Date.now() - openedAtRef.current < 500) return
              onClose()
            }}
          />

          <motion.div
            className={`${styles.shell} solana-deposit-shell`}
            initial={{ opacity: 0, y: 44, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, mass: 0.9 }}
            style={{
              '--accent': vaultColor,
              boxShadow: `0 0 0 1px ${vaultColor}24, 0 30px 120px rgba(0,0,0,0.86), 0 0 70px ${vaultColor}24`,
            } as React.CSSProperties}
          >
            <div className={styles.topRule} />
            <div className={styles.ambientGlow} />
            <div className={styles.texture} />

            <div className={`${styles.body} solana-deposit-body`}>
              <div className={styles.grabber} />

              <div className={styles.header}>
                <div className={styles.headingCluster}>
                  <div
                    className={styles.vaultIcon}
                    style={{
                      borderColor: `${vaultColor}45`,
                    }}
                  >
                    <Coins className="h-6 w-6" style={{ color: vaultColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>
                        Solana Devnet
                      </span>
                      <span
                        className={styles.badge}
                        style={{ borderColor: `${vaultColor}38`, color: vaultColor, background: `${vaultColor}16` }}
                      >
                        {riskLevel} Risk
                      </span>
                    </div>
                    <h2 className={styles.title}>
                      Deposit to {vault?.name || 'Solana Vault'}
                    </h2>
                    <p className={styles.subtitle}>
                      {vault ? formatStrategy(vault.strategy) : 'AI routed Solana strategy'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close deposit modal"
                  className={styles.closeButton}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {vault && (
                <div className={styles.metricsGrid}>
                  <Metric label="APY" value={`${(vault.apy * 100).toFixed(1)}%`} color={vaultColor} />
                  <Metric label="TVL" value={`$${formatCurrency(vault.tvl)}`} />
                  <Metric label="Token" value={depositToken} />
                </div>
              )}

              {!isWalletConnected ? (
                <div className={styles.walletWarning}>
                  <Wallet className={`${styles.walletWarningIcon} h-10 w-10`} />
                  <p className={styles.walletWarningTitle}>Wallet not connected</p>
                  <p className={styles.walletWarningText}>Connect Phantom first, then come back to fund this vault.</p>
                </div>
              ) : (
                <div className={styles.connectedStack}>
                  <div className={styles.amountCard}>
                    <div className={styles.amountLabelRow}>
                      <span>Amount</span>
                      <span className={styles.balanceText}>
                        Balance {balance || '0'} {depositToken}
                      </span>
                    </div>

                    <div className={styles.amountInputRow}>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className={styles.amountInput}
                        disabled={transactionStatus === 'pending'}
                      />
                      <span
                        className={styles.tokenPill}
                        style={{ borderColor: `${vaultColor}38`, background: `${vaultColor}16`, color: vaultColor }}
                      >
                        {depositToken}
                      </span>
                    </div>

                    <div className={styles.quickGrid}>
                      {QUICK_AMOUNTS.map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAmountFromRatio(ratio)}
                          disabled={transactionStatus === 'pending' || maxAmount <= 0}
                          className={styles.quickButton}
                        >
                          {ratio === 1 ? 'MAX' : `${Math.round(ratio * 100)}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.detailGrid}>
                    <Detail icon={<Sparkles className="h-4 w-4" />} label="USD Est." value={`$${projectedValue.toFixed(2)}`} />
                    <Detail icon={<ShieldCheck className="h-4 w-4" />} label="Daily Yield" value={`$${projectedDailyYield.toFixed(2)}`} />
                  </div>

                  {exceedsBalance && (
                    <Status tone="error" icon={<AlertCircle className="h-5 w-5" />} title="Amount exceeds balance" description="Keep 0.01 SOL reserved for devnet transaction fees." />
                  )}

                  {errorMessage && (
                    <Status tone="error" icon={<AlertCircle className="h-5 w-5" />} title="Deposit failed" description={errorMessage} />
                  )}

                  {showSuccess && txSignature && (
                    <Status tone="success" icon={<CheckCircle2 className="h-5 w-5" />} title="Deposit successful" description={txSignature} />
                  )}

                  <button
                    onClick={handleDeposit}
                    disabled={!canDeposit}
                    className={styles.primaryButton}
                    style={{
                      background: canDeposit
                        ? `linear-gradient(135deg, ${vaultColor}, #14f195)`
                        : 'rgba(255,255,255,0.09)',
                      boxShadow: canDeposit ? `0 18px 44px ${vaultColor}30` : 'none',
                    }}
                  >
                    {transactionStatus === 'pending' || isDepositing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Confirming Deposit
                      </>
                    ) : (
                      <>
                        Deposit {depositToken}
                        <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className={styles.feeNote}>
                <div className={styles.feeNoteInner}>
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/70" />
                  <p>Deposits are simulated on devnet for strategy testing. Keep a small SOL buffer for fees and review vault risk before funding.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue} style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.detailCard}>
      <div className={styles.detailIcon}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={styles.detailLabel}>{label}</p>
        <p className={styles.detailValue}>{value}</p>
      </div>
    </div>
  )
}

function Status({
  tone,
  icon,
  title,
  description,
}: {
  tone: 'error' | 'success'
  icon: React.ReactNode
  title: string
  description: string
}) {
  const toneClass = tone === 'success'
    ? styles.statusSuccess
    : styles.statusError

  return (
    <div className={`${styles.statusCard} ${toneClass}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className={styles.statusTitle}>{title}</p>
        <p className={styles.statusDescription}>{description}</p>
      </div>
    </div>
  )
}
