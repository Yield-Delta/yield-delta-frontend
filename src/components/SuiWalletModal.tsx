'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallets, useDAppKit, useWalletConnection } from '@mysten/dapp-kit-react'
import { Wallet, X, Loader2, CheckCircle2 } from 'lucide-react'

interface SuiWalletModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SuiWalletModal({ isOpen, onClose }: SuiWalletModalProps) {
  const [mounted, setMounted] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const wallets = useWallets()
  const dAppKit = useDAppKit()
  const { status } = useWalletConnection()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close automatically when connection succeeds
  useEffect(() => {
    if (status === 'connected' && isOpen) {
      setConnecting(null)
      onClose()
    }
  }, [status, isOpen, onClose])

  const handleConnect = async (wallet: ReturnType<typeof useWallets>[number]) => {
    setConnecting(wallet.name)
    try {
      await dAppKit.connectWallet({ wallet })
    } catch {
      setConnecting(null)
    }
  }

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', isolation: 'isolate',
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 30% 20%, rgba(76,162,255,0.1), transparent 40%), rgba(2,4,14,0.88)',
              backdropFilter: 'blur(18px)',
            }}
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'relative',
              width: 'min(420px, calc(100vw - 24px))',
              borderRadius: '24px',
              border: '1px solid rgba(76,162,255,0.2)',
              background: 'linear-gradient(158deg, #080c1e 0%, #050810 100%)',
              boxShadow: '0 0 0 1px rgba(76,162,255,0.08), 0 24px 80px rgba(0,0,0,0.88)',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #4ca2ff, #a78bfa, transparent)',
            }} />

            <div style={{ padding: '24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(76,162,255,0.12)', border: '1px solid rgba(76,162,255,0.24)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Wallet size={16} style={{ color: '#4ca2ff' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 700 }}>
                      Connect Sui Wallet
                    </p>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>
                      Sui Testnet
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Wallet list */}
              {wallets.length === 0 ? (
                <div style={{
                  padding: '24px', textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', background: 'rgba(255,255,255,0.03)',
                }}>
                  <Wallet size={28} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 10px' }} />
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                    No Sui wallets detected
                  </p>
                  <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.28)', fontSize: '12px' }}>
                    Install Sui Wallet, OKX, or Suiet browser extension
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {wallets.map((wallet) => {
                    const isConnecting = connecting === wallet.name
                    return (
                      <button
                        key={wallet.name}
                        onClick={() => handleConnect(wallet)}
                        disabled={!!connecting}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px', borderRadius: '14px',
                          border: '1px solid rgba(76,162,255,0.15)',
                          background: isConnecting
                            ? 'rgba(76,162,255,0.12)'
                            : 'rgba(255,255,255,0.04)',
                          cursor: connecting ? 'not-allowed' : 'pointer',
                          opacity: connecting && !isConnecting ? 0.5 : 1,
                          transition: 'all 0.15s ease',
                          width: '100%', textAlign: 'left',
                        }}
                        onMouseEnter={(e) => {
                          if (!connecting) {
                            e.currentTarget.style.background = 'rgba(76,162,255,0.08)'
                            e.currentTarget.style.borderColor = 'rgba(76,162,255,0.3)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!connecting) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                            e.currentTarget.style.borderColor = 'rgba(76,162,255,0.15)'
                          }
                        }}
                      >
                        {/* Wallet icon */}
                        {wallet.icon ? (
                          <img
                            src={wallet.icon}
                            alt={wallet.name}
                            style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                            background: 'rgba(76,162,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Wallet size={14} style={{ color: '#4ca2ff' }} />
                          </div>
                        )}
                        <span style={{ flex: 1, color: 'rgba(255,255,255,0.88)', fontSize: '14px', fontWeight: 600 }}>
                          {wallet.name}
                        </span>
                        {isConnecting ? (
                          <Loader2 size={16} style={{ color: '#4ca2ff', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                            Connect →
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <p style={{
                margin: '16px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.28)',
                lineHeight: 1.5, textAlign: 'center',
              }}>
                By connecting you agree to interact with Sui Testnet. No real funds at risk.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}
