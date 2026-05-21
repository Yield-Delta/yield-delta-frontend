'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, ChainType, type WalletState } from '@/types/chain'
import { CHAIN_METADATA, getChainMetadata } from '@/lib/chainConfig'
import { formatBalance } from '@/lib/chainUtils'

interface ChainSelectorProps {
  onChainSelect?: (chainId: ChainId) => void
  showBalances?: boolean
  compact?: boolean
  className?: string
}

export function ChainSelector({
  onChainSelect,
  showBalances = true,
  compact = false,
  className = '',
}: ChainSelectorProps) {
  const {
    activeChain,
    setActiveChain,
    evm,
    solana,
    sui,
    isWalletConnectedForChain,
  } = useMultiChainStore()

  const [isOpen, setIsOpen] = useState(false)
  const [triggerHovered, setTriggerHovered] = useState(false)
  const [alignLeft, setAlignLeft] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeMetadata = activeChain ? getChainMetadata(activeChain) : null
  const isConnected = activeChain ? isWalletConnectedForChain(activeChain) : false

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Decide dropdown alignment when opening so it stays inside the viewport
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const PANEL_WIDTH = 272
      // If there isn't enough room to the left (right-anchored panel), align left instead
      setAlignLeft(rect.right - PANEL_WIDTH < 8)
    }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const getWalletStateForChain = (chainId: ChainId): WalletState | null => {
    const metadata = getChainMetadata(chainId)
    switch (metadata.type) {
      case ChainType.EVM: return evm
      case ChainType.SOLANA: return solana
      case ChainType.SUI: return sui
      default: return null
    }
  }

  const handleChainSelect = (chainId: ChainId) => {
    setActiveChain(chainId)
    setIsOpen(false)
    onChainSelect?.(chainId)
  }

  const evmChains = Object.values(CHAIN_METADATA).filter(c => c.type === ChainType.EVM)
  const solanaChains = Object.values(CHAIN_METADATA).filter(c => c.type === ChainType.SOLANA)
  const suiChains = Object.values(CHAIN_METADATA).filter(c => c.type === ChainType.SUI)

  const active = triggerHovered || isOpen

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* ── Trigger ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(o => !o)}
        onMouseEnter={() => setTriggerHovered(true)}
        onMouseLeave={() => setTriggerHovered(false)}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: compact ? '5px 11px 5px 9px' : '6px 13px 6px 10px',
          borderRadius: '999px',
          background: active
            ? 'rgba(0,245,212,0.07)'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isOpen
            ? 'rgba(0,245,212,0.45)'
            : active
              ? 'rgba(0,245,212,0.22)'
              : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          outline: 'none',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: isOpen
            ? '0 0 0 1px rgba(0,245,212,0.1) inset, 0 0 18px rgba(0,245,212,0.07)'
            : 'none',
        }}
      >
        {/* Live status dot */}
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          flexShrink: 0,
          background: isConnected ? '#10b981' : 'rgba(255,255,255,0.18)',
          boxShadow: isConnected ? '0 0 7px #10b981' : 'none',
          transition: 'all 0.3s',
        }} />

        {/* Chain icon */}
        {activeMetadata?.iconUrl && (
          <span style={{
            width: '17px',
            height: '17px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'block',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <img
              src={activeMetadata.iconUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </span>
        )}

        {/* Chain name */}
        {!compact && (
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: isOpen ? 'rgba(0,245,212,0.92)' : 'rgba(255,255,255,0.82)',
            transition: 'color 0.18s',
            whiteSpace: 'nowrap',
          }}>
            {activeMetadata?.displayName ?? 'Select Chain'}
          </span>
        )}

        {/* Testnet badge */}
        {activeMetadata?.isTestnet && !compact && (
          <span style={{
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: '#f59e0b',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: '999px',
            padding: '1px 5px',
          }}>
            TEST
          </span>
        )}

        {/* Chevron */}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown
            size={12}
            style={{ color: isOpen ? 'rgba(0,245,212,0.7)' : 'rgba(255,255,255,0.38)' }}
          />
        </motion.span>
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.975 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.65 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 7px)',
              ...(alignLeft ? { left: 0 } : { right: 0 }),
              zIndex: 9999,
              width: '272px',
              maxWidth: 'calc(100vw - 16px)',
              background: 'linear-gradient(158deg, #07080f 0%, #0b0d1c 100%)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,245,212,0.13), 0 0 40px rgba(0,245,212,0.04)',
            }}
          >
            {/* Top shimmer line */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent 5%, rgba(0,245,212,0.5) 40%, rgba(153,69,255,0.5) 70%, transparent 95%)',
            }} />

            <div style={{ padding: '8px' }}>
              <ChainGroup label="EVM Chains">
                {evmChains.map((chain, i) => (
                  <ChainRow
                    key={chain.id}
                    index={i}
                    chain={chain}
                    isActive={activeChain === chain.id}
                    isConnected={isWalletConnectedForChain(chain.id)}
                    walletState={getWalletStateForChain(chain.id)}
                    showBalance={showBalances}
                    onSelect={() => handleChainSelect(chain.id)}
                    disabled={!chain.isTestnet}
                  />
                ))}
              </ChainGroup>

              <Divider />

              <ChainGroup label="Solana">
                {solanaChains.map((chain, i) => (
                  <ChainRow
                    key={chain.id}
                    index={i}
                    chain={chain}
                    isActive={activeChain === chain.id}
                    isConnected={isWalletConnectedForChain(chain.id)}
                    walletState={getWalletStateForChain(chain.id)}
                    showBalance={showBalances}
                    onSelect={() => handleChainSelect(chain.id)}
                    disabled={!chain.isTestnet}
                  />
                ))}
              </ChainGroup>

              <Divider />

              <ChainGroup label="Sui">
                {suiChains.map((chain, i) => (
                  <ChainRow
                    key={chain.id}
                    index={i}
                    chain={chain}
                    isActive={activeChain === chain.id}
                    isConnected={isWalletConnectedForChain(chain.id)}
                    walletState={getWalletStateForChain(chain.id)}
                    showBalance={showBalances}
                    onSelect={() => handleChainSelect(chain.id)}
                    disabled={!chain.isTestnet}
                  />
                ))}
              </ChainGroup>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Divider() {
  return (
    <div style={{
      height: '1px',
      background: 'rgba(255,255,255,0.05)',
      margin: '4px 6px',
    }} />
  )
}

