/**
 * Sui Move serializes a Balance<T> field either as a numeric string or as
 * `{ value }`. The deployed Yield Delta vaults currently store that balance
 * in `vault_balance` (not `balance`). Keep the legacy name as a fallback so
 * the reader remains compatible with older deployments.
 */
export function parseSuiVaultBalance(fields: Record<string, unknown> | null | undefined): number {
  const raw = fields?.vault_balance ?? fields?.balance

  let mist: bigint
  try {
    if (typeof raw === 'string') {
      mist = BigInt(raw)
    } else if (raw && typeof raw === 'object' && 'value' in raw) {
      const value = (raw as { value?: unknown }).value
      mist = typeof value === 'string' ? BigInt(value) : 0n
    } else {
      mist = 0n
    }
  } catch {
    mist = 0n
  }

  return Number(mist) / 1_000_000_000
}
