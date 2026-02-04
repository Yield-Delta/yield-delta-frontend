'use client'

import { useEffect, useState } from 'react'

/**
 * Client-side provider to initialize SEI Global Wallet
 * This must run on the client side to avoid SSR issues
 */
export function SeiGlobalWalletProvider({ children }: { children: React.ReactNode }) {
  const [seiWalletInitialized, setSeiWalletInitialized] = useState(false)

  useEffect(() => {
    // Prevent multiple initializations
    if (seiWalletInitialized) return

    // Add a longer delay to ensure wagmi is fully settled and prevent provider conflicts
    const timer = setTimeout(() => {
      // Check if MetaMask is already active to avoid conflicts
      const hasMetaMask = typeof window !== 'undefined' && window.ethereum?.isMetaMask
      
      if (hasMetaMask) {
        console.log('[SeiGlobalWalletProvider] MetaMask detected, delaying SEI wallet init to prevent conflicts')
        // Additional delay when MetaMask is present
        setTimeout(() => {
          initializeSeiWallet()
        }, 2000)
      } else {
        initializeSeiWallet()
      }
    }, 2000) // 2 second delay to let wagmi settle completely

    const initializeSeiWallet = () => {
      // Dynamically import the SEI Global Wallet to enable EIP-6963 support
      // This ensures it only runs on the client side and after other providers
      import('@sei-js/sei-global-wallet/eip6963')
        .then(() => {
          setSeiWalletInitialized(true)
          console.log('[SeiGlobalWalletProvider] SEI Global Wallet initialized')
        })
        .catch((error) => {
          console.error('[SeiGlobalWalletProvider] Failed to initialize:', error)
          setSeiWalletInitialized(true) // Set to true anyway to prevent retry loops
        })
    }

    return () => clearTimeout(timer)
  }, [seiWalletInitialized])

  return <>{children}</>
}