function ChainGroup({ label, soon, children }: { label: string; soon?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: '2px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px 5px',
      }}>
        <span style={{
          fontSize: '0.6rem',
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: 'rgba(255,255,255,0.22)',
        }}>
          {label}
        </span>
        {soon && (
          <span style={{
            fontSize: '0.55rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            color: 'rgba(153,69,255,0.75)',
            background: 'rgba(153,69,255,0.1)',
            border: '1px solid rgba(153,69,255,0.18)',
            borderRadius: '999px',
            padding: '1px 5px',
          }}>
            SOON
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

interface ChainRowProps {
  index: number
  chain: ReturnType<typeof getChainMetadata>
  isActive: boolean
  isConnected: boolean
  walletState: WalletState | null
  showBalance: boolean
  onSelect: () => void
  disabled?: boolean
}

function ChainRow({
  index,
  chain,
  isActive,
  isConnected,
  walletState,
  showBalance,
  onSelect,
  disabled = false,
}: ChainRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.button
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.18 }}
      onClick={disabled ? undefined : onSelect}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 10px',
        borderRadius: '10px',
        background: isActive
          ? 'rgba(0,245,212,0.07)'
          : hovered
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        border: isActive
          ? '1px solid rgba(0,245,212,0.18)'
          : '1px solid transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'all 0.14s ease',
        outline: 'none',
        textAlign: 'left' as const,
      }}
    >
      {/* Chain icon */}
      {chain.iconUrl ? (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          overflow: 'hidden',
          flexShrink: 0,
          border: `1px solid ${isActive ? 'rgba(0,245,212,0.25)' : 'rgba(255,255,255,0.07)'}`,
        }}>
          <img src={chain.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      ) : (
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)',
          flexShrink: 0,
        }} />
      )}

      {/* Name + balance */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: isActive ? 'rgba(0,245,212,0.92)' : 'rgba(255,255,255,0.85)',
            transition: 'color 0.14s',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}>
            {chain.displayName}
          </span>
          {chain.isTestnet && (
            <span style={{
              fontSize: '0.55rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: '#f59e0b',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.18)',
              borderRadius: '999px',
              padding: '1px 4px',
              flexShrink: 0,
            }}>
              TEST
            </span>
          )}
        </div>
        {showBalance && isConnected && walletState?.balance && (
          <span style={{
            fontSize: '0.68rem',
            color: 'rgba(255,255,255,0.32)',
            display: 'block',
            marginTop: '1px',
          }}>
            {formatBalance(walletState.balance, chain.id)} {chain.nativeCurrency.symbol}
          </span>
        )}
      </div>

      {/* Status indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {disabled ? (
          <span style={{
            fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.06em',
            color: 'rgba(245,158,11,0.7)',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.18)',
            borderRadius: '999px', padding: '1px 5px',
          }}>
            SOON
          </span>
        ) : (
          <>
            {isConnected && (
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'block',
              }} />
            )}
            {isActive && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ color: 'rgba(0,245,212,0.8)', display: 'flex' }}
              >
                <Check size={13} strokeWidth={2.5} />
              </motion.span>
            )}
          </>
        )}
      </div>
    </motion.button>
  )
}
