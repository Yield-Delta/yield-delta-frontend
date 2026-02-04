/**
 * Token utilities for SEI DLP Core
 * Handles token detection, balance checking, and vault requirements
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  address?: string; // undefined for native SEI
  decimals: number;
  isNative: boolean;
}

export interface VaultTokenRequirements {
  primaryToken: TokenInfo;
  secondaryToken: TokenInfo;
  requiresBothTokens: boolean;
  supportsNativeSEI: boolean;
}

export interface VaultData {
  tokenA: string;
  tokenB: string;
  strategy: string;
}

// SEI testnet token addresses (SEI Atlantic-2 Testnet)
export const SEI_TESTNET_TOKENS: Record<string, TokenInfo> = {
  SEI: {
    symbol: 'SEI',
    name: 'SEI',
    decimals: 18,
    isNative: true
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x4fCF1784B31630811181f670Aea7A7bEF803eaED', // USDC on SEI testnet atlantic-2
    decimals: 6,
    isNative: false
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0xE2E6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a3a3a', // Mock ETH address for testnet
    decimals: 18,
    isNative: false
  },
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    address: '0xB2B6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a4a4a', // Mock BTC address for testnet
    decimals: 8,
    isNative: false
  },
  ATOM: {
    symbol: 'ATOM',
    name: 'Cosmos',
    address: '0xA2A6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a5a5a', // Mock ATOM address for testnet
    decimals: 6,
    isNative: false
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xU2U6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a6a6a', // Mock USDT address for testnet
    decimals: 6,
    isNative: false
  },
  DAI: {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xD2D6BE5E318d5D4B3A03aFf4b7FfDA3d3f3a7a7a', // Mock DAI address for testnet
    decimals: 18,
    isNative: false
  }
};

/**
 * Validate vault data structure and token symbols
 */
