"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import DemoBanner from '@/components/DemoBanner';
import AIChat from '@/components/AIChat';
import DepositModal from '@/components/DepositModal';
import { MessageCircle, X, Loader2, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSeiMarketData } from '@/hooks/useMarketData';
import { useVaultStore, VaultData } from '@/stores/vaultStore';
import { useVaultTVL } from '@/hooks/useVaultTVL';
import { useTotalTVLInUSD } from '@/hooks/useTotalTVLInUSD';

gsap.registerPlugin(ScrollTrigger);

// ─── Utility functions ─────────────────────────────────────────────────────────

const formatAmount = (amount: number, token: string = 'SEI') => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M ${token}`
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K ${token}`
  if (amount >= 1) return `${amount.toFixed(2)} ${token}`
  return `${amount.toFixed(4)} ${token}`
}

const getVaultToken = (vault: VaultData) =>
  vault.strategy === 'stable_max' || vault.tokenA === 'USDC' ? 'USDC' : 'SEI'

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
  Low: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
  Medium: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  High: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
}

const STRATEGY_FILTERS = [
  { key: 'all', label: 'All_Nodes', color: 'rgba(255,255,255,0.5)' },
  { key: 'concentrated_liquidity', label: 'Concentrated', color: '#00f5d4' },
  { key: 'yield_farming', label: 'Yield_Farming', color: '#9b5de5' },
  { key: 'delta_neutral', label: 'Delta_Neutral', color: '#8b5cf6' },
  { key: 'stable_max', label: 'Stable_Max', color: '#10b981' },
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
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500">{label}</span>
      <span className="text-3xl font-black tracking-tighter" style={{ color }}>
        {loading ? '...' : displayed}{!loading && isNumeric ? suffix : ''}
      </span>
    </div>
  )
}

function Sparkline({ vault, color }: { vault: VaultData, color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const data = useMemo(() => {
    const points = 16
    const base = vault.performance.totalReturn
    return Array.from({ length: points }, (_, i) => base + (Math.sin(i * 0.8) * 0.02) + (Math.random() * 0.01))
  }, [vault.performance.totalReturn])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - Math.min(...data)) / (Math.max(...data) - Math.min(...data) || 1)) * height * 0.8 - (height * 0.1)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, `${color}33`)
    grad.addColorStop(1, 'transparent')
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.fillStyle = grad
    ctx.fill()
  }, [data, color])

  return <canvas ref={canvasRef} width={200} height={60} className="w-full h-12 opacity-50" />
}

