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
import { useSuiWallet } from '@/hooks/useSuiWallet'
import { useSuiVault } from '@/hooks/useSuiVault'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'
import { isWalletCancellation } from '@/lib/sui/walletErrors'
import styles from './SolanaDepositModal.module.css'

export interface SuiVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  description?: string
}

interface SuiDepositModalProps {
  vault: SuiVaultData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (digest: string) => void
}

const SUI_PRICE_USD = 3.5
const QUICK_AMOUNTS = [0.25, 0.5, 0.75, 1]
const DEMO_SIMULATION_ONLY = true

const formatCurrency = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
  return `${amount.toFixed(0)}`
}

const formatStrategy = (strategy: string) =>
  strategy.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const getRiskLevel = (apy: number): 'Low' | 'Medium' | 'High' => {
  const pct = apy * 100
  if (pct < 12) return 'Low'
  if (pct < 20) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) =>
  ({
    delta_neutral: '#4ca2ff',
    hedge: '#a78bfa',
    concentrated_liquidity: '#22d3ee',
    stable_max: '#34d399',
    layered_yield: '#fb923c',
    yield_farming: '#f472b6',
    arbitrage: '#f87171',
  } as Record<string, string>)[strategy] ?? '#4ca2ff'

export default function SuiDepositModal({
  vault,
  isOpen,
  onClose,
  onSuccess,
}: SuiDepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [wasCancelled, setWasCancelled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [txDigest, setTxDigest] = useState<string | null>(null)
  const [useSimulationFallback, setUseSimulationFallback] = useState(DEMO_SIMULATION_ONLY)
  const [wasSimulated, setWasSimulated] = useState(false)
  const openedAtRef = useRef(0)
  const submissionInFlightRef = useRef(false)

  const { address, isConnected, balance } = useSuiWallet()
  const { deposit, simulateDeposit, isDepositing } = useSuiVault()

  const vaultColor = vault ? getVaultColor(vault.strategy) : '#4ca2ff'
  const riskLevel = vault ? getRiskLevel(vault.apy) : 'Medium'
  // The current Sui testnet Move package uses SUI as its settlement coin.
  const depositToken = 'SUI'

  const numericBalance = parseFloat(balance || '0')
  const numericAmount = parseFloat(depositAmount || '0')
  const maxAmount = Math.max(0, numericBalance - 0.01)
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const exceedsBalance = isConnected && isValidAmount && numericAmount > maxAmount
  const canSubmit =
    isValidAmount &&
    (useSimulationFallback || !exceedsBalance) &&
    txStatus !== 'pending' &&
    !isDepositing &&
    isConnected

  const projectedValueUSD = useMemo(
    () => numericAmount * SUI_PRICE_USD,
    [numericAmount]
  )
  const projectedDailyYield = useMemo(() => {
    if (!vault || !isValidAmount) return 0
    return (projectedValueUSD * vault.apy) / 365
  }, [isValidAmount, projectedValueUSD, vault])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      openedAtRef.current = Date.now()
      setTxStatus('idle')
      setErrorMsg(null)
      setWasCancelled(false)
      setShowSuccess(false)
      setTxDigest(null)
      setUseSimulationFallback(DEMO_SIMULATION_ONLY)
      setWasSimulated(false)
      setDepositAmount('')
    }
  }, [isOpen])

  const handleDeposit = async () => {
    if (!canSubmit || !address || !vault || submissionInFlightRef.current) return

    submissionInFlightRef.current = true

    setTxStatus('pending')
    setErrorMsg(null)
    setWasCancelled(false)

    try {
      const result = useSimulationFallback
        ? await simulateDeposit(depositAmount)
        : await deposit(
            {
              vaultObjectId: vault.address,
              depositToken: vault.depositToken,
              coinType: SUI_VAULT_PROGRAMS.suiType,
            },
            depositAmount
          )

      setTxDigest(result.digest)
      setWasSimulated(Boolean(result.simulated))
      setTxStatus('success')
      setShowSuccess(true)
      onSuccess(result.digest)
    } catch (err) {
      if (isWalletCancellation(err)) {
        setTxStatus('idle')
        setWasCancelled(true)
        setUseSimulationFallback(DEMO_SIMULATION_ONLY)
        return
      }

      setTxStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed. Please try again.')
      if (!useSimulationFallback) setUseSimulationFallback(true)
    } finally {
      submissionInFlightRef.current = false
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
            .sui-deposit-shell {
              width: min(560px, calc(100vw - 24px));
              max-height: min(90dvh, 740px);
              border-radius: 28px;
              border: 1px solid rgba(76, 162, 255, 0.18);
              background:
                linear-gradient(180deg, rgba(8, 12, 30, 0.98), rgba(4, 6, 18, 0.99)),
                #050a1a;
              color: white;
              box-shadow:
                0 0 0 1px rgba(76, 162, 255, 0.06),
                0 32px 120px rgba(0, 0, 0, 0.88),
                0 0 70px rgba(76, 162, 255, 0.12);
            }

            .sui-deposit-body {
              max-height: min(90dvh, 740px);
              scrollbar-width: thin;
              scrollbar-color: rgba(76, 162, 255, 0.25) transparent;
            }

            @media (max-width: 640px) {
              .sui-deposit-shell {
                width: 100%;
                max-height: 92dvh;
                border-radius: 24px;
              }
              .sui-deposit-body {
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
            style={{
              background:
                'radial-gradient(circle at 30% 20%, rgba(76,162,255,0.12), transparent 35%), radial-gradient(circle at 70% 80%, rgba(167,139,250,0.1), transparent 32%), rgba(2,4,14,0.9)',
            }}
          />

          <motion.div
            className={`${styles.shell} sui-deposit-shell`}
            initial={{ opacity: 0, y: 44, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, mass: 0.9 }}
            style={{
              '--accent': vaultColor,
              boxShadow: `0 0 0 1px ${vaultColor}20, 0 30px 120px rgba(0,0,0,0.9), 0 0 70px ${vaultColor}18`,
            } as React.CSSProperties}
          >
            {/* Top accent line — SUI teal-to-violet */}
            <div
              className={styles.topRule}
              style={{
                background: `linear-gradient(90deg, transparent, ${vaultColor}, #a78bfa, transparent)`,
              }}
            />
            <div className={styles.ambientGlow} />
            <div className={styles.texture} />

            <div className={`${styles.body} sui-deposit-body`}>
              <div className={styles.grabber} />

              <div className={styles.header}>
                <div className={styles.headingCluster}>
                  <div
                    className={styles.vaultIcon}
                    style={{ borderColor: `${vaultColor}40` }}
                  >
                    <Coins className="h-6 w-6" style={{ color: vaultColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>Sui Testnet</span>
                      <span
                        className={styles.badge}
                        style={{
                          borderColor: `${vaultColor}38`,
                          color: vaultColor,
                          background: `${vaultColor}16`,
                        }}
                      >
                        {riskLevel} Risk
                      </span>
                    </div>
                    <h2 className={styles.title}>
                      Deposit to {vault?.name || 'Sui Vault'}
                    </h2>
                    <p className={styles.subtitle}>
                      {vault ? formatStrategy(vault.strategy) : 'SUI DeFi strategy'}
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

              {vault?.description && (
                <p style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                  padding: '12px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  {vault.description}
                </p>
              )}

              {!isConnected ? (
                <div className={styles.walletWarning}>
                  <Wallet className={`${styles.walletWarningIcon} h-10 w-10`} />
                  <p className={styles.walletWarningTitle}>Sui wallet not connected</p>
                  <p className={styles.walletWarningText}>
                    Connect Slush using the chain selector, then return to deposit.
                  </p>
                </div>
              ) : (
                <div className={styles.connectedStack}>
                  <div className={styles.amountCard}>
                    <div className={styles.amountLabelRow}>
                      <span>Amount</span>
                      <span className={styles.balanceText}>
                        Balance {balance} {depositToken}
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
                        disabled={txStatus === 'pending'}
                      />
                      <span
                        className={styles.tokenPill}
                        style={{
                          borderColor: `${vaultColor}38`,
                          background: `${vaultColor}16`,
                          color: vaultColor,
                        }}
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
                          disabled={txStatus === 'pending' || maxAmount <= 0}
                          className={styles.quickButton}
                        >
                          {ratio === 1 ? 'MAX' : `${Math.round(ratio * 100)}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.detailGrid}>
                    <Detail
                      icon={<Sparkles className="h-4 w-4" />}
                      label="USD Est."
                      value={`$${projectedValueUSD.toFixed(2)}`}
                    />
                    <Detail
                      icon={<ShieldCheck className="h-4 w-4" />}
                      label="Daily Yield"
                      value={`$${projectedDailyYield.toFixed(2)}`}
                    />
                  </div>

                  {exceedsBalance && !useSimulationFallback && (
                    <Status
                      tone="error"
                      icon={<AlertCircle className="h-5 w-5" />}
                      title="Amount exceeds balance"
                      description="Keep 0.01 SUI reserved for gas fees."
                    />
                  )}
                  {errorMsg && (
                    <Status
                      tone="error"
                      icon={<AlertCircle className="h-5 w-5" />}
                      title={useSimulationFallback ? 'On-chain deposit failed · demo retry available' : 'Deposit failed'}
                      description={errorMsg}
                    />
                  )}
                  {wasCancelled && (
                    <Status
                      tone="info"
                      icon={<Wallet className="h-5 w-5" />}
                      title="Wallet confirmation cancelled"
                      description="No transaction was submitted and no funds moved. You can try again when ready."
                    />
                  )}
                  {showSuccess && txDigest && (
                    <Status
                      tone="success"
                      icon={<CheckCircle2 className="h-5 w-5" />}
                      title={wasSimulated ? 'Demo deposit complete' : 'Deposit successful'}
                      description={txDigest}
                    />
                  )}

                  <button
                    onClick={handleDeposit}
                    disabled={!canSubmit}
                    className={styles.primaryButton}
                    style={{
                      background: canSubmit
                        ? `linear-gradient(135deg, ${vaultColor}, #a78bfa)`
                        : 'rgba(255,255,255,0.09)',
                      boxShadow: canSubmit ? `0 18px 44px ${vaultColor}28` : 'none',
                    }}
                  >
                    {txStatus === 'pending' || isDepositing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {useSimulationFallback ? 'Running Demo' : 'Confirming on Sui'}
                      </>
                    ) : (
                      <>
                        {useSimulationFallback ? 'Run Demo Simulation' : `Deposit ${depositToken}`}
                        <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className={styles.feeNote}>
                <div className={styles.feeNoteInner}>
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300/60" />
                  <p>
                    {wasSimulated
                      ? 'Demo mode completed locally and did not move testnet funds.'
                      : DEMO_SIMULATION_ONLY
                        ? 'Demo mode is enabled for recording. It simulates the deposit locally and never requests a wallet signature or moves funds.'
                        : 'The first attempt executes on Sui testnet. If it fails, the retry button switches to an explicitly labelled local simulation for recording.'}
                  </p>
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
      <p className={styles.metricValue} style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className={styles.detailCard}>
      <div className={styles.detailIcon}>{icon}</div>
      <div className="min-w-0">
        <p className={styles.detailLabel}>{label}</p>
        <p className={styles.detailValue}>{value}</p>
      </div>
    </div>
  )
}

function Status({
  tone, icon, title, description,
}: {
  tone: 'error' | 'success' | 'info'
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className={`${styles.statusCard} ${
        tone === 'success'
          ? styles.statusSuccess
          : tone === 'info'
            ? styles.statusInfo
            : styles.statusError
      }`}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className={styles.statusTitle}>{title}</p>
        <p className={styles.statusDescription}>{description}</p>
      </div>
    </div>
  )
}
