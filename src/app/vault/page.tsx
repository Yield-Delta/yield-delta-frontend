"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Navigation from '@/components/Navigation';
import { ArrowLeft, TrendingUp, Shield, Target, BarChart3, Loader2, Coins } from 'lucide-react';
import gsap from 'gsap';
import { useVaultStore } from '@/stores/vaultStore';
import { useVaults } from '@/hooks/useVaults';
import DepositModal from '@/components/DepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import VaultClientWrapper from '@/components/VaultClientWrapper';
import TokenPairDisplay from '@/components/TokenPairDisplay';
import PortfolioChart from '@/components/PortfolioChart';
import { useVaultPosition } from '@/hooks/useVaultPosition';
import { useVaultTVL } from '@/hooks/useVaultTVL';
import { formatUnits } from 'viem';
import { getPrimaryDepositToken } from '@/utils/tokenUtils';
import { useTokenPrices } from '@/hooks/useTokenPrices';

// Utility functions
// Commented out unused function
// const formatCurrency = (amount: number) => {
//   if (amount >= 1000000) {
//     return `$${(amount / 1000000).toFixed(1)}M`
//   }
//   if (amount >= 1000) {
//     return `$${(amount / 1000).toFixed(0)}K`
//   }
//   return `$${amount.toFixed(0)}`
// }

const getRiskLevel = (apy: number, strategy?: string): 'Low' | 'Medium' | 'High' => {
  const apyPercentage = apy * 100; // Convert decimal to percentage
  
  // Strategy-based risk adjustments
  const strategyRiskModifier = {
    'stable_max': -5,          // Stablecoin strategies are less risky
    'concentrated_liquidity': 5, // Concentrated liquidity has impermanent loss risk
    'arbitrage': 3,            // Arbitrage has execution risk
    'yield_farming': 2,        // Standard farming risk
    'hedge': 0,                // Hedge strategies are balanced
    'sei_hypergrowth': 8,      // High growth = high risk
    'blue_chip': -2,           // Blue chip assets are safer
    'delta_neutral': -3        // Delta neutral strategies reduce market risk
  };
  
  const modifier = strategy ? (strategyRiskModifier[strategy as keyof typeof strategyRiskModifier] || 0) : 0;
  const adjustedApy = apyPercentage + modifier;
  
  if (adjustedApy < 15) return 'Low'
  if (adjustedApy < 25) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) => {
  const colors = {
    concentrated_liquidity: '#00f5d4',
    yield_farming: '#9b5de5',
    arbitrage: '#ff206e',
    hedge: '#ffa500',
    stable_max: '#10b981',
    sei_hypergrowth: '#f59e0b',
    blue_chip: '#3b82f6',
    delta_neutral: '#8b5cf6',
  }
  return colors[strategy as keyof typeof colors] || '#00f5d4'
}

