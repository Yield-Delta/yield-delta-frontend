import { parseSuiVaultBalance } from '@/lib/sui/vaultBalance'

describe('parseSuiVaultBalance', () => {
  it('reads the vault_balance field used by the deployed Sui vaults', () => {
    expect(parseSuiVaultBalance({ vault_balance: '1492400000' })).toBe(1.4924)
  })

  it('supports Balance<SUI> object serialization', () => {
    expect(parseSuiVaultBalance({ vault_balance: { value: '497500000' } })).toBe(0.4975)
  })

  it('keeps compatibility with the legacy balance field', () => {
    expect(parseSuiVaultBalance({ balance: '1000000000' })).toBe(1)
  })

  it('returns zero for missing or malformed values', () => {
    expect(parseSuiVaultBalance(undefined)).toBe(0)
    expect(parseSuiVaultBalance({ vault_balance: 'not-a-number' })).toBe(0)
  })
})
