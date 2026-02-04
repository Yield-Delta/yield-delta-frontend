'use client'

import VaultCard from '@/components/VaultCard';
import { useVaults } from '@/hooks/useVaults';
import { Loader2 } from 'lucide-react';

const getVaultColor = (strategy: string) => {
    const colors = {
        concentrated_liquidity: '#00f5d4',
        stable_max: '#10b981',
        delta_neutral: '#8b5cf6',
        yield_farming: '#9b5de5',
        arbitrage: '#ff206e',
        hedge: '#ffa500',
        sei_hypergrowth: '#f59e0b',
        blue_chip: '#3b82f6',
    };
    return colors[strategy as keyof typeof colors] || '#00f5d4';
};

const getVaultDescription = (strategy: string, apy: number) => {
    const descriptions = {
        concentrated_liquidity: `Uniswap V3 style concentrated liquidity with ${(apy * 100).toFixed(1)}% APY from trading fees.`,
        stable_max: `Ultra-stable yield on USDC with ${(apy * 100).toFixed(1)}% APY and 103.36 Sharpe Ratio.`,
        delta_neutral: `Market-neutral strategy earning ${(apy * 100).toFixed(1)}% APY with zero directional risk.`,
        yield_farming: `Optimized farming rewards earning ${(apy * 100).toFixed(1)}% APY across protocols.`,
        arbitrage: `Active trading and market-making earning ${(apy * 100).toFixed(1)}% APY across multiple DEXes.`,
    };
    return descriptions[strategy as keyof typeof descriptions] || 'AI-optimized yield strategy.';
};

const getRiskLevel = (strategy: string): 'Low' | 'Medium' | 'High' => {
    const riskMap = {
        stable_max: 'Low' as const,
        delta_neutral: 'Low' as const,
        concentrated_liquidity: 'Medium' as const,
        yield_farming: 'Medium' as const,
        arbitrage: 'Medium' as const,
    };
    return riskMap[strategy as keyof typeof riskMap] || 'Medium' as const;
};

export default function VaultShowcase() {
    const { data: vaults, isLoading } = useVaults();

    // Only show 3 featured vaults on landing page (single-chain SEI vaults)
    // Excluding multi-chain vaults (Blue Chip, SEI Hypergrowth)
    const featuredStrategies = ['stable_max', 'yield_farming', 'arbitrage'];
    const activeVaults = vaults?.filter(v =>
        v.active && featuredStrategies.includes(v.strategy)
    ) || [];

    // Transform API vault data to match VaultCard props
    const vaultData = activeVaults.map(vault => ({
        address: vault.address,
        name: vault.name,
        apy: vault.apy * 100, // Convert decimal to percentage
        tvl: 0, // TVL fetched on-chain, placeholder for display
        risk: getRiskLevel(vault.strategy),
        color: getVaultColor(vault.strategy),
        description: getVaultDescription(vault.strategy, vault.apy),
    }));

    return (
        <section className="py-16 relative" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div className="container mx-auto px-4">
                <div className="text-center mb-20" style={{ marginBottom: '5rem' }}>
                    <h2
                        className="text-5xl lg:text-6xl font-bold mb-6 holo-text"
                        style={{
                            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                            fontWeight: 'bold',
                            marginBottom: '2rem',
                            lineHeight: '1.1'
                        }}
                    >
                        Intelligent Vault Ecosystem
                    </h2>
                    <p
                        className="text-2xl text-muted-foreground max-w-4xl mx-auto"
                        style={{
                            fontSize: '1.5rem',
                            marginTop: '2rem',
                            maxWidth: '64rem',
                            margin: '2rem auto 0'
                        }}
                    >
                        Choose from our curated selection of AI-optimized vaults,
                        each designed for different risk profiles and market conditions.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div
                        className="vault-container-override"
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            alignItems: 'stretch',
                            gap: '2.5rem',
                            maxWidth: '1200px',
                            margin: '0 auto',
                            padding: '0 1rem',
                            rowGap: '2.5rem',
                            columnGap: '2.5rem'
                        }}
                    >
                        <style jsx>{`
                            .vault-container-override {
                                display: flex !important;
                                flex-direction: row !important;
                                flex-wrap: wrap !important;
                                justify-content: center !important;
                                align-items: stretch !important;
                                gap: 2.5rem !important;
                                row-gap: 2.5rem !important;
                                column-gap: 2.5rem !important;
                                max-width: 1200px !important;
                                margin: 0 auto !important;
                                padding: 0 1rem !important;
                            }
                            .vault-card-wrapper {
                                flex: 0 0 auto !important;
                                width: 320px !important;
                                max-width: 320px !important;
                                min-width: 280px !important;
                                margin: 1rem !important;
                                padding: 0 !important;
                            }
                        `}</style>
                        {vaultData.map((vault, index) => (
                            <div
                                key={vault.name}
                                className="vault-card-wrapper"
                                style={{
                                    flex: '0 0 auto',
                                    width: '320px',
                                    maxWidth: '320px',
                                    minWidth: '280px',
                                    margin: '1rem',
                                    padding: '0'
                                }}
                            >
                                <VaultCard vault={vault} index={index} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
