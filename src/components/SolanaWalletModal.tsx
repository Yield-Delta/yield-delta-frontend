'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ExternalLink, AlertCircle, X, Zap } from 'lucide-react'
import { useSolanaWallet, SolanaWalletType } from '@/hooks/useSolanaWallet'
import { ChainId } from '@/types/chain'
import { getChainMetadata } from '@/lib/chainConfig'

interface SolanaWalletModalProps {
  isOpen: boolean
  onClose: () => void
  chainId?: ChainId
}

const WALLET_INFO: Record<SolanaWalletType, {
  name: string
  description: string
  icon: string
  downloadUrl: string
  accentColor: string
  gradientFrom: string
  gradientTo: string
}> = {
  [SolanaWalletType.PHANTOM]: {
    name: 'Phantom',
    description: 'The most popular Solana wallet',
    icon: '👻',
    downloadUrl: 'https://phantom.app/download',
    accentColor: '#ab9ff2',
    gradientFrom: 'rgba(171,159,242,0.12)',
    gradientTo: 'rgba(99,91,255,0.06)',
  },
  [SolanaWalletType.SOLFLARE]: {
    name: 'Solflare',
    description: 'Secure & user-friendly Solana wallet',
    icon: '🔥',
    downloadUrl: 'https://solflare.com/download',
    accentColor: '#fc8c4a',
    gradientFrom: 'rgba(252,140,74,0.12)',
    gradientTo: 'rgba(239,68,68,0.06)',
  },
  [SolanaWalletType.BACKPACK]: {
    name: 'Backpack',
    description: 'Multi-chain wallet with Solana support',
    icon: '🎒',
    downloadUrl: 'https://backpack.app/',
    accentColor: '#22d3ee',
    gradientFrom: 'rgba(34,211,238,0.12)',
    gradientTo: 'rgba(59,130,246,0.06)',
  },
}

