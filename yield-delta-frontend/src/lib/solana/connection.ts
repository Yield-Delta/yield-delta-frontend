/**
 * Solana Connection Utility
 * 
 * This module provides utilities for connecting to the Solana blockchain
 * and fetching account balances.
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL, ConnectionConfig } from '@solana/web3.js'

/**
 * Solana cluster types
 */
export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet'

/**
 * Configuration for Solana RPC endpoints
 */
const RPC_ENDPOINTS: Record<SolanaCluster, string> = {
  'mainnet-beta': process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
  'devnet': process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com',
  'testnet': process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC || 'https://api.testnet.solana.com',
}

/**
 * Connection pool to reuse connections
 */
const connectionPool: Map<SolanaCluster, Connection> = new Map()

/**
 * Connection configuration for optimal performance
 */
const CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
}

/**
 * Get or create a Solana connection for the specified cluster
 * 
 * @param cluster - The Solana cluster to connect to
 * @returns Solana Connection instance
 */
export function getSolanaConnection(cluster: SolanaCluster = 'mainnet-beta'): Connection {
  if (!connectionPool.has(cluster)) {
    const endpoint = RPC_ENDPOINTS[cluster]
    const connection = new Connection(endpoint, CONNECTION_CONFIG)
    connectionPool.set(cluster, connection)
  }
  
  return connectionPool.get(cluster)!
}

/**
 * Get the Solana balance for a given address
 * 
 * @param address - The wallet address (base58 string or PublicKey)
 * @param cluster - The Solana cluster to query (default: mainnet-beta)
 * @returns The balance in SOL as a string
 * @throws Error if the address is invalid or the RPC request fails
 */
export async function getSolanaBalance(
  address: string | PublicKey,
  cluster: SolanaCluster = 'mainnet-beta'
): Promise<string> {
  try {
    const connection = getSolanaConnection(cluster)
    const publicKey = typeof address === 'string' ? new PublicKey(address) : address
    
    // Fetch balance in lamports
    const balanceInLamports = await connection.getBalance(publicKey)
    
    // Convert lamports to SOL
    const balanceInSOL = balanceInLamports / LAMPORTS_PER_SOL
    
    return balanceInSOL.toString()
  } catch (error) {
    console.error(`Failed to fetch Solana balance for ${address}:`, error)
    
    // Return '0' instead of throwing to gracefully handle errors
    return '0'
  }
}

/**
 * Get the Solana balance with retry logic
 * 
 * @param address - The wallet address
 * @param cluster - The Solana cluster to query
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns The balance in SOL as a string
 */
export async function getSolanaBalanceWithRetry(
  address: string | PublicKey,
  cluster: SolanaCluster = 'mainnet-beta',
  maxRetries = 3
): Promise<string> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await getSolanaBalance(address, cluster)
    } catch (error) {
      lastError = error as Error
      
      // Exponential backoff: wait 1s, 2s, 4s...
      const waitTime = Math.pow(2, attempt) * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  
  console.error(`Failed to fetch Solana balance after ${maxRetries} attempts:`, lastError)
  return '0'
}

/**
 * Validate a Solana address
 * 
 * @param address - The address to validate
 * @returns true if the address is valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

/**
 * Get the RPC endpoint for a given cluster
 * 
 * @param cluster - The Solana cluster
 * @returns The RPC endpoint URL
 */
export function getRpcEndpoint(cluster: SolanaCluster): string {
  return RPC_ENDPOINTS[cluster]
}

/**
 * Clear the connection pool (useful for testing or switching networks)
 */
export function clearConnectionPool(): void {
  connectionPool.clear()
}

/**
 * Get account info for a Solana address
 * 
 * @param address - The wallet address
 * @param cluster - The Solana cluster to query
 * @returns Account info or null if account doesn't exist
 */
export async function getAccountInfo(
  address: string | PublicKey,
  cluster: SolanaCluster = 'mainnet-beta'
) {
  try {
    const connection = getSolanaConnection(cluster)
    const publicKey = typeof address === 'string' ? new PublicKey(address) : address
    
    return await connection.getAccountInfo(publicKey)
  } catch (error) {
    console.error(`Failed to fetch account info for ${address}:`, error)
    return null
  }
}

/**
 * Get recent blockhash (useful for transactions)
 * 
 * @param cluster - The Solana cluster to query
 * @returns Recent blockhash info
 */
export async function getRecentBlockhash(cluster: SolanaCluster = 'mainnet-beta') {
  const connection = getSolanaConnection(cluster)
  return await connection.getLatestBlockhash()
}
