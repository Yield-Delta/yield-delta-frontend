'use client'

import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useRouter } from 'next/navigation'

interface SolanaVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  description: string
  userShares?: string
  userValue?: string
}

interface SolanaVaultCardProps {
  vault: SolanaVaultData
  index: number
  onDeposit?: (vault: SolanaVaultData) => void
  onWithdraw?: (vault: SolanaVaultData) => void
}

const formatTvl = (tvl: number | string) => {
  if (typeof tvl === 'string') return tvl
  if (tvl >= 1000000) return `$${(tvl / 1000000).toFixed(1)}M`
  if (tvl >= 1000) return `$${(tvl / 1000).toFixed(0)}K`
  return `$${tvl.toFixed(0)}`
}

const getVaultColor = (strategy: string) => {
  const colors: Record<string, string> = {
    concentrated_liquidity: '#9945ff',
    yield_farming: '#14f195',
    stable_max: '#00d4ff',
    margin: '#ff6b6b',
    leveraged: '#ffd93d',
    staked_sol: '#8b5cf6',
  }
  return colors[strategy] || '#9945ff'
}

const getStrategyIcon = (strategy: string) => {
  const icons: Record<string, string> = {
    concentrated_liquidity: '◈',
    yield_farming: '⬡',
    stable_max: '◎',
    margin: '◉',
    leveraged: '◐',
    staked_sol: '✦',
  }
  return icons[strategy] || '◆'
}

export default function SolanaVaultCard({ vault, index, onDeposit, onWithdraw }: SolanaVaultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [displayApy, setDisplayApy] = useState(0)
  const router = useRouter()

  const vaultColor = getVaultColor(vault.strategy)
  const hasPosition = vault.userShares && parseFloat(vault.userShares) > 0
  const hasUserValue = vault.userValue && parseFloat(vault.userValue) > 0

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { 
          opacity: 0, 
          y: 60,
          rotateX: -15,
          scale: 0.9
        },
        { 
          opacity: 1, 
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: 1, 
          delay: index * 0.15,
          ease: "back.out(1.4)"
        }
      )
    }

    gsap.to({ value: 0 }, {
      value: vault.apy,
      duration: 2,
      delay: index * 0.15 + 0.4,
      ease: "power2.out",
      onUpdate: function() {
        setDisplayApy(Number((this.targets()[0] as unknown as {value: number}).value.toFixed(1)))
      }
    })
  }, [vault.apy, index])

  const handleHover = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1.02,
        y: -5,
        duration: 0.4,
        ease: "power2.out"
      })
    }
  }

  const handleLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      })
    }
  }

  return (
    <div 
      ref={cardRef}
      className="relative group cursor-pointer"
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
      onClick={() => router.push(`/vault?address=${vault.address}&chain=solana`)}
      style={{ perspective: '1000px' }}
    >
      <div 
        className="absolute inset-0 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ 
          background: `radial-gradient(circle at 50% 0%, ${vaultColor}40, transparent 70%)`,
        }}
      />
      
      <div 
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(20, 10, 35, 0.9), rgba(30, 15, 45, 0.95))',
          border: `1px solid ${vaultColor}30`,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-20 opacity-60"
          style={{
            background: `linear-gradient(180deg, ${vaultColor}30, transparent)`,
          }}
        />
        
        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: `linear-gradient(135deg, ${vaultColor}, ${vaultColor}80)`,
                  boxShadow: `0 8px 20px ${vaultColor}40`,
                }}
              >
                {getStrategyIcon(vault.strategy)}
              </div>
              <div>
                <h3 
                  className="font-bold text-lg text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {vault.name}
                </h3>
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  style={{ 
                    background: `${vaultColor}20`, 
                    color: vaultColor,
                    border: `1px solid ${vaultColor}40`
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: vaultColor }} />
                  SOL
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs text-white/40 mb-1">APY</p>
              <p 
                className="text-2xl font-bold"
                style={{ 
                  color: vaultColor,
                  textShadow: `0 0 20px ${vaultColor}60`
                }}
              >
                {displayApy}%
              </p>
            </div>
          </div>

          <p className="text-sm text-white/60 mb-4 line-clamp-2">
            {vault.description}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div 
              className="p-3 rounded-2xl"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            >
              <p className="text-xs text-white/40 mb-1">TVL</p>
              <p className="text-sm font-semibold text-white">{formatTvl(vault.tvl)}</p>
            </div>
            <div 
              className="p-3 rounded-2xl"
              style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}
            >
              <p className="text-xs text-white/40 mb-1">Strategy</p>
              <p className="text-sm font-medium text-white capitalize">{vault.strategy.replace('_', ' ')}</p>
            </div>
          </div>

          {hasPosition && hasUserValue && (
            <div 
              className="p-3 rounded-2xl mb-4"
              style={{ 
                background: `linear-gradient(135deg, ${vaultColor}15, transparent)`,
                border: `1px solid ${vaultColor}30`
              }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-white/50">Your Position</p>
                  <p className="text-sm font-medium text-white">{vault.userValue}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">Shares</p>
                  <p className="text-sm font-medium text-white">{parseFloat(vault.userShares || '0').toFixed(4)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeposit?.(vault)
              }}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all hover:brightness-110"
              style={{
                background: `linear-gradient(135deg, ${vaultColor}, #14f195)`,
                boxShadow: `0 4px 15px ${vaultColor}40`,
              }}
            >
              Deposit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onWithdraw?.(vault)
              }}
              disabled={!hasPosition}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm transition-all"
              style={{
                background: hasPosition 
                  ? 'rgba(255, 107, 107, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: hasPosition ? '#ff6b6b' : 'rgba(255, 255, 255, 0.3)',
                border: hasPosition ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: hasPosition ? 'pointer' : 'not-allowed',
              }}
            >
              Withdraw
            </button>
          </div>
        </div>

        <div 
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${vaultColor}, transparent)`,
          }}
        />
      </div>
    </div>
  )
}