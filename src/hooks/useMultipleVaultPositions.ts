/**
 * Hook to fetch user's positions across multiple vaults
 */

import { useReadContracts, useAccount } from 'wagmi';
import SEIVault from '@/lib/abis/SEIVault';

interface VaultPosition {
  shares: string;
  shareValue: string;
  totalDeposited: string;
  totalWithdrawn: string;
  depositTime: string;
  lockTimeRemaining: string;
}

interface VaultWithPosition {
  address: string;
  position: VaultPosition | null;
  hasPosition: boolean;
}

export function useMultipleVaultPositions(vaultAddresses: string[]) {
  const { address: userAddress } = useAccount();

  // Create contract read configs for all vaults
  const contracts = vaultAddresses.map((vaultAddress) => ({
    address: vaultAddress as `0x${string}`,
    abi: SEIVault,
    functionName: 'getCustomerStats' as const,
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  }));

  const { data, isLoading, isError, error, refetch } = useReadContracts({
    contracts: userAddress ? contracts : [],
    query: {
      enabled: !!userAddress && vaultAddresses.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  // Parse the data for each vault
  const positions: VaultWithPosition[] = vaultAddresses.map((address, index) => {
    const result = data?.[index];

    if (!result || result.status === 'failure' || !result.result) {
      return {
        address,
        position: null,
        hasPosition: false,
      };
    }

    const contractData = result.result as unknown as {
      shares?: bigint;
      shareValue?: bigint;
      totalDeposited?: bigint;
      totalWithdrawn?: bigint;
      depositTime?: bigint;
      lockTimeRemaining?: bigint;
      [key: number]: bigint | undefined;
    };

    const position: VaultPosition = {
      shares: (contractData.shares ?? contractData[0] ?? 0n).toString(),
      shareValue: (contractData.shareValue ?? contractData[1] ?? 0n).toString(),
      totalDeposited: (contractData.totalDeposited ?? contractData[2] ?? 0n).toString(),
      totalWithdrawn: (contractData.totalWithdrawn ?? contractData[3] ?? 0n).toString(),
      depositTime: (contractData.depositTime ?? contractData[4] ?? 0n).toString(),
      lockTimeRemaining: (contractData.lockTimeRemaining ?? contractData[5] ?? 0n).toString(),
    };

    const hasPosition = BigInt(position.shares) > 0n;

    return {
      address,
      position,
      hasPosition,
    };
  });

  return {
    positions,
    isLoading,
    isError,
    error,
    refetch
  };
}
