'use client'

import { useEffect } from 'react'
import { useWalletConnection, useCurrentAccount } from '@mysten/dapp-kit-react'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, WalletStatus } from '@/types/chain'

/**
 * Invisible component that syncs dApp Kit wallet state into the shared
 * multiChainStore so the rest of the app (ChainSelector, deposit modals,
 * TVL hooks) can treat SUI like any other chain.
 *
 * Must live inside <DAppKitProvider> — place it in Web3Provider after mount.
 */
export function SuiWalletSync() {
  const { status } = useWalletConnection()
  const account = useCurrentAccount()
  const { connectSuiWallet, disconnectSuiWallet, sui } = useMultiChainStore()

  useEffect(() => {
    if (status === 'connected' && account?.address) {
      connectSuiWallet(account.address, ChainId.SUI_TESTNET)
    } else if (
      (status === 'disconnected') &&
      sui.status === WalletStatus.CONNECTED
    ) {
      disconnectSuiWallet()
    }
  }, [status, account?.address])

  return null
}
