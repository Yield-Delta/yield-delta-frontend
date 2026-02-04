/**
 * Solana Wallet Adapter Hook
 * Provides unified interface for Solana wallet connections
 * Supports Phantom, Solflare, and other Solana wallets
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, WalletStatus } from '@/types/chain'
import { getSolanaBalance, type SolanaCluster } from '@/lib/solana/connection'

// Window with Solana wallet extensions
declare global {
  interface Window {
    phantom?: {
      solana?: SolanaWallet
    }
    solflare?: SolanaWallet
    backpack?: SolanaWallet
  }
}

// Solana wallet interface (browser extension)
interface SolanaWallet {
  publicKey?: { toString(): string }
  isConnected: boolean
  connect(): Promise<{ publicKey: { toString(): string } }>
  disconnect(): Promise<void>
  on(event: string, callback: (publicKey: { toString(): string } | null) => void): void
  off(event: string, callback: (publicKey: { toString(): string } | null) => void): void
}

// Available Solana wallets
export enum SolanaWalletType {
  PHANTOM = 'phantom',
  SOLFLARE = 'solflare',
  BACKPACK = 'backpack',
}

interface UseSolanaWalletReturn {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  balance: string | null
  
  // Actions
  connect: (walletType: SolanaWalletType, chainId: ChainId) => Promise<void>
  disconnect: () => Promise<void>
  
  // Wallet detection
  availableWallets: SolanaWalletType[]
  hasPhantom: boolean
  hasSolflare: boolean
  hasBackpack: boolean
  
  // Error handling
  error: string | null
  clearError: () => void
}

// Helper: Map ChainId to SolanaCluster
function chainIdToCluster(chainId: ChainId): SolanaCluster {
  switch (chainId) {
    case ChainId.SOLANA_MAINNET:
      return 'mainnet-beta'
    case ChainId.SOLANA_DEVNET:
      return 'devnet'
    default:
      return 'devnet' // Default to devnet for safety
  }
}

export function useSolanaWallet(): UseSolanaWalletReturn {
  const {
    solana,
    connectSolanaWallet,
    disconnectSolanaWallet,
    updateSolanaBalance,
    setSolanaStatus,
  } = useMultiChainStore()

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableWallets, setAvailableWallets] = useState<SolanaWalletType[]>([])

  // Detect available wallets
  useEffect(() => {
    const detected: SolanaWalletType[] = []
    
    if (typeof window !== 'undefined') {
      if (window.phantom?.solana) {
        detected.push(SolanaWalletType.PHANTOM)
      }
      if (window.solflare) {
        detected.push(SolanaWalletType.SOLFLARE)
      }
      if (window.backpack) {
        detected.push(SolanaWalletType.BACKPACK)
      }
    }
    
    setAvailableWallets(detected)
  }, [])

  // Get wallet provider
  const getWalletProvider = useCallback((walletType: SolanaWalletType): SolanaWallet | null => {
    if (typeof window === 'undefined') return null

    switch (walletType) {
      case SolanaWalletType.PHANTOM:
        return window.phantom?.solana ?? null
      case SolanaWalletType.SOLFLARE:
        return window.solflare ?? null
      case SolanaWalletType.BACKPACK:
        return window.backpack ?? null
      default:
        return null
    }
  }, [])

  // Connect wallet
  const connect = useCallback(async (walletType: SolanaWalletType, chainId: ChainId) => {
    try {
      setIsConnecting(true)
      setError(null)
      setSolanaStatus(WalletStatus.CONNECTING)

      const wallet = getWalletProvider(walletType)
      if (!wallet) {
        throw new Error(`${walletType} wallet not found. Please install the extension.`)
      }

      // Connect to wallet
      const response = await wallet.connect()
      const address = response.publicKey.toString()

      // Update store
      connectSolanaWallet(address, chainId)

      // Fetch real balance from Solana RPC
      try {
        const cluster = chainIdToCluster(chainId)
        const balance = await getSolanaBalance(address, cluster)
        updateSolanaBalance(balance)
        console.log('[useSolanaWallet] Balance fetched:', balance, 'SOL')
      } catch (balanceErr) {
        console.error('[useSolanaWallet] Failed to fetch balance:', balanceErr)
        updateSolanaBalance('0')
      }

      // Setup event listeners
      wallet.on('accountChanged', (publicKey: { toString(): string } | null) => {
        if (publicKey) {
          connectSolanaWallet(publicKey.toString(), chainId)
        } else {
          disconnectSolanaWallet()
        }
      })

      wallet.on('disconnect', () => {
        disconnectSolanaWallet()
      })

      console.log('[useSolanaWallet] Connected:', { address, chainId, walletType })
    } catch (err: unknown) {
      console.error('[useSolanaWallet] Connection error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet'
      setError(errorMessage)
      setSolanaStatus(WalletStatus.ERROR)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [getWalletProvider, connectSolanaWallet, disconnectSolanaWallet, updateSolanaBalance, setSolanaStatus])

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      // Try to disconnect from all possible wallets
      for (const walletType of availableWallets) {
        const wallet = getWalletProvider(walletType)
        if (wallet?.isConnected) {
          await wallet.disconnect()
        }
      }

      disconnectSolanaWallet()
      console.log('[useSolanaWallet] Disconnected')
    } catch (err: unknown) {
      console.error('[useSolanaWallet] Disconnect error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect wallet'
      setError(errorMessage)
    }
  }, [availableWallets, getWalletProvider, disconnectSolanaWallet])

  const clearError = useCallback(() => setError(null), [])

  return {
    isConnected: solana.status === WalletStatus.CONNECTED,
    isConnecting,
    address: solana.address,
    balance: solana.balance,
    connect,
    disconnect,
    availableWallets,
    hasPhantom: availableWallets.includes(SolanaWalletType.PHANTOM),
    hasSolflare: availableWallets.includes(SolanaWalletType.SOLFLARE),
    hasBackpack: availableWallets.includes(SolanaWalletType.BACKPACK),
    error,
    clearError,
  }
}

// Helper hook to fetch Solana balance
export function useSolanaBalance(address: string | null, chainId: ChainId | null) {
  const { updateSolanaBalance } = useMultiChainStore()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!address || !chainId) return

    const fetchBalance = async () => {
      try {
        setIsLoading(true)
        
        // Fetch real balance from Solana RPC
        const cluster = chainIdToCluster(chainId)
        const balance = await getSolanaBalance(address, cluster)
        updateSolanaBalance(balance)
        
        console.log('[useSolanaBalance] Balance updated:', balance, 'SOL')
      } catch (err) {
        console.error('[useSolanaBalance] Error fetching balance:', err)
        updateSolanaBalance('0')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
    
    // Refetch balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000)
    return () => clearInterval(interval)
  }, [address, chainId, updateSolanaBalance])

  return { isLoading }
}
