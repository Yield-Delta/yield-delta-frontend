/**
 * Hook to calculate aggregate vault statistics
 */

import { useVaults } from './useVaults';
import { useMemo } from 'react';

export interface VaultStats {
  totalTVL: number;
  activeVaultsCount: number;
  averageAPY: number;
  isLoading: boolean;
  error: Error | null;
}

export function useVaultStats(): VaultStats {
  const { data: vaults, isLoading, error } = useVaults();

  const stats = useMemo(() => {
    if (!vaults || vaults.length === 0) {
      return {
        totalTVL: 0,
        activeVaultsCount: 0,
        averageAPY: 0,
      };
    }

    // Calculate total TVL across all vaults
    const totalTVL = vaults.reduce((sum, vault) => sum + vault.tvl, 0);

    // Count active vaults (vaults with TVL > 0)
    const activeVaultsCount = vaults.filter(vault => vault.tvl > 0).length;

    // Calculate average APY
    const totalAPY = vaults.reduce((sum, vault) => sum + vault.apy, 0);
    const averageAPY = vaults.length > 0 ? totalAPY / vaults.length : 0;

    return {
      totalTVL,
      activeVaultsCount,
      averageAPY,
    };
  }, [vaults]);

  return {
    ...stats,
    isLoading,
    error: error as Error | null,
  };
}
