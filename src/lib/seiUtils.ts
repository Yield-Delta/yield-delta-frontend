// Modern SEI wallet connection using EIP-6963 standard
// Note: Import '@sei-js/sei-global-wallet/eip6963' in your app entry point to enable global wallet

export interface SeiConnection {
  accounts: { address: string; publicKey: string }[]
  chainId: string
  provider?: unknown
}

/**
 * Connect to a Sei wallet using modern EIP-6963 standard
 * Make sure to import '@sei-js/sei-global-wallet/eip6963' in your app
 */
export async function connectSeiWallet(
  evmChainId: number = 1328
): Promise<SeiConnection> {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Window object not available')
    }

    // Check if Ethereum provider is available (SEI Global Wallet uses EIP-6963)
    const ethereum = (window as unknown as { ethereum?: unknown }).ethereum
    if (!ethereum) {
      throw new Error('No wallet provider found. Please install a compatible wallet.')
    }

    // For now, return a basic connection structure
    // In a real implementation, you would use the EIP-6963 discovery mechanism
    const chainConfig = getSeiChainConfig(evmChainId)
    
    return {
      accounts: [], // Will be populated by wallet connection
      chainId: chainConfig.chainId,
      provider: ethereum
    }
  } catch (error) {
    console.error('Failed to connect to Sei wallet:', error)
    throw error
  }
}

/**
 * Get chain configuration based on EVM chain ID
 */
export function getSeiChainConfig(evmChainId: number) {
  switch (evmChainId) {
    case 1329: // SEI Mainnet
      return {
        chainId: 'pacific-1',
        rpcEndpoint: 'https://rpc.sei-apis.com',
        restEndpoint: 'https://rest.sei-apis.com',
        name: 'SEI Pacific'
      }
    case 713715: // SEI Devnet (for DeFi compliance)
      return {
        chainId: 'devnet-1', // or the appropriate cosmos chain ID for devnet
        rpcEndpoint: 'https://rpc-devnet.sei-apis.com',
        restEndpoint: 'https://rest-devnet.sei-apis.com',
        name: 'SEI Devnet'
      }
    case 1328: // SEI Testnet (Atlantic-2)
      return {
        chainId: 'atlantic-2',
        rpcEndpoint: 'https://rpc-testnet.sei-apis.com',
        restEndpoint: 'https://rest-testnet.sei-apis.com',
        name: 'SEI Atlantic-2'
      }
    default:
      throw new Error(`Unsupported SEI chain ID: ${evmChainId}`)
  }
}

/**
 * Format Sei address for display
 */
export function formatSeiAddress(address: string, length: number = 8): string {
  if (!address) return ''
  if (address.length <= length * 2) return address
  return `${address.slice(0, length)}...${address.slice(-length)}`
}

/**
 * Check if a wallet is available in the browser
 */
export function isWalletAvailable(walletType: string): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as unknown as Record<string, unknown>)[walletType]
}

/**
 * Get available Sei wallets
 */
export function getAvailableSeiWallets() {
  const supportedWallets = [
    { windowKey: 'keplr', name: 'Keplr' },
    { windowKey: 'leap', name: 'Leap' },
    { windowKey: 'falcon', name: 'Falcon' },
    { windowKey: 'coin98', name: 'Coin98' }
  ]

  return supportedWallets.filter(wallet => isWalletAvailable(wallet.windowKey))
}