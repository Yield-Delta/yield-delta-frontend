"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { TrendingUp, ArrowRight, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVaults } from '@/hooks/useVaults';

const STRATEGY_COLORS: Record<string, string> = {
  concentrated_liquidity: '#00f5d4',
  yield_farming: '#9945FF',
  arbitrage: '#ff206e',
  stable_max: '#14F195',
  delta_neutral: '#8b5cf6',
  hedge: '#fc8c4a',
  sei_hypergrowth: '#fc8c4a',
  blue_chip: '#3b82f6',
}

const getStrategyColor = (s: string) => STRATEGY_COLORS[s] ?? '#00f5d4'

const MarketPage = () => {
  const router = useRouter()
  const { data: vaults, isLoading, isError } = useVaults()

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
    { label: 'Total TVL', value: isLoading ? '...' : formatNumber(totalTVL), accent: '#00f5d4', tag: 'LIVE DATA' },
    { label: 'Active Vaults', value: isLoading ? '...' : String(vaults?.length ?? 0), accent: '#9945FF', tag: 'ON SEI' },
    { label: 'Avg APY', value: isLoading ? '...' : `${avgAPY.toFixed(1)}%`, accent: '#14F195', tag: 'CURRENT' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#07080f', position: 'relative' }}>
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* ── HEADER ── */}
      <div style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
        {/* Dot-grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(153,69,255,0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)',
          pointerEvents: 'none',
        }} />
        {/* Top radial glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '160px',
          background: 'radial-gradient(ellipse at 50% -20%, rgba(0,245,212,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1.5rem 2.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              {/* Pill badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                marginBottom: '14px', padding: '4px 10px 4px 8px',
                borderRadius: '999px', background: 'rgba(20,241,149,0.07)',
                border: '1px solid rgba(20,241,149,0.18)',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#14F195', boxShadow: '0 0 8px #14F195', display: 'block',
                  animation: 'yd-pulse 2s ease-in-out infinite',
                }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(20,241,149,0.8)' }}>
                  LIVE DATA
                </span>
              </div>

              <h1 style={{
                margin: 0, fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, color: '#fff',
              }}>
                SEI VAULTS{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #00f5d4, #9945FF)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  MARKET
                </span>
              </h1>
              <p style={{ margin: '10px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.38)' }}>
                Live vault data on SEI Atlantic-2 Testnet (Chain ID 1328)
              </p>
            </div>

            {/* Chain ID pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '7px 14px', borderRadius: '999px',
              background: 'rgba(0,245,212,0.06)', border: '1px solid rgba(0,245,212,0.18)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Chain ID</span>
              <span style={{ fontSize: '0.72rem', color: '#00f5d4', fontWeight: 800, letterSpacing: '0.02em' }}>1328</span>
            </div>
          </div>
        </div>

        {/* Bottom shimmer line */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 5%, #9945FF 35%, #14F195 65%, transparent 95%)',
        }} />
      </div>

      {/* ── STATS + TABLE ── */}
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Table panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {/* Top shimmer */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 5%, #00f5d4 40%, #9945FF 70%, transparent 95%)',
          }} />

          {/* Table header row */}
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <TrendingUp size={16} style={{ color: '#00f5d4' }} />
            <span style={{
              fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
            }}>
              Live Vaults
            </span>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '12px' }}>
              <Loader2 style={{ width: 22, height: 22, color: '#00f5d4', animation: 'yd-spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>Loading vaults...</span>
            </div>
          )}

          {/* Error */}
          {isError && (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(239,68,68,0.8)', marginBottom: '8px' }}>Failed to load vaults</p>
              <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)' }}>Please try again later</p>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !isError && vaults && vaults.length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <Info size={32} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 16px', display: 'block' }} />
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>No Vaults Available</p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Vaults are being deployed. Check back soon!</p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && vaults && vaults.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                    {['Vault', 'Strategy', 'TVL', 'APY', 'Pair', ''].map((col) => (
                      <th key={col} style={{
                        padding: '10px 16px',
                        textAlign: col === 'Vault' || col === '' ? 'left' : 'right',
                        fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
                        whiteSpace: 'nowrap',
                      }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {vaults.map((vault, i) => {
                      const color = getStrategyColor(vault.strategy)
                      return (
                        <motion.tr
                          key={vault.address}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04, duration: 0.22 }}
                          style={{ display: 'table-row' }}
                        >
                          <VaultRow
                            vault={vault}
                            color={color}
                            formatNumber={formatNumber}
                            onView={() => router.push(`/vault?address=${vault.address}`)}
                          />
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: '#14F195', boxShadow: '0 0 8px #14F195', display: 'block',
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
              Live data from SEI Atlantic-2 Testnet
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>
            All vault data fetched directly from smart contracts · Chain ID: 1328
          </p>
        </div>
      </div>

      <style>{`
        @keyframes yd-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes yd-spin  { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, accent, tag }: { label: string; value: string; accent: string; tag: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: hovered ? `${accent}06` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? accent + '35' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '16px',
        padding: '1.5rem',
        transition: 'all 0.2s ease',
        cursor: 'default',
      }}
    >
      {/* Scan shimmer on hover */}
      {hovered && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, bottom: 0, width: '40%',
            background: `linear-gradient(90deg, transparent, ${accent}18, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* Top glow on hover */}
      {hovered && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 0%, ${accent}0a, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{
        fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
        marginBottom: '10px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, letterSpacing: '-0.04em',
        color: accent, lineHeight: 1, marginBottom: '10px',
        textShadow: hovered ? `0 0 30px ${accent}50` : 'none',
        transition: 'text-shadow 0.2s',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: `${accent}60`,
      }}>
        {tag}
      </div>
    </div>
  )
}

function VaultRow({ vault, color, formatNumber, onView }: {
  vault: { address: string; name: string; strategy: string; tvl: number; apy: number; tokenA: string; tokenB: string; chainId: number }
  color: string
  formatNumber: (n: number, d?: number) => string
  onView: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <>
      <td
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        colSpan={6}
        style={{ padding: 0 }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr
              style={{
                background: hovered ? 'rgba(255,255,255,0.035)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.045)',
                transition: 'background 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              {/* Vault name */}
              <td style={{ padding: '14px 16px', width: '30%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: `linear-gradient(135deg, ${color}cc, ${color}55)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 900, color: '#050508', letterSpacing: '0.02em',
                  }}>
                    {vault.tokenA.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em' }}>
                      {vault.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)', marginTop: '2px' }}>
                      Chain {vault.chainId}
                    </div>
                  </div>
                </div>
              </td>

              {/* Strategy */}
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color, background: `${color}12`, border: `1px solid ${color}28`,
                  borderRadius: '999px', padding: '3px 10px',
                }}>
                  {vault.strategy.replace(/_/g, ' ')}
                </span>
              </td>

              {/* TVL */}
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
                  {formatNumber(vault.tvl)}
                </span>
              </td>

              {/* APY */}
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#14F195', letterSpacing: '-0.01em' }}>
                  {(vault.apy * 100).toFixed(1)}%
                </span>
              </td>

              {/* Pair */}
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
                  {vault.tokenA}/{vault.tokenB}
                </span>
              </td>

              {/* Action */}
              <td style={{ padding: '14px 16px' }}>
                <button
                  onClick={onView}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '999px',
                    background: hovered ? `${color}18` : 'transparent',
                    border: `1px solid ${hovered ? color + '55' : 'rgba(255,255,255,0.1)'}`,
                    color: hovered ? color : 'rgba(255,255,255,0.4)',
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                    cursor: 'pointer', transition: 'all 0.15s ease', outline: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  View
                  <ArrowRight size={11} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </>
  )
}

export default MarketPage
