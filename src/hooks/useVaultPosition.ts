/**
 * Hook to fetch user's position in a specific vault
 */

import { useReadContract, useAccount } from 'wagmi';
import SEIVault from '@/lib/abis/SEIVault';

interface VaultPosition {
  shares: string;
  shareValue: string;
  totalDeposited: string;
  totalWithdrawn: string;
  depositTime: string;
  lockTimeRemaining: string;
}

interface ContractData {
  shares?: bigint;
  shareValue?: bigint;
  totalDeposited?: bigint;
  totalWithdrawn?: bigint;
  depositTime?: bigint;
  lockTimeRemaining?: bigint;
  [key: number]: bigint | undefined;
}

export function useVaultPosition(vaultAddress: string) {
  const { address: userAddress } = useAccount();

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: SEIVault,
    functionName: 'getCustomerStats',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress && !!vaultAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  });

  // Parse the data if available
  // Note: wagmi returns tuple data as an array-like object with both numeric indices and named properties
  // IMPORTANT: We prioritize named properties over indices to avoid confusion
  const contractData = data as ContractData | undefined;
  const position: VaultPosition | null = contractData ? {
    shares: (contractData.shares ?? contractData[0] ?? 0n).toString(),
    shareValue: (contractData.shareValue ?? contractData[1] ?? 0n).toString(),
    totalDeposited: (contractData.totalDeposited ?? contractData[2] ?? 0n).toString(),
    totalWithdrawn: (contractData.totalWithdrawn ?? contractData[3] ?? 0n).toString(),
    depositTime: (contractData.depositTime ?? contractData[4] ?? 0n).toString(),
    lockTimeRemaining: (contractData.lockTimeRemaining ?? contractData[5] ?? 0n).toString(),
  } : null;

  // Debug logging
  if (contractData) {
    console.log('[useVaultPosition] ===== CONTRACT DATA =====');
    console.log('[useVaultPosition] Raw contract data:', data);
    console.log('[useVaultPosition] Data type:', typeof data);
    console.log('[useVaultPosition] Is Array?:', Array.isArray(data));
    console.log('[useVaultPosition] Data keys:', data ? Object.keys(data as object) : []);
    console.log('[useVaultPosition] ===== NUMERIC INDICES =====');
    console.log('[useVaultPosition] [0] (should be shares):', contractData[0]?.toString());
    console.log('[useVaultPosition] [1] (should be shareValue):', contractData[1]?.toString());
    console.log('[useVaultPosition] [2] (should be totalDeposited):', contractData[2]?.toString());
    console.log('[useVaultPosition] [3] (should be totalWithdrawn):', contractData[3]?.toString());
    console.log('[useVaultPosition] [4] (should be depositTime):', contractData[4]?.toString());
    console.log('[useVaultPosition] [5] (should be lockTimeRemaining):', contractData[5]?.toString());
    console.log('[useVaultPosition] ===== NAMED PROPERTIES =====');
    console.log('[useVaultPosition] .shares:', contractData.shares?.toString());
    console.log('[useVaultPosition] .shareValue:', contractData.shareValue?.toString());
    console.log('[useVaultPosition] .totalDeposited:', contractData.totalDeposited?.toString());
    console.log('[useVaultPosition] .totalWithdrawn:', contractData.totalWithdrawn?.toString());
    console.log('[useVaultPosition] .depositTime:', contractData.depositTime?.toString());
    console.log('[useVaultPosition] .lockTimeRemaining:', contractData.lockTimeRemaining?.toString());

    if (position) {
      console.log('[useVaultPosition] ===== PARSED POSITION =====');
      console.log('[useVaultPosition] Parsed position object:', position);
      console.log('[useVaultPosition] Shares (Wei):', position.shares);
      console.log('[useVaultPosition] Shares (Ether):', (Number(position.shares) / 1e18).toFixed(18));
      console.log('[useVaultPosition] ShareValue (Wei):', position.shareValue);
      console.log('[useVaultPosition] ShareValue (Ether):', (Number(position.shareValue) / 1e18).toFixed(18));
      console.log('[useVaultPosition] TotalDeposited (Wei):', position.totalDeposited);
      console.log('[useVaultPosition] TotalDeposited (Ether):', (Number(position.totalDeposited) / 1e18).toFixed(18));
    }
    console.log('[useVaultPosition] ===============================');
  }

  const hasPosition = position ? BigInt(position.shares) > 0n : false;

  return {
    position,
    hasPosition,
    isLoading,
    isError,
    error,
    refetch
  };
}
