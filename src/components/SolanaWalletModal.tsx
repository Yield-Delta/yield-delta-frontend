'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, AlertCircle, X, ArrowRight } from 'lucide-react'
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
  downloadUrl: string
  accentColor: string
  bg: string
  iconBg: string
  symbol: string
}> = {
  [SolanaWalletType.PHANTOM]: {
    name: 'Phantom',
    description: 'The most popular Solana wallet',
    downloadUrl: 'https://phantom.app/download',
    accentColor: '#ab9ff2',
    bg: 'rgba(171,159,242,0.07)',
    iconBg: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
    symbol: 'P',
  },
  [SolanaWalletType.SOLFLARE]: {
    name: 'Solflare',
    description: 'Secure & user-friendly Solana wallet',
    downloadUrl: 'https://solflare.com/download',
    accentColor: '#fc8c4a',
    bg: 'rgba(252,140,74,0.07)',
    iconBg: 'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
    symbol: 'S',
  },
  [SolanaWalletType.BACKPACK]: {
    name: 'Backpack',
    description: 'Multi-chain wallet with Solana support',
    downloadUrl: 'https://backpack.app/',
    accentColor: '#22d3ee',
    bg: 'rgba(34,211,238,0.07)',
    iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)',
    symbol: 'B',
  },
}

export function SolanaWalletModal({
  isOpen,
  onClose,
  chainId = ChainId.SOLANA_DEVNET,
}: SolanaWalletModalProps) {
  const { connect, isConnecting, availableWallets, redetect, error, clearError } = useSolanaWallet()
  const [selectedWallet, setSelectedWallet] = useState<SolanaWalletType | null>(null)
  const chainMetadata = getChainMetadata(chainId)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      redetect()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, redetect])

  const handleClose = useCallback(() => {
    clearError()
    setSelectedWallet(null)
    onClose()
  }, [clearError, onClose])

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

  const handleCardClick = (walletType: SolanaWalletType, isAvailable: boolean, downloadUrl: string) => {
    if (isAvailable) {
      handleConnect(walletType)
      return
    }
    const provider = typeof window !== 'undefined'
      ? walletType === 'phantom' ? window.phantom?.solana
        : walletType === 'solflare' ? window.solflare
        : walletType === 'backpack' ? window.backpack
        : undefined
      : undefined

    if (provider) {
      handleConnect(walletType)
    } else {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, handleClose])

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999998,
              background: 'rgba(2,3,10,0.82)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.85 }}
            style={{
              position: 'relative',
              zIndex: 9999999,
              width: '100%',
              maxWidth: '400px',
              background: '#06040e',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 0 0 1px rgba(153,69,255,0.35), 0 0 60px rgba(153,69,255,0.12), 0 32px 80px rgba(0,0,0,0.95)',
            }}
          >
            {/* Dot-grid texture */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(153,69,255,0.18) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              pointerEvents: 'none',
              maskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 30%, transparent 80%)',
            }} />

            {/* Top glow */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '160px',
              background: 'radial-gradient(ellipse at 50% -20%, rgba(153,69,255,0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Top border shimmer */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent 5%, #9945FF 35%, #14F195 65%, transparent 95%)',
            }} />

            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                zIndex: 10,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)',
                transition: 'all 0.18s',
                outline: 'none',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget
                b.style.background = 'rgba(255,255,255,0.1)'
                b.style.color = '#fff'
              }}
              onMouseLeave={e => {
                const b = e.currentTarget
                b.style.background = 'rgba(255,255,255,0.05)'
                b.style.color = 'rgba(255,255,255,0.4)'
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>

            {/* Header */}
            <div style={{ position: 'relative', padding: '32px 24px 22px' }}>
              {/* Solana mark */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '14px',
                padding: '4px 10px 4px 8px',
                borderRadius: '999px',
                background: 'rgba(20,241,149,0.07)',
                border: '1px solid rgba(20,241,149,0.18)',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#14F195',
                  boxShadow: '0 0 8px #14F195',
                  display: 'block',
                }} />
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'rgba(20,241,149,0.8)',
                }}>
                  {chainMetadata.displayName.toUpperCase()} · {chainMetadata.isTestnet ? 'DEVNET' : 'MAINNET'}
                </span>
              </div>

              <h2 style={{
                margin: 0,
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: '#ffffff',
              }}>
                Connect your<br />
                <span style={{
                  background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Solana wallet
                </span>
              </h2>
              <p style={{
                margin: '8px 0 0',
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.38)',
                lineHeight: 1.5,
              }}>
                Choose a wallet to start earning yield
              </p>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', padding: '0 16px 20px' }}>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '12px' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '0.77rem',
                      color: '#fca5a5',
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0, color: '#ef4444' }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wallet cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(WALLET_INFO).map(([walletType, info], i) => {
                  const isAvailable = availableWallets.includes(walletType as SolanaWalletType)
                  const isLoading = isConnecting && selectedWallet === walletType

                  return (
                    <WalletCard
                      key={walletType}
                      index={i}
                      walletType={walletType as SolanaWalletType}
                      info={info}
                      isAvailable={isAvailable}
                      isLoading={isLoading}
                      dimmed={isConnecting && selectedWallet !== null && selectedWallet !== walletType}
                      onConnect={(wt) => handleCardClick(wt, isAvailable, info.downloadUrl)}
                    />
                  )
                })}
              </div>

              {/* Footer */}
              <p style={{
                marginTop: '18px',
                textAlign: 'center',
                fontSize: '0.68rem',
                color: 'rgba(255,255,255,0.22)',
                lineHeight: 1.6,
              }}>
                Non-custodial · Your keys, your assets
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

