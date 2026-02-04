/**
 * Multi-Chain Configuration
 * Centralized chain metadata and configuration
 */

import { ChainId, ChainMetadata, ChainType, NetworkEnvironment } from '@/types/chain'

// Chain metadata registry
export const CHAIN_METADATA: Record<ChainId, ChainMetadata> = {
  // SEI Networks (EVM)
  [ChainId.SEI_MAINNET]: {
    id: ChainId.SEI_MAINNET,
    type: ChainType.EVM,
    name: 'SEI Mainnet',
    displayName: 'SEI',
    environment: NetworkEnvironment.MAINNET,
    nativeCurrency: {
      name: 'SEI',
      symbol: 'SEI',
      decimals: 18,
    },
    rpcUrls: [
      'https://evm-rpc.sei-apis.com',
      'https://evm-rpc-testnet.sei-apis.com',
    ],
    blockExplorerUrls: ['https://seitrace.com'],
    evmChainId: 1329,
    isTestnet: false,
    iconUrl: '/chains/sei.svg',
  },
  
  [ChainId.SEI_TESTNET]: {
    id: ChainId.SEI_TESTNET,
    type: ChainType.EVM,
    name: 'SEI Atlantic-2 Testnet',
    displayName: 'SEI Testnet',
    environment: NetworkEnvironment.TESTNET,
    nativeCurrency: {
      name: 'SEI',
      symbol: 'SEI',
      decimals: 18,
    },
    rpcUrls: ['https://evm-rpc-testnet.sei-apis.com'],
    blockExplorerUrls: ['https://seitrace.com/atlantic-2'],
    evmChainId: 1328,
    isTestnet: true,
    iconUrl: '/chains/sei.svg',
  },
  
  [ChainId.SEI_DEVNET]: {
    id: ChainId.SEI_DEVNET,
    type: ChainType.EVM,
    name: 'SEI Arctic-1 Devnet',
    displayName: 'SEI Devnet',
    environment: NetworkEnvironment.DEVNET,
    nativeCurrency: {
      name: 'SEI',
      symbol: 'SEI',
      decimals: 18,
    },
    rpcUrls: ['https://evm-rpc-arctic-1.sei-apis.com'],
    blockExplorerUrls: ['https://seitrace.com/?chain=devnet'],
    evmChainId: 713715,
    isTestnet: true,
    iconUrl: '/chains/sei.svg',
  },
  
  // Solana Networks
  [ChainId.SOLANA_MAINNET]: {
    id: ChainId.SOLANA_MAINNET,
    type: ChainType.SOLANA,
    name: 'Solana Mainnet Beta',
    displayName: 'Solana',
    environment: NetworkEnvironment.MAINNET,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    rpcUrls: [
      'https://api.mainnet-beta.solana.com',
      'https://solana-api.projectserum.com',
    ],
    blockExplorerUrls: [
      'https://explorer.solana.com',
      'https://solscan.io',
    ],
    solanaCluster: 'mainnet-beta',
    isTestnet: false,
    iconUrl: '/chains/solana.svg',
  },
  
  [ChainId.SOLANA_DEVNET]: {
    id: ChainId.SOLANA_DEVNET,
    type: ChainType.SOLANA,
    name: 'Solana Devnet',
    displayName: 'Solana Devnet',
    environment: NetworkEnvironment.DEVNET,
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    rpcUrls: ['https://api.devnet.solana.com'],
    blockExplorerUrls: ['https://explorer.solana.com/?cluster=devnet'],
    solanaCluster: 'devnet',
    isTestnet: true,
    iconUrl: '/chains/solana.svg',
  },
  
  // Sui Networks (Future)
  [ChainId.SUI_MAINNET]: {
    id: ChainId.SUI_MAINNET,
    type: ChainType.SUI,
    name: 'Sui Mainnet',
    displayName: 'Sui',
    environment: NetworkEnvironment.MAINNET,
    nativeCurrency: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9,
    },
    rpcUrls: ['https://fullnode.mainnet.sui.io'],
    blockExplorerUrls: ['https://explorer.sui.io'],
    isTestnet: false,
    iconUrl: '/chains/sui.svg',
  },
  
  [ChainId.SUI_TESTNET]: {
    id: ChainId.SUI_TESTNET,
    type: ChainType.SUI,
    name: 'Sui Testnet',
    displayName: 'Sui Testnet',
    environment: NetworkEnvironment.TESTNET,
    nativeCurrency: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9,
    },
    rpcUrls: ['https://fullnode.testnet.sui.io'],
    blockExplorerUrls: ['https://explorer.sui.io/?network=testnet'],
    isTestnet: true,
    iconUrl: '/chains/sui.svg',
  },
}

// Helper functions
export function getChainMetadata(chainId: ChainId): ChainMetadata {
  return CHAIN_METADATA[chainId]
}

export function isChainSupported(chainId: ChainId): boolean {
  return chainId in CHAIN_METADATA
}

export function getChainsByType(type: ChainType): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(chain => chain.type === type)
}

export function getMainnetChains(): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(chain => !chain.isTestnet)
}

export function getTestnetChains(): ChainMetadata[] {
  return Object.values(CHAIN_METADATA).filter(chain => chain.isTestnet)
}

// Default chain based on environment
export function getDefaultChain(): ChainId {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || 'testnet'
  
  switch (env) {
    case 'mainnet':
      return ChainId.SEI_MAINNET
    case 'devnet':
      return ChainId.SEI_DEVNET
    default:
      return ChainId.SEI_TESTNET
  }
}

// Get EVM chain ID for wagmi/viem
export function getEvmChainId(chainId: ChainId): number | null {
  const metadata = getChainMetadata(chainId)
  return metadata.evmChainId || null
}

// Get Solana cluster name
export function getSolanaCluster(chainId: ChainId): string | null {
  const metadata = getChainMetadata(chainId)
  return metadata.solanaCluster || null
}
