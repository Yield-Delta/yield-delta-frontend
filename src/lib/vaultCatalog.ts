import { ChainId, ChainType } from '@/types/chain'
import { getChainMetadata } from '@/lib/chainConfig'
import { VaultData } from '@/stores/vaultStore'

export const SOLANA_DEVNET_VAULTS: VaultData[] = [
  {
    address: 'SoLendStable111111111111111111111111111111111',
    name: 'Stablecoin Lending Vault',
    strategy: 'stable_max',
    tokenA: 'USDC-test',
    tokenB: 'USDC-test',
    fee: 0,
    tickSpacing: 1,
    tvl: 0,
    apy: 0.042,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'Single-asset stablecoin lending benchmark for baseline yield and low-volatility testing.',
    performance: { totalReturn: 0.0103, sharpeRatio: 2.4, maxDrawdown: 0.001, winRate: 0.97 },
  },
  {
    address: 'SoLStakeLiquid1111111111111111111111111111111',
    name: 'SOL Staking Vault',
    strategy: 'yield_farming',
    tokenA: 'SOL-test',
    tokenB: 'stSOL-test',
    fee: 0,
    tickSpacing: 1,
    tvl: 0,
    apy: 0.061,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'SOL-test staking and liquid staking wrapper flow for auto-compounding validation.',
    performance: { totalReturn: 0.015, sharpeRatio: 1.9, maxDrawdown: 0.018, winRate: 0.86 },
  },
  {
    address: 'SoLLpCompound1111111111111111111111111111111',
    name: 'SOL/Stable LP Auto-Compounding Vault',
    strategy: 'concentrated_liquidity',
    tokenA: 'SOL-test',
    tokenB: 'USDC-test',
    fee: 0.003,
    tickSpacing: 64,
    tvl: 0,
    apy: 0.118,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'LP fee harvesting, reward compounding, and simulated impermanent-loss tracking.',
    performance: { totalReturn: 0.0287, sharpeRatio: 0.92, maxDrawdown: 0.115, winRate: 0.61 },
  },
  {
    address: 'SoLVolAware111111111111111111111111111111111',
    name: 'Volatility-Aware Rebalancing Vault',
    strategy: 'concentrated_liquidity',
    tokenA: 'SOL-test',
    tokenB: 'USDC-test',
    fee: 0.003,
    tickSpacing: 64,
    tvl: 0,
    apy: 0.134,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'AI-adjusted LP ranges that widen or tighten as volatility regimes change.',
    performance: { totalReturn: 0.0321, sharpeRatio: 1.18, maxDrawdown: 0.092, winRate: 0.68 },
  },
  {
    address: 'SoLDeltaNeutral111111111111111111111111111111',
    name: 'Delta-Neutral Yield Vault',
    strategy: 'delta_neutral',
    tokenA: 'SOL-test',
    tokenB: 'USDC-test',
    fee: 0.001,
    tickSpacing: 64,
    tvl: 0,
    apy: 0.086,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'Long and synthetic short test positions for neutrality drift and collateral-ratio testing.',
    performance: { totalReturn: 0.021, sharpeRatio: 2.8, maxDrawdown: 0.024, winRate: 0.88 },
  },
  {
    address: 'SoLAiMetaVault111111111111111111111111111111',
    name: 'AI Auto-Allocation Meta Vault',
    strategy: 'hedge',
    tokenA: 'USDC-test',
    tokenB: 'Multi-strategy',
    fee: 0,
    tickSpacing: 1,
    tvl: 0,
    apy: 0.105,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'Flagship allocator that routes capital across underlying Solana testnet strategies.',
    performance: { totalReturn: 0.0256, sharpeRatio: 1.95, maxDrawdown: 0.052, winRate: 0.78 },
  },
  {
    address: 'SoLSandboxVault11111111111111111111111111111',
    name: 'Experimental Strategy Sandbox Vault',
    strategy: 'arbitrage',
    tokenA: 'SOL-test',
    tokenB: 'USDC-test',
    fee: 0,
    tickSpacing: 1,
    tvl: 0,
    apy: 0.16,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'Test-only strategy sandbox for rapid rebalancing, routing, and telemetry experiments.',
    performance: { totalReturn: 0.038, sharpeRatio: 0.52, maxDrawdown: 0.21, winRate: 0.54 },
  },
]

export function isSolanaChain(chainId: ChainId | null | undefined) {
  return chainId ? getChainMetadata(chainId).type === ChainType.SOLANA : false
}

export function isEvmChain(chainId: ChainId | null | undefined) {
  return chainId ? getChainMetadata(chainId).type === ChainType.EVM : false
}

export function getVaultsForChain(chainId: ChainId | null | undefined): VaultData[] | null {
  if (isSolanaChain(chainId)) return SOLANA_DEVNET_VAULTS
  return null
}