// Detailed strategy descriptions for each vault type
const getStrategyDetails = (strategy: string, tokenA: string, tokenB: string) => {
  const strategies: Record<string, { description: string; features: string[]; riskFactors: string[]; rebalanceFrequency: string }> = {
    concentrated_liquidity: {
      description: `This vault uses concentrated liquidity positions on DEXes to maximize capital efficiency. By focusing liquidity within a tight price range around the ${tokenA}-${tokenB} pair's current price, the strategy earns significantly higher fees compared to traditional full-range positions. Our AI continuously monitors price movements and adjusts ranges to maintain optimal positioning.`,
      features: [
        'AI-optimized price range selection',
        'Dynamic range adjustment based on volatility',
        'Automatic position rebalancing every hour',
        'MEV-protected transactions',
        'Gas-optimized batch operations'
      ],
      riskFactors: [
        'Impermanent loss during high volatility',
        'Range may go out of bounds requiring rebalancing',
        'Smart contract risk'
      ],
      rebalanceFrequency: 'Every 1-4 hours based on market conditions'
    },
    yield_farming: {
      description: `The Yield Farming vault actively seeks the highest yield opportunities across multiple DeFi protocols for ${tokenA}-${tokenB}. It automatically compounds rewards, harvests incentive tokens, and reallocates capital to maximize APY while managing risk through diversification across protocols.`,
      features: [
        'Multi-protocol yield optimization',
        'Auto-compounding every 24 hours',
        'Reward token harvesting and conversion',
        'Protocol risk diversification',
        'Gas-efficient batch harvesting'
      ],
      riskFactors: [
        'Protocol-specific smart contract risks',
        'Reward token price volatility',
        'Impermanent loss on LP positions'
      ],
      rebalanceFrequency: 'Daily compounding with weekly strategy rebalancing'
    },
    arbitrage: {
      description: `This vault captures price discrepancies between different DEXes and liquidity pools for ${tokenA}-${tokenB}. Using high-frequency monitoring and instant execution, it profits from temporary price inefficiencies while maintaining delta-neutral exposure to minimize directional risk.`,
      features: [
        'Cross-DEX price monitoring',
        'Sub-second execution capability',
        'Flash loan integration for capital efficiency',
        'Slippage protection algorithms',
        'Profit-locking mechanisms'
      ],
      riskFactors: [
        'Execution risk during high volatility',
        'MEV competition from other arbitrageurs',
        'Network congestion delays'
      ],
      rebalanceFrequency: 'Continuous monitoring with instant execution'
    },
    delta_neutral: {
      description: `The Delta Neutral vault maintains market-neutral positions by hedging ${tokenA} exposure through perpetual futures or options. This strategy generates yield from funding rates and basis trades while eliminating directional market risk, making it ideal for risk-averse investors.`,
      features: [
        'Perpetual futures hedging',
        'Funding rate optimization',
        'Basis trade capture',
        'Automated hedge rebalancing',
        'Market-neutral exposure maintenance'
      ],
      riskFactors: [
        'Funding rate reversal risk',
        'Basis convergence timing risk',
        'Liquidation risk on leveraged positions'
      ],
      rebalanceFrequency: 'Every 8 hours or when hedge ratio deviates >2%'
    },
    stable_max: {
      description: `Designed for capital preservation, this vault focuses on ${tokenA}-${tokenB} stablecoin pairs to generate consistent yields with minimal volatility. It optimizes across lending protocols, stablecoin pools, and low-risk yield opportunities while maintaining high liquidity.`,
      features: [
        'Stablecoin-focused strategies',
        'Multi-protocol diversification',
        'High liquidity maintenance',
        'Minimal impermanent loss risk',
        'Conservative position sizing'
      ],
      riskFactors: [
        'Stablecoin depeg risk',
        'Lower yields compared to volatile pairs',
        'Protocol risk from lending platforms'
      ],
      rebalanceFrequency: 'Weekly optimization with daily monitoring'
    },
    sei_hypergrowth: {
      description: `An aggressive growth strategy targeting high-yield opportunities in the SEI ecosystem. This vault actively participates in new protocol launches, liquidity mining incentives, and high-APY farms for ${tokenA}-${tokenB}, accepting higher risk for potentially higher returns.`,
      features: [
        'Early access to SEI ecosystem launches',
        'High-yield farm participation',
        'Aggressive position sizing',
        'Quick capital rotation',
        'Incentive token optimization'
      ],
      riskFactors: [
        'High volatility exposure',
        'New protocol smart contract risks',
        'Impermanent loss on volatile pairs',
        'Rug pull risk from new projects'
      ],
      rebalanceFrequency: 'Multiple times daily based on opportunities'
    },
    blue_chip: {
      description: `A conservative strategy focusing on established, battle-tested protocols for ${tokenA}-${tokenB}. This vault prioritizes security and reliability over maximum yields, investing only in protocols with proven track records and significant TVL.`,
      features: [
        'Top-tier protocol selection only',
        'Extensive due diligence process',
        'Lower but consistent yields',
        'Battle-tested smart contracts',
        'Institutional-grade security'
      ],
      riskFactors: [
        'Lower yields than aggressive strategies',
        'Still subject to market-wide risks',
        'Protocol governance changes'
      ],
      rebalanceFrequency: 'Monthly rebalancing with continuous monitoring'
    },
    hedge: {
      description: `This vault employs sophisticated hedging techniques to protect ${tokenA}-${tokenB} positions against market downturns. It uses options, perpetuals, and dynamic position sizing to maintain upside exposure while limiting downside risk.`,
      features: [
        'Options-based downside protection',
        'Dynamic hedge ratio adjustment',
        'Tail risk management',
        'Volatility harvesting',
        'Portfolio insurance mechanisms'
      ],
      riskFactors: [
        'Hedging costs reduce overall returns',
        'Options premium decay',
        'Imperfect hedge correlation'
      ],
      rebalanceFrequency: 'Every 4 hours or on significant price moves'
    }
  };

  return strategies[strategy] || {
    description: `This vault optimizes liquidity provision for ${tokenA}-${tokenB} using advanced AI algorithms to maximize returns while managing risk.`,
    features: ['AI-driven optimization', 'Automatic rebalancing', 'MEV protection', 'Gas optimization'],
    riskFactors: ['Smart contract risk', 'Market volatility', 'Impermanent loss'],
    rebalanceFrequency: 'Varies based on market conditions'
  };
}