export function validateVaultData(vaultData: VaultData | null | undefined): { isValid: boolean; errors: string[] } {
  console.log('🔍 [validateVaultData] Starting validation for vaultData:', vaultData);
  const errors: string[] = [];
  
  if (!vaultData) {
    errors.push('Vault data is null or undefined');
    console.error('❌ [validateVaultData] Validation failed: Vault data is null or undefined');
    return { isValid: false, errors };
  }
  
  if (typeof vaultData !== 'object') {
    errors.push('Vault data must be an object');
    return { isValid: false, errors };
  }
  
  // Check required fields
  if (!vaultData.tokenA || typeof vaultData.tokenA !== 'string' || vaultData.tokenA.trim() === '') {
    errors.push(`Invalid tokenA: '${vaultData.tokenA}'`);
  }
  
  if (!vaultData.tokenB || typeof vaultData.tokenB !== 'string' || vaultData.tokenB.trim() === '') {
    errors.push(`Invalid tokenB: '${vaultData.tokenB}'`);
  }
  
  if (!vaultData.strategy || typeof vaultData.strategy !== 'string' || vaultData.strategy.trim() === '') {
    errors.push(`Invalid strategy: '${vaultData.strategy}'`);
  }
  
  // Check if tokens exist in our registry
  if (vaultData.tokenA && typeof vaultData.tokenA === 'string') {
    const tokenAInfo = getTokenInfo(vaultData.tokenA);
    if (!tokenAInfo) {
      errors.push(`Unknown tokenA: '${vaultData.tokenA}'. Available tokens: ${Object.keys(SEI_TESTNET_TOKENS).join(', ')}`);
    }
  }
  
  if (vaultData.tokenB && typeof vaultData.tokenB === 'string') {
    const tokenBInfo = getTokenInfo(vaultData.tokenB);
    if (!tokenBInfo) {
      errors.push(`Unknown tokenB: '${vaultData.tokenB}'. Available tokens: ${Object.keys(SEI_TESTNET_TOKENS).join(', ')}`);
    }
  }
  
  if (errors.length > 0) {
    console.error('❌ [validateVaultData] Validation failed with errors:', errors);
  } else {
    console.log('✅ [validateVaultData] Validation successful');
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Get token information by symbol
 */
export function getTokenInfo(symbol: string): TokenInfo | null {
  // Handle empty, null, undefined, or whitespace-only symbols
  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    console.warn('[tokenUtils] Invalid token symbol provided:', symbol);
    return null;
  }
  
  const normalizedSymbol = symbol.trim().toUpperCase();
  const tokenInfo = SEI_TESTNET_TOKENS[normalizedSymbol] || null;
  
  if (!tokenInfo) {
    console.warn(`[tokenUtils] Unknown token symbol: '${symbol}' (normalized: '${normalizedSymbol}')`);
  }
  
  return tokenInfo;
}

/**
 * Determine vault token requirements based on vault data
 */
export function getVaultTokenRequirements(vaultData: {
  tokenA: string;
  tokenB: string;
  strategy: string;
}): VaultTokenRequirements {
  console.log('🔍 [getVaultTokenRequirements] Determining requirements for vault:', vaultData);
  // Validate vault data first
  const validation = validateVaultData(vaultData);
  if (!validation.isValid) {
    const errorMessage = `Invalid vault data: ${validation.errors.join(', ')}`;
    console.error('❌ [getVaultTokenRequirements] Validation failed:', errorMessage, { vaultData });
    throw new Error(errorMessage);
  }
  
  const { tokenA, tokenB } = vaultData;
  
  const primaryTokenInfo = getTokenInfo(tokenA);
  const secondaryTokenInfo = getTokenInfo(tokenB);

  // Provide detailed error information
  if (!primaryTokenInfo || !secondaryTokenInfo) {
    const missingTokens = [];
    if (!primaryTokenInfo) missingTokens.push(`tokenA: '${tokenA}'`);
    if (!secondaryTokenInfo) missingTokens.push(`tokenB: '${tokenB}'`);
    
    const errorMsg = `Vault contains unknown or invalid tokens: ${missingTokens.join(', ')}. Available tokens: ${Object.keys(SEI_TESTNET_TOKENS).join(', ')}`;
    console.error('[tokenUtils]', errorMsg);
    throw new Error(errorMsg);
  }

  // Determine if vault supports native SEI deposits
  const supportsNativeSEI = 
    primaryTokenInfo.symbol === 'SEI' || 
    secondaryTokenInfo.symbol === 'SEI';

  // Most strategies require both tokens, but some concentrated liquidity vaults
  // may allow single-sided deposits that get converted
  const requiresBothTokens = ![
    'concentrated_liquidity',
    'stable_max'
  ].includes(vaultData.strategy);

  const requirements = {
    primaryToken: primaryTokenInfo,
    secondaryToken: secondaryTokenInfo,
    requiresBothTokens,
    supportsNativeSEI,
  };

  console.log('✅ [getVaultTokenRequirements] Determined requirements:', requirements);
  return requirements;
}

/**
 * Check if a vault accepts native SEI deposits
 */
export function vaultAcceptsNativeSEI(vaultData: {
  tokenA: string;
  tokenB: string;
  address?: string;
}): boolean {
  // Handle invalid vault data gracefully
  if (!vaultData || !vaultData.tokenA || !vaultData.tokenB) {
    console.warn('[tokenUtils] Invalid vault data for SEI check:', vaultData);
    return false;
  }
  
  const tokenAUpper = vaultData.tokenA.trim().toUpperCase();
  const tokenBUpper = vaultData.tokenB.trim().toUpperCase();
  
  // Check if either token is SEI (native)
  const hasSEIToken = tokenAUpper === 'SEI' || tokenBUpper === 'SEI';
  
  // Additional check: some vaults might be configured for native SEI even with other tokens
  // This can be determined by checking if tokenA is set to address(0) in the contract
  return hasSEIToken;
}

/**
 * Determine if a vault is configured for native SEI (token0 == address(0))
 */
export function isNativeSEIVault(vaultData: {
  tokenA: string;
  tokenB: string;
  strategy: string;
}): boolean {
  // Check if the primary token is SEI and the strategy suggests native support
  const primaryToken = getPrimaryDepositToken(vaultData);
  return primaryToken.isNative && primaryToken.symbol === 'SEI';
}

/**
 * Get the required token for a single-token deposit
 * Returns the primary token that users need to deposit
 */
export function getPrimaryDepositToken(vaultData: {
  tokenA: string;
  tokenB: string;
  strategy: string;
}): TokenInfo {
  try {
    const requirements = getVaultTokenRequirements(vaultData);
    
    // For SEI-containing pairs, prefer SEI as primary
    if (requirements.supportsNativeSEI) {
      return requirements.primaryToken.symbol === 'SEI' 
        ? requirements.primaryToken 
        : requirements.secondaryToken;
    }
    
    // For other pairs, return the first token
    return requirements.primaryToken;
  } catch (error) {
    console.error('[tokenUtils] Error getting primary deposit token, falling back to SEI:', error);
    // Fallback to SEI if there's an error
    return SEI_TESTNET_TOKENS.SEI;
  }
}

/**
 * Generate user-friendly token requirement text
 */
export function getTokenRequirementText(vaultData: {
  tokenA: string;
  tokenB: string;
  strategy: string;
}): string {
  try {
    const requirements = getVaultTokenRequirements(vaultData);
    
    if (requirements.supportsNativeSEI && !requirements.requiresBothTokens) {
      return `Accepts native SEI deposits`;
    }
    
    if (requirements.requiresBothTokens) {
      return `Requires ${requirements.primaryToken.symbol} + ${requirements.secondaryToken.symbol}`;
    }
    
    const primaryToken = getPrimaryDepositToken(vaultData);
    return `Accepts ${primaryToken.symbol} deposits`;
  } catch (error) {
    console.error('[tokenUtils] Error getting token requirement text:', error);
    // Fallback message when vault data is incomplete
    return 'Token requirements unavailable';
  }
}

/**
 * Check if user has sufficient balance for deposit
 */
export function hasInsufficientBalance(
  depositAmount: string,
  userBalance: number,
  tokenInfo: TokenInfo
): { insufficient: boolean; message?: string } {
  const amount = parseFloat(depositAmount);
  
  if (isNaN(amount) || amount <= 0) {
    return { insufficient: true, message: 'Invalid deposit amount' };
  }
  
  if (amount > userBalance) {
    return { 
      insufficient: true, 
      message: `Insufficient ${tokenInfo.symbol} balance. You have ${userBalance.toFixed(4)} ${tokenInfo.symbol}, but need ${amount} ${tokenInfo.symbol}.`
    };
  }
  
  return { insufficient: false };
}

/**
 * Format token amount for display
 */
export function formatTokenAmount(amount: number, tokenInfo: TokenInfo): string {
  const decimals = tokenInfo.decimals === 18 ? 4 : Math.min(tokenInfo.decimals, 6);
  return `${amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: decimals 
  })} ${tokenInfo.symbol}`;
}

/**
 * Get vault strategy display name
 */
export function getStrategyDisplayName(strategy: string): string {
  const strategyNames: Record<string, string> = {
    'concentrated_liquidity': 'Concentrated Liquidity',
    'yield_farming': 'Yield Farming',
    'arbitrage': 'Arbitrage Bot',
    'hedge': 'Hedge Strategy',
    'stable_max': 'Stable Max Yield',
    'sei_hypergrowth': 'SEI Hypergrowth',
    'blue_chip': 'Blue Chip DeFi',
    'delta_neutral': 'Delta Neutral LP'
  };
  
  return strategyNames[strategy] || strategy.replace('_', ' ');
}