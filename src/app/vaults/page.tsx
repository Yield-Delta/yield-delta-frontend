"use client"

import React, { useEffect, useRef, useState, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import DemoBanner from '@/components/DemoBanner';
import AIChat from '@/components/AIChat';
import DepositModal from '@/components/DepositModal';
import SolanaDepositModal from '@/components/SolanaDepositModal';
import { MessageCircle, X, Loader2, TrendingUp, Shield, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSeiMarketData } from '@/hooks/useMarketData';
import { useVaultStore, VaultData } from '@/stores/vaultStore';
import { useVaultTVL } from '@/hooks/useVaultTVL';
import { useTotalTVLInUSD } from '@/hooks/useTotalTVLInUSD';
import { useMultiChainStore } from '@/stores/multiChainStore';
import { ChainId } from '@/types/chain';
import { getVaultsForChain, isSolanaChain } from '@/lib/vaultCatalog';

gsap.registerPlugin(ScrollTrigger);

// ─── Utility functions ─────────────────────────────────────────────────────────

const formatAmount = (amount: number, token: string = 'SEI') => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M ${token}`
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K ${token}`
  if (amount >= 1) return `${amount.toFixed(2)} ${token}`
  return `${amount.toFixed(4)} ${token}`
}

const getVaultToken = (vault: VaultData) =>
  vault.strategy === 'stable_max' || vault.tokenA.toUpperCase().includes('USDC')
    ? 'USDC'
    : vault.tokenA.toUpperCase().includes('SOL')
      ? 'SOL'
      : 'SEI'

const toSolanaDepositVault = (vault: VaultData | null) => {
  if (!vault) return null

  const depositToken = vault.tokenA.toUpperCase().includes('USDC')
    ? vault.tokenA
    : vault.tokenA.toUpperCase().includes('SOL')
      ? vault.tokenA
      : getVaultToken(vault)

  return {
    address: vault.address,
    name: vault.name,
    apy: vault.apy,
    tvl: vault.tvl,
    strategy: vault.strategy,
    depositToken,
    tokenDecimals: depositToken.toUpperCase().includes('USDC') ? 6 : 9,
  }
}

const getRiskLevel = (apy: number, strategy?: string): 'Low' | 'Medium' | 'High' => {
  const modifier: Record<string, number> = {
    stable_max: -5, concentrated_liquidity: 5, arbitrage: 3,
    yield_farming: 2, hedge: 0, sei_hypergrowth: 8, blue_chip: -2, delta_neutral: -3,
  }
  const adjusted = apy * 100 + (strategy ? (modifier[strategy] || 0) : 0)
  if (adjusted < 15) return 'Low'
  if (adjusted < 25) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) => ({
  concentrated_liquidity: '#00f5d4',
  yield_farming: '#9b5de5',
  arbitrage: '#ff206e',
  hedge: '#ffa500',
  stable_max: '#10b981',
  sei_hypergrowth: '#f59e0b',
  blue_chip: '#3b82f6',
  delta_neutral: '#8b5cf6',
} as Record<string, string>)[strategy] || '#00f5d4'

const RISK_BADGE_STYLES = {
  Low: { bg: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: 'rgba(16,185,129,0.35)' },
  Medium: { bg: 'rgba(245,158,11,0.15)', color: '#fcd34d', border: 'rgba(245,158,11,0.35)' },
  High: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: 'rgba(239,68,68,0.35)' },
}

const STRATEGY_FILTERS = [
  { key: 'all', label: 'All Vaults', color: 'rgba(255,255,255,0.55)' },
  { key: 'concentrated_liquidity', label: 'Concentrated', color: '#00f5d4' },
  { key: 'yield_farming', label: 'Yield Farming', color: '#9b5de5' },
  { key: 'delta_neutral', label: 'Delta Neutral', color: '#8b5cf6' },
  { key: 'stable_max', label: 'Stable', color: '#10b981' },
  { key: 'arbitrage', label: 'Arbitrage', color: '#ff206e' },
]

// ─── Sub-components ─────────────────────────────────────────────────────────────

