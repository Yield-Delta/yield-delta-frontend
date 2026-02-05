/**
 * Solana Wallet Hook Tests
 * Tests for useSolanaWallet and useSolanaBalance hooks
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSolanaWallet, useSolanaBalance, SolanaWalletType } from '@/hooks/useSolanaWallet'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, WalletStatus } from '@/types/chain'

// Mock the multiChainStore
jest.mock('@/stores/multiChainStore')

// Mock solana connection
jest.mock('@/lib/solana/connection', () => ({
  getSolanaBalance: jest.fn(),
}))

import { getSolanaBalance } from '@/lib/solana/connection'

describe('useSolanaWallet', () => {
  const mockConnectSolanaWallet = jest.fn()
  const mockDisconnectSolanaWallet = jest.fn()
  const mockUpdateSolanaBalance = jest.fn()
  const mockSetSolanaStatus = jest.fn()

  const createMockStore = (overrides: Record<string, unknown> = {}) => ({
    solana: {
      address: null,
      balance: null,
      chainId: null,
      status: WalletStatus.DISCONNECTED,
      ...overrides,
    },
    connectSolanaWallet: mockConnectSolanaWallet,
    disconnectSolanaWallet: mockDisconnectSolanaWallet,
    updateSolanaBalance: mockUpdateSolanaBalance,
    setSolanaStatus: mockSetSolanaStatus,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useMultiChainStore as unknown as jest.Mock).mockReturnValue(createMockStore())

    // Reset window object
    delete (window as unknown as Record<string, unknown>).phantom
    delete (window as unknown as Record<string, unknown>).solflare
    delete (window as unknown as Record<string, unknown>).backpack
  })

  describe('wallet detection', () => {
    it('should detect Phantom wallet', () => {
      ;(window as unknown as Record<string, unknown>).phantom = { solana: { isConnected: false } }

      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.hasPhantom).toBe(true)
      expect(result.current.hasSolflare).toBe(false)
      expect(result.current.hasBackpack).toBe(false)
      expect(result.current.availableWallets).toContain(SolanaWalletType.PHANTOM)
    })

    it('should detect Solflare wallet', () => {
      ;(window as unknown as Record<string, unknown>).solflare = { isConnected: false }

      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.hasPhantom).toBe(false)
      expect(result.current.hasSolflare).toBe(true)
      expect(result.current.hasBackpack).toBe(false)
      expect(result.current.availableWallets).toContain(SolanaWalletType.SOLFLARE)
    })

    it('should detect Backpack wallet', () => {
      ;(window as unknown as Record<string, unknown>).backpack = { isConnected: false }

      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.hasPhantom).toBe(false)
      expect(result.current.hasSolflare).toBe(false)
      expect(result.current.hasBackpack).toBe(true)
      expect(result.current.availableWallets).toContain(SolanaWalletType.BACKPACK)
    })

    it('should detect multiple wallets', () => {
      ;(window as unknown as Record<string, unknown>).phantom = { solana: { isConnected: false } }
      ;(window as unknown as Record<string, unknown>).solflare = { isConnected: false }
      ;(window as unknown as Record<string, unknown>).backpack = { isConnected: false }

      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.availableWallets).toHaveLength(3)
      expect(result.current.hasPhantom).toBe(true)
      expect(result.current.hasSolflare).toBe(true)
      expect(result.current.hasBackpack).toBe(true)
    })

    it('should handle no wallets installed', () => {
      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.availableWallets).toHaveLength(0)
      expect(result.current.hasPhantom).toBe(false)
      expect(result.current.hasSolflare).toBe(false)
      expect(result.current.hasBackpack).toBe(false)
    })
  })

  describe('connect', () => {
    it('should connect Phantom wallet successfully', async () => {
      const mockConnect = jest.fn().mockResolvedValue({
        publicKey: { toString: () => 'PhantomAddress123' },
      })

      ;(window as unknown as Record<string, unknown>).phantom = {
        solana: {
          isConnected: false,
          connect: mockConnect,
          on: jest.fn(),
          off: jest.fn(),
        },
      }

      ;(getSolanaBalance as jest.Mock).mockResolvedValue('5.5')

      const { result } = renderHook(() => useSolanaWallet())

      await act(async () => {
        await result.current.connect(SolanaWalletType.PHANTOM, ChainId.SOLANA_DEVNET)
      })

      expect(mockConnect).toHaveBeenCalled()
      expect(mockConnectSolanaWallet).toHaveBeenCalledWith('PhantomAddress123', ChainId.SOLANA_DEVNET)
      expect(mockUpdateSolanaBalance).toHaveBeenCalledWith('5.5')
      expect(result.current.isConnecting).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle wallet not found error', async () => {
      const { result } = renderHook(() => useSolanaWallet())

      await act(async () => {
        await expect(
          result.current.connect(SolanaWalletType.PHANTOM, ChainId.SOLANA_DEVNET)
        ).rejects.toThrow('phantom wallet not found')
      })

      expect(result.current.error).toContain('phantom wallet not found')
      expect(mockSetSolanaStatus).toHaveBeenCalledWith(WalletStatus.ERROR)
    })

    it('should handle connection error', async () => {
      const mockConnect = jest.fn().mockRejectedValue(new Error('User rejected'))

      ;(window as unknown as Record<string, unknown>).phantom = {
        solana: {
          isConnected: false,
          connect: mockConnect,
          on: jest.fn(),
          off: jest.fn(),
        },
      }

      const { result } = renderHook(() => useSolanaWallet())

      await act(async () => {
        await expect(
          result.current.connect(SolanaWalletType.PHANTOM, ChainId.SOLANA_DEVNET)
        ).rejects.toThrow('User rejected')
      })

      expect(result.current.error).toBe('User rejected')
      expect(mockSetSolanaStatus).toHaveBeenCalledWith(WalletStatus.ERROR)
    })

    it('should set connecting state during connection', async () => {
      let resolveConnect: (value: unknown) => void = () => {}
      const connectPromise = new Promise((resolve) => {
        resolveConnect = resolve
      })

      ;(window as unknown as Record<string, unknown>).phantom = {
        solana: {
          isConnected: false,
          connect: jest.fn().mockReturnValue(connectPromise),
          on: jest.fn(),
          off: jest.fn(),
        },
      }

      const { result } = renderHook(() => useSolanaWallet())

      act(() => {
        result.current.connect(SolanaWalletType.PHANTOM, ChainId.SOLANA_DEVNET)
      })

      expect(result.current.isConnecting).toBe(true)

      await act(async () => {
        resolveConnect({ publicKey: { toString: () => 'Address123' } })
        await connectPromise
      })

      expect(result.current.isConnecting).toBe(false)
    })
  })

  describe('disconnect', () => {
    it('should disconnect wallet successfully', async () => {
      const mockDisconnect = jest.fn().mockResolvedValue(undefined)

      ;(window as unknown as Record<string, unknown>).phantom = {
        solana: {
          isConnected: true,
          disconnect: mockDisconnect,
        },
      }

      ;(useMultiChainStore as unknown as jest.Mock).mockReturnValue(
        createMockStore({
          availableWallets: [SolanaWalletType.PHANTOM],
        })
      )

      const { result } = renderHook(() => useSolanaWallet())

      await act(async () => {
        await result.current.disconnect()
      })

      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockDisconnectSolanaWallet).toHaveBeenCalled()
    })

    it('should handle disconnect error', async () => {
      const mockDisconnect = jest.fn().mockRejectedValue(new Error('Disconnect failed'))

      ;(window as unknown as Record<string, unknown>).phantom = {
        solana: {
          isConnected: true,
          disconnect: mockDisconnect,
        },
      }

      ;(useMultiChainStore as unknown as jest.Mock).mockReturnValue(
        createMockStore({
          availableWallets: [SolanaWalletType.PHANTOM],
        })
      )

      const { result } = renderHook(() => useSolanaWallet())

      await act(async () => {
        await result.current.disconnect()
      })

      expect(result.current.error).toBe('Disconnect failed')
    })
  })

  describe('connection state', () => {
    it('should reflect connected state', () => {
      ;(useMultiChainStore as unknown as jest.Mock).mockReturnValue(
        createMockStore({
          address: 'ConnectedAddress123',
          balance: '10.5',
          status: WalletStatus.CONNECTED,
        })
      )

      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.isConnected).toBe(true)
      expect(result.current.address).toBe('ConnectedAddress123')
      expect(result.current.balance).toBe('10.5')
    })

    it('should reflect disconnected state', () => {
      const { result } = renderHook(() => useSolanaWallet())

      expect(result.current.isConnected).toBe(false)
      expect(result.current.address).toBeNull()
      expect(result.current.balance).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error state', async () => {
      ;(window as unknown as Record<string, unknown>).phantom = {
        solana: {
          isConnected: false,
          connect: jest.fn().mockRejectedValue(new Error('Test error')),
          on: jest.fn(),
          off: jest.fn(),
        },
      }

      const { result } = renderHook(() => useSolanaWallet())

      await act(async () => {
        try {
          await result.current.connect(SolanaWalletType.PHANTOM, ChainId.SOLANA_DEVNET)
        } catch {
          // Expected error
        }
      })

      expect(result.current.error).toBe('Test error')

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })
})

describe('useSolanaBalance', () => {
  const mockUpdateSolanaBalance = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    ;(useMultiChainStore as unknown as jest.Mock).mockReturnValue({
      updateSolanaBalance: mockUpdateSolanaBalance,
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should fetch balance on mount', async () => {
    ;(getSolanaBalance as jest.Mock).mockResolvedValue('7.5')

    renderHook(() =>
      useSolanaBalance('TestAddress123', ChainId.SOLANA_DEVNET)
    )

    await waitFor(() => {
      expect(getSolanaBalance).toHaveBeenCalledWith('TestAddress123', 'devnet')
    })

    await waitFor(() => {
      expect(mockUpdateSolanaBalance).toHaveBeenCalledWith('7.5')
    })
  })

  it('should not fetch if address is null', () => {
    renderHook(() => useSolanaBalance(null, ChainId.SOLANA_DEVNET))

    expect(getSolanaBalance).not.toHaveBeenCalled()
  })

  it('should not fetch if chainId is null', () => {
    renderHook(() => useSolanaBalance('TestAddress123', null))

    expect(getSolanaBalance).not.toHaveBeenCalled()
  })

  it('should refetch balance every 30 seconds', async () => {
    ;(getSolanaBalance as jest.Mock).mockResolvedValue('5')

    renderHook(() => useSolanaBalance('TestAddress123', ChainId.SOLANA_DEVNET))

    await waitFor(() => {
      expect(getSolanaBalance).toHaveBeenCalledTimes(1)
    })

    act(() => {
      jest.advanceTimersByTime(30000)
    })

    await waitFor(() => {
      expect(getSolanaBalance).toHaveBeenCalledTimes(2)
    })

    act(() => {
      jest.advanceTimersByTime(30000)
    })

    await waitFor(() => {
      expect(getSolanaBalance).toHaveBeenCalledTimes(3)
    })
  })

  it('should handle fetch error gracefully', async () => {
    ;(getSolanaBalance as jest.Mock).mockRejectedValue(new Error('RPC error'))

    renderHook(() =>
      useSolanaBalance('TestAddress123', ChainId.SOLANA_DEVNET)
    )

    await waitFor(() => {
      expect(mockUpdateSolanaBalance).toHaveBeenCalledWith('0')
    })
  })

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    const { unmount } = renderHook(() =>
      useSolanaBalance('TestAddress123', ChainId.SOLANA_DEVNET)
    )

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })
})
