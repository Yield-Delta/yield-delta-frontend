import { http } from 'wagmi'
import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// SEI Mainnet (Pacific-1)
export const seiMainnet = defineChain({
  id: 1329,
  name: 'SEI',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace', url: 'https://seitrace.com' }
  },
  testnet: false
})

// SEI Devnet 
export const seiDevnet = defineChain({
  id: 713715,
  name: 'SEI Devnet',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc-arctic-1.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace Devnet', url: 'https://seitrace.com/?chain=devnet' }
  },
  testnet: true
})

// SEI Testnet (Atlantic-2) - Updated for testing
export const seiTestnet = defineChain({
  id: 1328,
  name: 'SEI Atlantic-2',
  nativeCurrency: { name: 'SEI', symbol: 'SEI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evm-rpc-testnet.sei-apis.com'] }
  },
  blockExplorers: {
    default: { name: 'SeiTrace Testnet', url: 'https://seitrace.com/atlantic-2' }
  },
  testnet: true
})

// Singleton pattern to prevent multiple config instantiation
let configInstance: ReturnType<typeof getDefaultConfig> | null = null
let isCreatingConfig = false

function createConfig() {
  // Prevent race conditions during config creation
  if (isCreatingConfig) {
    // Wait for existing creation to complete
    while (!configInstance && isCreatingConfig) {
      // Busy wait for a short time
    }
    return configInstance!
  }

  if (configInstance) {
    return configInstance
  }

  isCreatingConfig = true

  const projectId = process.env.NEXT_PUBLIC_WC_ID

  if (!projectId || projectId === 'dummy-project-id' || projectId === 'your_walletconnect_project_id_here') {
    console.warn('⚠️ WalletConnect Project ID not set. Please add NEXT_PUBLIC_WC_ID to your .env.local file.')
    console.warn('Get your Project ID from: https://walletconnect.com/cloud')
  }

  // Use RainbowKit's getDefaultConfig for proper wallet integration
  // This includes automatic wallet detection and proper modal functionality
  configInstance = getDefaultConfig({
    appName: 'Yield Delta',
    projectId: projectId || 'fallback-project-id',
    chains: [seiTestnet, seiDevnet, seiMainnet],
    ssr: true,
    transports: {
      [seiDevnet.id]: http(undefined, {
        timeout: 30_000, // 30 second timeout for RPC requests
        retryCount: 3,
        retryDelay: 1_000,
      }),
      [seiMainnet.id]: http(undefined, {
        timeout: 30_000,
        retryCount: 3,
        retryDelay: 1_000,
      }),
      [seiTestnet.id]: http(undefined, {
        timeout: 30_000, // 30 second timeout for RPC requests
        retryCount: 3, // Retry failed requests up to 3 times
        retryDelay: 1_000, // Wait 1 second between retries
      })
    },
    batch: {
      multicall: false,
    },
  })

  isCreatingConfig = false
  return configInstance
}

export const config = createConfig()