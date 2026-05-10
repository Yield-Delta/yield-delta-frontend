"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { TrendingUp, ArrowRight, Loader2, Info, Activity, Clock, Layers, Globe, ShieldCheck, Zap, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaults } from '@/hooks/useVaults';
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

const STRATEGY_COLORS: Record<string, string> = {
  concentrated_liquidity: '#00f5d4',
  yield_farming: '#9b5de5',
  arbitrage: '#ff206e',
  stable_max: '#10b981',
  delta_neutral: '#8b5cf6',
  hedge: '#f59e0b',
  sei_hypergrowth: '#f59e0b',
  blue_chip: '#3b82f6',
}

const getStrategyColor = (s: string) => STRATEGY_COLORS[s] ?? '#00f5d4'

const MarketPage = () => {
  const router = useRouter()
  const { data: vaults, isLoading, isError } = useVaults()
  const mainRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
    return `$${num.toFixed(decimals)}`
  }

  const totalTVL = vaults?.reduce((sum, v) => sum + v.tvl, 0) || 0
  const avgAPY = vaults && vaults.length > 0
    ? (vaults.reduce((sum, v) => sum + v.apy, 0) / vaults.length) * 100
    : 0

  const STATS = [
    { label: 'GLOBAL_TVL_NODE', value: isLoading ? '...' : formatNumber(totalTVL), accent: '#00f5d4', tag: 'NET_RESONANCE' },
    { label: 'ACTIVE_STRATEGIES', value: isLoading ? '...' : String(vaults?.length ?? 0), accent: '#9b5de5', tag: 'NODE_COUNT' },
    { label: 'SYSTEM_AVG_APY', value: isLoading ? '...' : `${avgAPY.toFixed(1)}%`, accent: '#10b981', tag: 'LIVE_YIELD' },
  ]

  useEffect(() => {
    if (!isLoading && vaults && mainRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".heritage-header-item", {
          opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: "expo.out"
        });
        gsap.from(".market-stat-anim", {
          opacity: 0, y: 20, duration: 0.8, stagger: 0.05, ease: "power2.out"
        });
        gsap.from(".market-row-anim", {
          opacity: 0, y: 10, duration: 0.5, stagger: 0.03, ease: "power2.out",
          scrollTrigger: { trigger: tableRef.current, start: "top 90%" }
        });
      }, mainRef);
      return () => ctx.revert();
    }
  }, [isLoading, vaults]);

  return (
    <div className={`min-h-screen ${publicSans.variable} ${spaceGrotesk.variable} bg-[#020617] text-slate-50 font-sans selection:bg-[#00f5d4] selection:text-black overflow-x-hidden relative`}>
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
        .yd-premium-grid {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(circle at center, black, transparent 85%);
        }
        .market-stat-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .market-stat-card:hover {
          border-color: rgba(0, 245, 212, 0.2);
          background: rgba(15, 23, 42, 0.6);
          transform: translateY(-2px);
        }
        .market-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: background 0.3s ease;
        }
        .market-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#00f5d4]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#9b5de5]/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '15s', animationDelay: '3s' }} />
        <div className="absolute inset-0 yd-premium-grid opacity-40" />
      </div>

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main ref={mainRef} className="relative z-10 pt-28 px-4 md:px-12 lg:px-20 pb-32 max-w-[1800px] mx-auto">
        
        {/* HUD Header */}
        <header className="mb-20">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
            <div className="space-y-8">
              <div className="heritage-header-item flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#00f5d4] font-mono bg-[#00f5d4]/10 w-fit px-4 py-1.5 rounded-sm border-l-2 border-[#00f5d4]">
                <Globe className="w-3 h-3" />
                <span>GLOBAL_MARKET {"//"} OVERSIGHT</span>
              </div>
              
              <h1 className="heritage-header-item text-7xl md:text-[9rem] font-black tracking-tighter leading-[0.8] text-white">
                Market <br/>
                <span className="text-[#00f5d4]">Dynamics.</span>
              </h1>
              <p className="heritage-header-item text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
                Real-time transparency into decentralized strategy resonance across the SEI ecosystem.
              </p>
            </div>

            <div className="heritage-header-item flex flex-col items-end gap-4">
               <div className="flex items-center gap-3 px-6 py-3 bg-slate-900/60 rounded-sm border border-slate-800/50">
                 <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_12px_#10b981]" />
                 <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#10b981]">Node_Status: Optimal</span>
               </div>
               <div className="font-mono text-[9px] font-bold uppercase text-slate-500 tracking-[0.3em]">
                 CHAIN_ID: SEI_ATLANTIC_2 {"//"} 1328
               </div>
            </div>
          </div>
        </header>

        {/* Global Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {STATS.map((stat, i) => (
            <div key={i} className="market-stat-anim market-stat-card p-10 relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-0 bg-[#00f5d4] group-hover:h-full transition-all duration-500" style={{ backgroundColor: stat.accent }} />
               <div className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-12">{stat.label}</div>
               <div className="text-6xl font-black mb-4 tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500" style={{ color: stat.accent }}>{stat.value}</div>
               <div className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-white/5 pt-6">{stat.tag}</div>
            </div>
          ))}
        </div>

        {/* Strategic Node Ledger */}
        <div ref={tableRef} className="space-y-8">
           <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-12">
              <div className="p-3 bg-white/5 border border-white/10">
                <Database className="w-5 h-5 text-[#00f5d4]" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">Strategic_Node_Ledger</h2>
              <div className="flex-1 h-px bg-white/10" />
           </div>

           <div className="bg-slate-900/20 backdrop-blur-xl border border-white/5 rounded-sm overflow-hidden">
             {isLoading ? (
               <div className="py-40 flex flex-col items-center justify-center">
                 <Loader2 className="w-16 h-16 text-[#00f5d4] animate-spin mb-8" />
                 <div className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Loading_Ledger_Data...</div>
               </div>
             ) : isError ? (
               <div className="py-40 text-center">
                 <Info className="w-16 h-16 text-red-500 mx-auto mb-8" />
                 <h3 className="text-2xl font-black text-white mb-2">Sync_Failure</h3>
                 <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Failed to reconcile market state from decentralized nodes</p>
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="bg-white/5">
                     <tr className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <th className="px-10 py-6">STRATEGIC_NODE</th>
                       <th className="px-10 py-6 text-right">STRATEGY_CLASS</th>
                       <th className="px-10 py-6 text-right">TOTAL_VALUE_LOCKED</th>
                       <th className="px-10 py-6 text-right">PROJECTED_APY</th>
                       <th className="px-10 py-6 text-right">ASSET_PAIR</th>
                       <th className="px-10 py-6 text-right">DIRECTIVE</th>
                     </tr>
                   </thead>
                   <tbody>
                     {vaults?.map((vault) => {
                       const color = getStrategyColor(vault.strategy)
                       return (
                         <tr key={vault.address} className="market-row-anim market-row group cursor-pointer" onClick={() => router.push(`/vault/${vault.address}`)}>
                           <td className="px-10 py-10">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 bg-slate-800 border border-white/10 flex items-center justify-center group-hover:border-[#00f5d4]/40 transition-colors shadow-xl">
                                    <span className="text-[10px] font-black" style={{ color }}>{vault.tokenA.slice(0, 3)}</span>
                                 </div>
                                 <div>
                                   <div className="text-xl font-bold text-white group-hover:text-[#00f5d4] transition-colors">{vault.name}</div>
                                   <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mt-1">Node: {vault.address.slice(0, 8)}...{vault.address.slice(-4)}</div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-10 py-10 text-right">
                              <span className="px-4 py-1.5 rounded-sm heritage-caps text-[9px] border" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}05` }}>
                                {vault.strategy.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="px-10 py-10 text-right">
                              <div className="text-2xl font-black text-[#F7F5F2] tracking-tighter">{formatNumber(vault.tvl)}</div>
                           </td>
                           <td className="px-10 py-10 text-right">
                              <div className="text-2xl font-black text-[#10b981] tracking-tighter">{(vault.apy * 100).toFixed(1)}%</div>
                           </td>
                           <td className="px-10 py-10 text-right">
                              <div className="font-mono text-[11px] font-bold text-slate-400 tracking-widest uppercase">{vault.tokenA} / {vault.tokenB}</div>
                           </td>
                           <td className="px-10 py-10 text-right">
                              <div className="inline-flex items-center justify-center px-6 py-2 border border-white/10 group-hover:border-[#00f5d4]/50 group-hover:bg-[#00f5d4]/5 transition-all heritage-caps text-[9px] text-slate-500 group-hover:text-[#00f5d4]">
                                View_Node <ChevronRight className="w-3 h-3 ml-2" />
                              </div>
                           </td>
                         </tr>
                       )
                     })}
                   </tbody>
                 </table>
               </div>
             )}
           </div>
        </div>

        {/* Methodology Footer */}
        <section className="mt-40 border-t-4 border-[#00f5d4]/20 pt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
             <div className="space-y-8">
                <div className="flex items-center gap-4">
                   <ShieldCheck className="w-6 h-6 text-[#9b5de5]" />
                   <h4 className="text-2xl font-black uppercase text-white">Security_Audit.</h4>
                </div>
                <p className="text-sm text-slate-500 leading-loose font-medium">
                  All market dynamic indices are verified through cryptographic proof nodes and real-time smart contract synchronization. Protocol risk assessment is calculated via multi-vector volatility matrices.
                </p>
             </div>
             <div className="flex flex-col justify-end">
                <div className="heritage-caps text-slate-500 mb-4">SYNC_RESONANCE</div>
                <div className="text-4xl font-black text-white/30 font-mono">99.982%</div>
                <div className="mt-4 flex items-center gap-3">
                   <Zap className="w-3 h-3 text-[#f59e0b]" />
                   <span className="heritage-caps text-[10px] text-[#f59e0b]">High_Frequency_Sync_Active</span>
                </div>
             </div>
             <div className="flex flex-col justify-end items-end text-right">
                <div className="heritage-caps text-slate-500 mb-4">LAST_SYSTEM_UPDATE</div>
                <div className="text-3xl font-black text-white/40 font-mono">{new Date().toLocaleTimeString()}</div>
                <div className="mt-4 flex items-center gap-3">
                   <span className="heritage-caps text-[#10b981]">Verification_Sequence: Normal</span>
                   <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                </div>
             </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default MarketPage;
