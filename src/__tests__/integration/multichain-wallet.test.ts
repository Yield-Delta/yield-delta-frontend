/**
 * Multi-Chain Wallet Integration Tests
 * Tests for chain switching, wallet connections, and state management
 */

import { renderHook, act } from '@testing-library/react'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, ChainType, WalletStatus } from '@/types/chain'
import { formatBalance, getTransactionUrl, getAddressUrl } from '@/lib/chainUtils'

describe('Multi-Chain Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useMultiChainStore())
    act(() => {
      result.current.resetStore()
    })
  })

  describe('EVM Wallet Management', () => {
    it('should connect EVM wallet successfully', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
      })

      expect(result.current.evm.address).toBe('0x1234...5678')
      expect(result.current.evm.chainId).toBe(ChainId.SEI_TESTNET)
      expect(result.current.evm.status).toBe(WalletStatus.CONNECTED)
      expect(result.current.activeChain).toBe(ChainId.SEI_TESTNET)
    })

    it('should disconnect EVM wallet', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
      })

      act(() => {
        result.current.disconnectEvmWallet()
      })

      expect(result.current.evm.address).toBeNull()
      expect(result.current.evm.status).toBe(WalletStatus.DISCONNECTED)
    })

    it('should update EVM balance', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
        result.current.updateEvmBalance('100.5')
      })

      expect(result.current.evm.balance).toBe('100.5')
    })
  })

  describe('Solana Wallet Management', () => {
    it('should connect Solana wallet successfully', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectSolanaWallet(
          'AbC123...XyZ789',
          ChainId.SOLANA_DEVNET
        )
      })

      expect(result.current.solana.address).toBe('AbC123...XyZ789')
      expect(result.current.solana.chainId).toBe(ChainId.SOLANA_DEVNET)
      expect(result.current.solana.status).toBe(WalletStatus.CONNECTED)
      expect(result.current.activeChain).toBe(ChainId.SOLANA_DEVNET)
    })

    it('should disconnect Solana wallet', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectSolanaWallet(
          'AbC123...XyZ789',
          ChainId.SOLANA_DEVNET
        )
      })

      act(() => {
        result.current.disconnectSolanaWallet()
      })

      expect(result.current.solana.address).toBeNull()
      expect(result.current.solana.status).toBe(WalletStatus.DISCONNECTED)
    })
  })

  describe('Chain Management', () => {
    it('should switch active chain', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.setActiveChain(ChainId.SEI_TESTNET)
      })

      expect(result.current.activeChain).toBe(ChainId.SEI_TESTNET)

      act(() => {
        result.current.setActiveChain(ChainId.SOLANA_DEVNET)
      })

      expect(result.current.activeChain).toBe(ChainId.SOLANA_DEVNET)
    })

    it('should get active chain metadata', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.setActiveChain(ChainId.SOLANA_DEVNET)
      })

      const metadata = result.current.getActiveChainMetadata()

      expect(metadata).toBeDefined()
      expect(metadata?.id).toBe(ChainId.SOLANA_DEVNET)
      expect(metadata?.type).toBe(ChainType.SOLANA)
      expect(metadata?.displayName).toBe('Solana Devnet')
    })

    it('should get active wallet state', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectSolanaWallet(
          'AbC123...XyZ789',
          ChainId.SOLANA_DEVNET
        )
      })

      const walletState = result.current.getActiveWalletState()

      expect(walletState).toBeDefined()
      expect(walletState?.address).toBe('AbC123...XyZ789')
      expect(walletState?.chainType).toBe(ChainType.SOLANA)
    })

    it('should check if wallet is connected for specific chain', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
      })

      expect(result.current.isWalletConnectedForChain(ChainId.SEI_TESTNET)).toBe(true)
      expect(result.current.isWalletConnectedForChain(ChainId.SOLANA_DEVNET)).toBe(false)
    })
  })

  describe('Multi-Chain Connections', () => {
    it('should maintain separate connections for EVM and Solana', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
        result.current.connectSolanaWallet(
          'AbC123...XyZ789',
          ChainId.SOLANA_DEVNET
        )
      })

      expect(result.current.evm.status).toBe(WalletStatus.CONNECTED)
      expect(result.current.solana.status).toBe(WalletStatus.CONNECTED)
      expect(result.current.evm.address).toBe('0x1234...5678')
      expect(result.current.solana.address).toBe('AbC123...XyZ789')
    })

    it('should switch active chain without disconnecting wallets', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
        result.current.connectSolanaWallet(
          'AbC123...XyZ789',
          ChainId.SOLANA_DEVNET
        )
      })

      act(() => {
        result.current.setActiveChain(ChainId.SEI_TESTNET)
      })

      expect(result.current.activeChain).toBe(ChainId.SEI_TESTNET)
      expect(result.current.evm.status).toBe(WalletStatus.CONNECTED)
      expect(result.current.solana.status).toBe(WalletStatus.CONNECTED)
    })
  })

  describe('Transaction Management', () => {
    it('should add transaction', () => {
      const { result } = renderHook(() => useMultiChainStore())

      const transaction = {
        hash: '0xabc123',
        chainId: ChainId.SEI_TESTNET,
        chainType: ChainType.EVM,
        from: '0x1234...5678',
        value: '100',
        status: 'pending' as const,
        timestamp: Date.now(),
        blockExplorerUrl: 'https://explorer.example.com/tx/0xabc123',
      }

      act(() => {
        result.current.addTransaction(transaction)
      })

      expect(result.current.transactions).toHaveLength(1)
      expect(result.current.transactions[0].hash).toBe('0xabc123')
    })

    it('should update transaction status', () => {
      const { result } = renderHook(() => useMultiChainStore())

      const transaction = {
        hash: '0xabc123',
        chainId: ChainId.SEI_TESTNET,
        chainType: ChainType.EVM,
        from: '0x1234...5678',
        value: '100',
        status: 'pending' as const,
        timestamp: Date.now(),
        blockExplorerUrl: 'https://explorer.example.com/tx/0xabc123',
      }

      act(() => {
        result.current.addTransaction(transaction)
      })

      act(() => {
        result.current.updateTransactionStatus('0xabc123', 'confirmed')
      })

      expect(result.current.transactions[0].status).toBe('confirmed')
    })

    it('should get transactions by chain', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.addTransaction({
          hash: '0xabc123',
          chainId: ChainId.SEI_TESTNET,
          chainType: ChainType.EVM,
          from: '0x1234',
          value: '100',
          status: 'pending',
          timestamp: Date.now(),
          blockExplorerUrl: 'https://explorer.example.com/tx/0xabc123',
        })

        result.current.addTransaction({
          hash: 'solana123',
          chainId: ChainId.SOLANA_DEVNET,
          chainType: ChainType.SOLANA,
          from: 'AbC123',
          value: '50',
          status: 'confirmed',
          timestamp: Date.now(),
          blockExplorerUrl: 'https://explorer.solana.com/tx/solana123',
        })
      })

      const seiTxs = result.current.getTransactionsByChain(ChainId.SEI_TESTNET)
      const solanaTxs = result.current.getTransactionsByChain(ChainId.SOLANA_DEVNET)

      expect(seiTxs).toHaveLength(1)
      expect(solanaTxs).toHaveLength(1)
      expect(seiTxs[0].hash).toBe('0xabc123')
      expect(solanaTxs[0].hash).toBe('solana123')
    })
  })

  describe('Disconnect All', () => {
    it('should disconnect all wallets', () => {
      const { result } = renderHook(() => useMultiChainStore())

      act(() => {
        result.current.connectEvmWallet('0x1234...5678', ChainId.SEI_TESTNET)
        result.current.connectSolanaWallet(
          'AbC123...XyZ789',
          ChainId.SOLANA_DEVNET
        )
      })

      act(() => {
        result.current.disconnectAll()
      })

      expect(result.current.evm.status).toBe(WalletStatus.DISCONNECTED)
      expect(result.current.solana.status).toBe(WalletStatus.DISCONNECTED)
      expect(result.current.activeChain).toBeNull()
      expect(result.current.transactions).toHaveLength(0)
    })
  })
})

describe('Chain Utilities', () => {
  it('should format balance correctly', () => {
    // Test EVM (18 decimals)
    const evmBalance = formatBalance('1000000000000000000', ChainId.SEI_TESTNET, 4)
    expect(evmBalance).toBe('1.0000')

    // Test Solana (9 decimals)
    const solanaBalance = formatBalance('1000000000', ChainId.SOLANA_DEVNET, 4)
    expect(solanaBalance).toBe('1.0000')
  })

  it('should get transaction URL correctly', () => {
    const evmUrl = getTransactionUrl(ChainId.SEI_TESTNET, '0xabc123')
    expect(evmUrl).toContain('/tx/0xabc123')

    const solanaUrl = getTransactionUrl(ChainId.SOLANA_DEVNET, 'solana123')
    expect(solanaUrl).toContain('/tx/solana123')
  })

  it('should get address URL correctly', () => {
    const evmUrl = getAddressUrl(ChainId.SEI_TESTNET, '0x1234')
    expect(evmUrl).toContain('/address/0x1234')

    const solanaUrl = getAddressUrl(ChainId.SOLANA_DEVNET, 'AbC123')
    expect(solanaUrl).toContain('/address/AbC123')
  })
})