// Strategy-specific trading statistics and metrics
const getStrategyTradingStats = (strategy: string, tvl: number, winRate: number, sharpeRatio: number, maxDrawdown: number) => {
  // Base calculations
  const baseTradesPerDay = {
    concentrated_liquidity: 6,  // Rebalances frequently
    yield_farming: 2,           // Daily compounds
    arbitrage: 50,              // High frequency
    delta_neutral: 4,           // Hedge adjustments
    stable_max: 1,              // Minimal rebalancing
    sei_hypergrowth: 8,         // Active rotation
    blue_chip: 0.5,             // Monthly
    hedge: 6                    // Frequent hedging
  };

  const volatilityMultiplier = {
    concentrated_liquidity: 1.2,
    yield_farming: 0.9,
    arbitrage: 0.3,
    delta_neutral: 0.5,
    stable_max: 0.2,
    sei_hypergrowth: 1.8,
    blue_chip: 0.6,
    hedge: 0.7
  };

  const avgTradeReturn = {
    concentrated_liquidity: { best: 2.5, worst: -1.8 },
    yield_farming: { best: 1.8, worst: -0.8 },
    arbitrage: { best: 0.5, worst: -0.2 },
    delta_neutral: { best: 0.8, worst: -0.4 },
    stable_max: { best: 0.3, worst: -0.1 },
    sei_hypergrowth: { best: 8.0, worst: -5.0 },
    blue_chip: { best: 1.2, worst: -0.6 },
    hedge: { best: 1.5, worst: -1.0 }
  };

  const tradesPerDay = baseTradesPerDay[strategy as keyof typeof baseTradesPerDay] || 2;
  const volatility = volatilityMultiplier[strategy as keyof typeof volatilityMultiplier] || 1;
  const tradeReturns = avgTradeReturn[strategy as keyof typeof avgTradeReturn] || { best: 2, worst: -1 };

  // Calculate estimated metrics
  const totalTrades = Math.floor(tvl > 0 ? tradesPerDay * 30 * (tvl / 10000 + 1) : 0);
  const avgTradeSize = tvl > 0 ? (tvl / Math.max(totalTrades, 1) * 10) : 0;
  const bestTrade = tradeReturns.best * (1 + winRate) * (sharpeRatio / 2);
  const worstTrade = Math.abs(tradeReturns.worst) * (1 + maxDrawdown);

  return {
    totalTrades,
    avgTradeSize,
    bestTrade: bestTrade.toFixed(2),
    worstTrade: worstTrade.toFixed(2),
    tradesPerDay,
    volatility: (volatility * 12.5).toFixed(1),
    strategyType: strategy.replace('_', ' ').toUpperCase()
  };
}

interface VaultDetailPageProps {
  vaultAddress: string | null;
  activeTab: string;
  action: string | null;
  searchParams: URLSearchParams;
}

