"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import DemoBanner from '@/components/DemoBanner';
import PortfolioChart from '@/components/PortfolioChart';
import { 
  TrendingUp, 
  PieChart, 
  Activity, 
  Plus, 
  ArrowRight, 
  Wallet, 
  BarChart3, 
  Settings, 
  Loader2, 
  Info,
  ChevronRight,
  Shield,
  Zap,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useVaults } from '@/hooks/useVaults';
import { useMultipleVaultPositions } from '@/hooks/useMultipleVaultPositions';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { getTokenInfo } from '@/utils/tokenUtils';
import { useTokenPrices, convertToUSD } from '@/hooks/useTokenPrices';
import { calculateSimulatedYield } from '@/utils/simulatedYield';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VaultWithPosition {
  address: string;
  name: string;
  strategy: string;
  shares: string;
  shareValue: string;
  totalDeposited: string;
  depositTime: string;
  apy: number;
  pnl: number;
  pnlPercent: number;
}

const DashboardPage = () => {
  const [mounted, setMounted] = useState(false);
  const { address: userAddress } = useAccount();
  const { data: vaults, isLoading: vaultsLoading } = useVaults();
  const { data: tokenPrices, isLoading: pricesLoading } = useTokenPrices();
  
  const mainRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<HTMLDivElement>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const vaultAddresses = useMemo(() => {
    return vaults?.map(v => v.address) || [];
  }, [vaults]);

  const { positions: rawPositions, isLoading: positionsLoading } = useMultipleVaultPositions(vaultAddresses);

  const vaultPositions = useMemo(() => {
    if (!vaults || !userAddress || !mounted) return [];

    return vaults
      .map(vault => {
        const positionData = rawPositions.find(p => p.address === vault.address);
        if (!positionData?.hasPosition || !positionData.position) return null;
        const position = positionData.position;
        const tokenInfo = getTokenInfo(vault.tokenA);
        const decimals = tokenInfo?.decimals || 18;
        const shareValue = parseFloat(formatUnits(BigInt(position.shareValue), decimals));
        const totalDeposited = parseFloat(formatUnits(BigInt(position.totalDeposited), decimals));
        const totalWithdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn), decimals));
        const totalValue = shareValue + totalWithdrawn;
        const pnl = totalValue - totalDeposited;
        const pnlPercent = totalDeposited > 0 ? (pnl / totalDeposited) * 100 : 0;

        return {
          address: vault.address,
          name: vault.name,
          strategy: vault.strategy,
          shares: position.shares,
          shareValue: position.shareValue,
          totalDeposited: position.totalDeposited,
          depositTime: position.depositTime,
          apy: vault.apy * 100,
          pnl,
          pnlPercent,
        } as VaultWithPosition;
      })
      .filter((pos): pos is VaultWithPosition => pos !== null);
  }, [vaults, userAddress, rawPositions, mounted]);

  const portfolioOverview = useMemo(() => {
    if (vaultPositions.length === 0 || !tokenPrices) {
      return { totalValue: 0, totalPnL: 0, pnlPercent: 0, dailyYield: 0, activePositions: 0, totalYieldEarned: 0, avgAPY: 0 };
    }

    let totalValueUSD = 0;
    let totalDepositedUSD = 0;
    let totalPnLUSD = 0;
    let totalSimulatedYieldUSD = 0;
    let totalDailyYieldUSD = 0;

    vaultPositions.forEach(pos => {
      if (!vaults) return;
      const vault = vaults.find(v => v.address === pos.address);
      if (!vault) return;
      const tokenInfo = getTokenInfo(vault.tokenA);
      const tokenSymbol = tokenInfo?.symbol || 'SEI';
      const shareValue = parseFloat(formatUnits(BigInt(pos.shareValue), tokenInfo?.decimals || 18));
      const totalDeposited = parseFloat(formatUnits(BigInt(pos.totalDeposited), tokenInfo?.decimals || 18));
      const depositTimestamp = parseInt(pos.depositTime) * 1000;
      const simulatedYield = calculateSimulatedYield(totalDeposited, depositTimestamp, vault.apy);
      const tokenPrice = tokenPrices[tokenSymbol as keyof typeof tokenPrices] || 0;
      
      totalValueUSD += convertToUSD(shareValue, tokenSymbol, tokenPrices);
      totalDepositedUSD += convertToUSD(totalDeposited, tokenSymbol, tokenPrices);
      totalPnLUSD += convertToUSD(pos.pnl, tokenSymbol, tokenPrices);
      totalSimulatedYieldUSD += simulatedYield.totalYield * tokenPrice;
      totalDailyYieldUSD += simulatedYield.dailyYield * tokenPrice;
    });

    return {
      totalValue: totalValueUSD,
      totalPnL: totalPnLUSD,
      pnlPercent: totalDepositedUSD > 0 ? (totalPnLUSD / totalDepositedUSD) * 100 : 0,
      dailyYield: totalDailyYieldUSD,
      activePositions: vaultPositions.length,
      totalYieldEarned: totalSimulatedYieldUSD,
      avgAPY: vaultPositions.reduce((sum, pos) => sum + pos.apy, 0) / vaultPositions.length,
    };
  }, [vaultPositions, vaults, tokenPrices]);

  const isLoading = !mounted || vaultsLoading || positionsLoading || pricesLoading;

  useEffect(() => {
    if (!isLoading && mounted && mainRef.current) {
      const ctx = gsap.context(() => {
        gsap.from(".heritage-header-item", {
          opacity: 0, y: 30, duration: 1, stagger: 0.1, ease: "expo.out"
        });
        gsap.from(".intel-card-anim", {
          opacity: 0, y: 20, duration: 0.8, stagger: 0.05, ease: "power2.out"
        });
        gsap.from(".position-row-anim", {
          opacity: 0, x: -20, duration: 0.6, stagger: 0.04, ease: "power2.out",
          scrollTrigger: { trigger: positionsRef.current, start: "top 90%" }
        });
      }, mainRef);
      return () => ctx.revert();
    }
  }, [isLoading, mounted, vaultPositions]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 font-sans selection:bg-[#00f5d4] selection:text-black overflow-x-hidden relative">
      <style jsx global>{`
        .yd-premium-grid {
          background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(circle at center, black, transparent 85%);
        }
        .intel-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .intel-card:hover {
          border-color: rgba(0, 245, 212, 0.3);
          background: rgba(15, 23, 42, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(0, 245, 212, 0.05);
        }
        .executive-row {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.3s ease;
        }
        .executive-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>

      {/* Premium Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-[#9b5de5]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#00f5d4]/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '15s', animationDelay: '2s' }} />
        <div className="absolute inset-0 yd-premium-grid opacity-40" />
      </div>

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      <DemoBanner />

      <main ref={mainRef} className="relative z-10 pt-28 px-4 md:px-12 lg:px-20 pb-32 max-w-[1800px] mx-auto">
        
        {/* Executive Header */}
        <header className="mb-20 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
          <div className="space-y-6">
            <div className="heritage-header-item flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-[#00f5d4] font-mono bg-[#00f5d4]/10 w-fit px-4 py-1.5 rounded-sm border-l-2 border-[#00f5d4]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f5d4] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f5d4]"></span>
              </span>
              <span>EXECUTIVE_DIRECTIVE {"//"} OPERATIONAL</span>
            </div>
            
            <h1 className="heritage-header-item text-6xl md:text-[7rem] font-black tracking-tighter leading-[0.8] text-white">
              Vault <br/>
              <span className="text-[#00f5d4]">Dashboard.</span>
            </h1>
            <p className="heritage-header-item text-xl text-slate-400 font-medium max-w-xl leading-relaxed">
              Strategic oversight of your decentralized liquidity positions. AI-orchestrated yield management.
            </p>
          </div>

          <div className="heritage-header-item flex flex-wrap gap-4">
             <Link href="/dashboard/rebalance" className="px-8 py-4 bg-[#B8422E] text-white font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#A33825] transition-all flex items-center gap-3 shadow-xl">
               <BarChart3 className="w-4 h-4" />
               Run_Rebalance_Analysis
             </Link>
             <Link href="/vaults" className="px-8 py-4 bg-white text-black font-mono text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-all flex items-center gap-3 shadow-xl">
               <Plus className="w-4 h-4" />
               New_Strategic_Node
             </Link>
          </div>
        </header>

        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center">
            <Loader2 className="w-16 h-16 text-[#00f5d4] animate-spin mb-8" />
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400 animate-pulse">Synchronizing_Executive_Data...</div>
          </div>
        ) : !userAddress ? (
          <div className="py-40 text-center bg-slate-900/20 backdrop-blur-xl border border-white/5 p-20 rounded-sm">
            <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-8" />
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Wallet_Link_Required</h2>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mb-12">Please authorize node access to view strategic positions</p>
            <div className="flex justify-center">
              <div className="p-1 rounded-sm bg-gradient-to-r from-[#00f5d4] to-[#9b5de5]">
                 <div className="bg-[#020617] px-8 py-3 font-mono text-[10px] font-bold uppercase tracking-widest">Awaiting_Connection...</div>
              </div>
            </div>
          </div>
        ) : vaultPositions.length === 0 ? (
          <div className="py-40 text-center bg-slate-900/20 backdrop-blur-xl border border-white/5 p-20 rounded-sm">
            <Info className="w-16 h-16 text-slate-600 mx-auto mb-8" />
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">No_Active_Nodes</h2>
            <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] mb-12">Deployment required to initiate strategic yield generation</p>
            <Link href="/vaults" className="inline-flex items-center gap-3 px-10 py-5 bg-[#00f5d4] text-black font-black uppercase text-[11px] tracking-widest hover:scale-[1.02] transition-all">
              Initialize_First_Vault <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Intel Stats Grid */}
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-24">
              {[
                { label: 'PORTFOLIO_VALUE', value: `$${portfolioOverview.totalValue.toFixed(2)}`, desc: 'USD Equivalent', icon: Wallet, color: '#9b5de5' },
                { label: 'TOTAL_PNL', value: `$${portfolioOverview.totalPnL.toFixed(2)}`, desc: `${portfolioOverview.pnlPercent.toFixed(2)}% Performance`, icon: TrendingUp, color: portfolioOverview.totalPnL >= 0 ? '#10b981' : '#ef4444' },
                { label: 'DAILY_EXPECTED', value: `$${portfolioOverview.dailyYield.toFixed(2)}`, desc: 'Simulated Node Yield', icon: Zap, color: '#00f5d4' },
                { label: 'ACTIVE_NODES', value: portfolioOverview.activePositions.toString(), desc: 'Deployed Strategies', icon: Layers, color: '#f59e0b' },
                { label: 'TOTAL_YIELD', value: `$${portfolioOverview.totalYieldEarned.toFixed(2)}`, desc: 'Historical Accumulation', icon: Activity, color: '#ff206e' },
                { label: 'STRATEGIC_APY', value: `${portfolioOverview.avgAPY.toFixed(1)}%`, desc: 'Average Yield Resonance', icon: BarChart3, color: '#00f5d4' }
              ].map((stat, i) => (
                <div key={i} className="intel-card-anim intel-card p-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-0 bg-[#00f5d4] group-hover:h-full transition-all duration-500" style={{ backgroundColor: stat.color }} />
                  <div className="flex justify-between items-start mb-8">
                    <stat.icon className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" style={{ color: `${stat.color}80` }} />
                    <div className="font-mono text-[8px] font-bold text-slate-600 uppercase tracking-widest">STABLE</div>
                  </div>
                  <div className="text-3xl font-black text-white mb-2 tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{stat.label}</div>
                  <div className="mt-6 pt-4 border-t border-white/5 font-mono text-[8px] text-slate-500 group-hover:text-slate-300 transition-colors">{stat.desc}</div>
                </div>
              ))}
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              
              {/* Left Column: Positions */}
              <div className="lg:col-span-2 space-y-12" ref={positionsRef}>
                <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-white/5 border border-white/10">
                        <Activity className="w-5 h-5 text-[#00f5d4]" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Operational_Positions</h2>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">Live Node Feedback Matrix</p>
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/20 backdrop-blur-xl border border-white/5 rounded-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5">
                      <tr className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="px-8 py-5">STRATEGIC_NODE</th>
                        <th className="px-8 py-5">POSITION_VALUE</th>
                        <th className="px-8 py-5">YIELD_PERFORMANCE</th>
                        <th className="px-8 py-5 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaultPositions.map((pos) => {
                        const vault = vaults?.find(v => v.address === pos.address);
                        const tokenInfo = vault ? getTokenInfo(vault.tokenA) : null;
                        const tokenSymbol = tokenInfo?.symbol || 'SEI';
                        
                        return (
                          <tr key={pos.address} className="position-row-anim executive-row group cursor-pointer" onClick={() => router.push(`/vault?address=${pos.address}`)}>
                            <td className="px-8 py-8">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-slate-800 border border-white/10 flex items-center justify-center group-hover:border-[#00f5d4]/40 transition-colors">
                                     <Image src={`/chains/${vault?.chainId === 1328 ? 'sei.svg' : 'solana.svg'}`} alt="chain" width={24} height={24} className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <div className="text-lg font-bold text-white group-hover:text-[#00f5d4] transition-colors">{pos.name}</div>
                                    <div className="font-mono text-[8px] text-slate-500 uppercase tracking-[0.2em]">{pos.strategy.replace('_', ' ')}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <div className="text-xl font-black text-white tracking-tighter">
                                 {parseFloat(formatUnits(BigInt(pos.shareValue), tokenInfo?.decimals || 18)).toFixed(2)} <span className="text-[10px] text-slate-500 font-bold ml-1">{tokenSymbol}</span>
                               </div>
                            </td>
                            <td className="px-8 py-8">
                               <div className="flex flex-col">
                                  <div className={`text-lg font-black tracking-tight ${pos.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                    {pos.pnl >= 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                                  </div>
                                  <div className="font-mono text-[9px] text-[#00f5d4] font-bold">{pos.apy.toFixed(1)}%_APY</div>
                               </div>
                            </td>
                            <td className="px-8 py-8 text-right">
                               <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-white/10 group-hover:border-[#00f5d4]/40 group-hover:bg-[#00f5d4]/5 transition-all">
                                 <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00f5d4]" />
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="pt-8 flex justify-center">
                   <Link href="/vaults" className="group flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 hover:text-white transition-colors">
                     <Plus className="w-4 h-4 text-[#00f5d4] group-hover:rotate-90 transition-transform duration-500" />
                     Initialize_New_Operational_Node
                   </Link>
                </div>
              </div>

              {/* Right Column: Analytics & Directives */}
              <div className="space-y-12">
                <section>
                  <div className="flex items-center gap-4 mb-8">
                    <PieChart className="w-5 h-5 text-[#9b5de5]" />
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#6C7278]">Portfolio_Resonance</h3>
                  </div>
                  <div className="bg-slate-900/20 border border-white/5 p-8 rounded-sm">
                    <PortfolioChart
                      vaultPositions={vaultPositions}
                      tokenPrices={tokenPrices || {}}
                      vaults={vaults || []}
                    />
                  </div>
                </section>

                <section className="space-y-6">
                   <div className="flex items-center gap-4 mb-8">
                     <Settings className="w-5 h-5 text-[#f59e0b]" />
                     <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#6C7278]">Operational_Directives</h3>
                   </div>
                   
                   {[
                     { label: 'Automated_Rebalance', desc: 'Optimize node yields via AI analysis', link: '/dashboard/rebalance', icon: BarChart3, color: '#f59e0b' },
                     { label: 'Market_Oversight', desc: 'Live global vault statistics', link: '/market', icon: Activity, color: '#10b981' },
                     { label: 'Security_Log', desc: 'Encryption & protocol status', link: '/docs', icon: Shield, color: '#9b5de5' }
                   ].map((action, i) => (
                     <Link href={action.link} key={i} className="flex items-center justify-between p-6 bg-[#1A1C1E] border border-white/5 hover:border-white/20 transition-all group">
                        <div className="flex items-center gap-5">
                           <div className="p-3 bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                             <action.icon className="w-5 h-5" style={{ color: action.color }} />
                           </div>
                           <div>
                              <div className="text-sm font-bold text-white uppercase tracking-widest mb-1">{action.label}</div>
                              <div className="text-[10px] text-slate-500 font-medium">{action.desc}</div>
                           </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-all group-hover:translate-x-1" />
                     </Link>
                   ))}
                </section>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
