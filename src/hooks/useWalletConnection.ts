'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

/**
 * Centralized wallet connection manager to prevent multiple simultaneous connections
 * and reduce MetaMask account polling conflicts
 */
export function useWalletConnection() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const connectionAttemptRef = useRef<Promise<void> | null>(null)
  
  const { address, isConnected, status } = useAccount()
  const { disconnect } = useDisconnect()

  // Clear error when connection status changes
  useEffect(() => {
    if (isConnected) {
      setConnectionError(null)
      setIsConnecting(false)
    }
  }, [isConnected])

  // Prevent multiple simultaneous connection attempts
  const connectWallet = async (connectFn: () => Promise<void>) => {
    if (isConnecting || connectionAttemptRef.current) {
      console.warn('[useWalletConnection] Connection already in progress')
      return
    }

    setIsConnecting(true)
    setConnectionError(null)

    try {
      const connectionPromise = connectFn()
      connectionAttemptRef.current = connectionPromise
      await connectionPromise
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setConnectionError(errorMessage)
      console.error('[useWalletConnection] Connection failed:', error)
    } finally {
      setIsConnecting(false)
      connectionAttemptRef.current = null
    }
  }

  const disconnectWallet = async () => {
    try {
      setConnectionError(null)
      await disconnect()
    } catch (error) {
      console.error('[useWalletConnection] Disconnect failed:', error)
    }
  }

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    connectionError,
    status,
    
    // Connection actions
    connectWallet,
    disconnectWallet,
    
    // Status checks
    isConnectionStable: isConnected && !isConnecting && !connectionError,
  }
}