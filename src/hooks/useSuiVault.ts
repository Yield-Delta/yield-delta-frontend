'use client'

import { useState } from 'react'
import { useDAppKit, useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { Transaction, coinWithBalance } from '@mysten/sui/transactions'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'

// Maps each vault shared-object ID → its Move module name
const VAULT_MODULE: Record<string, string> = {
  [SUI_VAULT_PROGRAMS.deltaNeutralVault]: 'delta_neutral_vault',
  [SUI_VAULT_PROGRAMS.hedgeRatioVault]:   'hedge_ratio_vault',
  [SUI_VAULT_PROGRAMS.lvrOffsetVault]:    'lvr_offset_vault',
  [SUI_VAULT_PROGRAMS.suiUsdeMetaVault]:  'suiusde_meta_vault',
}

const ZERO_PKG = '0x' + '0'.repeat(64)

export interface SuiVaultDepositParams {
  vaultObjectId: string
  depositToken: string
  coinType?: string
}

export function useSuiVault() {
  const dAppKit = useDAppKit()
  const account = useCurrentAccount()
  const client = useCurrentClient()
  const [isDepositing, setIsDepositing] = useState(false)

  const isDeployed = SUI_VAULT_PROGRAMS.packageId !== ZERO_PKG

  const deposit = async (
    params: SuiVaultDepositParams,
    amount: string
  ): Promise<{ digest: string }> => {
    if (!account) throw new Error('SUI wallet not connected')

    const amountRaw = parseFloat(amount)
    if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
      throw new Error('Invalid deposit amount')
    }

    if (!isDeployed) {
      await new Promise((resolve) => setTimeout(resolve, 1600))
      return { digest: `sim-sui-${account.address.slice(2, 10)}-${Date.now()}` }
    }

    const moduleName = VAULT_MODULE[params.vaultObjectId]
    if (!moduleName) throw new Error('Unknown vault object ID — cannot determine module')

    setIsDepositing(true)
    try {
      const coinType = params.coinType ?? SUI_VAULT_PROGRAMS.suiType
      if (coinType !== SUI_VAULT_PROGRAMS.suiType) {
        throw new Error('The deployed Sui testnet vaults currently accept SUI deposits only')
      }

      const amountMist = BigInt(Math.round(amountRaw * 1_000_000_000))

      const tx = new Transaction()
      tx.setSender(account.address)
      const depositCoin = coinWithBalance({ balance: amountMist })

      // deposit(vault: &mut VaultT, coin_in: Coin<SUI>, ctx: &mut TxContext): u64
      // Returned u64 (shares) has `drop` ability — safe to ignore in the PTB
      tx.moveCall({
        target: `${SUI_VAULT_PROGRAMS.packageId}::${moduleName}::deposit`,
        arguments: [
          tx.object(params.vaultObjectId),
          depositCoin,
        ],
      })

      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })

      if (result.FailedTransaction) {
        throw new Error(
          result.FailedTransaction.status.error?.message ?? 'Transaction failed'
        )
      }

      const digest = result.Transaction.digest
      await client.waitForTransaction({ digest })
      return { digest }
    } finally {
      setIsDepositing(false)
    }
  }

  const withdraw = async (
    params: SuiVaultDepositParams,
    sharesStr: string
  ): Promise<{ digest: string }> => {
    if (!account) throw new Error('SUI wallet not connected')

    const sharesRaw = parseFloat(sharesStr)
    if (!Number.isFinite(sharesRaw) || sharesRaw <= 0) {
      throw new Error('Invalid shares amount')
    }

    if (!isDeployed) {
      await new Promise((resolve) => setTimeout(resolve, 1400))
      return { digest: `sim-sui-withdraw-${account.address.slice(2, 10)}-${Date.now()}` }
    }

    const moduleName = VAULT_MODULE[params.vaultObjectId]
    if (!moduleName) throw new Error('Unknown vault object ID — cannot determine module')

    // On testnet with zero TVL, shares ≈ MIST (1:1 at first deposit)
    const sharesMist = BigInt(Math.round(sharesRaw * 1_000_000_000))

    const tx = new Transaction()
    tx.setSender(account.address)

    // withdraw(vault: &mut VaultT, shares: u64, ctx: &mut TxContext): Coin<SUI>
    // Coin<SUI> has key+store but NOT drop — must transfer the returned coin
    const [withdrawnCoin] = tx.moveCall({
      target: `${SUI_VAULT_PROGRAMS.packageId}::${moduleName}::withdraw`,
      arguments: [
        tx.object(params.vaultObjectId),
        tx.pure.u64(sharesMist),
      ],
    })
    tx.transferObjects([withdrawnCoin], account.address)

    const result = await dAppKit.signAndExecuteTransaction({ transaction: tx })

    if (result.FailedTransaction) {
      throw new Error(
        result.FailedTransaction.status.error?.message ?? 'Transaction failed'
      )
    }

    const digest = result.Transaction.digest
    await client.waitForTransaction({ digest })
    return { digest }
  }

  return { deposit, withdraw, isDepositing, isDeployed }
}
