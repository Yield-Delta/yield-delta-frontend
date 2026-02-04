'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'

// Supported Sei wallets (Cosmos-based)
export const SUPPORTED_SEI_WALLETS = [
  { windowKey: 'keplr', name: 'Keplr' },
  { windowKey: 'leap', name: 'Leap' },
  { windowKey: 'falcon', name: 'Falcon' },
  { windowKey: 'coin98', name: 'Coin98' }
] as const

type SeiWalletType = typeof SUPPORTED_SEI_WALLETS[number]['windowKey']

interface SeiWalletState {
  isConnected: boolean
  accounts: string[]
  selectedWallet: SeiWalletType | null
  error: string | null
}

export function useSeiWallet() {
  const [mounted, setMounted] = useState(false)
  // Use selective destructuring to avoid unnecessary re-renders
  const account = useAccount()
  const chainId = useChainId()
  
  // Cache the connection status to prevent excessive polling
  const isEvmConnected = account.isConnected
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const [seiWalletState, setSeiWalletState] = useState<SeiWalletState>({
    isConnected: false,
    accounts: [],
    selectedWallet: null,
    error: null
  })

  const connectSeiWallet = async (walletType: SeiWalletType) => {
    try {
      setSeiWalletState(prev => ({ ...prev, error: null }))

      if (typeof window === 'undefined') {
        throw new Error('Window is not available')
      }

      const wallet = (window as unknown as Record<string, unknown>)[walletType] as {
        enable?: (chainId: string) => Promise<void>
        getOfflineSigner?: (chainId: string) => { getAccounts: () => Promise<Array<{ address: string }>> }
      }
      if (!wallet) {
        throw new Error(`${walletType} wallet not found. Please install the ${walletType} extension.`)
      }

      // Determine the cosmos chain ID based on EVM chain ID
      let cosmosChainId: string
      if (chainId === 1329) {
        cosmosChainId = 'pacific-1' // mainnet
      } else if (chainId === 1328) {
        cosmosChainId = 'atlantic-2' // testnet
      } else {
        cosmosChainId = 'arctic-1' // testnet fallback
      }
      
      console.log('[useSeiWallet] Using chain ID:', chainId, 'mapping to cosmos:', cosmosChainId);

      // For Keplr and other Cosmos wallets, we need to enable the chain first
      if (walletType === 'keplr') {
        if (!wallet.enable) {
          throw new Error('Wallet enable method not available')
        }
        await wallet.enable(cosmosChainId)
        
        if (!wallet.getOfflineSigner) {
          throw new Error('Wallet getOfflineSigner method not available')
        }
        const offlineSigner = wallet.getOfflineSigner(cosmosChainId)
        const accounts = await offlineSigner.getAccounts()
        
        setSeiWalletState({
          isConnected: true,
          accounts: accounts.map((acc: { address: string }) => acc.address),
          selectedWallet: walletType,
          error: null
        })
      } else {
        // For other wallets, we might need different connection logic
        if (!wallet.enable) {
          throw new Error('Wallet enable method not available')
        }
        await wallet.enable(cosmosChainId)
        
        if (!wallet.getOfflineSigner) {
          throw new Error('Wallet getOfflineSigner method not available')
        }
        const offlineSigner = wallet.getOfflineSigner(cosmosChainId)
        const accounts = await offlineSigner.getAccounts()
        
        setSeiWalletState({
          isConnected: true,
          accounts: accounts.map((acc: { address: string }) => acc.address),
          selectedWallet: walletType,
          error: null
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet'
      setSeiWalletState(prev => ({
        ...prev,
        error: errorMessage,
        isConnected: false,
        accounts: [],
        selectedWallet: null
      }))
    }
  }

  const disconnectSeiWallet = () => {
    setSeiWalletState({
      isConnected: false,
      accounts: [],
      selectedWallet: null,
      error: null
    })
  }

  // Check if we have both EVM and Cosmos wallet connections
  const isFullyConnected = mounted && isEvmConnected && seiWalletState.isConnected

  return {
    // EVM wallet state
    isEvmConnected: mounted ? isEvmConnected : false,
    
    // Sei Cosmos wallet state
    isSeiConnected: seiWalletState.isConnected,
    seiAccounts: seiWalletState.accounts,
    selectedSeiWallet: seiWalletState.selectedWallet,
    seiWalletError: seiWalletState.error,
    
    // Combined state
    isFullyConnected,
    mounted,
    
    // Actions
    connectSeiWallet,
    disconnectSeiWallet,
    
    // Constants
    SUPPORTED_SEI_WALLETS
  }
}