function StatPillar({
  label, value, color, loading = false, isNumeric = false, decimals = 1, suffix = '',
}: {
  label: string; value: string | number; color: string
  loading?: boolean; isNumeric?: boolean; decimals?: number; suffix?: string
}) {
  const [displayed, setDisplayed] = useState(isNumeric ? '0' : '')

  useEffect(() => {
    if (loading) return
    if (!isNumeric) { setDisplayed(value as string); return }
    const target = typeof value === 'number' ? value : parseFloat(value as string)
    if (isNaN(target)) { setDisplayed(String(value)); return }
    const duration = 1400
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayed((eased * target).toFixed(decimals))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [loading, value, isNumeric, decimals])

  return (
    <div className="yd-stat-pillar" style={{ '--pillar-color': color } as CSSProperties}>
      <span className="yd-stat-label">{label}</span>
      <span className="yd-stat-value">
        {loading ? '...' : displayed}{!loading && isNumeric ? suffix : ''}
      </span>
    </div>
  )
}

function Sparkline({ vault, color }: { vault: VaultData; color: string }) {
  const id = `spark-${vault.address.slice(-8)}`
  const W = 300, H = 36
  const raw = [
    0.18,
    0.28 + vault.performance.winRate * 0.15,
    0.4 + vault.performance.sharpeRatio * 0.07,
    0.5 + vault.performance.totalReturn * 0.45,
    0.62 + vault.apy * 0.28,
    0.75 + vault.performance.totalReturn * 0.38,
    0.88 + vault.performance.sharpeRatio * 0.05,
  ]
  const pts = raw.map((v, i) => ({
    x: (i / (raw.length - 1)) * W,
    y: H - Math.min(Math.max(v, 0.04), 0.96) * H,
  }))
  const d = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
  }, '')

  return (
    <div style={{ margin: '0.75rem -4px 0', opacity: 0.65 }}>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${d} L ${W},${H} L 0,${H} Z`} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function VaultsPage() {
  const router = useRouter()
  const vaultCardsRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const lastDepositOpenRef = useRef(0)
  const clearDepositVaultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositVault, setDepositVault] = useState<VaultData | null>(null)
  const [activeFilter, setActiveFilter] = useState('all')

  const { selectedVault, setSelectedVault, getFilteredVaults, isLoading: vaultLoading } = useVaultStore()
  const activeChain = useMultiChainStore((state) => state.activeChain)
  const vaultChain = activeChain || ChainId.SEI_TESTNET
  const [vaultsData, setVaultsData] = React.useState<VaultData[]>([])
  const [queryLoading, setQueryLoading] = React.useState(true)
  const [queryError, setQueryError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    const fetchVaults = async () => {
      try {
        setQueryLoading(true)
        setQueryError(null)

        const localVaults = getVaultsForChain(vaultChain)
        if (localVaults) {
          setVaultsData(localVaults)
          return
        }

        const res = await fetch('/api/vaults')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const result = await res.json()
        if (result.success && result.data) setVaultsData(result.data)
        else throw new Error(result.error || 'Invalid response')
      } catch (err) {
        setQueryError(err as Error)
      } finally {
        setQueryLoading(false)
      }
    }
    fetchVaults()
  }, [vaultChain])

  const { data: marketData } = useSeiMarketData()
  const isSolanaVaultChain = isSolanaChain(vaultChain)
  const vaultAddresses = React.useMemo(() => (
    isSolanaVaultChain ? [] : vaultsData?.map(v => v.address) || []
  ), [isSolanaVaultChain, vaultsData])
  const { tvlMap, isLoading: tvlLoading } = useVaultTVL(vaultAddresses)
  const { formattedUSD: totalTVLInUSD, isLoading: tvlUSDLoading } = useTotalTVLInUSD(vaultsData || [], tvlMap)

  const isLoading = vaultLoading || queryLoading || (!isSolanaVaultChain && tvlLoading)
  const filteredVaults = React.useMemo(
    () => (vaultsData?.length > 0 ? vaultsData : getFilteredVaults()),
    [vaultsData, getFilteredVaults]
  )

  const displayVaults = React.useMemo(() => {
    if (activeFilter === 'all') return filteredVaults
    return filteredVaults.filter(v => v.strategy === activeFilter)
  }, [filteredVaults, activeFilter])

  const avgApy = React.useMemo(() => {
    if (!displayVaults.length) return 0
    return (displayVaults.reduce((s, v) => s + v.apy, 0) / displayVaults.length) * 100
  }, [displayVaults])

  const getVaultTVL = React.useCallback((vault: VaultData) => {
    const on = tvlMap.get(vault.address.toLowerCase())
    return on !== undefined ? on : vault.tvl
  }, [tvlMap])

  const handleDeposit = React.useCallback((vault: VaultData) => {
    if (!vault) return
    if (clearDepositVaultTimeoutRef.current) {
      clearTimeout(clearDepositVaultTimeoutRef.current)
      clearDepositVaultTimeoutRef.current = null
    }
    lastDepositOpenRef.current = Date.now()
    setSelectedVault(vault)
    setDepositVault(vault)
    setShowDepositModal(true)
  }, [setSelectedVault])

  const handleDepositSuccess = React.useCallback((txHash: string) => {
    console.log('Deposit successful:', txHash)
  }, [])

  const handleCloseModal = React.useCallback(() => {
    setShowDepositModal(false)
    if (clearDepositVaultTimeoutRef.current) {
      clearTimeout(clearDepositVaultTimeoutRef.current)
    }
    clearDepositVaultTimeoutRef.current = setTimeout(() => {
      setDepositVault(null)
      clearDepositVaultTimeoutRef.current = null
    }, 300)
  }, [])

  useEffect(() => {
    return () => {
      if (clearDepositVaultTimeoutRef.current) {
        clearTimeout(clearDepositVaultTimeoutRef.current)
      }
    }
  }, [])

  const handleViewAnalytics = (vault: VaultData) => {
    setSelectedVault(vault)
    router.push(`/vault?address=${vault.address}&tab=analytics`)
  }

  // GSAP hero + cards
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.querySelectorAll('.yd-hero-animate'),
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.1 }
      )
      gsap.fromTo(
        heroRef.current.querySelectorAll('.yd-stat-pillar'),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out', delay: 0.35 }
      )
    }
  }, [])

  useEffect(() => {
    if (vaultCardsRef.current && !isLoading) {
      const cards = Array.from(vaultCardsRef.current.children)
      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.7, stagger: 0.1, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: vaultCardsRef.current, start: 'top 85%' },
        }
      )
    }
  }, [isLoading, displayVaults])

  return (
    <div className="min-h-screen relative" style={{ background: '#07080f' }}>
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      <DemoBanner />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section ref={heroRef} className="yd-vaults-hero">
        {/* SVG grid background */}
        <svg className="yd-hero-grid-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <defs>
            <pattern id="heroGrid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(0,245,212,0.18)" strokeWidth="0.5" />
            </pattern>
            <radialGradient id="heroGridFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="65%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="heroGridMask">
              <rect width="100%" height="100%" fill="url(#heroGridFade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#heroGrid)" mask="url(#heroGridMask)" />
        </svg>

        {/* Radial glow */}
        <div className="yd-hero-radial-glow" />

        <div className="yd-hero-content">
          {/* Left: heading */}
          <div className="yd-hero-left">
            <div className="yd-live-badge yd-hero-animate">
              <span className="yd-live-dot" />
              LIVE
            </div>

            <h1 className="yd-hero-heading yd-hero-animate">
              AI-POWERED{' '}
              <span style={{ color: '#00f5d4', textShadow: '0 0 50px rgba(0,245,212,0.35)' }}>YIELD</span>
              {' '}OPTIMIZATION
              <br />
              ON SEI
            </h1>

            <p className="yd-hero-sub yd-hero-animate">
              Autonomous liquidity strategies, continuously optimized by AI
            </p>
          </div>

          {/* Right: stat pillars */}
          <div className="yd-hero-stats">
            <StatPillar
              label="Total TVL"
              value={isLoading || tvlUSDLoading ? '...' : totalTVLInUSD}
              color="#00f5d4"
              loading={isLoading || tvlUSDLoading}
            />
            <StatPillar
              label="Vaults"
              value={filteredVaults.length}
              color="#9b5de5"
              loading={isLoading}
              isNumeric
              decimals={0}
            />
            <StatPillar
              label="Avg APY"
              value={avgApy}
              color="#10b981"
              loading={isLoading}
              isNumeric
              decimals={1}
              suffix="%"
            />
            <StatPillar
              label="AI Uptime"
              value={99.97}
              color="#3b82f6"
              isNumeric
              decimals={2}
              suffix="%"
            />
          </div>
        </div>
      </section>

      {/* ── FILTER BAR ────────────────────────────────────── */}
      <div className="yd-filter-bar">
        <div className="yd-filter-chips">
          {STRATEGY_FILTERS.map(f => (
            <button
              key={f.key}
              className={`yd-filter-chip${activeFilter === f.key ? ' active' : ''}`}
              style={{ '--chip-color': f.color } as CSSProperties}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
          {!isLoading && (
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '0.08em',
              marginLeft: 8,
            }}>
              {displayVaults.length} vault{displayVaults.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── VAULT GRID ────────────────────────────────────── */}
      <div className="yd-vault-grid-section">
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
            <Loader2 style={{ width: 28, height: 28, color: '#00f5d4', animation: 'spin 1s linear infinite' }} />
            <span style={{ marginLeft: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
              Loading vaults...
            </span>
          </div>
        )}

        {queryError && (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'rgba(239,68,68,0.8)' }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>Failed to load vaults</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{queryError.message}</p>
          </div>
        )}

        {!isLoading && !queryError && (
          <div ref={vaultCardsRef} className="yd-vault-grid">
            {displayVaults.map(vault => {
              const color = getVaultColor(vault.strategy)
              const risk = getRiskLevel(vault.apy, vault.strategy)
              const riskStyle = RISK_BADGE_STYLES[risk]
              const tvl = getVaultTVL(vault)
              const token = getVaultToken(vault)

              return (
                <div
                  key={vault.address}
                  className="yd-vault-card-wrap"
                  style={{ '--card-color': color } as CSSProperties}
                  onPointerUpCapture={(e) => {
                    if (e.pointerType !== 'touch') return

                    const target = e.target as HTMLElement
                    if (target.closest('[data-vault-action="analytics"]')) return

                    if (target.closest('[data-vault-action="deposit"]') || window.matchMedia('(max-width: 680px)').matches) {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeposit(vault)
                    }
                  }}
                >
                  <div className="yd-vault-card-body">
                    {/* Top accent bar */}
                    <div
                      className="yd-card-top-bar"
                      style={{ background: `linear-gradient(90deg, transparent, ${color}cc 50%, transparent)` }}
                    />
                    {/* Ambient top glow */}
                    <div
                      className="yd-card-top-glow"
                      style={{ background: `radial-gradient(ellipse at 50% -10%, ${color}1a 0%, transparent 70%)` }}
                    />

                    {/* Header row: strategy badge + token pair */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '9px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color,
                        background: `${color}14`,
                        border: `1px solid ${color}28`,
                        borderRadius: 100,
                        padding: '3px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                        {vault.strategy.replace(/_/g, ' ')}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.04em',
                      }}>
                        {vault.tokenA}/{vault.tokenB}
                      </span>
                    </div>

                    {/* Vault name */}
                    <h3 style={{
                      fontFamily: 'var(--font-display, system-ui)',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.9)',
                      lineHeight: 1.2,
                      marginBottom: 0,
                    }}>
                      {vault.name}
                    </h3>

                    {/* APY Hero */}
                    <div className="yd-apy-hero">
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <div
                            className="yd-apy-value"
                            style={{
                              color,
                              textShadow: `0 0 40px ${color}55, 0 0 80px ${color}1a`,
                            }}
                          >
                            {(vault.apy * 100).toFixed(1)}%
                          </div>
                          <div className="yd-apy-label">Annual Yield</div>
                        </div>

                        {/* Risk badge */}
                        <span style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '10px',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: riskStyle.color,
                          background: riskStyle.bg,
                          border: `1px solid ${riskStyle.border}`,
                          borderRadius: 8,
                          padding: '5px 12px',
                          alignSelf: 'flex-end',
                          marginBottom: '6px',
                        }}>
                          {risk} Risk
                        </span>
                      </div>
                    </div>

                    {/* Separator */}
                    <div
                      className="yd-card-separator"
                      style={{ background: `linear-gradient(90deg, transparent, ${color}22, transparent)` }}
                    />

                    {/* 3-metric strip */}
                    <div className="yd-metric-strip">
                      <div className="yd-metric-item">
                        <span className="yd-metric-value" style={{ color: '#10b981' }}>
                          {formatAmount(tvl, token)}
                        </span>
                        <span className="yd-metric-label">TVL</span>
                      </div>
                      <div className="yd-metric-divider" />
                      <div className="yd-metric-item">
                        <span className="yd-metric-value" style={{ color: '#00f5d4' }}>
                          {(vault.performance.winRate * 100).toFixed(0)}%
                        </span>
                        <span className="yd-metric-label">Win Rate</span>
                      </div>
                      <div className="yd-metric-divider" />
                      <div className="yd-metric-item">
                        <span className="yd-metric-value" style={{ color: '#9b5de5' }}>
                          {vault.performance.sharpeRatio.toFixed(2)}
                        </span>
                        <span className="yd-metric-label">Sharpe</span>
                      </div>
                    </div>

                    {/* Sparkline */}
                    <Sparkline vault={vault} color={color} />

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 10, marginTop: '1.1rem' }}>
                      <button
                        type="button"
                        data-vault-action="deposit"
                        onPointerUp={(e) => {
                          if (e.pointerType !== 'touch') return
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeposit(vault)
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (Date.now() - lastDepositOpenRef.current < 600) return
                          handleDeposit(vault)
                        }}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '12px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '11px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: 'none',
                          background: `linear-gradient(135deg, ${color}e0, ${color}a0)`,
                          color: '#050508',
                          boxShadow: `0 4px 20px ${color}30`,
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = `0 8px 28px ${color}45`
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = `0 4px 20px ${color}30`
                        }}
                      >
                        Deposit
                      </button>
                      <button
                        type="button"
                        data-vault-action="analytics"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleViewAnalytics(vault)
                        }}
                        style={{
                          flex: 1,
                          height: '44px',
                          borderRadius: '12px',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: '11px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          fontWeight: 500,
                          cursor: 'pointer',
                          background: `${color}0c`,
                          border: `1px solid ${color}25`,
                          color: 'rgba(255,255,255,0.65)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = `${color}18`
                          e.currentTarget.style.borderColor = `${color}45`
                          e.currentTarget.style.color = 'rgba(255,255,255,0.88)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = `${color}0c`
                          e.currentTarget.style.borderColor = `${color}25`
                          e.currentTarget.style.color = 'rgba(255,255,255,0.65)'
                        }}
                      >
                        Analytics
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── AI CHAT PANEL ─────────────────────────────────── */}
      {showChat && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 40, pointerEvents: 'none',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '1rem',
        }}>
          <div style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: '28rem', minWidth: '320px',
            height: '600px', marginRight: '1rem', marginBottom: '5rem',
            borderRadius: '20px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 30px rgba(0,245,212,0.15)',
            color: '#fff', overflow: 'hidden', position: 'relative',
          }}>
            <AIChat
              className="h-full"
              vaultAddress={selectedVault?.address}
              context={{
                currentPage: 'vaults',
                vaultData: filteredVaults,
                userPreferences: {
                  preferredTimeframe: '1d', riskTolerance: 'medium',
                  autoRebalance: true, selectedVault, marketData,
                },
              }}
              initialMessage="🎯 Welcome to SEI DLP Vaults! I'm Kairos, your AI assistant. I can help you analyze vault performance, predict optimal ranges, and recommend rebalancing strategies. What vault would you like to optimize today?"
            />
          </div>
        </div>
      )}

      {/* ── DEPOSIT MODAL ─────────────────────────────────── */}
      {isSolanaVaultChain ? (
        <SolanaDepositModal
          vault={toSolanaDepositVault(depositVault)}
          isOpen={showDepositModal}
          onClose={handleCloseModal}
          onSuccess={handleDepositSuccess}
        />
      ) : (
        <DepositModal
          vault={depositVault}
          isOpen={showDepositModal}
          onClose={handleCloseModal}
          onSuccess={handleDepositSuccess}
        />
      )}

      {/* ── FLOATING AI BUTTON ────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        zIndex: 999999, isolation: 'isolate', pointerEvents: showDepositModal ? 'none' : 'auto',
        opacity: showDepositModal ? 0 : 1,
        transition: 'opacity 0.18s ease',
      }}>
        <div style={{ position: 'relative' }}>
          {/* Glow ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(45deg, #00f5d4, #ff206e, #9b5de5, #00f5d4)',
            backgroundSize: '400% 400%',
            filter: 'blur(8px)', opacity: 0.55, transform: 'scale(1.35)',
          }} />
          <button
            onClick={() => setShowChat(v => !v)}
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #00f5d4 0%, #10b981 30%, #ff206e 70%, #9b5de5 100%)',
              border: '3px solid rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '64px', height: '64px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(0,245,212,0.6), 0 0 80px rgba(255,32,110,0.3)',
              transition: 'transform 0.25s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
            aria-label={showChat ? 'Close AI Assistant' : 'Open AI Assistant'}
          >
            {showChat
              ? <X style={{ width: 24, height: 24, color: '#050508' }} />
              : <MessageCircle style={{ width: 24, height: 24, color: '#050508' }} />
            }
          </button>
          {!showChat && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#22c55e', border: '2px solid #07080f',
              boxShadow: '0 0 10px rgba(34,197,94,0.7)',
              animation: 'ydLivePulse 2s ease-in-out infinite',
            }} />
          )}
        </div>
      </div>
    </div>
  )
}
