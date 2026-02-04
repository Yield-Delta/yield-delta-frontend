'use client'

import React, { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { SeiWalletModal } from './SeiWalletModal'
import { useSeiWallet } from '@/hooks/useSeiWallet'
import { useBalance, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { isTestnetChain, getChainDisplayName } from '@/lib/chainUtils'

export function WalletConnectButton() {
  const [showSeiModal, setShowSeiModal] = useState(false)
  const { isSeiConnected, isFullyConnected, mounted } = useSeiWallet()
  const [fallbackMode, setFallbackMode] = useState(false)
  const [lastLogTime, setLastLogTime] = useState(0)
  
  // Get wallet address and balance for SEI testnet
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
    chainId: 1328, // SEI Atlantic-2 testnet
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 20000, // 20 seconds stale time
    }
  })
  
  // Enhanced debug logging with debouncing to prevent spam
  React.useEffect(() => {
    const now = Date.now()
    // Only log every 5 seconds to prevent console spam
    if (now - lastLogTime < 5000) return
    
    setLastLogTime(now)
    console.log('[WalletConnectButton] State:', { 
      mounted, 
      fallbackMode, 
      isSeiConnected, 
      isFullyConnected,
      timestamp: new Date().toISOString()
    })
    
    // Debug DOM visibility (only when needed)
    const walletContainers = document.querySelectorAll('.wallet-container-override')
    if (walletContainers.length > 1) {
      console.warn('[WalletConnectButton] Multiple wallet containers detected:', walletContainers.length)
    }
  }, [mounted, fallbackMode, isSeiConnected, isFullyConnected, lastLogTime])

  // Reduced fallback timeout for better UX
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!mounted) {
        console.log('[WalletConnectButton] Activating fallback mode after timeout')
        setFallbackMode(true)
      }
    }, 3000) // Reduced from 5s to 3s

    return () => clearTimeout(timer)
  }, [mounted])

  // Always show a button to ensure visibility - even during loading
  if (!mounted && !fallbackMode) {
    return (
      <div className="wallet-container-override">
        <Button 
          className="btn-cyber" 
          disabled
          data-testid="wallet-loading-button"
        >
          Loading...
        </Button>
      </div>
    )
  }

  // Enhanced fallback mode with better error handling
  if (fallbackMode) {
    return (
      <div className="wallet-container-override">
        <Button 
          className="btn-cyber"
          onClick={() => {
            console.log('[WalletConnectButton] Fallback mode - attempting wallet connection')
            // More user-friendly fallback
            const retry = window.confirm('Wallet connection is having issues. Would you like to refresh the page to try again?')
            if (retry) {
              window.location.reload()
            }
          }}
        >
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <>
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== 'loading'
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus ||
              authenticationStatus === 'authenticated')

          return (
            <>
              {/* Always render container - even if not ready for maximum visibility */}
              <div className="wallet-container-override flex items-center">
                {(() => {
                  // Show loading state if not ready
                  if (!ready) {
                    return (
                      <Button 
                        className="btn-cyber"
                        disabled
                      >
                        Connecting...
                      </Button>
                    )
                  }

                  if (!connected) {
                    return (
                      <Button 
                        onClick={openConnectModal} 
                        className="btn-cyber"
                        type="button"
                      >
                        Connect Wallet
                      </Button>
                    )
                  }

                if (chain.unsupported) {
                  return (
                    <Button 
                      onClick={openChainModal} 
                      type="button"
                      className="btn-cyber-error"
                    >
                      Wrong network
                    </Button>
                  )
                }

                return (
                  <div className="flex items-center gap-2">
                    {/* Chain Button - Hidden on mobile - Shows testnet status */}
                    <Button
                      onClick={openChainModal}
                      className={`${isTestnetChain(chain.id) ? 'btn-cyber-warning' : 'btn-cyber-secondary'} hidden sm:flex relative`}
                      type="button"
                      title={isTestnetChain(chain.id) ? 'Testnet - Not real money' : chain.name}
                    >
                      {chain.hasIcon && (
                        <div
                          style={{
                            background: chain.iconBackground,
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            overflow: 'hidden',
                            marginRight: 4,
                          }}
                        >
                          {chain.iconUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={chain.name ?? 'Chain icon'}
                              src={chain.iconUrl}
                              style={{ width: 12, height: 12 }}
                            />
                          )}
                        </div>
                      )}
                      {getChainDisplayName(chain.id)}
                      {isTestnetChain(chain.id) && (
                        <div
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-background animate-pulse"
                          aria-label="Testnet indicator"
                        />
                      )}
                    </Button>

                    {/* Account Button - Responsive truncation */}
                    <Button
                      onClick={openAccountModal}
                      type="button"
                      className="btn-cyber relative max-w-[160px] sm:max-w-none"
                    >
                      {/* Mobile: Ultra-compact display */}
                      <span className="sm:hidden">
                        {account.displayName.substring(0, 4)}...{account.displayName.substring(account.displayName.length - 2)}
                      </span>

                      {/* Tablet: Compact with balance */}
                      <span className="hidden sm:inline md:hidden">
                        {account.displayName}
                        {balance && !balanceLoading
                          ? ` (${parseFloat(formatEther(balance.value)).toFixed(1)})`
                          : ''}
                      </span>

                      {/* Desktop: Full display */}
                      <span className="hidden md:inline">
                        {account.displayName}
                        {balance && !balanceLoading
                          ? ` (${parseFloat(formatEther(balance.value)).toFixed(2)} SEI)`
                          : balanceLoading
                          ? ' (Loading...)'
                          : ' (0.00 SEI)'}
                      </span>

                      {/* Connection status indicator */}
                      {isFullyConnected && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </Button>

                    {/* Sei Wallet Toggle - Hidden on mobile */}
                    <Button
                      onClick={() => setShowSeiModal(true)}
                      className={`${isSeiConnected ? "btn-cyber-secondary" : "btn-cyber-outline"} hidden sm:flex`}
                      type="button"
                      title="Connect Sei Cosmos wallet"
                    >
                      {isSeiConnected ? '🌕' : '🌑'}
                    </Button>
                  </div>
                )
                })()}
              </div>
            </>
          )
        }}
      </ConnectButton.Custom>

      {/* Sei Wallet Modal */}
      <SeiWalletModal 
        isOpen={showSeiModal} 
        onClose={() => setShowSeiModal(false)} 
      />
    </>
  )
}