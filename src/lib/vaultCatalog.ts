import { ChainId, ChainType } from '@/types/chain'
import { getChainMetadata } from '@/lib/chainConfig'
import { VaultData } from '@/stores/vaultStore'
import { SOLANA_PROGRAM_IDS } from '@/lib/solana/programIds'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'

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
    address: SOLANA_PROGRAM_IDS.adaptiveYieldVault,
    name: 'Adaptive Yield Vault',
    strategy: 'experimental',
    tokenA: 'USDC-test',
    tokenB: 'USDC-test',
    fee: 0,
    tickSpacing: 1,
    tvl: 0,
    // Base 12% APY — scales 0.70× in Low regime and 1.50× in High regime (8.4%–18%)
    apy: 0.12,
    chainId: ChainId.SOLANA_DEVNET,
    active: true,
    description: 'Reads the on-chain oracle volatility regime (Low/Medium/High) and adjusts yield rate in real time. Slot-locked withdrawals activate during High-volatility transitions — a Solana-native circuit breaker.',
    performance: { totalReturn: 0.031, sharpeRatio: 1.42, maxDrawdown: 0.08, winRate: 0.72 },
  },
]

export const SUI_TESTNET_VAULTS: VaultData[] = [
  {
    address: SUI_VAULT_PROGRAMS.deltaNeutralVault,
    name: 'Delta-Neutral DeepBook Vault',
    strategy: 'delta_neutral',
    tokenA: 'SUI',
    tokenB: 'suiUSDC',
    fee: 0.001,
    tickSpacing: 1,
    tvl: 0,
    apy: 0.086,
    chainId: ChainId.SUI_TESTNET,
    active: true,
    description:
      'Enforces |Δp| ≤ ε atomically via Hot Potato DeltaReceipt. Long SUI/suiUSDC LP on DeepBook CLMM hedged with a synthetic short via DeepBook Perps. Owned BalanceManager routes all swaps on Sui\'s parallel execution fast-path.',
    performance: { totalReturn: 0.021, sharpeRatio: 2.8, maxDrawdown: 0.024, winRate: 0.88 },
  },
  {
    address: SUI_VAULT_PROGRAMS.hedgeRatioVault,
    name: 'GBM Hedge-Ratio Vault',
    strategy: 'hedge',
    tokenA: 'SUI',
    tokenB: 'suiUSDC',
    fee: 0.001,
    tickSpacing: 10,
    tvl: 0,
    apy: 0.124,
    chainId: ChainId.SUI_TESTNET,
    active: true,
    description:
      'Implements h** = min(h*, h̄(α)) via GBM moment-matching. Rebalancing frequency T scales down with realized volatility σ̃, keeping P(LTV > ℓ_max) < 1−α. Collateral managed via owned MarginManager on DeepBook Margin.',
    performance: { totalReturn: 0.031, sharpeRatio: 1.85, maxDrawdown: 0.048, winRate: 0.74 },
  },
  {
    address: SUI_VAULT_PROGRAMS.lvrOffsetVault,
    name: 'LVR Offset Options Vault',
    strategy: 'concentrated_liquidity',
    tokenA: 'SUI',
    tokenB: 'suiUSDT',
    fee: 0.003,
    tickSpacing: 64,
    tvl: 0,
    apy: 0.187,
    chainId: ChainId.SUI_TESTNET,
    active: true,
    description:
      'CLMM position boundaries replicate a Continuous Installment option strip. Buys/writes CI puts via DeepBook Predict to convert pathwise LVR cost into a predictable funding rate q priced from market implied volatility.',
    performance: { totalReturn: 0.045, sharpeRatio: 1.22, maxDrawdown: 0.11, winRate: 0.65 },
  },
  {
    address: SUI_VAULT_PROGRAMS.suiUsdeMetaVault,
    name: 'suiUSDe Layered Meta Vault',
    strategy: 'layered_yield',
    tokenA: 'suiUSDe',
    tokenB: 'USDC',
    fee: 0,
    tickSpacing: 1,
    tvl: 0,
    apy: 0.223,
    chainId: ChainId.SUI_TESTNET,
    active: true,
    description:
      'Uses suiUSDe as core margin collateral on DeepBook Margin. Simultaneously captures staking rewards, perpetual funding rates, money market deposit yields, and CLOB trading fees for maximum capital efficiency.',
    performance: { totalReturn: 0.055, sharpeRatio: 1.45, maxDrawdown: 0.062, winRate: 0.79 },
  },
]

export function isSolanaChain(chainId: ChainId | null | undefined) {
  return chainId ? getChainMetadata(chainId).type === ChainType.SOLANA : false
}

export function isSuiChain(chainId: ChainId | null | undefined) {
  return chainId ? getChainMetadata(chainId).type === ChainType.SUI : false
}

export function isEvmChain(chainId: ChainId | null | undefined) {
  return chainId ? getChainMetadata(chainId).type === ChainType.EVM : false
}

export function getVaultsForChain(chainId: ChainId | null | undefined): VaultData[] | null {
  if (isSolanaChain(chainId)) return SOLANA_DEVNET_VAULTS
  if (isSuiChain(chainId)) return SUI_TESTNET_VAULTS
  return null
}
