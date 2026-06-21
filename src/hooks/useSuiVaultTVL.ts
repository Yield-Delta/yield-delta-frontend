'use client'

import { useCurrentClient } from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'
import { parseSuiVaultBalance } from '@/lib/sui/vaultBalance'

const VAULT_IDS = [
  SUI_VAULT_PROGRAMS.deltaNeutralVault,
  SUI_VAULT_PROGRAMS.hedgeRatioVault,
  SUI_VAULT_PROGRAMS.lvrOffsetVault,
  SUI_VAULT_PROGRAMS.suiUsdeMetaVault,
]

export const SUI_VAULT_TVL_QUERY_KEY = ['suiVaultTVL', VAULT_IDS] as const

// Returns TVL in SUI (not MIST) keyed by vault object ID
export function useSuiVaultTVL() {
  const client = useCurrentClient()

  const { data, isLoading } = useQuery({
    queryKey: SUI_VAULT_TVL_QUERY_KEY,
    queryFn: async () => {
      const result = await client.core.getObjects({
        objectIds: VAULT_IDS,
        include: { json: true },
      })

      const tvlMap: Record<string, number> = {}
      for (const obj of result.objects) {
        // Filter out error responses
        if (!(obj instanceof Error) && 'objectId' in obj) {
          const fields = obj.json as Record<string, unknown> | null | undefined
          tvlMap[obj.objectId] = parseSuiVaultBalance(fields)
        }
      }
      return tvlMap
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return { tvlMap: data ?? {}, isLoading }
}
