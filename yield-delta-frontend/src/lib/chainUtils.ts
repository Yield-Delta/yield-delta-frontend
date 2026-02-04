/**
 * Chain utility functions for network detection and handling
 * Extended to support multi-chain architecture (SEI, Solana, Sui)
 */

import { ChainId, ChainType } from '@/types/chain'
import { CHAIN_METADATA, getChainMetadata, getDefaultChain } from './chainConfig'

// Legacy SEI EVM Chain IDs (for backwards compatibility)
export const SEI_MAINNET_ID = 1329;
export const SEI_TESTNET_ID = 1328; // Atlantic-2
export const SEI_DEVNET_ID = 713715; // Arctic-1

/**
 * Check if a chain ID (EVM numeric) is a testnet
 * @deprecated Use getChainMetadata(chainId).isTestnet instead
 */
export function isTestnetChain(chainId: number): boolean {
  return chainId === SEI_TESTNET_ID || chainId === SEI_DEVNET_ID;
}

/**
 * Check if a chain ID (EVM numeric) is mainnet
 * @deprecated Use getChainMetadata(chainId).environment instead
 */
export function isMainnetChain(chainId: number): boolean {
  return chainId === SEI_MAINNET_ID;
}

/**
 * Get chain name from EVM chain ID
 * @deprecated Use getChainMetadata(chainId).name instead
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case SEI_MAINNET_ID:
      return 'SEI Mainnet';
    case SEI_TESTNET_ID:
      return 'SEI Atlantic-2 Testnet';
    case SEI_DEVNET_ID:
      return 'SEI Arctic-1 Devnet';
    default:
      return `Chain ${chainId}`;
  }
}

/**
 * Get chain display name with testnet indicator
 * @deprecated Use getChainMetadata(chainId).displayName instead
 */
export function getChainDisplayName(chainId: number): string {
  const isTestnet = isTestnetChain(chainId);

  switch (chainId) {
    case SEI_MAINNET_ID:
      return 'SEI';
    case SEI_TESTNET_ID:
      return 'SEI Testnet';
    case SEI_DEVNET_ID:
      return 'SEI Devnet';
    default:
      return isTestnet ? `Testnet ${chainId}` : `Chain ${chainId}`;
  }
}

/**
 * Get block explorer URL for a chain
 * @deprecated Use getChainMetadata(chainId).blockExplorerUrls[0] instead
 */
export function getBlockExplorerUrl(chainId: number): string {
  switch (chainId) {
    case SEI_MAINNET_ID:
      return 'https://seitrace.com';
    case SEI_TESTNET_ID:
      return 'https://seitrace.com/atlantic-2';
    case SEI_DEVNET_ID:
      return 'https://seitrace.com/?chain=devnet';
    default:
      return '';
  }
}

/**
 * Check if environment is configured for testnet
 */
export function isTestnetEnvironment(): boolean {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId === 'sei-testnet' || chainId === 'sei-devnet' || !chainId;
}

/**
 * Get expected EVM chain ID from environment
 * @deprecated Use getDefaultChain() instead
 */
export function getExpectedChainId(): number {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;

  switch (chainId) {
    case 'sei-mainnet':
      return SEI_MAINNET_ID;
    case 'sei-devnet':
      return SEI_DEVNET_ID;
    case 'sei-testnet':
    default:
      return SEI_TESTNET_ID; // Default to testnet for safety
  }
}

// ============================================================================
// NEW MULTICHAIN UTILITIES
// ============================================================================

/**
 * Convert EVM numeric chain ID to ChainId enum
 */
export function evmChainIdToChainId(evmChainId: number): ChainId | null {
  switch (evmChainId) {
    case SEI_MAINNET_ID:
      return ChainId.SEI_MAINNET
    case SEI_TESTNET_ID:
      return ChainId.SEI_TESTNET
    case SEI_DEVNET_ID:
      return ChainId.SEI_DEVNET
    default:
      return null
  }
}

/**
 * Get transaction explorer URL for any chain
 */
export function getTransactionUrl(chainId: ChainId, txHash: string): string {
  const metadata = getChainMetadata(chainId)
  const baseUrl = metadata.blockExplorerUrls[0]
  
  switch (metadata.type) {
    case ChainType.EVM:
      return `${baseUrl}/tx/${txHash}`
    case ChainType.SOLANA:
      return `${baseUrl}/tx/${txHash}`
    case ChainType.SUI:
      return `${baseUrl}/txblock/${txHash}`
    default:
      return baseUrl
  }
}

/**
 * Get address explorer URL for any chain
 */
export function getAddressUrl(chainId: ChainId, address: string): string {
  const metadata = getChainMetadata(chainId)
  const baseUrl = metadata.blockExplorerUrls[0]
  
  switch (metadata.type) {
    case ChainType.EVM:
      return `${baseUrl}/address/${address}`
    case ChainType.SOLANA:
      return `${baseUrl}/address/${address}`
    case ChainType.SUI:
      return `${baseUrl}/address/${address}`
    default:
      return baseUrl
  }
}

/**
 * Format balance for display with proper decimals
 */
export function formatBalance(
  balance: string | number,
  chainId: ChainId,
  maxDecimals: number = 4
): string {
  const metadata = getChainMetadata(chainId)
  const decimals = metadata.nativeCurrency.decimals
  
  const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance
  const divisor = Math.pow(10, decimals)
  const formatted = balanceNum / divisor
  
  return formatted.toFixed(Math.min(maxDecimals, decimals))
}

/**
 * Get chain icon component props
 */
export function getChainIcon(chainId: ChainId): { src: string; alt: string } | null {
  const metadata = getChainMetadata(chainId)
  if (!metadata.iconUrl) return null
  
  return {
    src: metadata.iconUrl,
    alt: `${metadata.displayName} icon`,
  }
}

/**
 * Check if chain type is supported
 */
export function isChainTypeSupported(type: ChainType): boolean {
  // Currently supporting EVM and Solana, Sui is future
  return type === ChainType.EVM || type === ChainType.SOLANA
}

/**
 * Get all supported chains for a given environment
 */
export function getSupportedChains(includeTestnets: boolean = true): ChainId[] {
  return Object.values(ChainId).filter((chainId) => {
    const metadata = getChainMetadata(chainId as ChainId)
    if (!includeTestnets && metadata.isTestnet) return false
    return isChainTypeSupported(metadata.type)
  })
}