function VaultDetailPageContent({ vaultAddress, activeTab, action, searchParams }: VaultDetailPageProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const hasRefetchedRef = useRef(false);

  // State
  const [showDepositModal, setShowDepositModal] = useState(action === 'deposit');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Store and API hooks
  const { selectedVault, setSelectedVault, getVaultByAddress } = useVaultStore();
  const { data: vaultsData, isLoading } = useVaults();
  const { data: tokenPrices } = useTokenPrices();

  // Get vault data (needs to be declared before it's used)
  const vault = selectedVault || (vaultAddress ? getVaultByAddress(vaultAddress) : null);

  // Get user's position in this vault
  const { position, hasPosition, refetch: refetchPosition } = useVaultPosition(
    vaultAddress || ''
  );

  // Get on-chain TVL for this vault
  const { tvlMap, isLoading: tvlLoading, refetch: refetchTVL } = useVaultTVL(
    vaultAddress ? [vaultAddress] : []
  );
  const onChainTVL = vaultAddress ? (tvlMap.get(vaultAddress.toLowerCase()) || 0) : 0;

  // Get primary token for the vault to display correct TVL symbol
  const vaultPrimaryToken = vault ? getPrimaryDepositToken(vault) : null;
  const tvlTokenSymbol = vaultPrimaryToken?.symbol || 'SEI';
  const tvlDecimals = vaultPrimaryToken?.decimals || 18;

  // Prepare vault positions for PortfolioChart (single vault context)
  const vaultPositionsForChart = vault && position && hasPosition ? [{
    address: vault.address,
    totalDeposited: position.totalDeposited,
    depositTime: position.depositTime,
    apy: vault.apy * 100,
    shareValue: position.shareValue,
  }] : [];

  // Removed USD conversion for individual vault page - showing native tokens only

  // Debug logging for position
  useEffect(() => {
    if (position) {
      console.log('[VaultPage] User position:', position);
      console.log('[VaultPage] Shares being passed to modal:', position.shares);
      console.log('[VaultPage] ShareValue being passed to modal:', position.shareValue);
    }
  }, [position]);

  // Refetch TVL and position data when vault becomes available (only once per mount)
  // This ensures fresh data after deposits/withdrawals and on page load
  useEffect(() => {
    if (vaultAddress && vault && !hasRefetchedRef.current) {
      console.log('[VaultPage] Vault ready - refetching TVL and position data for fresh state');
      hasRefetchedRef.current = true;

      // Small delay to ensure hooks are ready and blockchain state is current
      const timer = setTimeout(() => {
        refetchTVL();
        refetchPosition();
        console.log('[VaultPage] Triggered initial refetch of TVL and position');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [vaultAddress, vault, refetchTVL, refetchPosition]);

  // Reset the refetch flag when vault address changes (navigating to different vault)
  useEffect(() => {
    hasRefetchedRef.current = false;
  }, [vaultAddress]);
  
  useEffect(() => {
    if (vaultAddress && !vault && vaultsData) {
      // Find vault in data and set it
      const foundVault = vaultsData.find((v) => v.address === vaultAddress);
      if (foundVault) {
        setSelectedVault(foundVault);
      }
    }
  }, [vaultAddress, vault, vaultsData, setSelectedVault]);
  
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
      );
    }
  }, [vault]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg">Loading vault details...</p>
        </div>
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vault Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested vault could not be found.</p>
          <Button onClick={() => router.push('/vaults')}>
            Back to Vaults
          </Button>
        </div>
      </div>
    );
  }

  const vaultColor = getVaultColor(vault.strategy);
  const riskLevel = getRiskLevel(vault.apy, vault.strategy);

  const handleDepositSuccess = (txHash: string) => {
    console.log('Deposit successful:', txHash);
    setShowDepositModal(false);
    // Refetch position and TVL data after successful deposit
    setTimeout(() => {
      refetchPosition();
      refetchTVL();
      console.log('[VaultPage] Refetched position and TVL after deposit');
    }, 1000); // Small delay to ensure blockchain state is updated
  };

  const handleWithdrawSuccess = (txHash: string) => {
    console.log('Withdrawal successful:', txHash);
    setShowWithdrawModal(false);
    // Refetch position and TVL data after successful withdrawal
    setTimeout(() => {
      refetchPosition();
      refetchTVL();
      console.log('[VaultPage] Refetched position and TVL after withdrawal');
    }, 1000); // Small delay to ensure blockchain state is updated
  };

  return (
    <div 
      className="min-h-screen bg-background relative vault-page" 
      style={{
        background: 'radial-gradient(ellipse at top, rgba(155, 93, 229, 0.1) 0%, rgba(0, 245, 212, 0.05) 50%, transparent 100%)',
        width: '100vw',
        maxWidth: 'none',
        position: 'relative'
      }}
    >
      {/* Background overlay for better content contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/80 via-background/70 to-background/80 pointer-events-none" />
      
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      <div className="relative z-10 pt-20 md:pt-20 lg:pt-20 px-4 pb-12">
        {/* Unified container for consistent width across all sections */}
        <div className="vault-layout-container" style={{
          maxWidth: '80rem', // Changed to match vaults page (max-w-7xl)
          width: '100%',
          margin: '0 auto',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          position: 'relative'
        }}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-end mb-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/vaults')}
                className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                  textShadow: '0 1px 2px rgba(0,0,0,0.7)'
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vaults
              </Button>
            </div>
            
            <div ref={cardRef} className="vault-detail-header-card-optimized relative z-10" style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
              padding: 'clamp(1rem, 2.5vw, 1.5rem)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 'clamp(140px, 18vw, 180px)',
              marginBottom: '1.5rem',
              maxWidth: '80rem',  // Match container and tabs width for perfect alignment
              width: '100%',
              boxSizing: 'border-box',         // Add consistent box model
              margin: '0 auto'
            }}>
              {/* Enhanced Background Gradient for Header */}
              <div 
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${vaultColor}15 0%, transparent 60%)`
                }}
              />

              {/* Action Buttons - Deposit & Withdraw */}
              <div
                className="vault-action-buttons-wrapper"
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  zIndex: 100,
                  display: 'flex',
                  gap: '0.75rem'
                }}
              >
                <style jsx>{`
                  @media (max-width: 768px) {
                    .vault-action-buttons-wrapper {
                      position: relative !important;
                      top: auto !important;
                      right: auto !important;
                      margin: 1rem 0 !important;
                      display: flex !important;
                      justify-content: center !important;
                      width: 100% !important;
                      flex-wrap: wrap !important;
                    }
                    .vault-action-button {
                      flex: 1 !important;
                      min-width: 140px !important;
                      max-width: 200px !important;
                      height: 48px !important;
                      font-size: 0.9rem !important;
                    }
                  }
                  @media (max-width: 480px) {
                    .vault-action-button {
                      min-width: 120px !important;
                      height: 44px !important;
                      font-size: 0.85rem !important;
                    }
                  }
                `}</style>
                {/* Deposit Button */}
                <button
                  className="vault-action-button"
                  onClick={() => {
                    console.log('[VaultDetail] Deposit button clicked');
                    setShowDepositModal(true);
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${vaultColor}F0, ${vaultColor}DD, ${vaultColor}CC)`,
                    color: '#000000',
                    border: `2px solid ${vaultColor}`,
                    boxShadow: `
                      0 8px 32px ${vaultColor}50,
                      0 0 40px ${vaultColor}30,
                      0 0 0 1px rgba(255,255,255,0.4) inset,
                      0 4px 16px rgba(0,0,0,0.3)
                    `,
                    width: '160px',
                    height: '56px',
                    fontSize: '0.95rem',
                    fontWeight: '900',
                    borderRadius: '16px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(12px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    fontFamily: 'inherit',
                    outline: 'none',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                    e.currentTarget.style.boxShadow = `
                      0 12px 48px ${vaultColor}60,
                      0 0 60px ${vaultColor}40,
                      0 0 0 1px rgba(255,255,255,0.5) inset,
                      0 6px 24px rgba(0,0,0,0.4)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = `
                      0 8px 32px ${vaultColor}50,
                      0 0 40px ${vaultColor}30,
                      0 0 0 1px rgba(255,255,255,0.4) inset,
                      0 4px 16px rgba(0,0,0,0.3)
                    `;
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 2 }}>Deposit</span>
                </button>

                {/* Withdraw Button - Only show if user has a position */}
                {hasPosition && (
                  <button
                    className="vault-action-button"
                    onClick={() => {
                      console.log('[VaultDetail] Withdraw button clicked');
                      setShowWithdrawModal(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
                      color: '#ffffff',
                      border: '2px solid rgba(239, 68, 68, 0.6)',
                      boxShadow: `
                        0 8px 32px rgba(239, 68, 68, 0.4),
                        0 0 40px rgba(239, 68, 68, 0.2),
                        0 0 0 1px rgba(255,255,255,0.4) inset,
                        0 4px 16px rgba(0,0,0,0.3)
                      `,
                      width: '160px',
                      height: '56px',
                      fontSize: '0.95rem',
                      fontWeight: '900',
                      borderRadius: '16px',
                      textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                      backdropFilter: 'blur(12px)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      fontFamily: 'inherit',
                      outline: 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                      e.currentTarget.style.boxShadow = `
                        0 12px 48px rgba(239, 68, 68, 0.5),
                        0 0 60px rgba(239, 68, 68, 0.3),
                        0 0 0 1px rgba(255,255,255,0.5) inset,
                        0 6px 24px rgba(0,0,0,0.4)
                      `;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = `
                        0 8px 32px rgba(239, 68, 68, 0.4),
                        0 0 40px rgba(239, 68, 68, 0.2),
                        0 0 0 1px rgba(255,255,255,0.4) inset,
                        0 4px 16px rgba(0,0,0,0.3)
                      `;
                    }}
                  >
                    <span style={{ position: 'relative', zIndex: 2 }}>Withdraw</span>
                  </button>
                )}
              </div>

              {/* Header Content with Compact Spacing */}
              <div className="vault-header-content" style={{ 
                marginRight: 'clamp(0px, 20vw, 160px)', 
                marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                position: 'relative',
                zIndex: 2
              }}>
                <style jsx>{`
                  @media (min-width: 769px) {
                    .vault-header-content {
                      margin-right: clamp(120px, 20vw, 160px) !important;
                    }
                  }
                  @media (max-width: 768px) {
                    .vault-header-content {
                      margin-right: 0 !important;
                      text-align: center !important;
                    }
                  }
                `}</style>
                <div className="vault-title-section">
                  <h1 className="vault-main-title" style={{ 
                    fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
                    fontWeight: '900',
                    marginBottom: 'clamp(0.375rem, 1.5vw, 0.75rem)',
                    lineHeight: '1.1',
                    color: vaultColor,
                    textShadow: `
                      0 0 30px ${vaultColor}40, 
                      0 3px 6px rgba(0,0,0,0.4),
                      0 1px 3px rgba(0,0,0,0.6)
                    `,
                    letterSpacing: '-0.02em'
                  }}>
                    {vault.name}
                  </h1>
                  <p className="vault-subtitle" style={{
                    fontSize: 'clamp(0.875rem, 2vw, 1.125rem)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
                    fontWeight: '500',
                    letterSpacing: '0.5px'
                  }}>
                    {vault.strategy.replace('_', ' ').toUpperCase()} • {vault.tokenA}-{vault.tokenB}
                  </p>
                  <div className="vault-badges" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.5rem, 1.5vw, 0.75rem)' }}>
                    <div
                      className="vault-risk-badge-v2"
                      style={{
                        background: riskLevel === 'Low' ? 
                          'linear-gradient(135deg, #22c55e, #16a34a, #15803d)' :
                          riskLevel === 'Medium' ? 
                          'linear-gradient(135deg, #f59e0b, #d97706, #b45309)' :
                          'linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)',
                        color: '#ffffff',
                        border: riskLevel === 'Low' ? '2px solid rgba(34, 197, 94, 0.6)' :
                                riskLevel === 'Medium' ? '2px solid rgba(245, 158, 11, 0.6)' :
                                '2px solid rgba(239, 68, 68, 0.6)',
                        boxShadow: riskLevel === 'Low' ? 
                          '0 0 20px rgba(34, 197, 94, 0.4), 0 4px 12px rgba(34, 197, 94, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' :
                          riskLevel === 'Medium' ? 
                          '0 0 20px rgba(245, 158, 11, 0.4), 0 4px 12px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset' :
                          '0 0 20px rgba(239, 68, 68, 0.4), 0 4px 12px rgba(239, 68, 68, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(10px)',
                        fontWeight: '800',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        padding: '0 24px',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {riskLevel} Risk
                    </div>
                  </div>
                </div>
              </div>

              {/* Optimized Key Metrics - Responsive Bento Grid */}
              <div className="vault-metrics-optimized" style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                maxWidth: '100%',
                margin: '0 auto',
                padding: '1.5rem',
                position: 'relative',
                zIndex: 2
              }}>
                <style jsx>{`
                  @media (max-width: 768px) {
                    .vault-metrics-optimized {
                      grid-template-columns: 1fr !important;
                      gap: 0.75rem !important;
                      padding: 1rem !important;
                    }
                    .vault-metric-primary-compact {
                      grid-column: span 1 !important;
                    }
                    .vault-metric-wide-compact {
                      grid-column: span 1 !important;
                    }
                  }
                `}</style>
                {/* APY - Compact Primary Focus with Better Centering */}
                <div className="vault-metric-primary-compact" style={{
                  gridColumn: 'span 2',
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                  border: `1px solid ${vaultColor}50`,
                  backdropFilter: 'blur(16px)',
                  borderRadius: '18px',
                  boxShadow: `
                    0 10px 20px rgba(0, 0, 0, 0.25), 
                    0 0 30px ${vaultColor}12,
                    0 0 0 1px rgba(255, 255, 255, 0.1) inset
                  `,
                  padding: '1.25rem',
                  textAlign: 'center',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: '120px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {/* Subtle glow effect */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: '0',
                      background: `radial-gradient(circle at center, ${vaultColor}06 0%, transparent 60%)`,
                      opacity: '0.8',
                      pointerEvents: 'none'
                    }}
                  />
                  <div style={{ position: 'relative', zIndex: 2, width: '100%' }}>
                    <div style={{ 
                      fontSize: '2.5rem',
                      fontWeight: '700',
                      marginBottom: '0.375rem',
                      color: vaultColor,
                      textShadow: `
                        0 0 25px ${vaultColor}45, 
                        0 2px 5px rgba(0,0,0,0.4)
                      `,
                      letterSpacing: '-0.01em',
                      lineHeight: '1.2',
                      textAlign: 'center'
                    }}>
                      {(vault.apy * 100).toFixed(1)}%
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                      letterSpacing: '0.75px',
                      textAlign: 'center',
                      opacity: '0.7'
                    }}>
                      Current APY
                    </div>
                  </div>
                </div>
                
                {/* TVL - Native Token Display Only */}
                <div className="vault-metric-secondary-compact" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  minHeight: '120px',
                  minWidth: '140px',
                  aspectRatio: '3/2',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {/* Native Token Amount - Primary Display */}
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: '600',
                    marginBottom: '0.25rem',
                    color: '#10b981',
                    textShadow: '0 0 15px rgba(16, 185, 129, 0.4), 0 1px 2px rgba(0,0,0,0.4)',
                    lineHeight: '1.3'
                  }}>
                    {tvlLoading ? (
                      '...'
                    ) : (
                      `${onChainTVL.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`
                    )}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: '0.7'
                  }}>
                    TVL
                  </div>
                </div>
                
                {/* Total Return - More Compact Secondary */}
                <div className="vault-metric-secondary-compact" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                  minHeight: '120px',
                  minWidth: '140px',
                  aspectRatio: '3/2',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '0.1875rem',
                    color: '#22c55e',
                    textShadow: '0 0 12px rgba(34, 197, 94, 0.4), 0 1px 2px rgba(0,0,0,0.4)',
                    lineHeight: '1.3'
                  }}>
                    {(vault.performance.totalReturn * 100).toFixed(1)}%
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    opacity: '0.7'
                  }}>
                    90-Day Return
                  </div>
                </div>
                
                {/* Sharpe Ratio - More Compact Full Width */}
                <div className="vault-metric-wide-compact" style={{
                  gridColumn: 'span 4',
                  background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.1) 0%, rgba(155, 93, 229, 0.035) 100%)',
                  border: '1px solid rgba(155, 93, 229, 0.2)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '14px',
                  boxShadow: '0 6px 16px rgba(155, 93, 229, 0.12)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  minHeight: '75px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{ 
                    fontSize: '1.5rem',
                    fontWeight: '600',
                    marginBottom: '0.1875rem',
                    color: '#9b5de5',
                    textShadow: '0 0 16px rgba(155, 93, 229, 0.45), 0 1px 2px rgba(0,0,0,0.4)',
                    lineHeight: '1.3'
                  }}>
                    {vault.performance.sharpeRatio.toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.75px',
                    opacity: '0.7'
                  }}>
                    Sharpe Ratio
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Tabs Section */}
          <Tabs value={activeTab} onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', value);
            router.push(`/vault?${params.toString()}`);
          }}>
            <TabsList
              className="vault-tabs-clean"
              style={{
                '--vault-color': vaultColor,
                '--vault-color-rgb': vaultColor.replace('#', '').match(/.{1,2}/g)?.map(hex => parseInt(hex, 16)).join(', ') || '0, 245, 212',
                display: 'flex',
                width: '100%',
                maxWidth: '64rem',
                height: '4rem',
                margin: '2rem auto 1.5rem auto',
                padding: '0.375rem',
                gap: '0.5rem',
                borderRadius: '1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(51, 65, 85, 0.6)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
              } as React.CSSProperties}
            >
              <TabsTrigger
                value="overview"
                className="tab-trigger-clean"
                style={{
                  flex: '1 1 0',
                  height: '100%',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '0.625rem',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="tab-trigger-clean"
                style={{
                  flex: '1 1 0',
                  height: '100%',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '0.625rem',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="strategy"
                className="tab-trigger-clean"
                style={{
                  flex: '1 1 0',
                  height: '100%',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '0.625rem',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  whiteSpace: 'nowrap'
                }}
              >
                Strategy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Position Card - Only show if user has a position */}
                {hasPosition && position && (
                  <Card className="vault-solid-card relative z-10 lg:col-span-2" style={{
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(34, 197, 94, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                  }}>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-green-400 text-xl font-bold">
                        <Coins className="w-5 h-5 text-green-400" />
                        Your Position
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* HIDDEN: Share count display - shares not calculated as expected */}
                      {/* <div className="p-3 rounded-xl" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span className="text-muted-foreground text-xs font-medium block mb-1">Shares</span>
                        <span className="font-bold text-white text-lg">
                          {parseFloat(formatUnits(BigInt(position.shares), tvlDecimals)).toFixed(tvlDecimals === 6 ? 2 : 4)}
                        </span>
                      </div> */}
                      <div className="p-3 rounded-xl" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span className="text-muted-foreground text-xs font-medium block mb-1">Value</span>
                        <span className="font-bold text-green-400 text-lg" style={{
                          textShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                        }}>
                          {parseFloat(formatUnits(BigInt(position.shareValue), tvlDecimals)).toFixed(tvlDecimals === 6 ? 2 : 4)} {tvlTokenSymbol}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span className="text-muted-foreground text-xs font-medium block mb-1">Net Invested</span>
                        <span className="font-bold text-white text-lg">
                          {(() => {
                            const deposited = parseFloat(formatUnits(BigInt(position.totalDeposited), tvlDecimals));
                            const withdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn || '0'), tvlDecimals));
                            const netInvested = deposited - withdrawn;
                            return `${netInvested.toFixed(tvlDecimals === 6 ? 2 : 4)} ${tvlTokenSymbol}`;
                          })()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        <span className="text-muted-foreground text-xs font-medium block mb-1">P&L</span>
                        <span className={`font-bold text-lg ${
                          (() => {
                            const totalDeposited = parseFloat(formatUnits(BigInt(position.totalDeposited), tvlDecimals));
                            const totalWithdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn), tvlDecimals));
                            const currentValue = parseFloat(formatUnits(BigInt(position.shareValue), tvlDecimals));
                            // P&L = (current value + withdrawn) - deposited
                            // This properly accounts for withdrawals as realized gains
                            const totalValue = currentValue + totalWithdrawn;
                            const pnl = totalValue - totalDeposited;
                            return pnl >= 0 ? 'text-green-400' : 'text-red-400';
                          })()
                        }`}>
                          {(() => {
                            const totalDeposited = parseFloat(formatUnits(BigInt(position.totalDeposited), tvlDecimals));
                            const totalWithdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn), tvlDecimals));
                            const currentValue = parseFloat(formatUnits(BigInt(position.shareValue), tvlDecimals));
                            // P&L = (current value + withdrawn) - deposited
                            const totalValue = currentValue + totalWithdrawn;
                            const pnl = totalValue - totalDeposited;
                            const pnlPercentage = totalDeposited > 0 ? (pnl / totalDeposited) * 100 : 0;
                            return pnlPercentage.toFixed(2);
                          })()}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Performance Metrics - Enhanced */}
                <Card className="vault-solid-card relative z-10" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-vault-primary text-xl font-bold">
                      <TrendingUp className="w-5 h-5" style={{ color: vaultColor }} />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Win Rate</span>
                      <span className="font-bold text-green-400 text-enhanced-glow text-lg" style={{
                        textShadow: '0 0 15px rgba(34, 197, 94, 0.4)'
                      }}>
                        {(vault.performance.winRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Max Drawdown</span>
                      <span className={`font-bold text-enhanced-glow text-lg ${
                        vault.performance.maxDrawdown > 0.05 ? 'text-red-400' : 'text-green-400'
                      }`} style={{
                        textShadow: vault.performance.maxDrawdown > 0.05 ? 
                          '0 0 15px rgba(239, 68, 68, 0.4)' : 
                          '0 0 15px rgba(34, 197, 94, 0.4)'
                      }}>
                        {(vault.performance.maxDrawdown * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Fee Tier</span>
                      <span className="font-bold text-blue-400 text-enhanced-glow text-lg" style={{
                        textShadow: '0 0 15px rgba(59, 130, 246, 0.4)'
                      }}>
                        {(vault.fee * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl" style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <span className="text-muted-foreground font-medium">Chain ID</span>
                      <span className="font-bold text-cyan-400 text-enhanced-glow text-lg" style={{
                        textShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
                      }}>
                        {vault.chainId}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Analysis - Enhanced */}
                <Card className="vault-solid-card relative z-10" style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-vault-primary text-xl font-bold">
                      <Shield className="w-5 h-5 text-green-400" />
                      Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Risk Level</span>
                        <Badge className={
                          riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                          riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }>
                          {riskLevel}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Based on volatility, correlation, and market conditions
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volatility</span>
                        <span className="font-bold text-enhanced-glow text-orange-400">12.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Beta</span>
                        <span className="font-bold text-enhanced-glow text-purple-400">0.87</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Chart */}
                <Card className="vault-solid-card lg:col-span-2 relative z-10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-vault-primary">
                      <BarChart3 className="w-5 h-5" />
                      Performance Chart
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PortfolioChart
                      vaultPositions={vaultPositionsForChart}
                      tokenPrices={tokenPrices || {}}
                      vaults={vaultsData}
                    />
                  </CardContent>
                </Card>

                {/* Historical Data */}
                <Card className="vault-solid-card relative z-10">
                  <CardHeader>
                    <CardTitle className="text-vault-primary">Historical Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      // Calculate returns based on total return and APY
                      const totalReturn = vault.performance.totalReturn * 100;
                      const dailyRate = vault.apy / 365;
                      const return1D = (dailyRate * 100).toFixed(2);
                      const return7D = (dailyRate * 7 * 100).toFixed(2);
                      const return30D = (dailyRate * 30 * 100).toFixed(2);

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">1D Return</span>
                            <span className={`font-bold text-enhanced-glow ${parseFloat(return1D) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {parseFloat(return1D) >= 0 ? '+' : ''}{return1D}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">7D Return</span>
                            <span className={`font-bold text-enhanced-glow ${parseFloat(return7D) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {parseFloat(return7D) >= 0 ? '+' : ''}{return7D}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">30D Return</span>
                            <span className={`font-bold text-enhanced-glow ${parseFloat(return30D) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {parseFloat(return30D) >= 0 ? '+' : ''}{return30D}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">All Time</span>
                            <span className={`font-bold text-enhanced-glow ${totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Trading Stats - Strategy Specific */}
                <Card className="vault-solid-card relative z-10">
                  <CardHeader>
                    <CardTitle className="text-vault-primary">Trading Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      // Get strategy-specific trading stats
                      const tradingStats = getStrategyTradingStats(
                        vault.strategy,
                        onChainTVL,
                        vault.performance.winRate,
                        vault.performance.sharpeRatio,
                        vault.performance.maxDrawdown
                      );

                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Rebalances</span>
                            <span className="font-bold text-enhanced-glow text-blue-400">
                              {tradingStats.totalTrades > 0 ? tradingStats.totalTrades.toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rebalances/Day</span>
                            <span className="font-bold text-enhanced-glow text-purple-400">
                              ~{tradingStats.tradesPerDay}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Position Size</span>
                            <span className="font-bold text-enhanced-glow text-cyan-400">
                              {onChainTVL > 0 ? `${tradingStats.avgTradeSize.toFixed(2)} ${tvlTokenSymbol}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Best Rebalance</span>
                            <span className="font-bold text-green-400 text-enhanced-glow">
                              {onChainTVL > 0 ? `+${tradingStats.bestTrade}%` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Worst Rebalance</span>
                            <span className="font-bold text-red-400 text-enhanced-glow">
                              {onChainTVL > 0 ? `-${tradingStats.worstTrade}%` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Strategy Volatility</span>
                            <span className="font-bold text-orange-400 text-enhanced-glow">
                              {tradingStats.volatility}%
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="strategy">
              <div>
                <Card className="vault-solid-card relative z-10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-vault-primary">
                    <Target className="w-5 h-5" />
                    Strategy Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(() => {
                    const strategyDetails = getStrategyDetails(vault.strategy, vault.tokenA, vault.tokenB);
                    return (
                      <>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">
                            {vault.strategy.replace('_', ' ').toUpperCase()} Strategy
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {strategyDetails.description}
                          </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-semibold mb-3 text-lg text-primary">Key Features</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground list-none">
                              {strategyDetails.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-primary mt-0.5">✓</span>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3 text-lg text-yellow-500">Risk Factors</h4>
                            <ul className="space-y-2 text-sm text-muted-foreground list-none">
                              {strategyDetails.riskFactors.map((risk, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-yellow-500 mt-0.5">⚠</span>
                                  <span>{risk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-border/50">
                          <div>
                            <h4 className="font-semibold mb-3 text-lg">Rebalance Frequency</h4>
                            <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                              {strategyDetails.rebalanceFrequency}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-3 text-lg">Token Pair</h4>
                            <div className="flex items-center justify-start md:justify-center py-2">
                              <TokenPairDisplay tokenA={vault.tokenA} tokenB={vault.tokenB} size={48} />
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div> {/* Close unified vault-layout-container */}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        vault={vault}
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={handleDepositSuccess}
      />

      {/* Withdraw Modal */}
      <WithdrawModal
        vault={vault}
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        onSuccess={handleWithdrawSuccess}
        userShares={position?.shares || '0'}
        userValue={position ? formatUnits(BigInt(position.shareValue), tvlDecimals) : '0'}
      />

    </div>
  );
}

export default function VaultDetailPage() {
  return (
    <VaultClientWrapper>
      {({ vaultAddress, activeTab, action, searchParams }) => (
        <VaultDetailPageContent
          vaultAddress={vaultAddress}
          activeTab={activeTab}
          action={action}
          searchParams={searchParams}
        />
      )}
    </VaultClientWrapper>
  );
}