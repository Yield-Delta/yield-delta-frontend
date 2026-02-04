/**
 * Hook for managing token balances in SEI DLP
 * Supports both native SEI and ERC20 token balance
 */

import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { getTokenInfo } from '@/utils/tokenUtils';

// ERC20 ABI for balance checking
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    name: 'allowance',
    type: 'function', 
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view'
  }
] as const;

interface TokenBalance {
  balance: number;
  formatted: string;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Get native SEI balance
 */
export function useNativeSEIBalance(): TokenBalance {
  const { address, isConnected } = useAccount();
  
  const { 
    data: balance, 
    isLoading, 
    error, 
    refetch 
  } = useBalance({
    address,
    chainId: 1328, // SEI Atlantic-2 testnet
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 20000, // 20 seconds stale time
    }
  });

  const numericBalance = balance ? parseFloat(formatUnits(balance.value, 18)) : 0;

  return {
    balance: numericBalance,
    formatted: balance ? formatUnits(balance.value, 18) : '0',
    isLoading,
    error: error as Error | null,
    refetch
  };
}

/**
 * Get ERC20 token balance
 */
export function useERC20Balance(tokenAddress: string, decimals: number = 18): TokenBalance {
  const { address, isConnected } = useAccount();

  const {
    data: balance,
    isLoading,
    error,
    refetch
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && isConnected,
      refetchInterval: 30000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 20000,
    }
  });

  // Use the correct decimals for the token
  const numericBalance = balance ? parseFloat(formatUnits(balance as bigint, decimals)) : 0;

  return {
    balance: numericBalance,
    formatted: balance ? formatUnits(balance as bigint, decimals) : '0',
    isLoading,
    error: error as Error | null,
    refetch
  };
}

/**
 * Get token balance for any token (native or ERC20)
 */
export function useTokenBalance(tokenSymbol: string): TokenBalance {
  const tokenInfo = getTokenInfo(tokenSymbol);
  const nativeSEI = useNativeSEIBalance();
  const erc20Balance = useERC20Balance(tokenInfo?.address || '', tokenInfo?.decimals || 18);

  if (!tokenInfo) {
    return {
      balance: 0,
      formatted: '0',
      isLoading: false,
      error: new Error(`Unknown token: ${tokenSymbol}`),
      refetch: () => {}
    };
  }

  if (tokenInfo.isNative) {
    return nativeSEI;
  }

  return erc20Balance;
}

/**
 * Get multiple token balances for vault requirements
 */
export function useVaultTokenBalances(tokenA: string, tokenB: string) {
  const tokenABalance = useTokenBalance(tokenA);
  const tokenBBalance = useTokenBalance(tokenB);

  return {
    tokenA: {
      symbol: tokenA,
      ...tokenABalance
    },
    tokenB: {
      symbol: tokenB,
      ...tokenBBalance
    },
    isLoading: tokenABalance.isLoading || tokenBBalance.isLoading,
    refetch: () => {
      tokenABalance.refetch();
      tokenBBalance.refetch();
    }
  };
}

/**
 * Check token allowance for ERC20 tokens
 */
export function useTokenAllowance(
  tokenAddress: string, 
  spenderAddress: string
): {
  allowance: bigint;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { address, isConnected } = useAccount();

  const { 
    data: allowance, 
    isLoading, 
    error,
    refetch
  } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address && !!tokenAddress && !!spenderAddress && isConnected,
      refetchInterval: 30000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 20000,
    }
  });

  return {
    allowance: (allowance as bigint) || 0n,
    isLoading,
    error: error as Error | null,
    refetch
  };
}

/**
 * Hook to get all relevant balances for a specific vault
 */
export function useVaultDepositBalances(vaultData: {
  tokenA: string;
  tokenB: string;
  address: string;
  strategy: string;
}) {
  const balances = useVaultTokenBalances(vaultData.tokenA, vaultData.tokenB);
  const tokenAInfo = getTokenInfo(vaultData.tokenA);
  const tokenBInfo = getTokenInfo(vaultData.tokenB);

  // Check allowances for ERC20 tokens
  const tokenAAllowance = useTokenAllowance(
    tokenAInfo?.address || '',
    vaultData.address
  );
  const tokenBAllowance = useTokenAllowance(
    tokenBInfo?.address || '',
    vaultData.address
  );

  return {
    ...balances,
    allowances: {
      tokenA: tokenAInfo?.isNative ? null : tokenAAllowance,
      tokenB: tokenBInfo?.isNative ? null : tokenBAllowance,
    },
    tokenInfo: {
      tokenA: tokenAInfo,
      tokenB: tokenBInfo
    }
  };
}