export default function VaultsPage() {
  const router = useRouter()
  const mainRef = useRef<HTMLDivElement>(null)
  const vaultCardsRef = useRef<HTMLDivElement>(null)

  const { vaults, isLoading: isVaultsLoading } = useVaultStore()
  const { marketData, isLoading: isMarketLoading } = useSeiMarketData()
  const { totalTVLInUSD, isLoading: tvlUSDLoading } = useTotalTVLInUSD()
  const { getVaultTVL } = useVaultTVL()

  const [activeFilter, setActiveFilter] = useState('all')
  const [showChat, setShowChat] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [depositVault, setDepositVault] = useState<VaultData | null>(null)
  const [selectedVault, setSelectedVault] = useState<VaultData | null>(null)

  const displayVaults = useMemo(() => {
    if (activeFilter === 'all') return vaults
    return vaults.filter(v => v.strategy === activeFilter)
  }, [vaults, activeFilter])

  const avgApy = useMemo(() => {
    if (!vaults.length) return 0
    return (vaults.reduce((sum, v) => sum + v.apy, 0) / vaults.length) * 100
  }, [vaults])

  const handleCloseModal = useCallback(() => {
    setShowDepositModal(false)
    setDepositVault(null)
  }, [])

  const handleDepositSuccess = useCallback((sig: string) => {
    console.log('Deposit success:', sig)
  }, [])

  useEffect(() => {
    if (!isVaultsLoading && mainRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".heritage-header-item", {
          opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: "expo.out"
        })
        gsap.from(".vault-card-anim", {
          opacity: 0, y: 40, duration: 0.8, stagger: 0.05, ease: "power2.out",
          scrollTrigger: { trigger: vaultCardsRef.current, start: "top 85%" }
        })
      }, mainRef)
      return () => ctx.revert()
    }
  }, [isVaultsLoading])

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-[#00f5d4] selection:text-black overflow-x-hidden relative">
      <style jsx global>{`
        .yd-premium-grid {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(circle at center, black, transparent 85%);
        }
      `}</style>

      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#00f5d4]/10 blur-[120px] rounded-full animate-pulse" 
          style={{ animationDuration: '8s' }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#9b5de5]/10 blur-[150px] rounded-full animate-pulse" 
          style={{ animationDuration: '12s', animationDelay: '2s' }}
        />
        <div className="absolute inset-0 yd-premium-grid opacity-50" />
      </div>

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main ref={mainRef} className="relative z-10 pt-28 px-4 md:px-12 lg:px-20 pb-32 max-w-[1800px] mx-auto">
        
        {/* HUD Header */}
        <header className="mb-20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
            <div className="space-y-8">
              <div className="heritage-header-item flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#00f5d4] font-mono bg-[#00f5d4]/10 w-fit px-4 py-1.5 rounded-sm border-l-2 border-[#00f5d4]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f5d4]"></span>
                </span>
                <span>VAULT_NETWORK {"//"} SYNCHRONIZED</span>
              </div>
              
              <h1 className="heritage-header-item text-7xl md:text-[9rem] font-black tracking-tighter leading-[0.8] text-white">
                Quantum <br/>
                <span className="text-[#00f5d4]">Vaults.</span>
              </h1>
              <p className="heritage-header-item text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
                Autonomous liquidity strategies, continuously optimized by AI for maximum mathematical advantage.
              </p>
            </div>

            <div className="heritage-header-item flex flex-wrap gap-12 items-center bg-slate-900/40 backdrop-blur-xl p-10 rounded-sm border border-slate-800/50 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#00f5d4] opacity-50 group-hover:h-1 transition-all duration-500" />
              <StatPillar label="NETWORK_TVL" value={isVaultsLoading || tvlUSDLoading ? '...' : totalTVLInUSD} color="#00f5d4" loading={isVaultsLoading || tvlUSDLoading} />
              <div className="w-px h-16 bg-slate-800 hidden sm:block" />
              <StatPillar label="VAULT_NODES" value={displayVaults.length} color="#9b5de5" loading={isVaultsLoading} isNumeric decimals={0} />
              <div className="w-px h-16 bg-slate-800 hidden sm:block" />
              <StatPillar label="AVG_APY" value={avgApy} color="#10b981" loading={isVaultsLoading} isNumeric suffix="%" />
            </div>
          </div>
        </header>

        {/* Advanced Filters */}
        <section className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 py-8 border-y border-slate-800/50 relative">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Filter_Nodes {"//"}</span>
            <div className="flex flex-wrap gap-3">
              {STRATEGY_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    activeFilter === f.key 
                      ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                      : 'border-slate-800 text-slate-500 hover:border-[#00f5d4]/50 hover:text-[#00f5d4]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/60 rounded-sm border border-slate-800/50">
               <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
               <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Yield_Engine_Active</span>
             </div>
          </div>
        </section>

        {/* Vault Grid - Quantum Refinement */}
        <section className="relative">
          {isVaultsLoading ? (
            <div className="py-40 flex flex-col items-center justify-center">
              <Loader2 className="w-16 h-16 text-[#00f5d4] animate-spin mb-8" />
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 animate-pulse">Establishing_Node_Link...</div>
            </div>
          ) : (
            <div ref={vaultCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-800/20">
              {displayVaults.map(vault => {
                const color = getVaultColor(vault.strategy)
                const risk = getRiskLevel(vault.apy, vault.strategy)
                const riskStyle = RISK_BADGE_STYLES[risk]
                const tvl = getVaultTVL(vault)
                const token = getVaultToken(vault)

                return (
                  <div
                    key={vault.address}
                    onClick={() => router.push(`/vault/${vault.address}`)}
                    className="vault-card-anim group cursor-pointer relative bg-slate-950/40 backdrop-blur-xl p-12 flex flex-col justify-between hover:z-10 hover:bg-slate-900/60 transition-all duration-700 relative overflow-hidden"
                  >
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-1 h-0 bg-[#00f5d4] group-hover:h-full transition-all duration-700" />
                    
                    <div>
                      <header className="flex justify-between items-start mb-16">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-sm bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden group-hover:border-[#00f5d4]/50 transition-colors shadow-inner">
                             <Image src={`/chains/${vault.chainId === 1328 ? 'sei.svg' : 'solana.svg'}`} alt="chain" width={28} height={28} className="w-7 h-7 z-10" />
                             <div className="absolute inset-0 bg-white/5 group-hover:bg-[#00f5d4]/10 transition-colors" />
                           </div>
                           <div>
                             <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-[#00f5d4] transition-colors">{vault.name}</h3>
                             <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">{vault.strategy.replace('_', ' ')}</span>
                           </div>
                        </div>
                        <div 
                          className="px-4 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border"
                          style={{ backgroundColor: riskStyle.bg, color: riskStyle.color, borderColor: riskStyle.border }}
                        >
                          {risk}_Risk
                        </div>
                      </header>

                      <div className="grid grid-cols-2 gap-10 mb-16 relative">
                        <div className="space-y-2">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">Live_Yield</span>
                          <div className="text-5xl font-black text-white group-hover:scale-105 transition-transform origin-left duration-700" style={{ color }}>
                            {(vault.apy * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-slate-500">Liquidity_Node</span>
                          <div className="text-3xl font-bold text-slate-200">
                            {formatAmount(tvl, token)}
                          </div>
                        </div>
                      </div>

                      {/* Sparkline Integration */}
                      <div className="mb-12">
                        <Sparkline vault={vault} color={color} />
                      </div>
                    </div>

                    <div className="pt-10 border-t border-slate-800/50 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-pulse" />
                         <span className="font-mono text-[9px] font-bold text-[#00f5d4] uppercase tracking-widest">Protocol_Optimized</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors duration-700">
                        Access_Terminal <ChevronRight className="w-5 h-5 text-[#00f5d4] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>

      <DemoBanner />
      
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
                vaultData: displayVaults,
                userPreferences: {
                  preferredTimeframe: '1d', riskTolerance: 'medium',
                  autoRebalance: true, selectedVault, marketData: marketData || undefined,
                },
              }}
              initialMessage="🎯 Welcome to Yield Delta Vaults! I'm Kairos, your AI assistant. I can help you analyze vault performance, predict optimal ranges, and recommend rebalancing strategies. What vault would you like to optimize today?"
            />
          </div>
        </div>
      )}

      {/* ── DEPOSIT MODAL ─────────────────────────────────── */}
      <DepositModal
        vault={depositVault}
        isOpen={showDepositModal}
        onClose={handleCloseModal}
        onSuccess={handleDepositSuccess}
      />

      {/* ── FLOATING AI BUTTON ────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        zIndex: 999999, isolation: 'isolate', pointerEvents: 'auto',
      }}>
        <div style={{ position: 'relative' }}>
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
