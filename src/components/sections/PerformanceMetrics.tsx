'use client'

import PerformanceCard from '@/components/PerformanceCard';
import { useVaultStats } from '@/hooks/useVaultStats';
import styles from './PerformanceMetrics.module.css';

export default function PerformanceMetrics() {
    const { totalTVL, averageAPY, activeVaultsCount, isLoading } = useVaultStats();

    // Format TVL for display
    const formatTVL = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    return (
        <section className="py-12 md:py-16 lg:py-20 relative" style={{ paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(3rem, 6vw, 5rem)' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-12 md:mb-16 lg:mb-20" style={{ marginBottom: 'clamp(3rem, 8vw, 6rem)' }}>
                    <h2
                        className="text-5xl lg:text-6xl font-bold mb-6 holo-text"
                        style={{
                            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            lineHeight: '1.1'
                        }}
                    >
                        Projected Performance
                    </h2>
                    <p
                        style={{
                            fontSize: '2.25rem',
                            fontWeight: '500',
                            lineHeight: '1.4',
                            color: 'hsl(var(--muted-foreground))',
                            maxWidth: '64rem',
                            margin: '0 auto',
                            textAlign: 'center',
                            letterSpacing: '-0.01em',
                            opacity: '0.9'
                        }}
                    >
                        Track your vault performance with AI-powered analytics and projected metrics.
                    </p>
                </div>
                
                <div className={styles.metricsGrid}>
                    <PerformanceCard
                        metric={isLoading ? 'Loading...' : `${(averageAPY * 100).toFixed(1)}%`}
                        description="Average APY"
                        comparison="Real-time vault data"
                        color="#00f5d4"
                        positive={true}
                    />
                    <PerformanceCard
                        metric={isLoading ? 'Loading...' : formatTVL(totalTVL)}
                        description="Total Value Locked"
                        comparison="Across all vaults"
                        color="#9b5de5"
                        positive={true}
                    />
                    <PerformanceCard
                        metric="0.018%"
                        description="Impermanent Loss"
                        comparison="-52% vs traditional AMMs"
                        color="#ff206e"
                        positive={true}
                    />
                    <PerformanceCard
                        metric="99.8%"
                        description="Uptime"
                        comparison="AI optimization active"
                        color="#fee75c"
                        positive={true}
                    />
                    <PerformanceCard
                        metric="3.2s"
                        description="Avg Response Time"
                        comparison="Lightning fast execution"
                        color="#00bcd4"
                        positive={true}
                    />
                    <PerformanceCard
                        metric={isLoading ? 'Loading...' : activeVaultsCount.toString()}
                        description="Active Vaults"
                        comparison="Live on SEI testnet"
                        color="#ff9800"
                        positive={true}
                    />
                    <PerformanceCard
                        metric="Coming Soon"
                        description="Active Users"
                        comparison="Mainnet launch pending"
                        color="#00f5d4"
                        positive={true}
                    />
                    <PerformanceCard
                        metric="Coming Soon"
                        description="Daily Volume"
                        comparison="Testnet data only"
                        color="#9b5de5"
                        positive={true}
                    />
                </div>
            </div>
        </section>
    );
}
