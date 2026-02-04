import { useState, useCallback } from 'react'

type SetValue<T> = (value: T | ((val: T) => T)) => void

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue: SetValue<T> = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// Specialized hooks for common use cases
export const useUserPreferences = () => {
  return useLocalStorage('user-preferences', {
    theme: 'dark' as 'light' | 'dark' | 'system',
    preferredTimeframe: '1d' as '1h' | '1d' | '7d' | '30d',
    riskTolerance: 'medium' as 'low' | 'medium' | 'high',
    autoRebalance: true,
    slippageTolerance: 0.5,
    notifications: true,
    sound: false,
  })
}

export const useRecentTransactions = () => {
  return useLocalStorage('recent-transactions', [] as Array<{
    hash: string
    type: 'deposit' | 'withdraw' | 'rebalance'
    vaultAddress: string
    amount: string
    timestamp: number
    status: 'pending' | 'confirmed' | 'failed'
  }>)
}

export const useFavoriteVaults = () => {
  return useLocalStorage('favorite-vaults', [] as string[])
}

export const useWatchlist = () => {
  return useLocalStorage('watchlist', [] as Array<{
    symbol: string
    name: string
    addedAt: number
  }>)
}

export default useLocalStorage