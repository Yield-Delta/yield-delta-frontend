/**
 * SUI testnet vault package IDs and shared object IDs.
 * Pattern mirrors SOLANA_PROGRAM_IDS for consistency.
 */
export const DEFAULT_SUI_VAULT_PROGRAMS = {
  packageId: '0xdcdbb87eeeb9ea5ab945313458b4e95f0d9cee27e980de57443ee60a34bda092',
  deltaNeutralVault: '0x20d65bba1fe94d020ef6b98ea1720f2f4db5ee9b268e03124d4f852485f6d710',
  hedgeRatioVault: '0x3d2da93346ffbfd59a2d721d0093bf4409388c890d1cf38d1d40de550100e714',
  lvrOffsetVault: '0x2e39f29fbb3821673b1241676e2491268c045442166e1d9351e9251ef4069335',
  suiUsdeMetaVault: '0x41f09a09dec8a42e13daf12d590f13798a7e7010a3ea9b8a44637b2f8ca0390b',
} as const

export const SUI_VAULT_PROGRAMS = {
  // Move package ID and shared vault object IDs — deployed to Sui testnet
  packageId:
    process.env.NEXT_PUBLIC_SUI_VAULT_PACKAGE_ID ||
    DEFAULT_SUI_VAULT_PROGRAMS.packageId,
  deltaNeutralVault:
    process.env.NEXT_PUBLIC_SUI_DELTA_NEUTRAL_VAULT_ID ||
    DEFAULT_SUI_VAULT_PROGRAMS.deltaNeutralVault,
  hedgeRatioVault:
    process.env.NEXT_PUBLIC_SUI_HEDGE_RATIO_VAULT_ID ||
    DEFAULT_SUI_VAULT_PROGRAMS.hedgeRatioVault,
  lvrOffsetVault:
    process.env.NEXT_PUBLIC_SUI_LVR_OFFSET_VAULT_ID ||
    DEFAULT_SUI_VAULT_PROGRAMS.lvrOffsetVault,
  suiUsdeMetaVault:
    process.env.NEXT_PUBLIC_SUI_USDE_META_VAULT_ID ||
    DEFAULT_SUI_VAULT_PROGRAMS.suiUsdeMetaVault,

  // DeepBook integration
  deepBookPoolSuiUsdc: '0x0000000000000000000000000000000000000000000000000000000000000005',
  deepBookBalanceManager: '0x0000000000000000000000000000000000000000000000000000000000000006',

  // Coin types
  suiType: '0x2::sui::SUI',
  suiUsdcType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
  suiUsdtType: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
  suiUsdeType: '0x0000000000000000000000000000000000000000000000000000000000000007',
} as const

export type SuiVaultId = keyof typeof SUI_VAULT_PROGRAMS
