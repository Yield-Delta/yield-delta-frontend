/**
 * Hook to fetch on-chain TVL for vaults
 */

import { useReadContracts } from 'wagmi';
import SEIVault from '@/lib/abis/SEIVault';
import { getTokenInfo } from '@/utils/tokenUtils';

interface VaultTVL {
  address: string;
  tvl: bigint;
  tvlFormatted: number;
}

export function useVaultTVL(vaultAddresses: string[], vaultTokens?: { [address: string]: string }) {
  // Create contract read configs for all vaults to get totalAssets and asset address
  const contracts = vaultAddresses.flatMap((vaultAddress) => [
    {
      address: vaultAddress as `0x${string}`,
      abi: SEIVault,
      functionName: 'totalAssets' as const,
    },
    {
      address: vaultAddress as `0x${string}`,
      abi: SEIVault,
      functionName: 'asset' as const,
    }
  ]);

  const { data, isLoading, isError, error, refetch } = useReadContracts({
    contracts: vaultAddresses.length > 0 ? contracts : [],
    query: {
      enabled: vaultAddresses.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  // Parse the data for each vault
  const tvlData: VaultTVL[] = vaultAddresses.map((address, index) => {
    const totalAssetsIndex = index * 2;
    const assetAddressIndex = index * 2 + 1;

    const totalAssetsResult = data?.[totalAssetsIndex];
    const assetAddressResult = data?.[assetAddressIndex];

    if (!totalAssetsResult || totalAssetsResult.status === 'failure' || !totalAssetsResult.result) {
      return {
        address,
        tvl: 0n,
        tvlFormatted: 0,
      };
    }

    const tvl = totalAssetsResult.result as bigint;

    // Determine decimals based on the asset address
    let decimals = 18; // Default to 18 for native SEI

    if (assetAddressResult && assetAddressResult.status === 'success' && assetAddressResult.result) {
      const assetAddress = assetAddressResult.result as string;

      // If it's address(0), it's native SEI (18 decimals)
      if (assetAddress === '0x0000000000000000000000000000000000000000') {
        decimals = 18;
      } else {
        // Check if it's USDC
        const usdcAddress = '0x4fCF1784B31630811181f670Aea7A7bEF803eaED';
        if (assetAddress.toLowerCase() === usdcAddress.toLowerCase()) {
          decimals = 6;
        }
        // You can add more token checks here as needed
      }
    } else if (vaultTokens && vaultTokens[address.toLowerCase()]) {
      // Fallback: use provided token symbol to determine decimals
      const tokenSymbol = vaultTokens[address.toLowerCase()];
      const tokenInfo = getTokenInfo(tokenSymbol);
      if (tokenInfo) {
        decimals = tokenInfo.decimals;
      }
    }

    const tvlFormatted = Number(tvl) / Math.pow(10, decimals);

    return {
      address,
      tvl,
      tvlFormatted,
    };
  });

  // Create a map for easy lookup
  const tvlMap = new Map<string, number>();
  tvlData.forEach((item) => {
    tvlMap.set(item.address.toLowerCase(), item.tvlFormatted);
  });

  return {
    tvlData,
    tvlMap,
    isLoading,
    isError,
    error,
    refetch
  };
}
