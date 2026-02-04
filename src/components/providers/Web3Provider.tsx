"use client"

// Polyfill indexedDB on server to prevent WalletConnect SSR errors
if (typeof window === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).indexedDB = { open: () => ({}) }
}
import '@rainbow-me/rainbowkit/styles.css'
import { SeiGlobalWalletProvider } from './SeiGlobalWalletProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from '@/lib/web3'
import { ReactNode, useEffect, useState } from 'react'

// Create QueryClient with proper error handling and retry logic
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 10, // 10 minutes - longer to reduce provider requests
        gcTime: 1000 * 60 * 60, // 60 minutes - longer garbage collection
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors or wallet-related errors
          if (error instanceof Error && (
            error.message.includes('4') ||
            error.message.includes('MetaMask') ||
            error.message.includes('eth_accounts') ||
            error.message.includes('wallet')
          )) {
            return false
          }
          return failureCount < 2 // Reduce retries to minimize provider calls
        },
        retryDelay: attemptIndex => Math.min(1000 * 3 ** attemptIndex, 45000), // Longer delays
        refetchOnWindowFocus: false, // CRITICAL: Prevent focus-based refetch
        refetchOnReconnect: false, // CRITICAL: Prevent reconnect-based refetch
        refetchOnMount: false, // CRITICAL: Prevent mount-based refetch
        refetchInterval: false, // CRITICAL: Disable automatic refetch intervals
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations on client errors or wallet errors
          if (error instanceof Error && (
            error.message.includes('4') ||
            error.message.includes('MetaMask') ||
            error.message.includes('eth_accounts') ||
            error.message.includes('wallet')
          )) {
            return false
          }
          return failureCount < 1 // Single retry only
        },
        retryDelay: attemptIndex => Math.min(1000 * 3 ** attemptIndex, 45000),
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [mounted, setMounted] = useState(false)
  // Create a stable queryClient instance
  const [queryClient] = useState(() => getQueryClient())

  useEffect(() => {
    setMounted(true)
  }, [])

  // Always provide QueryClientProvider and WagmiProvider to prevent hook errors
  // Only conditionally render RainbowKit and SEI providers after mounting
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {!mounted ? (
          // Return a skeleton while mounting to prevent layout shift
          <div className="min-h-screen">
            {children}
          </div>
        ) : (
          <RainbowKitProvider 
            initialChain={1328} 
            showRecentTransactions={false}
            // Prevent account switching issues
            modalSize="compact"
          >
            <SeiGlobalWalletProvider>
              {children}
            </SeiGlobalWalletProvider>
          </RainbowKitProvider>
        )}
      </WagmiProvider>
    </QueryClientProvider>
  )
}