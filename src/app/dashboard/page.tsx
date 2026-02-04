"use client"

import React, { useMemo, useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import DemoBanner from '@/components/DemoBanner';
import PortfolioChart from '@/components/PortfolioChart';
import { TrendingUp, PieChart, DollarSign, Activity, Plus, ArrowRight, Wallet, BarChart3, Settings, Bell, Loader2, Info } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';
import { useVaults } from '@/hooks/useVaults';
import { useMultipleVaultPositions } from '@/hooks/useMultipleVaultPositions';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { getTokenInfo } from '@/utils/tokenUtils';
import { useTokenPrices, convertToUSD } from '@/hooks/useTokenPrices';
import { calculateSimulatedYield } from '@/utils/simulatedYield';

interface VaultWithPosition {
  address: string;
  name: string;
  strategy: string;
  shares: string;
  shareValue: string;
  totalDeposited: string;
  depositTime: string;
  apy: number;
  pnl: number;
  pnlPercent: number;
}

const DashboardPage = () => {
  const [mounted, setMounted] = useState(false);
  const { address: userAddress } = useAccount();
  const { data: vaults, isLoading: vaultsLoading } = useVaults();
  const { data: tokenPrices, isLoading: pricesLoading } = useTokenPrices();

  // Handle hydration - only render dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get vault addresses for the multi-position hook
  const vaultAddresses = useMemo(() => {
    return vaults?.map(v => v.address) || [];
  }, [vaults]);

  // Fetch all positions in a single hook call (proper React hook usage)
  const { positions: rawPositions, isLoading: positionsLoading } = useMultipleVaultPositions(vaultAddresses);

  // Combine vault data with positions
  const vaultPositions = useMemo(() => {
    if (!vaults || !userAddress || !mounted) return [];

    return vaults
      .map(vault => {
        const positionData = rawPositions.find(p => p.address === vault.address);

        if (!positionData?.hasPosition || !positionData.position) return null;

        const position = positionData.position;

        // Get token info to determine correct decimals
        const tokenInfo = getTokenInfo(vault.tokenA);
        const decimals = tokenInfo?.decimals || 18;

        // Format values with correct decimals
        const shareValue = parseFloat(formatUnits(BigInt(position.shareValue), decimals));
        const totalDeposited = parseFloat(formatUnits(BigInt(position.totalDeposited), decimals));
        const totalWithdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn), decimals));

        // Calculate P&L correctly: (currentValue + withdrawn) - deposited
        const totalValue = shareValue + totalWithdrawn;
        const pnl = totalValue - totalDeposited;
        const pnlPercent = totalDeposited > 0 ? (pnl / totalDeposited) * 100 : 0;

        return {
          address: vault.address,
          name: vault.name,
          strategy: vault.strategy,
          shares: position.shares,
          shareValue: position.shareValue,
          totalDeposited: position.totalDeposited,
          depositTime: position.depositTime,
          apy: vault.apy * 100,
          pnl,
          pnlPercent,
        } as VaultWithPosition;
      })
      .filter((pos): pos is VaultWithPosition => pos !== null);
  }, [vaults, userAddress, rawPositions, mounted]);

  // Calculate portfolio overview from real positions in USD with simulated yield
  const portfolioOverview = useMemo(() => {
    if (vaultPositions.length === 0 || !tokenPrices) {
      return {
        totalValue: 0,
        totalPnL: 0,
        pnlPercent: 0,
        dailyYield: 0,
        activePositions: 0,
        totalYieldEarned: 0,
        totalSimulatedYield: 0,
        avgAPY: 0,
      };
    }

    // Calculate total value, P&L, and simulated yield in USD
    let totalValueUSD = 0;
    let totalDepositedUSD = 0;
    let totalPnLUSD = 0;
    let totalSimulatedYieldUSD = 0;
    let totalDailyYieldUSD = 0;

    vaultPositions.forEach(pos => {
      if (!vaults) return;
      const vault = vaults.find(v => v.address === pos.address);
      if (!vault) return;

      const tokenInfo = getTokenInfo(vault.tokenA);
      const decimals = tokenInfo?.decimals || 18;
      const tokenSymbol = tokenInfo?.symbol || 'SEI';

      // Get values in native token
      const shareValue = parseFloat(formatUnits(BigInt(pos.shareValue), decimals));
      const totalDeposited = parseFloat(formatUnits(BigInt(pos.totalDeposited), decimals));

      // Calculate simulated yield for this position
      const depositTimestamp = parseInt(pos.depositTime) * 1000; // Convert to milliseconds
      const simulatedYield = calculateSimulatedYield(
        totalDeposited,
        depositTimestamp,
        vault.apy, // APY as decimal (e.g., 0.15 for 15%)
      );

      // Convert to USD
      const tokenPrice = tokenPrices[tokenSymbol as keyof typeof tokenPrices] || 0;
      const shareValueUSD = convertToUSD(shareValue, tokenSymbol, tokenPrices);
      const totalDepositedUSD_pos = convertToUSD(totalDeposited, tokenSymbol, tokenPrices);
      const pnlUSD = convertToUSD(pos.pnl, tokenSymbol, tokenPrices);
      const simulatedYieldUSD = simulatedYield.totalYield * tokenPrice;
      const dailyYieldUSD = simulatedYield.dailyYield * tokenPrice;

      totalValueUSD += shareValueUSD;
      totalDepositedUSD += totalDepositedUSD_pos;
      totalPnLUSD += pnlUSD;
      totalSimulatedYieldUSD += simulatedYieldUSD;
      totalDailyYieldUSD += dailyYieldUSD;
    });

    const pnlPercent = totalDepositedUSD > 0 ? (totalPnLUSD / totalDepositedUSD) * 100 : 0;

    const avgAPY = vaultPositions.reduce((sum, pos) => sum + pos.apy, 0) / vaultPositions.length;

    return {
      totalValue: totalValueUSD,
      totalPnL: totalPnLUSD,
      pnlPercent,
      dailyYield: totalDailyYieldUSD,
      activePositions: vaultPositions.length,
      totalYieldEarned: totalSimulatedYieldUSD,
      totalSimulatedYield: totalSimulatedYieldUSD,
      avgAPY,
    };
  }, [vaultPositions, vaults, tokenPrices]);

  const getStrategyClass = (strategy: string) => {
    switch (strategy) {
      case 'concentrated_liquidity': return 'concentrated';
      case 'yield_farming': return 'farming';
      case 'arbitrage': return 'arbitrage';
      case 'delta_neutral': return 'neutral';
      case 'stable_max': return 'concentrated';
      default: return 'concentrated';
    }
  };

  const formatTokenValue = (amount: number, tokenSymbol: string) => {
    const decimals = tokenSymbol === 'USDC' || tokenSymbol === 'USDT' || tokenSymbol === 'ATOM' ? 2 : 4;
    return `${amount.toFixed(decimals)} ${tokenSymbol}`;
  };

  const isLoading = !mounted || vaultsLoading || positionsLoading || pricesLoading;
  const hasNoPositions = mounted && !vaultsLoading && !positionsLoading && !pricesLoading && userAddress && vaultPositions.length === 0;

  return (
    <div className={styles.dashboardContainer}>
      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* Demo Banner */}
      <DemoBanner />

      {/* Header */}
      <div className={styles.headerSection}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>
              <PieChart className="w-6 h-6" />
            </div>
            <div className={styles.headerText}>
              <h1>Vault Dashboard</h1>
              <p>Manage your DeFi positions on SEI Testnet</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconButton}>
              <Bell className="w-5 h-5" />
            </button>
            <button className={styles.iconButton}>
              <Settings className="w-5 h-5" />
            </button>
            {vaultPositions.length > 0 && (
              <Link
                href="/dashboard/rebalance"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-4 py-2 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Rebalance
              </Link>
            )}
            <Link
              href="/vaults"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Position
            </Link>
          </div>
        </div>
      </div>

      <section className={styles.contentSection}>
        <div className={styles.contentContainer}>
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mr-3" />
              <span className="text-lg text-gray-300">Loading your portfolio...</span>
            </div>
          )}

          {/* No Wallet Connected */}
          {mounted && !userAddress && !vaultsLoading && (
            <div className="text-center py-20">
              <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Please connect your wallet to view your portfolio</p>
            </div>
          )}

          {/* No Positions Empty State */}
          {hasNoPositions && userAddress && (
            <div className="text-center py-20">
              <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Positions</h2>
              <p className="text-gray-400 mb-6">You haven&apos;t deposited to any vaults yet.</p>
              <Link
                href="/vaults"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                <Plus className="w-5 h-5" />
                Explore Vaults
              </Link>
            </div>
          )}

          {/* Portfolio with Positions */}
          {!isLoading && vaultPositions.length > 0 && (
            <>
              {/* Portfolio Overview Stats */}
              <div className={styles.statsGrid}>
                {[
                  {
                    label: 'Total Portfolio Value',
                    value: `$${portfolioOverview.totalValue.toFixed(2)} USD`,
                    change: `${portfolioOverview.pnlPercent >= 0 ? '+' : ''}${portfolioOverview.pnlPercent.toFixed(2)}%`,
                    icon: Wallet,
                    color: 'purple',
                    trend: portfolioOverview.pnlPercent >= 0 ? 'up' : 'down'
                  },
                  {
                    label: 'Total P&L',
                    value: `$${portfolioOverview.totalPnL.toFixed(2)} USD`,
                    change: `${portfolioOverview.pnlPercent >= 0 ? '+' : ''}${portfolioOverview.pnlPercent.toFixed(2)}%`,
                    icon: TrendingUp,
                    color: portfolioOverview.totalPnL >= 0 ? 'green' : 'red',
                    trend: portfolioOverview.totalPnL >= 0 ? 'up' : 'down'
                  },
                  {
                    label: 'Estimated Daily Yield',
                    value: `$${portfolioOverview.dailyYield.toFixed(2)} USD`,
                    change: `${portfolioOverview.avgAPY.toFixed(1)}% APY (Simulated)`,
                    icon: DollarSign,
                    color: 'blue',
                    trend: 'up'
                  },
                  {
                    label: 'Active Positions',
                    value: portfolioOverview.activePositions.toString(),
                    change: `${vaults?.length || 0} vaults available`,
                    icon: Activity,
                    color: 'orange',
                    trend: 'up'
                  },
                  {
                    label: 'Total Yield Earned',
                    value: `$${portfolioOverview.totalYieldEarned.toFixed(2)} USD`,
                    change: 'Simulated (Demo)',
                    icon: TrendingUp,
                    color: 'pink',
                    trend: 'up'
                  },
                  {
                    label: 'Avg APY',
                    value: `${portfolioOverview.avgAPY.toFixed(1)}%`,
                    change: 'Across positions',
                    icon: BarChart3,
                    color: 'cyan',
                    trend: 'up'
                  }
                ].map((stat, index) => (
                  <div key={index} className={`${styles.statCard} ${styles.fadeIn}`}>
                    <div className={styles.statCardHeader}>
                      <div className={`${styles.statIcon} ${styles[stat.color]}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div className={`${styles.changeBadge} ${styles[stat.trend === 'up' ? 'positive' : 'negative']}`}>
                        {stat.change}
                      </div>
                    </div>
                    <div className={styles.statValue}>{stat.value}</div>
                    <div className={styles.statLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Portfolio Performance Chart */}
              <div className="mb-8">
                <PortfolioChart
                  vaultPositions={vaultPositions}
                  tokenPrices={tokenPrices || {}}
                  vaults={vaults}
                />
              </div>

              {/* Main Dashboard Content */}
              <div className={styles.mainCard}>
                <div className={styles.mainCardHeader}>
                  <Activity className={`w-5 h-5 ${styles.mainCardIcon}`} />
                  <h2 className={styles.mainCardTitle}>Your Positions</h2>
                </div>
                <div className={styles.positionsContainer}>
                  {vaultPositions.map((position) => {
                    // Get vault info for correct decimals and token symbol
                    const vault = vaults?.find(v => v.address === position.address);
                    const tokenInfo = vault ? getTokenInfo(vault.tokenA) : null;
                    const decimals = tokenInfo?.decimals || 18;
                    const tokenSymbol = tokenInfo?.symbol || 'SEI';

                    return (
                    <Link href={`/vault?address=${position.address}`} key={position.address} className={styles.positionCard}>
                      <div className={styles.positionHeader}>
                        <div className={styles.positionInfo}>
                          <div className={styles.positionTitle}>{position.name}</div>
                          <div className={`${styles.strategyBadge} ${styles[getStrategyClass(position.strategy)]}`}>
                            {position.strategy.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <ArrowRight className={`w-5 h-5 ${styles.arrowIcon}`} />
                      </div>
                      <div className={styles.metricsGrid}>
                        <div className={styles.metric}>
                          <div className={styles.metricLabel}>Value</div>
                          <div className={`${styles.metricValue} ${styles.white}`}>
                            {formatTokenValue(parseFloat(formatUnits(BigInt(position.shareValue), decimals)), tokenSymbol)}
                          </div>
                        </div>
                        <div className={styles.metric}>
                          <div className={styles.metricLabel}>P&L</div>
                          <div className={`${styles.metricValue} ${position.pnl >= 0 ? styles.positive : styles.negative}`}>
                            {position.pnl >= 0 ? '+' : ''}{formatTokenValue(position.pnl, tokenSymbol)} ({position.pnlPercent.toFixed(2)}%)
                          </div>
                        </div>
                        <div className={styles.metric}>
                          <div className={styles.metricLabel}>APY</div>
                          <div className={`${styles.metricValue} ${styles.blue}`}>{position.apy.toFixed(1)}%</div>
                        </div>
                        {/* HIDDEN: Share count display - shares not calculated as expected */}
                        {/* <div className={styles.metric}>
                          <div className={styles.metricLabel}>Shares</div>
                          <div className={`${styles.metricValue} ${styles.green}`}>
                            {parseFloat(formatUnits(BigInt(position.shares), decimals)).toFixed(decimals === 6 ? 2 : 4)}
                          </div>
                        </div> */}
                      </div>
                    </Link>
                  )})}
                </div>
                <div className={styles.sectionDivider}>
                  <Link href="/vaults" className={styles.addPositionButton}>
                    <Plus className="w-5 h-5" />
                    Add New Position
                  </Link>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.actionsGrid}>
                <Link href="/dashboard/rebalance" className={styles.actionCard}>
                  <BarChart3 className={`w-8 h-8 ${styles.actionIcon} ${styles.yellow}`} />
                  <div className={styles.actionTitle}>Portfolio Rebalancing</div>
                  <div className={styles.actionDescription}>Optimize your yield with AI-powered analysis</div>
                </Link>

                <Link href="/vaults" className={styles.actionCard}>
                  <TrendingUp className={`w-8 h-8 ${styles.actionIcon} ${styles.purple}`} />
                  <div className={styles.actionTitle}>Explore Vaults</div>
                  <div className={styles.actionDescription}>Discover new yield opportunities</div>
                </Link>

                <Link href="/market" className={styles.actionCard}>
                  <Activity className={`w-8 h-8 ${styles.actionIcon} ${styles.green}`} />
                  <div className={styles.actionTitle}>Market Overview</div>
                  <div className={styles.actionDescription}>View live vault statistics</div>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
