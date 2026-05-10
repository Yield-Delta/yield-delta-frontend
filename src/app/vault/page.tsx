"use client"

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, Shield, Target, Loader2, Activity, Zap, Database, Cpu } from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer,
} from 'recharts';
import Navigation from '@/components/Navigation';
import DepositModal from '@/components/DepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import VaultClientWrapper from '@/components/VaultClientWrapper';
import TokenPairDisplay from '@/components/TokenPairDisplay';
import PortfolioChart from '@/components/PortfolioChart';
import { useVaultStore } from '@/stores/vaultStore';
import { useVaults } from '@/hooks/useVaults';
import { useVaultPosition } from '@/hooks/useVaultPosition';
import { useVaultTVL } from '@/hooks/useVaultTVL';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { getPrimaryDepositToken } from '@/utils/tokenUtils';
import { formatUnits } from 'viem';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Public_Sans, Space_Grotesk } from 'next/font/google';

gsap.registerPlugin(ScrollTrigger);

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-public-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
});

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

const RISK_STYLE = {
  Low: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
  High: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
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

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <div className="p-3 bg-white/5 border border-white/10 rounded-sm" style={{ color }}>
        {icon}
      </div>
      <h3 className="font-heritage-grotesk text-sm font-bold uppercase tracking-[0.3em] text-[#6C7278]">{label}</h3>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )
}

