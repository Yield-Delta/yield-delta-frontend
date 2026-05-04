'use client'

import React, { useEffect, useRef } from 'react'
import { Activity, TrendingUp, Zap, Target, Shield, Clock, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import gsap from 'gsap'

interface AnalyticsDashboardProps {
  vault: {
    address: string
    name: string
    apy: number
    tvl: number
    strategy: string
    performance: {
      totalReturn: number
      sharpeRatio: number
      maxDrawdown: number
      winRate: number
    }
  }
  vaultPositionsForChart: Array<{
    depositTime: string
    totalDeposited: string
    shareValue: string
  }>
  tokenPrices: Record<string, number>
  vaults: Array<{
    address: string
    name: string
    tokenA: string
    tokenB: string
  }>
  userPosition?: {
    value: string
    netInvested: string
    pnl: string
    pnlPercentage: string
  }
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`
  return `$${amount.toFixed(2)}`
}

const getVaultColor = (strategy: string) => {
  const colors: Record<string, string> = {
    concentrated_liquidity: '#00f5d4',
    yield_farming: '#9b5de5',
    arbitrage: '#ff206e',
    hedge: '#ffa500',
    stable_max: '#10b981',
    sei_hypergrowth: '#f59e0b',
    blue_chip: '#3b82f6',
    delta_neutral: '#8b5cf6',
    staked_sol: '#9945ff',
    margin: '#ff6b6b',
    leveraged: '#ffd93d',
  }
  return colors[strategy] || '#00f5d4'
}

function StatCard({ label, value, subValue, icon: Icon, color, trend, delay = 0 }: { label: string; value: string; subValue?: string; icon: React.ComponentType<{ className?: string }>; color: string; trend?: 'up' | 'down' | 'neutral'; delay?: number }) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay, ease: 'power2.out' }
      )
    }
  }, [delay])

  return (
    <div 
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(145deg, rgba(10, 10, 26, 0.9), rgba(15, 15, 35, 0.95))',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 30px ${color}15, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
      }}
    >
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20"
        style={{ background: color }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}20`, border: `1px solid ${color}30` }}
          >
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend === 'up' ? 'bg-green-500/20 text-green-400' :
              trend === 'down' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> :
               trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : null}
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
            </div>
          )}
        </div>
        
        <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">{label}</p>
        <p 
          className="text-2xl font-bold"
          style={{ 
            color: color,
            textShadow: `0 0 20px ${color}40`
          }}
        >
          {value}
        </p>
        {subValue && (
          <p className="text-xs text-white/50 mt-1">{subValue}</p>
        )}
      </div>
    </div>
  )
}

function MiniChart({ data, color }: { data: number[]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    ctx.clearRect(0, 0, width, height)
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${color}40`)
    gradient.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.moveTo(0, height)
    
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height * 0.8) - height * 0.1
      ctx.lineTo(x, y)
    })
    
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height * 0.8) - height * 0.1
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
  }, [data, color])

  return <canvas ref={canvasRef} width={120} height={40} className="w-full h-10" />
}

export default function AnalyticsDashboard({ vault, vaultPositionsForChart, tokenPrices, vaults, userPosition }: AnalyticsDashboardProps) {
  const vaultColor = getVaultColor(vault.strategy)
  
  const dailyRate = vault.apy / 365
  const return1D = dailyRate * 100
  const return7D = dailyRate * 7 * 100
  const return30D = dailyRate * 30 * 100
  const totalReturn = vault.performance.totalReturn * 100

  const mockChartData = [0.8, 1.2, 1.1, 1.5, 1.3, 1.8, 2.0, 1.9, 2.2, 2.5, 2.3, 2.8, 3.0, 2.9, 3.2, 3.5]

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
      )
    }
  }, [])

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="1D Return" 
          value={`${return1D >= 0 ? '+' : ''}${return1D.toFixed(3)}%`}
          icon={Clock}
          color={return1D >= 0 ? '#00ff88' : '#ff206e'}
          trend={return1D >= 0 ? 'up' : 'down'}
          delay={0}
        />
        <StatCard 
          label="7D Return" 
          value={`${return7D >= 0 ? '+' : ''}${return7D.toFixed(2)}%`}
          icon={Activity}
          color={return7D >= 0 ? '#00ff88' : '#ff206e'}
          trend={return7D >= 0 ? 'up' : 'down'}
          delay={0.1}
        />
        <StatCard 
          label="30D Return" 
          value={`${return30D >= 0 ? '+' : ''}${return30D.toFixed(2)}%`}
          icon={TrendingUp}
          color={return30D >= 0 ? '#00ff88' : '#ff206e'}
          trend={return30D >= 0 ? 'up' : 'down'}
          delay={0.2}
        />
        <StatCard 
          label="All Time" 
          value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%`}
          icon={Zap}
          color={totalReturn >= 0 ? '#00ff88' : '#ff206e'}
          trend={totalReturn >= 0 ? 'up' : 'down'}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div 
            className="rounded-2xl p-6"
            style={{
              background: 'linear-gradient(145deg, rgba(10, 10, 26, 0.9), rgba(15, 15, 35, 0.95))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  Performance
                </h3>
                <p className="text-xs text-white/40">Yield over time</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: vaultColor }} />
                  <span className="text-xs text-white/60">APY: {(vault.apy * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
            
            <div className="h-48 relative">
              <MiniChart data={mockChartData} color={vaultColor} />
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-white/30 px-2">
                <span>30D</span>
                <span>20D</span>
                <span>10D</span>
                <span>Now</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">Current</p>
                <p className="text-lg font-bold text-white">{(vault.tvl / 1000).toFixed(1)}K</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">Peak</p>
                <p className="text-lg font-bold text-green-400">{(vault.tvl * 1.2 / 1000).toFixed(1)}K</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/40 mb-1">Min</p>
                <p className="text-lg font-bold text-red-400">{(vault.tvl * 0.7 / 1000).toFixed(1)}K</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {userPosition && (
            <div 
              className="rounded-2xl p-5"
              style={{
                background: 'linear-gradient(145deg, rgba(0, 255, 136, 0.1), rgba(0, 255, 136, 0.05))',
                border: '1px solid rgba(0, 255, 136, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-bold text-white">Your Position</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Value</span>
                  <span className="font-bold text-green-400">{userPosition.value}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">Net Invested</span>
                  <span className="font-bold text-white">{userPosition.netInvested}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-white/50">P&L</span>
                  <span className={`font-bold ${parseFloat(userPosition.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {userPosition.pnl} ({userPosition.pnlPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          <div 
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(145deg, rgba(153, 69, 255, 0.1), rgba(153, 69, 255, 0.05))',
              border: '1px solid rgba(153, 69, 255, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5" style={{ color: vaultColor }} />
              <h3 className="text-lg font-bold text-white">Risk Metrics</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Sharpe Ratio</span>
                <span className="font-bold text-purple-400">{vault.performance.sharpeRatio.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Max Drawdown</span>
                <span className="font-bold text-red-400">-{Math.abs(vault.performance.maxDrawdown * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Win Rate</span>
                <span className="font-bold text-cyan-400">{(vault.performance.winRate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div 
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(145deg, rgba(0, 212, 255, 0.1), rgba(0, 212, 255, 0.05))',
              border: '1px solid rgba(0, 212, 255, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Trading Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Strategy</span>
                <span className="font-medium text-white capitalize" style={{ color: vaultColor }}>{vault.strategy.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Daily Rebalances</span>
                <span className="font-bold text-cyan-400">~3.2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-white/50">Gas Efficiency</span>
                <span className="font-bold text-green-400">92%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}