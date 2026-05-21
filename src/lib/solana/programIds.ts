import { PublicKey } from '@solana/web3.js'

export const DEFAULT_SOLANA_PROGRAM_IDS = {
  yieldOracle: 'BCfceGYVBifA6uQ2D6wiLieTHC786u37dYzCLYoNk1df',
  yieldVault: 'FGH5S7dZrpM44QUquQaWo4G184rRgvhzV9np5MaAX8ga',
  deltaNeutralVault: 'J27AutkCvCGrNmpu2DxReEhJFUkStUF6HULuQ3hxm8BC',
  stakingVault: 'CKeT6u3dhZqWu9mvVPQ72TvzjLW7TmzUABU92c6ZeHJd',
  lpVault: 'E1Vwm8sabF4V4BgVKgFAoaVNSrwaFctYjj3hFuqDohww',
  metaVault: 'GWnVeWATrewpyPjWHkic5QjwH7knczUwovckx34jzHS1',
  adaptiveYieldVault: 'DUBHVDkWAF3NUkajnUbFWLrzFHVXkikR1u2ygPd2Ws43',
} as const

export const SOLANA_PROGRAM_IDS = {
  yieldOracle:
    process.env.NEXT_PUBLIC_YIELD_ORACLE_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.yieldOracle,
  yieldVault:
    process.env.NEXT_PUBLIC_YIELD_VAULT_PROGRAM_ID ||
    process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.yieldVault,
  deltaNeutralVault:
    process.env.NEXT_PUBLIC_DELTA_NEUTRAL_VAULT_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.deltaNeutralVault,
  stakingVault:
    process.env.NEXT_PUBLIC_STAKING_VAULT_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.stakingVault,
  lpVault:
    process.env.NEXT_PUBLIC_LP_VAULT_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.lpVault,
  metaVault:
    process.env.NEXT_PUBLIC_META_VAULT_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.metaVault,
  adaptiveYieldVault:
    process.env.NEXT_PUBLIC_ADAPTIVE_YIELD_VAULT_PROGRAM_ID ||
    DEFAULT_SOLANA_PROGRAM_IDS.adaptiveYieldVault,
} as const

export const YIELD_VAULT_PROGRAM_ID = new PublicKey(SOLANA_PROGRAM_IDS.yieldVault)
