/**
 * Solana Wallet Modal
 * Beautiful modal for connecting to Solana wallets (Phantom, Solflare, etc.)
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ExternalLink, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSolanaWallet, SolanaWalletType } from '@/hooks/useSolanaWallet'
import { ChainId } from '@/types/chain'
import { getChainMetadata } from '@/lib/chainConfig'

interface SolanaWalletModalProps {
  isOpen: boolean
  onClose: () => void
  chainId?: ChainId
}

// Wallet metadata for display
const WALLET_INFO: Record<SolanaWalletType, {
  name: string
  description: string
  icon: string
  downloadUrl: string
  color: string
}> = {
  [SolanaWalletType.PHANTOM]: {
    name: 'Phantom',
    description: 'The most popular Solana wallet',
    icon: '👻',
    downloadUrl: 'https://phantom.app/download',
    color: 'from-purple-500 to-indigo-500',
  },
  [SolanaWalletType.SOLFLARE]: {
    name: 'Solflare',
    description: 'Secure and user-friendly Solana wallet',
    icon: '🔥',
    downloadUrl: 'https://solflare.com/download',
    color: 'from-orange-500 to-red-500',
  },
  [SolanaWalletType.BACKPACK]: {
    name: 'Backpack',
    description: 'Multi-chain wallet with Solana support',
    icon: '🎒',
    downloadUrl: 'https://backpack.app/',
    color: 'from-cyan-500 to-blue-500',
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

  // Handle wallet connection
  const handleConnect = async (walletType: SolanaWalletType) => {
    try {
      setSelectedWallet(walletType)
      await connect(walletType, chainId)
      onClose()
    } catch (err) {
      console.error('Failed to connect:', err)
      setSelectedWallet(null)
    }
  }

  // Reset state when modal closes
  const handleClose = () => {
    clearError()
    setSelectedWallet(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Connect Solana Wallet
          </DialogTitle>
          <DialogDescription>
            Choose your preferred wallet to connect to {chainMetadata.displayName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chain Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            {chainMetadata.iconUrl && (
              <img
                src={chainMetadata.iconUrl}
                alt={chainMetadata.displayName}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <div className="font-semibold text-sm">{chainMetadata.displayName}</div>
              <div className="text-xs text-muted-foreground">
                {chainMetadata.isTestnet ? 'Testnet' : 'Mainnet'}
              </div>
            </div>
          </div>

          {/* Wallet Options */}
          <div className="space-y-2">
            {Object.entries(WALLET_INFO).map(([walletType, info]) => {
              const isAvailable = availableWallets.includes(walletType as SolanaWalletType)
              const isLoading = isConnecting && selectedWallet === walletType

              return (
                <WalletOption
                  key={walletType}
                  walletType={walletType as SolanaWalletType}
                  info={info}
                  isAvailable={isAvailable}
                  isLoading={isLoading}
                  onConnect={handleConnect}
                />
              )
            })}
          </div>

          {/* Info Section */}
          <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 border-t border-cyan-500/20">
            <p>Don&apos;t have a wallet?</p>
            <p>Click on any wallet above to download and install</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Wallet Option Component
interface WalletOptionProps {
  walletType: SolanaWalletType
  info: typeof WALLET_INFO[SolanaWalletType]
  isAvailable: boolean
  isLoading: boolean
  onConnect: (walletType: SolanaWalletType) => void
}

function WalletOption({
  walletType,
  info,
  isAvailable,
  isLoading,
  onConnect,
}: WalletOptionProps) {
  return (
    <motion.div
      whileHover={{ scale: isAvailable ? 1.02 : 1 }}
      whileTap={{ scale: isAvailable ? 0.98 : 1 }}
    >
      <Button
        variant="outline"
        className={`
          w-full h-auto p-4 relative overflow-hidden
          border-cyan-500/30 hover:border-cyan-500/50
          ${isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}
          ${isLoading ? 'animate-pulse' : ''}
        `}
        onClick={() => isAvailable && !isLoading && onConnect(walletType)}
        disabled={!isAvailable || isLoading}
      >
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-r ${info.color} opacity-0 hover:opacity-10 transition-opacity`} />

        <div className="relative flex items-center justify-between w-full">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-4">
            <div className="text-4xl">{info.icon}</div>
            <div className="text-left">
              <div className="font-semibold flex items-center gap-2">
                {info.name}
                {!isAvailable && (
                  <span className="text-xs text-muted-foreground">(Not installed)</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{info.description}</div>
            </div>
          </div>

          {/* Right: Action */}
          <div>
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full"
              />
            ) : isAvailable ? (
              <Wallet className="w-5 h-5 text-cyan-400" />
            ) : (
              <a
                href={info.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                <span className="text-xs">Install</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </Button>
    </motion.div>
  )
}