function StatCard({ label, value, color, desc }: { label: string, value: string, color?: string, desc?: string }) {
  return (
    <div className="bg-[#1A1C1E] p-8 border border-white/5 hover:border-white/10 transition-all group overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-0 bg-[#B8422E]/40 group-hover:h-full transition-all duration-500" />
      <div className="font-heritage-grotesk text-[10px] font-bold uppercase tracking-[0.3em] text-[#6C7278] mb-6">
        {label}
      </div>
      <div className="text-4xl font-black text-[#F7F5F2] group-hover:scale-105 transition-transform origin-left duration-500" style={{ color: color }}>
        {value}
      </div>
      {desc && (
        <div className="font-heritage-grotesk text-[9px] font-bold uppercase pt-6 mt-6 border-t border-white/5 text-[#6C7278]">
          {desc}
        </div>
      )}
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
  const mainRef = useRef<HTMLDivElement>(null)
  const hasRefetchedRef = useRef(false)

  const [showDepositModal, setShowDepositModal] = useState(action === 'deposit')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const { selectedVault, setSelectedVault, getVaultByAddress } = useVaultStore()
  const { data: vaultsData, isLoading } = useVaults()
  const { data: tokenPrices } = useTokenPrices()

  const vault = selectedVault || (vaultAddress ? getVaultByAddress(vaultAddress) : null)

  const { position, hasPosition, refetch: refetchPosition } = useVaultPosition(vaultAddress || '')
  const { tvlMap, refetch: refetchTVL } = useVaultTVL(vaultAddress ? [vaultAddress] : [])
  const onChainTVL = vaultAddress ? (tvlMap.get(vaultAddress.toLowerCase()) || 0) : 0

  const vaultPrimaryToken = vault ? getPrimaryDepositToken(vault) : null
  const tvlTokenSymbol = vaultPrimaryToken?.symbol || 'SEI'
  const tvlDecimals = vaultPrimaryToken?.decimals || 18

  const vaultPositionsForChart = useMemo(() => vault && position && hasPosition ? [{
    address: vault.address,
    totalDeposited: position.totalDeposited,
    depositTime: position.depositTime,
    apy: vault.apy * 100,
    shareValue: position.shareValue,
  }] : [], [vault, position, hasPosition])

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
    if (!isLoading && vault && mainRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".heritage-header-item", {
          opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: "expo.out"
        })
        gsap.from(".heritage-detail-section", {
          opacity: 0, y: 40, duration: 0.8, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: ".heritage-detail-section", start: "top 90%" }
        })
      }, mainRef)
      return () => ctx.revert()
    }
  }, [isLoading, vault])

  if (isLoading) return (
    <div className="min-h-screen bg-[#1A1C1E] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#B8422E] animate-spin mb-6 mx-auto" />
        <p className="font-heritage-grotesk text-[10px] font-bold uppercase tracking-[0.4em] text-[#6C7278]">Synchronizing_Vault_Nodes...</p>
      </div>
    </div>
  )

  if (!vault) return (
    <div className="min-h-screen bg-[#1A1C1E] flex items-center justify-center">
      <div className="text-center max-w-md px-8">
        <h1 className="font-heritage-sans text-4xl font-black text-[#F7F5F2] mb-6">Vault_Not_Found</h1>
        <p className="font-heritage-grotesk text-sm text-[#6C7278] mb-12 uppercase tracking-widest leading-loose">The requested node address does not resonate within the current network state.</p>
        <button onClick={() => router.push('/vaults')} className="px-10 py-4 bg-[#B8422E] text-[#F7F5F2] font-heritage-grotesk text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#A33825] transition-colors">Return_To_Network</button>
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
    <div className={`min-h-screen ${publicSans.variable} ${spaceGrotesk.variable} bg-[#1A1C1E] text-[#F7F5F2] selection:bg-[#B8422E] selection:text-white transition-colors duration-700`} style={{ fontFamily: 'var(--font-public-sans)' }}>
      <style jsx global>{`
        .font-heritage-sans { font-family: var(--font-public-sans); }
        .font-heritage-grotesk { font-family: var(--font-space-grotesk); }
        .heritage-caps { 
          font-family: var(--font-space-grotesk); 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          letter-spacing: 0.2em; 
          font-weight: 700;
        }
      `}</style>
      
      {/* Heritage Atmospheric Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[99] opacity-[0.08] mix-blend-overlay overflow-hidden">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="heritageNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#heritageNoise)" />
        </svg>
      </div>

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main ref={mainRef} className="pt-32 px-6 md:px-12 lg:px-20 max-w-[1800px] mx-auto pb-32">
        
        {/* Editorial Header - Vault Identity */}
        <header className="mb-24 relative">
          <button
            onClick={() => router.push('/vaults')}
            className="heritage-header-item flex items-center gap-3 font-heritage-grotesk text-[10px] font-bold uppercase tracking-[0.4em] text-[#6C7278] hover:text-[#B8422E] transition-colors mb-12 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Return_To_Vault_Nodes
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-baseline gap-12">
            <div className="max-w-4xl">
              <div className="heritage-header-item flex items-center gap-4 mb-8">
                <span className="heritage-caps text-[#B8422E] flex items-center gap-3">
                  <span className="w-8 h-[1px] bg-[#B8422E]" />
                  {vault.strategy.replace(/_/g, ' ')}
                </span>
                <div 
                  className="px-4 py-1 rounded-sm heritage-caps border"
                  style={{ backgroundColor: riskStyle.bg, color: riskStyle.color, borderColor: riskStyle.border }}
                >
                  {riskLevel}_Risk
                </div>
              </div>
              
              <h1 className="heritage-header-item text-7xl md:text-[9rem] font-black leading-[0.8] tracking-tighter mb-8 lowercase text-white">
                {vault.name.split(' ').map((word, i) => (
                  <span key={i} className={i === 1 ? "italic font-extralight block opacity-80" : ""}>
                    {word} {i === 0 && <br/>}
                  </span>
                ))}
              </h1>
              
              <p className="heritage-header-item text-xl md:text-3xl font-medium max-w-2xl leading-tight text-[#F7F5F2]/60 mt-12">
                Decentralized liquidity optimization for the <span className="text-white">{vault.tokenA}/{vault.tokenB}</span> node pair.
              </p>
            </div>
            
            <div className="heritage-header-item w-full lg:w-auto flex flex-col items-end gap-12">
              <div className="text-right flex flex-col items-end">
                <span className="heritage-caps text-[#6C7278] mb-4">Current_Yield</span>
                <div className="relative group">
                  <span className="text-8xl md:text-[10rem] font-black leading-none tracking-tighter" style={{ color: vaultColor }}>
                    {(vault.apy * 100).toFixed(0)}
                  </span>
                  <div className="absolute -top-4 -right-8 text-2xl font-black text-white/40">%</div>
                  <div className="absolute bottom-4 left-0 w-0 h-2 bg-[#B8422E]/40 group-hover:w-full transition-all duration-700" />
                </div>
                <span className="heritage-caps text-[#6C7278] mt-4">Annualized_APY</span>
              </div>
              
              <div className="flex gap-4">
                 <button 
                   onClick={() => setShowDepositModal(true)}
                   className="px-10 py-5 bg-[#F7F5F2] text-[#1A1C1E] heritage-caps rounded-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl"
                 >
                   Deposit_Assets
                 </button>
                 {hasPosition && (
                   <button 
                     onClick={() => setShowWithdrawModal(true)}
                     className="px-10 py-5 border border-white/20 text-[#F7F5F2] heritage-caps rounded-sm hover:bg-white/5 transition-all"
                   >
                     Withdraw
                   </button>
                 )}
              </div>
            </div>
          </div>
        </header>

        {/* High-Contrast Analytics Grid */}
        <section className="mb-32 heritage-detail-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5">
            <StatCard label="NETWORK_TVL" value={`${onChainTVL.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`} color="#10b981" desc="Total Value Locked in Strategy" />
            <StatCard label="90D_RETURN" value={`+${returnAll}%`} color="#00f5d4" desc="Compounded Performance Node" />
            <StatCard label="SHARPE_RATIO" value={vault.performance.sharpeRatio.toFixed(2)} color="#9b5de5" desc="Risk-Adjusted Efficiency Score" />
            <StatCard label="VOLATILITY" value={`${tradingStats.volatility}%`} color={riskStyle.color} desc="Mathematical Deviation Matrix" />
          </div>
        </section>

        {/* Two-Column Deep Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 heritage-detail-section">
          
          {/* Left Side: Performance & Position */}
          <div className="lg:col-span-2 space-y-32">
            
            {/* Performance Chart */}
            <section>
              <SectionHeader 
                icon={<Activity className="w-5 h-5" />} 
                label="Analytical_Pulse" 
                color={vaultColor} 
              />
              <div className="bg-[#1A1C1E] border border-white/5 p-10 relative group">
                <div className="absolute top-0 right-0 p-6 flex gap-4">
                   <div className="flex items-center gap-2 heritage-caps text-[8px] text-[#6C7278]">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#B8422E]" />
                     Historical_Nodes
                   </div>
                   <div className="flex items-center gap-2 heritage-caps text-[8px] text-[#6C7278]">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#00f5d4]" />
                     AI_Projection
                   </div>
                </div>
                <div className="h-[400px]">
                  <PortfolioChart
                    vaultPositions={vaultPositionsForChart}
                    tokenPrices={tokenPrices || {}}
                    vaults={vaultsData}
                  />
                </div>
                
                <div className="grid grid-cols-4 mt-12 border-t border-white/5">
                   {[
                     { label: '1D_DELTA', value: return1D },
                     { label: '7D_DELTA', value: return7D },
                     { label: '30D_DELTA', value: return30D },
                     { label: 'TOTAL_GAIN', value: returnAll },
                   ].map((d, i) => (
                     <div key={i} className="p-8 border-r last:border-0 border-white/5 text-center group/item hover:bg-white/[0.02] transition-colors">
                        <div className="heritage-caps text-[8px] text-[#6C7278] mb-3">{d.label}</div>
                        <div className={`text-2xl font-black ${parseFloat(d.value) >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                          {parseFloat(d.value) >= 0 ? '+' : ''}{d.value}%
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </section>

            {/* Position Details */}
            {hasPosition && pnlData && (
              <section>
                <SectionHeader 
                  icon={<Database className="w-5 h-5" />} 
                  label="Node_Position_Data" 
                  color="#10b981" 
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
                   {[
                     { label: 'Current_Value', value: `${pnlData.current.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`, color: '#10b981' },
                     { label: 'Net_Invested', value: `${(pnlData.deposited - pnlData.withdrawn).toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`, color: '#F7F5F2' },
                     { label: 'Unrealized_P&L', value: `${pnlData.pnl >= 0 ? '+' : ''}${pnlData.pct.toFixed(2)}%`, color: pnlData.pnl >= 0 ? '#10b981' : '#ef4444' },
                   ].map((m, i) => (
                     <div key={i} className="bg-[#1A1C1E] p-10 flex flex-col items-center text-center group hover:bg-white/[0.02] transition-colors">
                        <div className="heritage-caps text-[9px] text-[#6C7278] mb-6">{m.label}</div>
                        <div className="text-3xl font-black" style={{ color: m.color }}>{m.value}</div>
                     </div>
                   ))}
                </div>
              </section>
            )}

            {/* Strategy DNA */}
            <section>
              <SectionHeader 
                icon={<Cpu className="w-5 h-5" />} 
                label="Strategy_Dna_Sequence" 
                color="#9b5de5" 
              />
              <div className="bg-[#1A1C1E] border border-white/5 p-12 flex flex-col xl:flex-row gap-16 items-center">
                 <div className="w-[300px] h-[300px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dnaData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" gridType="polygon" />
                        <PolarAngleAxis
                          dataKey="metric"
                          tick={{ fontFamily: 'var(--font-space-grotesk)', fontSize: 10, fill: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', fontWeight: 700 }}
                        />
                        <Radar
                          dataKey="value"
                          stroke={vaultColor}
                          strokeWidth={3}
                          fill={vaultColor}
                          fillOpacity={0.1}
                          dot={{ r: 4, fill: vaultColor, strokeWidth: 0 }}
                          animationBegin={400}
                          animationDuration={1200}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex-1 space-y-10">
                    <div>
                      <h4 className="text-3xl font-black text-white mb-6 lowercase tracking-tight">The_Logic.</h4>
                      <p className="text-sm leading-loose text-[#6C7278] font-medium">
                        {strategyDetails.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                       <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-sm heritage-caps text-[9px] text-[#F7F5F2]">
                         {strategyDetails.rebalanceFrequency}
                       </div>
                       <div className="px-6 py-2 bg-[#B8422E]/10 border border-[#B8422E]/20 rounded-sm heritage-caps text-[9px] text-[#B8422E]">
                         MEV_PROTECTED
                       </div>
                    </div>
                 </div>
              </div>
            </section>

          </div>

          {/* Right Side: Features & Metadata */}
          <div className="space-y-32">
             
             {/* Key Features */}
             <section>
               <SectionHeader 
                 icon={<Zap className="w-5 h-5" />} 
                 label="Protocol_Features" 
                 color="#00f5d4" 
               />
               <div className="space-y-6">
                 {strategyDetails.features.map((f, i) => (
                   <div key={i} className="bg-white/5 p-8 border border-white/5 rounded-sm group hover:border-[#00f5d4]/40 transition-colors">
                      <div className="flex items-start gap-5">
                         <div className="w-1.5 h-1.5 rounded-full bg-[#00f5d4] mt-1.5 group-hover:scale-150 transition-transform" />
                         <span className="text-sm font-medium text-[#F7F5F2]/80 leading-relaxed group-hover:text-white transition-colors">{f}</span>
                      </div>
                   </div>
                 ))}
               </div>
             </section>

             {/* Risk Factors */}
             <section>
               <SectionHeader 
                 icon={<Shield className="w-5 h-5" />} 
                 label="Network_Risks" 
                 color="#B8422E" 
               />
               <div className="bg-[#B8422E]/5 border border-[#B8422E]/10 p-10 space-y-8 rounded-sm">
                 {strategyDetails.riskFactors.map((r, i) => (
                   <div key={i} className="flex items-start gap-5">
                      <span className="text-[#B8422E] font-black mt-0.5">/</span>
                      <span className="text-sm font-medium text-[#6C7278] leading-relaxed italic">{r}</span>
                   </div>
                 ))}
               </div>
             </section>

             {/* Trading Stats Metadata */}
             <section>
               <SectionHeader 
                 icon={<TrendingUp className="w-5 h-5" />} 
                 label="Node_Statistics" 
                 color="#9b5de5" 
               />
               <div className="bg-[#1A1C1E] border border-white/5 p-10 space-y-10 rounded-sm">
                  {[
                    { label: 'AVG_DAILY_NODES', value: `~${tradingStats.tradesPerDay}`, color: '#9b5de5' },
                    { label: 'TOTAL_REBALANCES', value: tradingStats.totalTrades.toLocaleString(), color: '#F7F5F2' },
                    { label: 'PEAK_PERFORMANCE', value: `+${tradingStats.bestTrade}%`, color: '#10b981' },
                    { label: 'MAX_DRAWDOWN', value: `-${tradingStats.worstTrade}%`, color: '#ef4444' },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-end border-b border-white/5 pb-6 last:border-0 last:pb-0">
                       <span className="heritage-caps text-[9px] text-[#6C7278]">{s.label}</span>
                       <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
                    </div>
                  ))}
               </div>
             </section>

             {/* Token Architecture */}
             <section>
               <SectionHeader 
                 icon={<Target className="w-5 h-5" />} 
                 label="Token_Architecture" 
                 color="#F7F5F2" 
               />
               <div className="bg-[#1A1C1E] border border-white/5 p-12 flex flex-col items-center gap-10 rounded-sm">
                  <TokenPairDisplay tokenA={vault.tokenA} tokenB={vault.tokenB} size={64} />
                  <div className="text-center space-y-4">
                     <div className="text-2xl font-black text-white">{vault.tokenA} / {vault.tokenB}</div>
                     <p className="text-[10px] heritage-caps text-[#6C7278] tracking-[0.4em]">Asset_Liquidity_Pair</p>
                  </div>
               </div>
             </section>

          </div>
        </div>

        {/* Methodology Footer */}
        <section className="mt-60 border-t-4 border-[#B8422E] pt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
             <div>
                <h4 className="text-2xl font-black uppercase mb-8 text-white">System_Logic.</h4>
                <p className="text-sm text-[#6C7278] leading-loose font-medium">
                  The mathematical parameters of this vault are calculated via multi-timeframe price action nodes and network throughput metrics. Performance is verified through continuous node synchronization.
                </p>
             </div>
             <div className="flex flex-col justify-end">
                <div className="heritage-caps text-[#6C7278] mb-4">SYNC_TIMESTAMP</div>
                <div className="text-3xl font-black text-white/40 font-mono">{new Date().toLocaleTimeString()}</div>
             </div>
             <div className="flex flex-col justify-end items-end text-right">
                <div className="heritage-caps text-[#6C7278] mb-4">NODE_STATUS</div>
                <div className="flex items-center gap-3">
                   <span className="heritage-caps text-[#10b981]">All_Signals_Normal</span>
                   <div className="w-3 h-3 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_12px_#10b981]" />
                </div>
             </div>
          </div>
        </section>

      </main>

      {/* ── MODALS ────────────────────────────────────────── */}
      <DepositModal
        vault={vault}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
      />
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
