'use client'

import {
  useWalletConnection,
  useCurrentAccount,
  useCurrentNetwork,
  useDAppKit,
  useCurrentClient,
} from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'

export function useSuiWallet() {
  const { status, wallet } = useWalletConnection()
  const account = useCurrentAccount()
  const dAppKit = useDAppKit()
  const client = useCurrentClient()
  const network = useCurrentNetwork()

  const { data: balanceData } = useQuery({
    queryKey: ['suiBalance', network, account?.address],
    queryFn: async () => {
      const result = await client.core.getBalance({
        owner: account!.address,
        coinType: SUI_VAULT_PROGRAMS.suiType,
      })
      return result
    },
    enabled: !!account,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  // Use total balance: testnet funds can live in coin objects or address balance.
  const formattedBalance = balanceData?.balance
    ? (Number(balanceData.balance.balance) / 1_000_000_000).toFixed(4)
    : '0'

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting' || status === 'reconnecting'

  return {
    address: account?.address ?? null,
    isConnected,
    isConnecting,
    balance: formattedBalance,
    walletName: wallet?.name ?? null,
    disconnect: () => dAppKit.disconnectWallet(),
  }
}
