'use client'

import { useCurrentClient } from '@mysten/dapp-kit-react'
import { useQuery } from '@tanstack/react-query'
import { SUI_VAULT_PROGRAMS } from '@/lib/sui/vaultPrograms'

const VAULT_IDS = [
  SUI_VAULT_PROGRAMS.deltaNeutralVault,
  SUI_VAULT_PROGRAMS.hedgeRatioVault,
  SUI_VAULT_PROGRAMS.lvrOffsetVault,
  SUI_VAULT_PROGRAMS.suiUsdeMetaVault,
]

// Returns TVL in SUI (not MIST) keyed by vault object ID
export function useSuiVaultTVL() {
  const client = useCurrentClient()

  const { data, isLoading } = useQuery({
    queryKey: ['suiVaultTVL', VAULT_IDS],
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
          // Balance<SUI> is serialised as { value: "NNNN" } or a plain string
          const raw = fields?.balance as { value?: string } | string | undefined
          const mist =
            typeof raw === 'string'
              ? BigInt(raw)
              : typeof raw?.value === 'string'
                ? BigInt(raw.value)
                : 0n
          tvlMap[obj.objectId] = Number(mist) / 1_000_000_000
        }
      }
      return tvlMap
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return { tvlMap: data ?? {}, isLoading }
}
