/**
 * Solana Connection Tests
 * Tests for Solana RPC connection, balance fetching, and address validation
 */

import { Connection, PublicKey } from '@solana/web3.js'
import {
  getSolanaConnection,
  getSolanaBalance,
  getSolanaBalanceWithRetry,
  isValidSolanaAddress,
  getRpcEndpoint,
  clearConnectionPool,
  getAccountInfo,
  getRecentBlockhash,
} from '@/lib/solana/connection'

// Mock @solana/web3.js
jest.mock('@solana/web3.js', () => {
  const mockConnection = {
    getBalance: jest.fn(),
    getAccountInfo: jest.fn(),
    getLatestBlockhash: jest.fn(),
  }

  return {
    Connection: jest.fn(() => mockConnection),
    PublicKey: jest.fn((address: string) => {
      // Simulate validation - reject empty strings and obviously invalid addresses
      if (!address || address.length < 32) {
        throw new Error('Invalid public key')
      }
      return {
        toString: () => address,
        toBase58: () => address,
      }
    }),
    LAMPORTS_PER_SOL: 1000000000,
  }
})

describe('Solana Connection', () => {
  beforeEach(() => {
    // Clear connection pool before each test
    clearConnectionPool()
    jest.clearAllMocks()
  })

  describe('getSolanaConnection', () => {
    it('should create a connection for mainnet-beta', () => {
      const connection = getSolanaConnection('mainnet-beta')
      expect(connection).toBeDefined()
      expect(Connection).toHaveBeenCalledWith(
        expect.stringContaining('mainnet-beta'),
        expect.objectContaining({ commitment: 'confirmed' })
      )
    })

    it('should create a connection for devnet', () => {
      const connection = getSolanaConnection('devnet')
      expect(connection).toBeDefined()
      expect(Connection).toHaveBeenCalledWith(
        expect.stringContaining('devnet'),
        expect.objectContaining({ commitment: 'confirmed' })
      )
    })

    it('should create a connection for testnet', () => {
      const connection = getSolanaConnection('testnet')
      expect(connection).toBeDefined()
      expect(Connection).toHaveBeenCalledWith(
        expect.stringContaining('testnet'),
        expect.objectContaining({ commitment: 'confirmed' })
      )
    })

    it('should reuse existing connection from pool', () => {
      const connection1 = getSolanaConnection('devnet')
      const connection2 = getSolanaConnection('devnet')
      expect(connection1).toBe(connection2)
      expect(Connection).toHaveBeenCalledTimes(1)
    })

    it('should create separate connections for different clusters', () => {
      getSolanaConnection('mainnet-beta')
      getSolanaConnection('devnet')
      getSolanaConnection('testnet')
      expect(Connection).toHaveBeenCalledTimes(3)
    })
  })

  describe('getSolanaBalance', () => {
    it('should fetch balance for valid address', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getBalance as jest.Mock).mockResolvedValue(5000000000) // 5 SOL

      const balance = await getSolanaBalance('ValidSolanaAddress111111111111111111111111111', 'devnet')
      expect(balance).toBe('5')
    })

    it('should handle very small balances', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getBalance as jest.Mock).mockResolvedValue(1) // 0.000000001 SOL

      const balance = await getSolanaBalance('ValidSolanaAddress111111111111111111111111111', 'devnet')
      expect(parseFloat(balance)).toBeCloseTo(0.000000001, 15)
    })

    it('should handle large balances', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getBalance as jest.Mock).mockResolvedValue(1000000000000) // 1000 SOL

      const balance = await getSolanaBalance('ValidSolanaAddress111111111111111111111111111', 'devnet')
      expect(balance).toBe('1000')
    })

    it('should handle zero balance', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getBalance as jest.Mock).mockResolvedValue(0)

      const balance = await getSolanaBalance('ValidSolanaAddress111111111111111111111111111', 'devnet')
      expect(balance).toBe('0')
    })

    it('should accept PublicKey object', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getBalance as jest.Mock).mockResolvedValue(1000000000)

      const publicKey = new PublicKey('ValidSolanaAddress111111111111111111111111111')
      const balance = await getSolanaBalance(publicKey, 'devnet')
      expect(balance).toBe('1')
    })

    it('should return 0 on error', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getBalance as jest.Mock).mockRejectedValue(new Error('RPC error'))

      const balance = await getSolanaBalance('InvalidAddress', 'devnet')
      expect(balance).toBe('0')
    })
  })

  describe('getSolanaBalanceWithRetry', () => {
    it('should exist as a function', () => {
      expect(typeof getSolanaBalanceWithRetry).toBe('function')
    })
  })

  describe('isValidSolanaAddress', () => {
    it('should return true for valid base58 addresses', () => {
      const validAddresses = [
        '11111111111111111111111111111111',
        'SeedPubeyogfHNJRNVWnDUXD1tF2BZ3hm1hMk3c61fQ',
        'Vote111111111111111111111111111111111111111',
        'Stake11111111111111111111111111111111111111',
      ]

      validAddresses.forEach(address => {
        expect(isValidSolanaAddress(address)).toBe(true)
      })
    })

    it('should return false for empty address', () => {
      expect(isValidSolanaAddress('')).toBe(false)
    })

    it('should return false for short addresses', () => {
      expect(isValidSolanaAddress('too-short')).toBe(false)
    })
  })

  describe('getRpcEndpoint', () => {
    it('should return mainnet-beta endpoint', () => {
      const endpoint = getRpcEndpoint('mainnet-beta')
      expect(endpoint).toContain('mainnet-beta')
    })

    it('should return devnet endpoint', () => {
      const endpoint = getRpcEndpoint('devnet')
      expect(endpoint).toContain('devnet')
    })

    it('should return testnet endpoint', () => {
      const endpoint = getRpcEndpoint('testnet')
      expect(endpoint).toContain('testnet')
    })
  })

  describe('getAccountInfo', () => {
    it('should fetch account info for valid address', async () => {
      const mockAccountInfo = {
        lamports: 1000000000,
        owner: '11111111111111111111111111111111',
        executable: false,
        rentEpoch: 0,
      }
      const mockConnection = new Connection('')
      ;(mockConnection.getAccountInfo as jest.Mock).mockResolvedValue(mockAccountInfo)

      const accountInfo = await getAccountInfo('ValidSolanaAddress111111111111111111111111111', 'devnet')
      expect(accountInfo).toEqual(mockAccountInfo)
    })

    it('should return null for non-existent account', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getAccountInfo as jest.Mock).mockResolvedValue(null)

      const accountInfo = await getAccountInfo('NonExistentAddress11111111111111111111111111', 'devnet')
      expect(accountInfo).toBeNull()
    })

    it('should return null on error', async () => {
      const mockConnection = new Connection('')
      ;(mockConnection.getAccountInfo as jest.Mock).mockRejectedValue(new Error('RPC error'))

      const accountInfo = await getAccountInfo('ValidAddress111111111111111111111111111111', 'devnet')
      expect(accountInfo).toBeNull()
    })
  })

  describe('getRecentBlockhash', () => {
    it('should fetch recent blockhash', async () => {
      const mockBlockhash = {
        blockhash: 'GH7PDFkHra4uE8qVNv4xKjNVNZFvW8qhbSM1RfjBYzpt',
        lastValidBlockHeight: 123456789,
      }
      const mockConnection = new Connection('')
      ;(mockConnection.getLatestBlockhash as jest.Mock).mockResolvedValue(mockBlockhash)

      const blockhash = await getRecentBlockhash('devnet')
      expect(blockhash).toEqual(mockBlockhash)
    })
  })

  describe('clearConnectionPool', () => {
    it('should clear all connections from pool', () => {
      // Create connections
      getSolanaConnection('devnet')
      getSolanaConnection('mainnet-beta')
      expect(Connection).toHaveBeenCalledTimes(2)

      // Clear pool
      clearConnectionPool()

      // Create new connections (should create new instances)
      getSolanaConnection('devnet')
      getSolanaConnection('mainnet-beta')
      expect(Connection).toHaveBeenCalledTimes(4)
    })
  })
})
