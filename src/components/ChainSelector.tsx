/**
 * Chain Selector Component
 * Beautiful UI for selecting between supported blockchains
 * Displays wallet connection status and balances per chain
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, Check, AlertCircle, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, ChainType, WalletState, WalletStatus } from '@/types/chain'
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

  const activeMetadata = activeChain ? getChainMetadata(activeChain) : null

  // Get wallet state for a chain
  const getWalletStateForChain = (chainId: ChainId) => {
    const metadata = getChainMetadata(chainId)
    switch (metadata.type) {
      case ChainType.EVM:
        return evm
      case ChainType.SOLANA:
        return solana
      case ChainType.SUI:
        return sui
      default:
        return null
    }
  }

  // Handle chain selection
  const handleChainSelect = (chainId: ChainId) => {
    setActiveChain(chainId)
    setIsOpen(false)
    onChainSelect?.(chainId)
  }

  // Group chains by type
  const evmChains = Object.values(CHAIN_METADATA).filter(c => c.type === ChainType.EVM)
  const solanaChains = Object.values(CHAIN_METADATA).filter(c => c.type === ChainType.SOLANA)
  const suiChains = Object.values(CHAIN_METADATA).filter(c => c.type === ChainType.SUI)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`${className} ${
            compact ? 'px-3' : 'px-4'
          } relative overflow-hidden border-cyan-500/30 bg-background/80 backdrop-blur-sm hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300`}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-0 hover:opacity-100"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ backgroundSize: '200% 200%' }}
          />

          <div className="relative flex items-center gap-2">
            {/* Chain Icon */}
            {activeMetadata?.iconUrl && (
              <div className="w-5 h-5 rounded-full overflow-hidden border border-cyan-500/30">
                <img
                  src={activeMetadata.iconUrl}
                  alt={activeMetadata.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Chain Name */}
            <span className="font-medium">
              {activeMetadata?.displayName || 'Select Chain'}
            </span>

            {/* Testnet Badge */}
            {activeMetadata?.isTestnet && !compact && (
              <Badge
                variant="outline"
                className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"
              >
                Testnet
              </Badge>
            )}

            {/* Connection Status Indicator */}
            {activeChain && isWalletConnectedForChain(activeChain) && (
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}

            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 border-0 p-1"
        style={{
          background: 'linear-gradient(145deg, #07080f 0%, #0b0d1c 100%)',
          border: '1px solid rgba(0, 245, 212, 0.18)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,245,212,0.06) inset, 0 0 50px rgba(0,245,212,0.05)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        <DropdownMenuLabel className="text-xs font-bold tracking-widest uppercase px-3 py-2" style={{ color: 'rgba(0,245,212,0.7)', letterSpacing: '0.12em' }}>Select Blockchain</DropdownMenuLabel>
        <DropdownMenuSeparator style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,212,0.2), transparent)', height: '1px', border: 'none', margin: '0 8px' }} />

        {/* EVM Chains (SEI) */}
        <div className="py-1">
          <div className="px-3 py-1.5 text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            EVM Chains
          </div>
          {evmChains.map((chain) => (
            <ChainMenuItem
              key={chain.id}
              chain={chain}
              isActive={activeChain === chain.id}
              isConnected={isWalletConnectedForChain(chain.id)}
              walletState={getWalletStateForChain(chain.id)}
              onSelect={() => handleChainSelect(chain.id)}
              showBalance={showBalances}
            />
          ))}
        </div>

        <DropdownMenuSeparator style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,212,0.15), transparent)', height: '1px', border: 'none', margin: '4px 8px' }} />

        {/* Solana Chains */}
        <div className="py-1">
          <div className="px-3 py-1.5 text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            Solana
          </div>
          {solanaChains.map((chain) => (
            <ChainMenuItem
              key={chain.id}
              chain={chain}
              isActive={activeChain === chain.id}
              isConnected={isWalletConnectedForChain(chain.id)}
              walletState={getWalletStateForChain(chain.id)}
              onSelect={() => handleChainSelect(chain.id)}
              showBalance={showBalances}
            />
          ))}
        </div>

        <DropdownMenuSeparator style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,212,0.15), transparent)', height: '1px', border: 'none', margin: '4px 8px' }} />

        {/* Sui Chains (Coming Soon) */}
        <div className="py-1 opacity-50">
          <div className="px-3 py-1.5 text-xs font-bold tracking-widest uppercase flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            Sui
            <Badge variant="outline" className="text-xs">
              Coming Soon
            </Badge>
          </div>
          {suiChains.map((chain) => (
            <ChainMenuItem
              key={chain.id}
              chain={chain}
              isActive={false}
              isConnected={false}
              walletState={null}
              onSelect={() => {}}
              showBalance={false}
              disabled
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Chain Menu Item Component
interface ChainMenuItemProps {
  chain: ReturnType<typeof getChainMetadata>
  isActive: boolean
  isConnected: boolean
  walletState: WalletState | null
  onSelect: () => void
  showBalance: boolean
  disabled?: boolean
}

function ChainMenuItem({
  chain,
  isActive,
  isConnected,
  walletState,
  onSelect,
  showBalance,
  disabled = false,
}: ChainMenuItemProps) {
  return (
    <DropdownMenuItem
      className={`
        relative cursor-pointer transition-all duration-200 rounded-lg mx-1 mb-0.5
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
      `}
      style={{
        background: isActive ? 'rgba(0, 245, 212, 0.1)' : 'transparent',
        borderLeft: isActive ? '2px solid rgba(0, 245, 212, 0.7)' : '2px solid transparent',
        paddingLeft: '10px',
      }}
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
    >
      <div className="flex items-center justify-between w-full gap-3">
        {/* Left: Icon + Name */}
        <div className="flex items-center gap-3 flex-1">
          {/* Chain Icon */}
          {chain.iconUrl && (
            <div className="w-6 h-6 rounded-full overflow-hidden border border-cyan-500/30 flex-shrink-0">
              <img
                src={chain.iconUrl}
                alt={chain.displayName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Chain Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{chain.displayName}</span>
              {chain.isTestnet && (
                <Badge
                  variant="outline"
                  className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30 px-1 py-0"
                >
                  Test
                </Badge>
              )}
            </div>
            
            {/* Balance */}
            {showBalance && isConnected && walletState?.balance && (
              <span className="text-xs text-muted-foreground">
                {formatBalance(walletState.balance, chain.id)} {chain.nativeCurrency.symbol}
              </span>
            )}
          </div>
        </div>

        {/* Right: Status Indicators */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Connection Status */}
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-400">
              <Wallet className="w-4 h-4" />
              <span className="text-xs">Connected</span>
            </div>
          ) : walletState?.status === WalletStatus.CONNECTING ? (
            <div className="flex items-center gap-1 text-cyan-400">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <AlertCircle className="w-4 h-4" />
              </motion.div>
              <span className="text-xs">Connecting...</span>
            </div>
          ) : null}

          {/* Active Indicator */}
          {isActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-cyan-400"
            >
              <Check className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </div>
    </DropdownMenuItem>
  )
}