interface WalletCardProps {
  index: number
  walletType: SolanaWalletType
  info: typeof WALLET_INFO[SolanaWalletType]
  isAvailable: boolean
  isLoading: boolean
  dimmed: boolean
  onConnect: (w: SolanaWalletType) => void
}

function WalletCard({ index, walletType, info, isAvailable, isLoading, dimmed, onConnect }: WalletCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isLoading && onConnect(walletType)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={e => e.key === 'Enter' && !isLoading && onConnect(walletType)}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: '14px',
          background: hovered ? info.bg : 'rgba(255,255,255,0.025)',
          border: `1px solid ${hovered ? info.accentColor + '45' : 'rgba(255,255,255,0.07)'}`,
          cursor: isLoading ? 'wait' : 'pointer',
          opacity: dimmed ? 0.4 : 1,
          transition: 'all 0.18s ease',
          outline: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Scan shimmer on hover */}
        {hovered && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0, bottom: 0,
              width: '40%',
              background: `linear-gradient(90deg, transparent, ${info.accentColor}18, transparent)`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Wallet icon */}
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: info.iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: hovered ? `0 6px 18px ${info.accentColor}35` : 'none',
          transition: 'box-shadow 0.18s',
          fontSize: '1.1rem',
          fontWeight: 900,
          color: '#fff',
          letterSpacing: '-0.02em',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {info.symbol}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '2px' }}>
            <span style={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: hovered ? '#fff' : 'rgba(255,255,255,0.88)',
              letterSpacing: '-0.01em',
              transition: 'color 0.18s',
            }}>
              {info.name}
            </span>
            {isAvailable ? (
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: '#14F195',
                background: 'rgba(20,241,149,0.1)',
                border: '1px solid rgba(20,241,149,0.22)',
                borderRadius: '999px',
                padding: '1px 5px',
              }}>
                READY
              </span>
            ) : (
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: 'rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '999px',
                padding: '1px 5px',
              }}>
                INSTALL
              </span>
            )}
          </div>
          <span style={{
            fontSize: '0.73rem',
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.3,
          }}>
            {info.description}
          </span>
        </div>

        {/* Action */}
        <div style={{ flexShrink: 0 }}>
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: `2px solid ${info.accentColor}`,
                borderTopColor: 'transparent',
              }}
            />
          ) : isAvailable ? (
            <motion.div
              animate={hovered ? { x: 2 } : { x: 0 }}
              transition={{ duration: 0.15 }}
              style={{ color: info.accentColor, display: 'flex', opacity: hovered ? 1 : 0.5 }}
            >
              <ArrowRight size={16} strokeWidth={2} />
            </motion.div>
          ) : (
            <ExternalLink size={14} style={{ color: 'rgba(255,255,255,0.25)', opacity: hovered ? 0.7 : 0.4 }} />
          )}
        </div>
      </div>
    </motion.div>
  )
}