export function SolanaWalletModal({
  isOpen,
  onClose,
  chainId = ChainId.SOLANA_DEVNET,
}: SolanaWalletModalProps) {
  const {
    connect,
    isConnecting,
    availableWallets,
    error,
    clearError,
  } = useSolanaWallet()

  const [selectedWallet, setSelectedWallet] = useState<SolanaWalletType | null>(null)
  const chainMetadata = getChainMetadata(chainId)

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleConnect = async (walletType: SolanaWalletType) => {
    try {
      setSelectedWallet(walletType)
      await connect(walletType, chainId)
      handleClose()
    } catch (err) {
      console.error('Failed to connect:', err)
      setSelectedWallet(null)
    }
  }

  const handleClose = () => {
    clearError()
    setSelectedWallet(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        // Portal-style fixed overlay — always above nav (z-index higher than nav's 99999)
        // paddingTop accounts for testnet banner (2rem) + nav bar (3.5rem) + breathing room
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            overflowY: 'auto',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '6rem',
            paddingBottom: '1.5rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
          }}
        >
          {/* Backdrop — no zIndex needed; DOM order places it below the modal panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999998,
              background: 'rgba(0, 0, 0, 0.78)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            style={{
              position: 'relative',
              zIndex: 9999999,
              width: '100%',
              maxWidth: '420px',
              maxHeight: 'calc(100dvh - 7.5rem)',
              overflowY: 'auto',
              background: 'linear-gradient(160deg, #080412 0%, #0e0520 45%, #06030f 100%)',
              border: '1px solid rgba(153, 69, 255, 0.45)',
              borderRadius: '24px',
              boxShadow: '0 0 0 1px rgba(153,69,255,0.08) inset, 0 0 80px rgba(153,69,255,0.18), 0 40px 80px rgba(0,0,0,0.9)',
            }}
          >
            {/* Top gradient accent strip */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #9945FF 30%, #14F195 70%, transparent)',
            }} />

            {/* Ambient top glow */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '120px',
              background: 'radial-gradient(ellipse at 50% -10%, rgba(153,69,255,0.28) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Close button */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s',
                zIndex: 10,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'
              }}
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div style={{ padding: '32px 28px 20px' }}>
              {/* Solana wordmark row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #9945FF, #14F195)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(153,69,255,0.4)',
                }}>
                  <Zap size={18} color="#000" strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    Connect Wallet
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.4)',
                    marginTop: '2px',
                    fontWeight: 500,
                  }}>
                    {chainMetadata.displayName} · {chainMetadata.isTestnet ? 'Devnet' : 'Mainnet'}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(153,69,255,0.25), transparent)', margin: '0 28px' }} />

            {/* Content */}
            <div style={{ padding: '20px 28px 28px' }}>

              {/* Error alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '16px' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.8rem',
                      color: '#fca5a5',
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0, color: '#ef4444' }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wallet options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(WALLET_INFO).map(([walletType, info], i) => {
                  const isAvailable = availableWallets.includes(walletType as SolanaWalletType)
                  const isLoading = isConnecting && selectedWallet === walletType

                  return (
                    <WalletOptionCard
                      key={walletType}
                      index={i}
                      walletType={walletType as SolanaWalletType}
                      info={info}
                      isAvailable={isAvailable}
                      isLoading={isLoading}
                      onConnect={handleConnect}
                    />
                  )
                })}
              </div>

              {/* Footer note */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(153,69,255,0.12)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                  New to Solana? Click any wallet above to install it.
                </p>
                <p style={{ fontSize: '0.72rem', color: 'rgba(153,69,255,0.6)', marginTop: '2px' }}>
                  Non-custodial · Your keys, your assets
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Individual wallet option card
interface WalletOptionCardProps {
  index: number
  walletType: SolanaWalletType
  info: typeof WALLET_INFO[SolanaWalletType]
  isAvailable: boolean
  isLoading: boolean
  onConnect: (w: SolanaWalletType) => void
}

function WalletOptionCard({ index, walletType, info, isAvailable, isLoading, onConnect }: WalletOptionCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => isAvailable && !isLoading && onConnect(walletType)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={e => e.key === 'Enter' && isAvailable && !isLoading && onConnect(walletType)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderRadius: '16px',
          border: `1px solid ${hovered && isAvailable ? info.accentColor + '50' : 'rgba(255,255,255,0.08)'}`,
          background: hovered && isAvailable
            ? `linear-gradient(135deg, ${info.gradientFrom}, ${info.gradientTo})`
            : 'rgba(255,255,255,0.03)',
          cursor: isAvailable ? 'pointer' : 'default',
          opacity: isLoading ? 0.7 : 1,
          transition: 'all 0.2s ease',
          overflow: 'hidden',
          outline: 'none',
        }}
      >
        {/* Hover shimmer */}
        {hovered && isAvailable && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 0% 50%, ${info.accentColor}12, transparent 60%)`,
            pointerEvents: 'none',
          }} />
        )}

        {/* Left: icon + text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
          {/* Icon */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: hovered && isAvailable
              ? `linear-gradient(135deg, ${info.accentColor}25, ${info.accentColor}10)`
              : 'rgba(255,255,255,0.05)',
            border: `1px solid ${hovered && isAvailable ? info.accentColor + '40' : 'rgba(255,255,255,0.06)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}>
            {info.icon}
          </div>

          {/* Text */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#ffffff',
                letterSpacing: '-0.01em',
              }}>
                {info.name}
              </span>
              {!isAvailable && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.35)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                  letterSpacing: '0.02em',
                }}>
                  NOT INSTALLED
                </span>
              )}
              {isAvailable && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: '#14F195',
                  background: 'rgba(20,241,149,0.1)',
                  border: '1px solid rgba(20,241,149,0.25)',
                  borderRadius: '6px',
                  padding: '1px 6px',
                }}>
                  DETECTED
                </span>
              )}
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.4)',
              marginTop: '2px',
              fontWeight: 400,
            }}>
              {info.description}
            </div>
          </div>
        </div>

        {/* Right: action */}
        <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${info.accentColor}`,
                borderTopColor: 'transparent',
              }}
            />
          ) : isAvailable ? (
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${info.accentColor}cc, ${info.accentColor}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${info.accentColor}40`,
            }}>
              <Wallet size={14} color="#000" strokeWidth={2.5} />
            </div>
          ) : (
            <a
              href={info.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                borderRadius: '10px',
                background: 'rgba(153,69,255,0.12)',
                border: '1px solid rgba(153,69,255,0.3)',
                color: '#c084fc',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(153,69,255,0.22)'
                el.style.color = '#d8b4fe'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement
                el.style.background = 'rgba(153,69,255,0.12)'
                el.style.color = '#c084fc'
              }}
            >
              Install
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}
