/**
 * Chain Type Definitions for Multi-Chain Support
 * Supports SEI (EVM), Solana, and future Sui integration
 */

// Supported blockchain ecosystems
export enum ChainType {
  EVM = 'evm',
  SOLANA = 'solana',
  SUI = 'sui', // Future support
}

// Chain identifiers
export enum ChainId {
  // SEI Networks (EVM)
  SEI_MAINNET = 'sei-mainnet',
  SEI_TESTNET = 'sei-testnet',
  SEI_DEVNET = 'sei-devnet',
  
  // Solana Networks
  SOLANA_MAINNET = 'solana-mainnet',
  SOLANA_DEVNET = 'solana-devnet',
  
  // Sui Networks (Future)
  SUI_MAINNET = 'sui-mainnet',
  SUI_TESTNET = 'sui-testnet',
}

// Network environment types
export enum NetworkEnvironment {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet',
}

// Chain metadata interface
export interface ChainMetadata {
  id: ChainId
  type: ChainType
  name: string
  displayName: string
  environment: NetworkEnvironment
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
  iconUrl?: string
  isTestnet: boolean
  evmChainId?: number // For EVM chains
  solanaCluster?: 'mainnet-beta' | 'devnet' | 'testnet' // For Solana
}

// Wallet connection status
export enum WalletStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Wallet interface for multi-chain support
export interface WalletState {
  address: string | null
  balance: string | null
  status: WalletStatus
  chainId: ChainId | null
  chainType: ChainType | null
}

// Multi-chain wallet state
export interface MultiChainWalletState {
  evm: WalletState
  solana: WalletState
  sui: WalletState
  activeChain: ChainId | null
}

// Transaction types
export interface Transaction {
  hash: string
  chainId: ChainId
  chainType: ChainType
  from: string
  to?: string
  value: string
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: number
  blockExplorerUrl: string
}

// Vault interaction types
export interface VaultAction {
  type: 'deposit' | 'withdraw' | 'rebalance'
  vaultId: string
  chainId: ChainId
  amount: string
  token: string
  timestamp: number
}
