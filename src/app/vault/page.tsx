"use client"

import { useEffect, useState, useRef, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Shield, Target, BarChart3, Loader2, Coins, Zap } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import Navigation from '@/components/Navigation';
import DepositModal from '@/components/DepositModal';
import SolanaDepositModal from '@/components/SolanaDepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import VaultClientWrapper from '@/components/VaultClientWrapper';
import TokenPairDisplay from '@/components/TokenPairDisplay';
import PortfolioChart from '@/components/PortfolioChart';
import { useVaultStore, VaultData } from '@/stores/vaultStore';
import { useVaults } from '@/hooks/useVaults';
import { useVaultPosition } from '@/hooks/useVaultPosition';
import { useVaultTVL } from '@/hooks/useVaultTVL';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { getPrimaryDepositToken } from '@/utils/tokenUtils';
import { formatUnits } from 'viem';
import gsap from 'gsap';
import { ChainId } from '@/types/chain';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getRiskLevel = (apy: number, strategy?: string): 'Low' | 'Medium' | 'High' => {
  const mod: Record<string, number> = {
    stable_max: -5, concentrated_liquidity: 5, arbitrage: 3,
    yield_farming: 2, hedge: 0, sei_hypergrowth: 8, blue_chip: -2, delta_neutral: -3,
  }
  const adjusted = apy * 100 + (strategy ? (mod[strategy] || 0) : 0)
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

const getSolanaDepositToken = (vault: VaultData) =>
  vault.strategy === 'stable_max' || vault.tokenA.toUpperCase().includes('USDC')
    ? vault.tokenA
    : vault.tokenA.toUpperCase().includes('SOL')
      ? vault.tokenA
      : 'SOL'

const toSolanaDepositVault = (vault: VaultData | null) => {
  if (!vault) return null

  const depositToken = getSolanaDepositToken(vault)

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

const RISK_STYLE = {
  Low: { color: '#6ee7b7', bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)' },
  Medium: { color: '#fcd34d', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)' },
  High: { color: '#fca5a5', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)' },
}

const getStrategyDetails = (strategy: string, tokenA: string, tokenB: string) => {
  const map: Record<string, { description: string; features: string[]; riskFactors: string[]; rebalanceFrequency: string }> = {
    concentrated_liquidity: {
      description: `This vault uses concentrated liquidity positions on DEXes to maximize capital efficiency. By focusing liquidity within a tight price range around the ${tokenA}-${tokenB} pair's current price, the strategy earns significantly higher fees compared to traditional full-range positions. Our AI continuously monitors price movements and adjusts ranges to maintain optimal positioning.`,
      features: ['AI-optimized price range selection', 'Dynamic range adjustment based on volatility', 'Automatic position rebalancing every hour', 'MEV-protected transactions', 'Gas-optimized batch operations'],
      riskFactors: ['Impermanent loss during high volatility', 'Range may go out of bounds requiring rebalancing', 'Smart contract risk'],
      rebalanceFrequency: 'Every 1–4 hours based on market conditions',
    },
    yield_farming: {
      description: `The Yield Farming vault actively seeks the highest yield opportunities across multiple DeFi protocols for ${tokenA}-${tokenB}. It automatically compounds rewards, harvests incentive tokens, and reallocates capital to maximize APY while managing risk through diversification.`,
      features: ['Multi-protocol yield optimization', 'Auto-compounding every 24 hours', 'Reward token harvesting and conversion', 'Protocol risk diversification', 'Gas-efficient batch harvesting'],
      riskFactors: ['Protocol-specific smart contract risks', 'Reward token price volatility', 'Impermanent loss on LP positions'],
      rebalanceFrequency: 'Daily compounding with weekly strategy rebalancing',
    },
    arbitrage: {
      description: `This vault captures price discrepancies between different DEXes and liquidity pools for ${tokenA}-${tokenB}. Using high-frequency monitoring and instant execution, it profits from temporary price inefficiencies while maintaining delta-neutral exposure.`,
      features: ['Cross-DEX price monitoring', 'Sub-second execution capability', 'Flash loan integration', 'Slippage protection algorithms', 'Profit-locking mechanisms'],
      riskFactors: ['Execution risk during high volatility', 'MEV competition from other arbitrageurs', 'Network congestion delays'],
      rebalanceFrequency: 'Continuous monitoring with instant execution',
    },
    delta_neutral: {
      description: `The Delta Neutral vault maintains market-neutral positions by hedging ${tokenA} exposure through perpetual futures or options, generating yield from funding rates and basis trades while eliminating directional market risk.`,
      features: ['Perpetual futures hedging', 'Funding rate optimization', 'Basis trade capture', 'Automated hedge rebalancing', 'Market-neutral exposure maintenance'],
      riskFactors: ['Funding rate reversal risk', 'Basis convergence timing risk', 'Liquidation risk on leveraged positions'],
      rebalanceFrequency: 'Every 8 hours or when hedge ratio deviates >2%',
    },
    stable_max: {
      description: `Designed for capital preservation, this vault focuses on ${tokenA}-${tokenB} stablecoin pairs to generate consistent yields with minimal volatility across lending protocols and stablecoin pools.`,
      features: ['Stablecoin-focused strategies', 'Multi-protocol diversification', 'High liquidity maintenance', 'Minimal impermanent loss risk', 'Conservative position sizing'],
      riskFactors: ['Stablecoin depeg risk', 'Lower yields compared to volatile pairs', 'Protocol risk from lending platforms'],
      rebalanceFrequency: 'Weekly optimization with daily monitoring',
    },
    sei_hypergrowth: {
      description: `An aggressive growth strategy targeting high-yield opportunities in the SEI ecosystem. This vault actively participates in new protocol launches, liquidity mining incentives, and high-APY farms for ${tokenA}-${tokenB}.`,
      features: ['Early access to SEI ecosystem launches', 'High-yield farm participation', 'Aggressive position sizing', 'Quick capital rotation', 'Incentive token optimization'],
      riskFactors: ['High volatility exposure', 'New protocol smart contract risks', 'Impermanent loss on volatile pairs', 'Rug pull risk from new projects'],
      rebalanceFrequency: 'Multiple times daily based on opportunities',
    },
    blue_chip: {
      description: `A conservative strategy focusing on established, battle-tested protocols for ${tokenA}-${tokenB}, prioritizing security and reliability over maximum yields.`,
      features: ['Top-tier protocol selection only', 'Extensive due diligence process', 'Lower but consistent yields', 'Battle-tested smart contracts', 'Institutional-grade security'],
      riskFactors: ['Lower yields than aggressive strategies', 'Still subject to market-wide risks', 'Protocol governance changes'],
      rebalanceFrequency: 'Monthly rebalancing with continuous monitoring',
    },
    hedge: {
      description: `This vault employs sophisticated hedging techniques to protect ${tokenA}-${tokenB} positions against market downturns using options, perpetuals, and dynamic position sizing.`,
      features: ['Options-based downside protection', 'Dynamic hedge ratio adjustment', 'Tail risk management', 'Volatility harvesting', 'Portfolio insurance mechanisms'],
      riskFactors: ['Hedging costs reduce overall returns', 'Options premium decay', 'Imperfect hedge correlation'],
      rebalanceFrequency: 'Every 4 hours or on significant price moves',
    },
  }
  return map[strategy] || {
    description: `This vault optimizes liquidity provision for ${tokenA}-${tokenB} using advanced AI algorithms.`,
    features: ['AI-driven optimization', 'Automatic rebalancing', 'MEV protection', 'Gas optimization'],
    riskFactors: ['Smart contract risk', 'Market volatility', 'Impermanent loss'],
    rebalanceFrequency: 'Varies based on market conditions',
  }
}

const getStrategyTradingStats = (strategy: string, tvl: number, winRate: number, sharpeRatio: number, maxDrawdown: number) => {
  const tpd: Record<string, number> = {
    concentrated_liquidity: 6, yield_farming: 2, arbitrage: 50,
    delta_neutral: 4, stable_max: 1, sei_hypergrowth: 8, blue_chip: 0.5, hedge: 6,
  }
  const vm: Record<string, number> = {
    concentrated_liquidity: 1.2, yield_farming: 0.9, arbitrage: 0.3,
    delta_neutral: 0.5, stable_max: 0.2, sei_hypergrowth: 1.8, blue_chip: 0.6, hedge: 0.7,
  }
  const tr: Record<string, { best: number; worst: number }> = {
    concentrated_liquidity: { best: 2.5, worst: -1.8 },
    yield_farming: { best: 1.8, worst: -0.8 },
    arbitrage: { best: 0.5, worst: -0.2 },
    delta_neutral: { best: 0.8, worst: -0.4 },
    stable_max: { best: 0.3, worst: -0.1 },
    sei_hypergrowth: { best: 8.0, worst: -5.0 },
    blue_chip: { best: 1.2, worst: -0.6 },
    hedge: { best: 1.5, worst: -1.0 },
  }
  const tradesPerDay = tpd[strategy] || 2
  const volatility = vm[strategy] || 1
  const returns = tr[strategy] || { best: 2, worst: -1 }
  const totalTrades = Math.floor(tvl > 0 ? tradesPerDay * 30 * (tvl / 10000 + 1) : 0)
  const avgTradeSize = tvl > 0 ? (tvl / Math.max(totalTrades, 1) * 10) : 0
  return {
    totalTrades,
    avgTradeSize,
    bestTrade: (returns.best * (1 + winRate) * (sharpeRatio / 2)).toFixed(2),
    worstTrade: (Math.abs(returns.worst) * (1 + maxDrawdown)).toFixed(2),
    tradesPerDay,
    volatility: (volatility * 12.5).toFixed(1),
  }
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="yd-section-header">
      <span style={{ color, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span className="yd-section-label">{label}</span>
      <div className="yd-section-rule" />
    </div>
  )
}

// ─── Glass card ────────────────────────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: '16px',
      padding: '1.5rem',
      backdropFilter: 'blur(16px)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Main content ──────────────────────────────────────────────────────────────

interface VaultDetailPageProps {
  vaultAddress: string | null;
  activeTab: string;
  action: string | null;
  searchParams: URLSearchParams;
}

function VaultDetailPageContent({ vaultAddress, action }: VaultDetailPageProps) {
  const router = useRouter()
  const heroRef = useRef<HTMLDivElement>(null)
  const hasRefetchedRef = useRef(false)

  const [showDepositModal, setShowDepositModal] = useState(action === 'deposit')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const { selectedVault, setSelectedVault, getVaultByAddress } = useVaultStore()
  const { data: vaultsData, isLoading } = useVaults()
  const { data: tokenPrices } = useTokenPrices()

  const vault = selectedVault || (vaultAddress ? getVaultByAddress(vaultAddress) : null)
  const isSolanaVault = vault?.chainId === ChainId.SOLANA_DEVNET || vault?.chainId === ChainId.SOLANA_MAINNET

  const { position, hasPosition, refetch: refetchPosition } = useVaultPosition(vaultAddress || '')
  const { tvlMap, isLoading: tvlLoading, refetch: refetchTVL } = useVaultTVL(vaultAddress ? [vaultAddress] : [])
  const onChainTVL = vaultAddress ? (tvlMap.get(vaultAddress.toLowerCase()) || 0) : 0

  const vaultPrimaryToken = vault ? getPrimaryDepositToken(vault) : null
  const tvlTokenSymbol = vaultPrimaryToken?.symbol || 'SEI'
  const tvlDecimals = vaultPrimaryToken?.decimals || 18

  const vaultPositionsForChart = vault && position && hasPosition ? [{
    address: vault.address,
    totalDeposited: position.totalDeposited,
    depositTime: position.depositTime,
    apy: vault.apy * 100,
    shareValue: position.shareValue,
  }] : []

  useEffect(() => {
    if (vaultAddress && vault && !hasRefetchedRef.current) {
      hasRefetchedRef.current = true
      const t = setTimeout(() => { refetchTVL(); refetchPosition() }, 300)
      return () => clearTimeout(t)
    }
  }, [vaultAddress, vault, refetchTVL, refetchPosition])

  useEffect(() => { hasRefetchedRef.current = false }, [vaultAddress])

  useEffect(() => {
    if (vaultAddress && !vault && vaultsData) {
      const found = vaultsData.find(v => v.address === vaultAddress)
      if (found) setSelectedVault(found)
    }
  }, [vaultAddress, vault, vaultsData, setSelectedVault])

  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(heroRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out' }
      )
    }
  }, [vault])

  if (isLoading) return (
    <div style={{ minHeight: '100vh', background: '#07080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 style={{ width: 28, height: 28, color: '#00f5d4', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>Loading vault...</p>
      </div>
    </div>
  )

  if (!vault) return (
    <div style={{ minHeight: '100vh', background: '#07080f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, color: 'rgba(255,255,255,0.85)' }}>Vault Not Found</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>The requested vault could not be found.</p>
        <button onClick={() => router.push('/vaults')} style={{
          padding: '10px 24px', borderRadius: 12, background: '#00f5d4',
          color: '#050508', fontWeight: 700, cursor: 'pointer', border: 'none',
        }}>Back to Vaults</button>
      </div>
    </div>
  )

  const vaultColor = getVaultColor(vault.strategy)
  const riskLevel = getRiskLevel(vault.apy, vault.strategy)
  const riskStyle = RISK_STYLE[riskLevel]
  const strategyDetails = getStrategyDetails(vault.strategy, vault.tokenA, vault.tokenB)
  const tradingStats = getStrategyTradingStats(vault.strategy, onChainTVL, vault.performance.winRate, vault.performance.sharpeRatio, vault.performance.maxDrawdown)

  // Historical returns
  const dailyRate = vault.apy / 365
  const return1D = (dailyRate * 100).toFixed(2)
  const return7D = (dailyRate * 7 * 100).toFixed(2)
  const return30D = (dailyRate * 30 * 100).toFixed(2)
  const returnAll = (vault.performance.totalReturn * 100).toFixed(1)

  // Radar data — Strategy DNA
  const dnaData = [
    { metric: 'YIELD',      value: Math.min(vault.apy * 100 * 8, 100) },
    { metric: 'SAFETY',     value: Math.max(0, 100 - vault.performance.maxDrawdown * 500) },
    { metric: 'ACTIVITY',   value: Math.min(tradingStats.tradesPerDay * 8, 100) },
    { metric: 'EFFICIENCY', value: Math.min(vault.performance.sharpeRatio * 38, 100) },
    { metric: 'LIQUIDITY',  value: Math.min(onChainTVL / 100 + 20, 100) },
  ]

  // Position P&L
  const pnlData = hasPosition && position ? (() => {
    const deposited = parseFloat(formatUnits(BigInt(position.totalDeposited), tvlDecimals))
    const withdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn || '0'), tvlDecimals))
    const current = parseFloat(formatUnits(BigInt(position.shareValue), tvlDecimals))
    const pnl = (current + withdrawn) - deposited
    const pct = deposited > 0 ? (pnl / deposited) * 100 : 0
    return { deposited, withdrawn, current, pnl, pct }
  })() : null

  const handleDepositSuccess = (txHash: string) => {
    console.log('Deposit successful:', txHash)
    setShowDepositModal(false)
    setTimeout(() => { refetchPosition(); refetchTVL() }, 1000)
  }

  const handleWithdrawSuccess = (txHash: string) => {
    console.log('Withdrawal successful:', txHash)
    setShowWithdrawModal(false)
    setTimeout(() => { refetchPosition(); refetchTVL() }, 1000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07080f', position: 'relative' }}>
      {/* Ambient bg gradient */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 70% 20%, ${vaultColor}08 0%, transparent 55%)`,
      }} />

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <div style={{ paddingTop: '80px', position: 'relative', zIndex: 10 }}>
        {/* ── VAULT HERO ─────────────────────────────────────── */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
          {/* Back button */}
          <button
            onClick={() => router.push('/vaults')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
              transition: 'color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Vaults
          </button>

          {/* Hero card */}
          <div
            ref={heroRef}
            className="yd-vault-hero"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)`,
              borderColor: `${vaultColor}25`,
            }}
          >
            {/* Mesh gradient overlay */}
            <div className="yd-vault-hero-mesh" style={{
              background: `radial-gradient(ellipse at 80% 50%, ${vaultColor}10 0%, transparent 60%)`,
            }} />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
              {/* Left: identity */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)', fontSize: 9,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: vaultColor, background: `${vaultColor}14`,
                    border: `1px solid ${vaultColor}28`, borderRadius: 100, padding: '4px 12px',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: vaultColor }} />
                    {vault.strategy.replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono, monospace)', fontSize: 10,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: riskStyle.color, background: riskStyle.bg,
                    border: `1px solid ${riskStyle.border}`, borderRadius: 8, padding: '4px 12px',
                  }}>
                    {riskLevel} Risk
                  </span>
                </div>

                <h1 style={{
                  fontFamily: 'var(--font-display, system-ui)',
                  fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                  fontWeight: 800, lineHeight: 1.05,
                  color: 'rgba(255,255,255,0.92)', margin: '0 0 6px',
                }}>
                  {vault.name}
                </h1>
                <p style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 13, color: 'rgba(255,255,255,0.38)',
                  letterSpacing: '0.05em',
                }}>
                  {vault.tokenA} / {vault.tokenB}
                </p>
              </div>

              {/* Right: APY + secondary stats */}
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
                    Current APY
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 'clamp(48px, 7vw, 72px)',
                    fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em',
                    color: vaultColor,
                    textShadow: `0 0 40px ${vaultColor}55, 0 0 80px ${vaultColor}1a`,
                  }}>
                    {(vault.apy * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                    ANNUALIZED
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 2 }}>TVL</div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 20, fontWeight: 500, color: '#10b981' }}>
                      {tvlLoading ? '...' : `${onChainTVL.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 2 }}>90-Day Return</div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 20, fontWeight: 500, color: '#22c55e' }}>
                      +{(vault.performance.totalReturn * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ─────────────────────────────── */}
        <div className="yd-vault-detail-layout" style={{ paddingTop: '2rem' }}>

          {/* ─── STICKY SIDEBAR ─────────────────────────────── */}
          <aside className="yd-sidebar">
            <div
              className="yd-sidebar-card"
              style={{ '--card-color': vaultColor } as CSSProperties}
            >
              {/* APY */}
              <div className="yd-sidebar-apy">
                <span className="yd-sidebar-apy-label">Current APY</span>
                <span className="yd-sidebar-apy-value" style={{
                  color: vaultColor,
                  textShadow: `0 0 30px ${vaultColor}50`,
                }}>
                  {(vault.apy * 100).toFixed(1)}%
                </span>
              </div>

              {/* Metrics */}
              <div className="yd-sidebar-metrics">
                {[
                  { label: 'TVL', value: tvlLoading ? '...' : `${onChainTVL.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`, color: '#10b981' },
                  { label: 'Win Rate', value: `${(vault.performance.winRate * 100).toFixed(0)}%`, color: '#00f5d4' },
                  { label: 'Sharpe', value: vault.performance.sharpeRatio.toFixed(2), color: '#9b5de5' },
                  { label: 'Max Drawdown', value: `${(vault.performance.maxDrawdown * 100).toFixed(1)}%`, color: vault.performance.maxDrawdown > 0.05 ? '#f87171' : '#6ee7b7' },
                  { label: 'Fee Tier', value: `${(vault.fee * 100).toFixed(2)}%`, color: '#60a5fa' },
                ].map(m => (
                  <div key={m.label} className="yd-sidebar-metric-row">
                    <span className="yd-sidebar-metric-label">{m.label}</span>
                    <span className="yd-sidebar-metric-value" style={{ color: m.color }}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Position (if any) */}
              {hasPosition && pnlData && (
                <div className="yd-sidebar-position">
                  <span className="yd-sidebar-position-label">Your Position</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Value</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: '#4ade80' }}>
                        {pnlData.current.toFixed(tvlDecimals === 6 ? 2 : 4)} {tvlTokenSymbol}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>P&L</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, color: pnlData.pnl >= 0 ? '#4ade80' : '#f87171' }}>
                        {pnlData.pnl >= 0 ? '+' : ''}{pnlData.pct.toFixed(2)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>Net Invested</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                        {(pnlData.deposited - pnlData.withdrawn).toFixed(tvlDecimals === 6 ? 2 : 4)} {tvlTokenSymbol}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CTAs */}
              <button
                className="yd-cta-deposit"
                style={{
                  background: `linear-gradient(135deg, ${vaultColor}e0, ${vaultColor}a0)`,
                  color: '#050508',
                  '--yd-glow': `${vaultColor}35`,
                } as CSSProperties}
                onClick={() => setShowDepositModal(true)}
              >
                Deposit
              </button>

              {hasPosition && (
                <button className="yd-cta-withdraw" onClick={() => setShowWithdrawModal(true)}>
                  Withdraw
                </button>
              )}
            </div>
          </aside>

          {/* ─── SCROLLABLE CONTENT ─────────────────────────── */}
          <main className="yd-scroll-section">

            {/* §1 Performance ──────────────────────────────── */}
            <section>
              <SectionHeader
                icon={<TrendingUp style={{ width: 16, height: 16 }} />}
                label="Performance"
                color={vaultColor}
              />

              <GlassCard style={{ marginBottom: '1rem' }}>
                <PortfolioChart
                  vaultPositions={vaultPositionsForChart}
                  tokenPrices={tokenPrices || {}}
                  vaults={vaultsData}
                />
              </GlassCard>

              <div className="yd-returns-strip">
                {[
                  { period: '1D', value: return1D },
                  { period: '7D', value: return7D },
                  { period: '30D', value: return30D },
                  { period: 'All Time', value: returnAll },
                ].map(({ period, value }) => {
                  const isPos = parseFloat(value) >= 0
                  return (
                    <div key={period} className="yd-return-card">
                      <span className="yd-return-period">{period}</span>
                      <span className="yd-return-value" style={{ color: isPos ? '#4ade80' : '#f87171' }}>
                        {isPos ? '+' : ''}{value}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* §2 Your Position (conditional) ─────────────── */}
            {hasPosition && pnlData && (
              <section>
                <SectionHeader
                  icon={<Coins style={{ width: 16, height: 16 }} />}
                  label="Your Position"
                  color="#4ade80"
                />
                <GlassCard style={{ borderColor: 'rgba(34,197,94,0.15)', background: 'rgba(34,197,94,0.04)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                    {[
                      { label: 'Current Value', value: `${pnlData.current.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`, color: '#4ade80' },
                      { label: 'Net Invested', value: `${(pnlData.deposited - pnlData.withdrawn).toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`, color: 'rgba(255,255,255,0.75)' },
                      { label: 'Unrealized P&L', value: `${pnlData.pnl >= 0 ? '+' : ''}${pnlData.pct.toFixed(2)}%`, color: pnlData.pnl >= 0 ? '#4ade80' : '#f87171' },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 12, padding: '1rem', textAlign: 'center',
                      }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                          {m.label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: m.color }}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </section>
            )}

            {/* §3 Risk & Analytics ─────────────────────────── */}
            <section>
              <SectionHeader
                icon={<Shield style={{ width: 16, height: 16 }} />}
                label="Risk & Analytics"
                color="#9b5de5"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <GlassCard>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>
                    Risk Analysis
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Risk Level</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: riskStyle.color, background: riskStyle.bg,
                        border: `1px solid ${riskStyle.border}`,
                        borderRadius: 6, padding: '3px 10px',
                      }}>{riskLevel}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Volatility</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: '#fb923c' }}>12.3%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Beta</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: '#c084fc' }}>0.87</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Chain ID</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: '#38bdf8' }}>{vault.chainId}</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard>
                  <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '1rem' }}>
                    Trading Statistics
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: 'Rebalances/Day', value: `~${tradingStats.tradesPerDay}`, color: '#9b5de5' },
                      { label: 'Total Rebalances', value: tradingStats.totalTrades > 0 ? tradingStats.totalTrades.toLocaleString() : 'N/A', color: '#60a5fa' },
                      { label: 'Best Rebalance', value: onChainTVL > 0 ? `+${tradingStats.bestTrade}%` : 'N/A', color: '#4ade80' },
                      { label: 'Worst Rebalance', value: onChainTVL > 0 ? `-${tradingStats.worstTrade}%` : 'N/A', color: '#f87171' },
                    ].map(m => (
                      <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: m.color }}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* §4 Strategy DNA ─────────────────────────────── */}
            <section>
              <SectionHeader
                icon={<Target style={{ width: 16, height: 16 }} />}
                label="Strategy DNA"
                color={vaultColor}
              />

              <GlassCard>
                <div className="yd-radar-wrapper">
                  {/* Radar chart */}
                  <div style={{ flex: '0 0 280px', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dnaData} margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                        <PolarGrid
                          stroke="rgba(255,255,255,0.07)"
                          gridType="polygon"
                        />
                        <PolarAngleAxis
                          dataKey="metric"
                          tick={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: 9,
                            fill: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.08em',
                          }}
                        />
                        <Radar
                          dataKey="value"
                          stroke={vaultColor}
                          strokeWidth={2}
                          fill={vaultColor}
                          fillOpacity={0.2}
                          dot={{ r: 3, fill: vaultColor, strokeWidth: 0 }}
                          animationBegin={300}
                          animationDuration={900}
                          animationEasing="ease-out"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Strategy description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display, system-ui)',
                      fontSize: 16, fontWeight: 700,
                      color: 'rgba(255,255,255,0.85)', marginBottom: '0.75rem',
                    }}>
                      {vault.strategy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Strategy
                    </h3>
                    <p style={{
                      fontSize: 13, lineHeight: 1.65,
                      color: 'rgba(255,255,255,0.45)', marginBottom: '1.25rem',
                    }}>
                      {strategyDetails.description}
                    </p>

                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: vaultColor, background: `${vaultColor}10`,
                      border: `1px solid ${vaultColor}22`, borderRadius: 6,
                      padding: '5px 12px', display: 'inline-block',
                    }}>
                      {strategyDetails.rebalanceFrequency}
                    </div>
                  </div>
                </div>

                {/* Features + Risks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: vaultColor, marginBottom: '0.75rem' }}>
                      Key Features
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {strategyDetails.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: vaultColor, marginTop: 1, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fbbf24', marginBottom: '0.75rem' }}>
                      Risk Factors
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {strategyDetails.riskFactors.map((r, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ color: '#fbbf24', marginTop: 1, flexShrink: 0 }}>⚠</span>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Token pair */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'center' }}>
                  <TokenPairDisplay tokenA={vault.tokenA} tokenB={vault.tokenB} size={48} />
                </div>
              </GlassCard>
            </section>

          </main>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────── */}
      {showDepositModal && vault && (isSolanaVault ? (
        <SolanaDepositModal
          vault={toSolanaDepositVault(vault)}
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
        />
      ) : (
        <DepositModal
          vault={vault}
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleDepositSuccess}
        />
      ))}
      <WithdrawModal
        vault={vault}
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleWithdrawSuccess}
        userShares={position?.shares || '0'}
        userValue={position ? formatUnits(BigInt(position.shareValue), tvlDecimals) : '0'}
      />
    </div>
  )
}

export default function VaultDetailPage() {
  return (
    <VaultClientWrapper>
      {({ vaultAddress, activeTab, action, searchParams }) => (
        <VaultDetailPageContent
          vaultAddress={vaultAddress}
          activeTab={activeTab}
          action={action}
          searchParams={searchParams}
        />
      )}
    </VaultClientWrapper>
  )
}
