import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useVaultStore, VaultData } from '@/stores/vaultStore'
import { useAppStore } from '@/stores/appStore'
import { useWriteContract, useAccount } from 'wagmi'
import { parseUnits } from 'viem'
import SEIVault from '@/lib/abis/SEIVault'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useVaults')

interface VaultResponse {
  success: boolean
  data: VaultData[]
  count: number
  chainId: number
  error?: string
}

interface CreateVaultRequest {
  name: string
  strategy: 'concentrated_liquidity' | 'yield_farming' | 'arbitrage' | 'hedge' | 'stable_max' | 'sei_hypergrowth' | 'blue_chip' | 'delta_neutral'
  tokenA: string
  tokenB: string
  fee: number
  tickSpacing: number
  chainId: number
}

export const VAULT_QUERY_KEYS = {
  all: ['vaults'] as const,
  lists: () => [...VAULT_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...VAULT_QUERY_KEYS.lists(), filters] as const,
  details: () => [...VAULT_QUERY_KEYS.all, 'detail'] as const,
  detail: (address: string) => [...VAULT_QUERY_KEYS.details(), address] as const,
  positions: (walletAddress: string) => [...VAULT_QUERY_KEYS.all, 'positions', walletAddress] as const,
}

// Fetch all vaults
export const useVaults = (filters?: { strategy?: string; active?: boolean }) => {
  const setVaults = useVaultStore((state) => state.setVaults)
  const setLoading = useVaultStore((state) => state.setLoading)
  const setError = useVaultStore((state) => state.setError)
  const addNotification = useAppStore((state) => state.addNotification)

  return useQuery({
    queryKey: VAULT_QUERY_KEYS.list(filters || {}),
    queryFn: async (): Promise<VaultData[]> => {
      logger.debug('queryFn called - starting fetch');

      // Only set loading in store if it's the client
      if (typeof window !== 'undefined') {
        setLoading(true)
      }

      try {
        const params = new URLSearchParams()
        if (filters?.strategy) params.append('strategy', filters.strategy)
        if (filters?.active !== undefined) params.append('active', filters.active.toString())

        const url = `/api/vaults?${params.toString()}`;
        logger.info('Fetching vaults from URL:', url);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })

        logger.debug('Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to fetch vaults: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
        }

        // Check if response has content
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');

        logger.debug('Response headers:', {
          contentLength,
          contentType
        });

        // Read response as text first to handle empty responses
        const responseText = await response.text();
        logger.debug(`Response text length: ${responseText.length}`);
        logger.debug(`Response text preview: ${responseText.substring(0, 200)}`);

        // Handle empty response
        if (!responseText || responseText.trim().length === 0) {
          logger.warn('Empty response received from vaults API');
          const emptyError = new Error('Empty response from vaults API');
          setError(emptyError.message);
          throw emptyError;
        }

        // Try to parse JSON
        let result: VaultResponse;
        try {
          result = JSON.parse(responseText);
          logger.debug('Successfully parsed JSON response:', result);
        } catch (parseError) {
          logger.error('JSON parse error:', parseError);
          logger.error('Failed to parse response text:', responseText);

          // Throw the error to surface it properly
          const error = new Error(`Failed to parse vaults API response: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
          setError(error.message);
          throw error;
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch vaults')
        }

        logger.info(`Successfully fetched ${result.data.length} vaults`);

        // Update store with fetched data (only on client)
        if (typeof window !== 'undefined') {
          setVaults(result.data)
          setError(null)
        }

        return result.data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        logger.error('Fetch error:', error);
        logger.debug('Error details:', {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : 'No stack',
          name: error instanceof Error ? error.name : 'Unknown error type'
        });

        // Only update store and show notifications on client
        if (typeof window !== 'undefined') {
          setError(errorMessage)
          addNotification({
            type: 'error',
            title: 'Failed to fetch vaults',
            message: errorMessage,
          })
        }

        throw error
      } finally {
        // Only set loading in store if it's the client
        if (typeof window !== 'undefined') {
          setLoading(false)
        }
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - much longer to reduce requests
    refetchInterval: false, // CRITICAL: Disable automatic refetch to prevent provider conflicts
    refetchOnWindowFocus: false, // CRITICAL: Prevent focus-based refetch
    refetchOnReconnect: false, // CRITICAL: Prevent reconnect-based refetch
    refetchOnMount: true, // Only refetch on mount
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors, wallet errors, or if offline
      if (error instanceof Error && (
        error.message.includes('4') ||
        error.message.includes('MetaMask') ||
        error.message.includes('eth_accounts') ||
        !navigator.onLine
      )) {
        return false
      }
      return failureCount < 2 // Reduced retries
    },
    enabled: typeof window !== 'undefined', // Only enable on client side
  })
}

// Fetch single vault details
export const useVault = (address: string) => {
  return useQuery({
    queryKey: VAULT_QUERY_KEYS.detail(address),
    queryFn: async (): Promise<VaultData> => {
      const response = await fetch(`/api/vaults/${address}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch vault: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`)
      }

      // Read response as text first to handle empty responses
      const responseText = await response.text();

      // Handle empty response
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response received from server')
      }

      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        logger.error('Single vault JSON parse error:', parseError);
        logger.error('Failed to parse single vault response text:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vault')
      }

      return result.data
    },
    enabled: !!address && typeof window !== 'undefined',
    staleTime: 3 * 60 * 1000, // 3 minutes - longer stale time
    refetchInterval: false, // CRITICAL: Disable automatic refetch
    refetchOnWindowFocus: false, // CRITICAL: Prevent focus-based refetch
    refetchOnReconnect: false, // CRITICAL: Prevent reconnect-based refetch
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors or wallet errors
      if (error instanceof Error && (
        error.message.includes('4') ||
        error.message.includes('MetaMask') ||
        error.message.includes('eth_accounts')
      )) {
        return false
      }
      return failureCount < 2 // Reduced retries
    },
  })
}

// Create new vault
export const useCreateVault = () => {
  const queryClient = useQueryClient()
  const addVault = useVaultStore((state) => state.addVault)
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    mutationFn: async (vaultData: CreateVaultRequest): Promise<VaultData> => {
      const response = await fetch('/api/vaults', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vaultData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create vault: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create vault')
      }

      return result.data
    },
    onSuccess: (newVault) => {
      // Update store
      addVault(newVault)

      // Invalidate and refetch vault lists
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() })

      // Success notification
      addNotification({
        type: 'success',
        title: 'Vault Created',
        message: `${newVault.name} has been successfully created`,
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      addNotification({
        type: 'error',
        title: 'Failed to create vault',
        message: errorMessage,
      })
    },
  })
}

// Get user positions
export const useUserPositions = (walletAddress: string) => {
  const setUserPositions = useVaultStore((state) => state.setUserPositions)

  return useQuery({
    queryKey: VAULT_QUERY_KEYS.positions(walletAddress),
    queryFn: async () => {
      // This would typically call your backend API
      // For now, returning mock data
      const positions = [
        {
          vaultAddress: '0x1234567890123456789012345678901234567890',
          shares: '1000000000000000000',
          depositedAmount: '1000',
          currentValue: '1087',
          pnl: 87,
          pnlPercentage: 8.7,
          depositedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        },
      ]

      setUserPositions(positions)
      return positions
    },
    enabled: !!walletAddress,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

// Deposit to vault
export const useDepositToVault = (vaultAddress: string) => {
  const { writeContract, data: hash, error, isPending, isSuccess, isError } = useWriteContract()
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  const deposit = async (amount: string): Promise<string> => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    if (!vaultAddress) {
      throw new Error('Vault address not provided')
    }

    // ONLY DEPLOYED VAULTS - SEI Atlantic-2 Testnet (Chain ID 1328)
    // These are the ONLY vaults actually deployed on-chain
    const validTestnetVaults = [
      '0x1ec7d0E455c0Ca2Ed4F2c27bc8F7E3542eeD6565', // Concentrated Liquidity Vault (DEPLOYED Nov 21 2025)
      '0xbCB883594435D92395fA72D87845f87BE78d202E', // Stable Max USDC Vault (DEPLOYED Nov 26 2025)
      '0xB8Ab030551dabC4FA99864111AAbA7F82281EbD8', // Delta Neutral Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
      '0x0Ea885EcA3c738be522b256261C4a13eF4225fD4', // Yield Farming Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
      '0xa079a2881233B8bBBd185DdEA5c0a5f484cD4E7b', // Active Trading Vault (REDEPLOYED Nov 29 2025 - with P&L simulation)
    ]

    // Legacy/demo vault addresses have been removed - they were never deployed

    const normalizedVaultAddress = vaultAddress.toLowerCase()
    const isValidTestnetVault = validTestnetVaults.some(addr => addr.toLowerCase() === normalizedVaultAddress)

    if (!isValidTestnetVault) {
      logger.error('Invalid vault address for testnet:', vaultAddress)
      throw new Error(`Vault address ${vaultAddress} is not deployed on SEI Atlantic-2 testnet (Chain ID 1328). Please use a valid testnet vault address.`)
    }

    const amountInWei = parseUnits(amount, 18)

    try {
      logger.info('Initiating deposit with validated address:', {
        vaultAddress,
        amount,
        amountInWei: amountInWei.toString(),
        userAddress: address
      })

      // Call writeContract - this triggers the transaction
      // Note: This contract expects ERC20 token approval, not native SEI
      writeContract({
        address: vaultAddress.startsWith('0x') ? vaultAddress as `0x${string}` : `0x${vaultAddress}` as `0x${string}`,
        abi: SEIVault,
        functionName: 'seiOptimizedDeposit',
        args: [amountInWei, address],
        // No value parameter - this contract uses transferFrom for ERC20 tokens
      })

      // The writeContract function returns void, but the hook will update with the hash
      // We return a resolved Promise immediately since the actual transaction handling
      // is done through the wagmi hooks (isSuccess, isError, etc.)
      return Promise.resolve('pending')
    } catch (err) {
      // Handle any synchronous errors
      logger.error('Deposit error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'

      // Enhanced error messaging for common issues
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('execution reverted')) {
        userFriendlyMessage = 'Transaction failed: Contract execution reverted. Please check your balance and try again.'
      } else if (errorMessage.includes('insufficient funds')) {
        userFriendlyMessage = 'Insufficient funds for this transaction including gas fees.'
      } else if (errorMessage.includes('user rejected')) {
        userFriendlyMessage = 'Transaction was rejected. Please try again.'
      }

      addNotification({
        type: 'error',
        title: 'Deposit Failed',
        message: userFriendlyMessage,
      })
      throw err
    }
  }

  // Handle success and error states through effects in the component
  return {
    deposit,
    hash,
    error,
    isPending,
    isSuccess,
    isError,
    // Add helper to invalidate queries when needed
    invalidateQueries: () => {
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.detail(vaultAddress) })
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() })
    }
  }
}

// Withdraw from vault
export const useWithdrawFromVault = () => {
  const queryClient = useQueryClient()
  const addNotification = useAppStore((state) => state.addNotification)

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async (_params: { vaultAddress: string; shares: string }) => {
      // This would integrate with your smart contract
      // For now, simulating the withdrawal
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, txHash: '0x...' })
        }, 2000)
      })
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.detail(variables.vaultAddress) })
      queryClient.invalidateQueries({ queryKey: VAULT_QUERY_KEYS.lists() })

      addNotification({
        type: 'success',
        title: 'Withdrawal Successful',
        message: `Successfully withdrew ${variables.shares} shares`,
      })
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Withdrawal failed'
      addNotification({
        type: 'error',
        title: 'Withdrawal Failed',
        message: errorMessage,
      })
    },
  })
}
