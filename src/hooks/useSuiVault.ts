'use client'

import { useState } from 'react'
import { useDAppKit, useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { Transaction } from '@mysten/sui/transactions'
import { coinWithBalance } from '@mysten/sui/transactions'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'

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

  const deposit = async (
    params: SuiVaultDepositParams,
    amount: string
  ): Promise<{ digest: string }> => {
    if (!account) throw new Error('SUI wallet not connected')

    const amountRaw = parseFloat(amount)
    if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
      throw new Error('Invalid deposit amount')
    }

    const isDeployed =
      params.vaultObjectId !== '0x0000000000000000000000000000000000000000000000000000000000000001' &&
      params.vaultObjectId !== '0x0000000000000000000000000000000000000000000000000000000000000002' &&
      params.vaultObjectId !== '0x0000000000000000000000000000000000000000000000000000000000000003' &&
      params.vaultObjectId !== '0x0000000000000000000000000000000000000000000000000000000000000004' &&
      SUI_VAULT_PROGRAMS.packageId !== '0x' + '0'.repeat(64)

    if (!isDeployed) {
      // Simulate until Move contracts are deployed on testnet
      await new Promise((resolve) => setTimeout(resolve, 1600))
      return { digest: `sim-sui-${account.address.slice(2, 10)}-${Date.now()}` }
    }

    setIsDepositing(true)
    try {
      const coinType = params.coinType ?? SUI_VAULT_PROGRAMS.suiType
      const isSui = coinType === SUI_VAULT_PROGRAMS.suiType
      const amountMist = BigInt(Math.round(amountRaw * 1_000_000_000))

      const tx = new Transaction()
      tx.setSender(account.address)

      let depositCoin
      if (isSui) {
        // Split from gas coin for SUI — no setSender needed for coinWithBalance on SUI
        ;[depositCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountMist)])
      } else {
        // coinWithBalance auto-selects, merges, and splits non-SUI coins
        depositCoin = coinWithBalance({ balance: amountMist, type: coinType })
      }

      tx.moveCall({
        target: `${SUI_VAULT_PROGRAMS.packageId}::vault::deposit`,
        arguments: [
          tx.object(params.vaultObjectId),
          depositCoin,
          tx.object(SUI_VAULT_PROGRAMS.deepBookBalanceManager),
        ],
        typeArguments: [coinType],
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
    lpAmount: string
  ): Promise<{ digest: string }> => {
    if (!account) throw new Error('SUI wallet not connected')

    // Simulate until contracts are deployed
    await new Promise((resolve) => setTimeout(resolve, 1400))
    return { digest: `sim-sui-withdraw-${account.address.slice(2, 10)}-${Date.now()}` }
  }

  return { deposit, withdraw, isDepositing }
}
