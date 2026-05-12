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

interface SolanaVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  tokenMint?: string
  tokenDecimals?: number
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

  const vaultColor = vault ? getVaultColor(vault.strategy) : '#9945ff'
  const riskLevel = vault ? getRiskLevel(vault.apy) : 'Medium'
  const depositToken = vault?.depositToken || 'SOL'
  const numericBalance = Number.parseFloat(balance || '0')
  const numericAmount = Number.parseFloat(depositAmount || '0')
  const maxAmount = Math.max(0, numericBalance - 0.01)
  const isValidAmount = Number.isFinite(numericAmount) && numericAmount > 0
  const exceedsBalance = isWalletConnected && isValidAmount && numericAmount > maxAmount
  const canDeposit = isValidAmount && !exceedsBalance && transactionStatus !== 'pending' && isWalletConnected

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
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockSignature = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}-${Date.now()}`
      setTxSignature(mockSignature)
      setTransactionStatus('success')
      setShowSuccess(true)
      onSuccess(mockSignature)
    } catch {
      setTransactionStatus('error')
      setErrorMessage('Transaction failed. Please try again.')
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
          className="fixed inset-0 z-[10000000] flex items-end justify-center px-0 sm:items-center sm:px-4"
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
            className="absolute inset-0 bg-[#02030a]/85 backdrop-blur-xl"
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
            className="solana-deposit-shell relative w-full max-h-[94dvh] overflow-hidden rounded-t-[28px] border border-white/10 bg-[#060711] shadow-[0_-24px_80px_rgba(0,0,0,0.7)] sm:max-w-[560px] sm:rounded-[28px] sm:shadow-[0_32px_120px_rgba(0,0,0,0.82)]"
            initial={{ opacity: 0, y: 44, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32, mass: 0.9 }}
            style={{
              width: 'min(560px, calc(100vw - 24px))',
              maxHeight: 'min(90dvh, 740px)',
              borderRadius: 28,
              boxShadow: `0 0 0 1px ${vaultColor}24, 0 30px 120px rgba(0,0,0,0.86), 0 0 70px ${vaultColor}24`,
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${vaultColor}, #14f195, transparent)` }} />
            <div className="absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl" style={{ background: `${vaultColor}28` }} />
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '22px 22px' }} />

            <div className="solana-deposit-body relative max-h-[94dvh] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:py-6">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20 sm:hidden" />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                    style={{
                      background: `linear-gradient(135deg, ${vaultColor}2e, rgba(20,241,149,0.08))`,
                      borderColor: `${vaultColor}45`,
                      boxShadow: `0 16px 38px ${vaultColor}20`,
                    }}
                  >
                    <Coins className="h-6 w-6" style={{ color: vaultColor }} />
                  </div>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-300">
                        Solana Devnet
                      </span>
                      <span
                        className="rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em]"
                        style={{ borderColor: `${vaultColor}38`, color: vaultColor, background: `${vaultColor}16` }}
                      >
                        {riskLevel} Risk
                      </span>
                    </div>
                    <h2 className="text-balance text-xl font-bold leading-tight text-white sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
                      Deposit to {vault?.name || 'Solana Vault'}
                    </h2>
                    <p className="mt-1 text-sm text-white/45">
                      {vault ? formatStrategy(vault.strategy) : 'AI routed Solana strategy'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close deposit modal"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {vault && (
                <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
                  <Metric label="APY" value={`${(vault.apy * 100).toFixed(1)}%`} color={vaultColor} />
                  <Metric label="TVL" value={`$${formatCurrency(vault.tvl)}`} />
                  <Metric label="Token" value={depositToken} />
                </div>
              )}

              {!isWalletConnected ? (
                <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-center">
                  <Wallet className="mx-auto mb-3 h-10 w-10 text-red-300" />
                  <p className="font-semibold text-white">Wallet not connected</p>
                  <p className="mt-1 text-sm text-white/55">Connect Phantom first, then come back to fund this vault.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-white/60">Amount</span>
                      <span className="truncate text-right text-white/45">
                        Balance {balance || '0'} {depositToken}
                      </span>
                    </div>

                    <div className="flex items-end gap-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="min-w-0 flex-1 bg-transparent text-4xl font-bold leading-none text-white outline-none placeholder:text-white/18 sm:text-5xl"
                        style={{ fontFamily: 'var(--font-display)' }}
                        disabled={transactionStatus === 'pending'}
                      />
                      <span
                        className="mb-1 rounded-2xl border px-3 py-2 text-sm font-bold"
                        style={{ borderColor: `${vaultColor}38`, background: `${vaultColor}16`, color: vaultColor }}
                      >
                        {depositToken}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {QUICK_AMOUNTS.map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setAmountFromRatio(ratio)}
                          disabled={transactionStatus === 'pending' || maxAmount <= 0}
                          className="min-h-10 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {ratio === 1 ? 'MAX' : `${Math.round(ratio * 100)}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                    className="group flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-base font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                      background: canDeposit
                        ? `linear-gradient(135deg, ${vaultColor}, #14f195)`
                        : 'rgba(255,255,255,0.09)',
                      boxShadow: canDeposit ? `0 18px 44px ${vaultColor}30` : 'none',
                    }}
                  >
                    {transactionStatus === 'pending' ? (
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

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-start gap-2 text-xs leading-relaxed text-white/42">
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
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</p>
      <p className="truncate text-base font-bold text-white" style={color ? { color } : undefined}>{value}</p>
    </div>
  )
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
  const styles = tone === 'success'
    ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    : 'border-red-400/20 bg-red-500/10 text-red-300'

  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-3 ${styles}`}>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 truncate text-xs opacity-75">{description}</p>
      </div>
    </div>
  )
}
