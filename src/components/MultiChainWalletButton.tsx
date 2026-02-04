/**
 * Multi-Chain Wallet Connect Button
 * Unified wallet connection interface for EVM, Solana, and Sui chains
 * Integrates with existing RainbowKit for EVM and custom adapters for Solana/Sui
 */

'use client'

import React, { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChainSelector } from './ChainSelector'
import { SolanaWalletModal } from './SolanaWalletModal'
import { useAccount } from 'wagmi'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { useSolanaWallet } from '@/hooks/useSolanaWallet'
import { ChainId, ChainType, WalletStatus } from '@/types/chain'
import { getChainMetadata, getDefaultChain } from '@/lib/chainConfig'
import { formatBalance, evmChainIdToChainId } from '@/lib/chainUtils'
import { Wallet, Power } from 'lucide-react'

export function MultiChainWalletButton() {
  const [showSolanaModal, setShowSolanaModal] = useState(false)
  const [mounted, setMounted] = useState(false)

  // EVM wallet state (via wagmi)
  const { address: evmAddress, isConnected: isEvmConnected, chain: evmChain } = useAccount()

  // Solana wallet state
  const {
    address: solanaAddress,
    isConnected: isSolanaConnected,
    disconnect: disconnectSolana,
  } = useSolanaWallet()

  // Multi-chain store
  const {
    activeChain,
    setActiveChain,
    evm,
    solana,
    connectEvmWallet,
    disconnectEvmWallet,
    getActiveChainMetadata,
    getActiveWalletState,
  } = useMultiChainStore()

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync EVM wallet with store
  useEffect(() => {
    if (isEvmConnected && evmAddress && evmChain) {
      const chainId = evmChainIdToChainId(evmChain.id)
      if (chainId) {
        connectEvmWallet(evmAddress, chainId)
      }
    } else if (!isEvmConnected) {
      disconnectEvmWallet()
    }
  }, [isEvmConnected, evmAddress, evmChain, connectEvmWallet, disconnectEvmWallet])

  // Set default active chain if none selected
  useEffect(() => {
    if (!activeChain && mounted) {
      const defaultChain = getDefaultChain()
      setActiveChain(defaultChain)
    }
  }, [activeChain, mounted, setActiveChain])

  // Handle chain selection
  const handleChainSelect = (chainId: ChainId) => {
    const metadata = getChainMetadata(chainId)
    
    // If selecting a Solana chain and not connected, open wallet modal
    if (metadata.type === ChainType.SOLANA && !isSolanaConnected) {
      setShowSolanaModal(true)
    }
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    const activeMetadata = getActiveChainMetadata()
    if (!activeMetadata) return

    switch (activeMetadata.type) {
      case ChainType.SOLANA:
        await disconnectSolana()
        break
      // EVM handled by RainbowKit
      // SUI - future implementation
    }
  }

  const activeMetadata = getActiveChainMetadata()
  const activeWallet = getActiveWalletState()
  const isActiveChainConnected = activeWallet?.status === WalletStatus.CONNECTED

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Button className="btn-cyber" disabled>
          Loading...
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Chain Selector */}
        <ChainSelector onChainSelect={handleChainSelect} />

        {/* Wallet Connection Button */}
        {activeMetadata?.type === ChainType.EVM ? (
          // EVM Chains - Use RainbowKit
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted: rainbowMounted,
            }) => {
              const ready = rainbowMounted && authenticationStatus !== 'loading'
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus || authenticationStatus === 'authenticated')

              if (!ready) {
                return (
                  <Button className="btn-cyber" disabled>
                    Connecting...
                  </Button>
                )
              }

              if (!connected) {
                return (
                  <Button onClick={openConnectModal} className="btn-cyber">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect EVM Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} className="btn-cyber-error">
                    Wrong Network
                  </Button>
                )
              }

              return (
                <Button onClick={openAccountModal} className="btn-cyber relative">
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">
                      {account.displayName}
                    </span>
                    <span className="sm:hidden">
                      {account.displayName.substring(0, 6)}...
                    </span>
                    {evm.balance && (
                      <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                        {parseFloat(evm.balance).toFixed(2)} {activeMetadata?.nativeCurrency.symbol}
                      </Badge>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                </Button>
              )
            }}
          </ConnectButton.Custom>
        ) : activeMetadata?.type === ChainType.SOLANA ? (
          // Solana Chains
          isSolanaConnected && solanaAddress ? (
            <div className="flex items-center gap-2">
              <Button className="btn-cyber relative">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">
                    {solanaAddress.substring(0, 4)}...{solanaAddress.substring(solanaAddress.length - 4)}
                  </span>
                  <span className="sm:hidden">
                    {solanaAddress.substring(0, 4)}...
                  </span>
                  {solana.balance && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                      {formatBalance(solana.balance, activeChain!)} SOL
                    </Badge>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="btn-cyber-outline"
                onClick={handleDisconnect}
              >
                <Power className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowSolanaModal(true)}
              className="btn-cyber"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Solana Wallet
            </Button>
          )
        ) : activeMetadata?.type === ChainType.SUI ? (
          // Sui Chains (Future)
          <Button className="btn-cyber" disabled>
            <Wallet className="w-4 h-4 mr-2" />
            Sui Coming Soon
          </Button>
        ) : (
          <Button className="btn-cyber" disabled>
            Select Chain
          </Button>
        )}

        {/* Connection Status Indicator */}
        {isActiveChainConnected && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">Connected</span>
          </div>
        )}
      </div>

      {/* Solana Wallet Modal */}
      <SolanaWalletModal
        isOpen={showSolanaModal}
        onClose={() => setShowSolanaModal(false)}
        chainId={activeChain || ChainId.SOLANA_DEVNET}
      />
    </>
  )
}
