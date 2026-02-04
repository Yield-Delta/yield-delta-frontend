import { createPublicClient, http, formatUnits } from 'viem'
import { SEIVaultABI } from './abis/SEIVault'

// SEI Testnet configuration
const SEI_TESTNET_RPC = 'https://evm-rpc-testnet.sei-apis.com'

// Deployed vault addresses - Using existing vaults with funds for testing
export const VAULT_ADDRESSES = {
  SEI: '0x1ec7d0E455c0Ca2Ed4F2c27bc8F7E3542eeD6565' as `0x${string}`, // Native SEI Vault (has 5 SEI)
  USDC: '0xcF796aEDcC293db74829e77df7c26F482c9dBEC0' as `0x${string}`, // USDC Vault
}

// Pyth price feed IDs for SEI testnet
export const PYTH_PRICE_FEEDS = {
  SEI: '0x53614f1cb0c031d4af66c04cb9c756234adad0e1cee85303795091499a4084eb',
  USDC: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  ETH: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  BTC: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
}

// Create public client for reading contract state
export const publicClient = createPublicClient({
  transport: http(SEI_TESTNET_RPC, {
    timeout: 30_000,
    retryCount: 3,
  }),
})

export interface VaultInfo {
  name: string
  strategy: string
  token0: string
  token1: string
  poolFee: number
  totalSupply: bigint
  totalValueLocked: bigint
  isActive: boolean
}

export interface CustomerStats {
  shares: bigint
  shareValue: bigint
  totalDeposited: bigint
  totalWithdrawn: bigint
  depositTime: bigint
  lockTimeRemaining: bigint
}

export interface Position {
  tickLower: number
  tickUpper: number
  liquidity: bigint
  tokensOwed0: bigint
  tokensOwed1: bigint
}

/**
 * Get total assets (TVL) for a vault
 */
export async function getVaultTVL(vaultAddress: `0x${string}`): Promise<string> {
  try {
    const totalAssets = await publicClient.readContract({
      address: vaultAddress,
      abi: SEIVaultABI,
      functionName: 'totalAssets',
    })
    return formatUnits(totalAssets as bigint, 18)
  } catch (error) {
    console.error(`Error fetching TVL for ${vaultAddress}:`, error)
    return '0'
  }
}

/**
 * Get vault info
 */
export async function getVaultInfo(vaultAddress: `0x${string}`): Promise<VaultInfo | null> {
  try {
    const info = await publicClient.readContract({
      address: vaultAddress,
      abi: SEIVaultABI,
      functionName: 'getVaultInfo',
    }) as VaultInfo
    return info
  } catch (error) {
    console.error(`Error fetching vault info for ${vaultAddress}:`, error)
    return null
  }
}

/**
 * Get customer stats for a specific user
 */
export async function getCustomerStats(
  vaultAddress: `0x${string}`,
  customerAddress: `0x${string}`
): Promise<CustomerStats | null> {
  try {
    const stats = await publicClient.readContract({
      address: vaultAddress,
      abi: SEIVaultABI,
      functionName: 'getCustomerStats',
      args: [customerAddress],
    }) as [bigint, bigint, bigint, bigint, bigint, bigint]

    return {
      shares: stats[0],
      shareValue: stats[1],
      totalDeposited: stats[2],
      totalWithdrawn: stats[3],
      depositTime: stats[4],
      lockTimeRemaining: stats[5],
    }
  } catch (error) {
    console.error(`Error fetching customer stats:`, error)
    return null
  }
}

/**
 * Get current LP position
 */
export async function getCurrentPosition(vaultAddress: `0x${string}`): Promise<Position | null> {
  try {
    const result = await publicClient.readContract({
      address: vaultAddress,
      abi: SEIVaultABI,
      functionName: 'getCurrentPosition',
    })

    // Contract returns a tuple, convert to Position object
    const position = result as unknown as [number, number, bigint, bigint, bigint]

    return {
      tickLower: position[0],
      tickUpper: position[1],
      liquidity: position[2],
      tokensOwed0: position[3],
      tokensOwed1: position[4],
    }
  } catch (error) {
    console.error(`Error fetching position for ${vaultAddress}:`, error)
    return null
  }
}

/**
 * Get all vault data in a single call
 */
export async function getAllVaultsData() {
  const vaults = []

  for (const [name, address] of Object.entries(VAULT_ADDRESSES)) {
    try {
      const [tvl, info, position] = await Promise.all([
        getVaultTVL(address),
        getVaultInfo(address),
        getCurrentPosition(address),
      ])

      vaults.push({
        name,
        address,
        tvl,
        info,
        position,
      })
    } catch (error) {
      console.error(`Error fetching data for ${name} vault:`, error)
      vaults.push({
        name,
        address,
        tvl: '0',
        info: null,
        position: null,
      })
    }
  }

  return vaults
}

/**
 * Fetch price from Pyth oracle on SEI
 */
export async function fetchPythPrice(priceFeedId: string): Promise<number | null> {
  try {
    // Pyth Hermes API endpoint
    const response = await fetch(
      `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceFeedId}`
    )

    if (!response.ok) {
      throw new Error(`Pyth API error: ${response.status}`)
    }

    const data = await response.json()
    if (data && data.length > 0) {
      const priceData = data[0].price
      // Pyth returns price with expo (usually -8)
      const price = parseFloat(priceData.price) * Math.pow(10, priceData.expo)
      return price
    }

    return null
  } catch (error) {
    console.error(`Error fetching Pyth price for ${priceFeedId}:`, error)
    return null
  }
}

/**
 * Get all asset prices from Pyth
 */
export async function getAllPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {}

  for (const [asset, feedId] of Object.entries(PYTH_PRICE_FEEDS)) {
    const price = await fetchPythPrice(feedId)
    if (price !== null) {
      prices[asset] = price
    }
  }

  return prices
}
