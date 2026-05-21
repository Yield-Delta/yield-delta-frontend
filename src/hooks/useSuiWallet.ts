'use client'

import {
  useWalletConnection,
  useCurrentAccount,
  useDAppKit,
  useCurrentClient,
} from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'

export function useSuiWallet() {
  const { status, wallet } = useWalletConnection()
  const account = useCurrentAccount()
  const dAppKit = useDAppKit()
  const client = useCurrentClient()

  const { data: balanceData } = useQuery({
    queryKey: ['suiBalance', account?.address],
    queryFn: async () => {
      const result = await client.core.listBalances({ owner: account!.address })
      return result
    },
    enabled: !!account,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const suiBalance = balanceData?.balances?.find(
    (b) => b.coinType === '0x2::sui::SUI'
  )
  const formattedBalance = suiBalance
    ? (Number(suiBalance.coinBalance) / 1_000_000_000).toFixed(4)
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
