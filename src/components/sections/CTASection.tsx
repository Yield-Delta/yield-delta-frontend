'use client'

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import styles from './CTASection.module.css';
import { useEffect, useState } from 'react';
import FinancialFlowVisualization from './FinancialFlowVisualization';
import { useVaultStats } from '@/hooks/useVaultStats';

export default function CTASection() {
    // Get real vault statistics
    const { totalTVL, averageAPY, activeVaultsCount, isLoading } = useVaultStats();
    const [mounted, setMounted] = useState(false);

    // Format numbers for display
    const formatTVL = (amount: number) => {
        if (amount >= 1000000) return (amount / 1000000).toFixed(1);
        if (amount >= 1000) return (amount / 1000).toFixed(1);
        return amount.toFixed(0);
    };

    const formatAPY = (apy: number) => {
        return (apy * 100).toFixed(1);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <section className="py-8 sm:py-12 lg:py-16 relative overflow-hidden mobile-safe-padding">
            {/* Enhanced Animated Background */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(90deg, hsl(var(--primary) / 0.12), hsl(var(--secondary) / 0.12), hsl(var(--accent) / 0.12))',
                }}
            />

            {/* Animated Background Waves */}
            <div className={`absolute inset-0 ${styles.waveBackground}`}>
                <div className={styles.wave} style={{ animationDelay: '0s' }}></div>
                <div className={styles.wave} style={{ animationDelay: '1s' }}></div>
                <div className={styles.wave} style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center max-w-7xl mx-auto">
                    <div className="text-center lg:text-left order-2 lg:order-1">
                        {/* Trust Badge */}
                        <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm">
                            <div className={styles.pulsingDot}></div>
                            <span className="text-xs sm:text-sm font-semibold text-primary">
                                Live on SEI Network
                            </span>
                        </div>

                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 lg:mb-8 holo-text mobile-responsive-heading"
                        >
                            <span className={styles.gradientText}>Automated Vaults</span>
                            <br />
                            That Work While You Sleep
                        </h2>

                        <p
                            className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 mobile-responsive-subheading max-w-full lg:max-w-[90%] mx-auto lg:mx-0"
                        >
                            AI-powered liquidity optimization delivering consistent yields on SEI blockchain.
                            <span className="text-primary font-semibold"> No manual management required.</span>
                        </p>

                        {/* Stats Grid - Trust Indicators */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0">
                            {/* APY Stat */}
                            <div className={`${styles.statCard} group`}>
                                <div className={`${styles.statValue} ${styles.numberCounter}`}>
                                    {mounted ? (isLoading ? '...' : formatAPY(averageAPY)) : '0.0'}%
                                </div>
                                <div className={styles.statLabel}>
                                    Avg APY
                                </div>
                                <div className={styles.statIndicator}>
                                    <svg className={styles.trendingUp} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M2 14L8 8L11 11L14 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M10 2H14V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    </svg>
                                </div>
                            </div>

                            {/* TVL Stat */}
                            <div className={`${styles.statCard} group`}>
                                <div className={`${styles.statValue} ${styles.numberCounter}`}>
                                    ${mounted ? (isLoading ? '...' : formatTVL(totalTVL)) : '0'}K
                                </div>
                                <div className={styles.statLabel}>
                                    Total TVL
                                </div>
                                <div className={`${styles.statIndicator} ${styles.pulsingIndicator}`}>
                                    <div className={styles.liveDot}></div>
                                </div>
                            </div>

                            {/* Vaults Stat */}
                            <div className={`${styles.statCard} group`}>
                                <div className={`${styles.statValue} ${styles.numberCounter}`}>
                                    {mounted ? (isLoading ? '...' : activeVaultsCount) : '0'}
                                </div>
                                <div className={styles.statLabel}>
                                    Active Vaults
                                </div>
                                <div className={styles.statIndicator}>
                                    <svg className={styles.usersIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z" fill="currentColor"/>
                                        <path d="M3 14C3 11.7909 4.79086 10 7 10H9C11.2091 10 13 11.7909 13 14H3Z" fill="currentColor"/>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Enhanced CTA Buttons with 3 options */}
                        <div className={`${styles.buttonContainer}`}>
                            <Link href="/vaults" className="w-auto">
                                <Button
                                    className="mobile-responsive-button font-bold w-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-4 lg:py-6 group relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(135deg, hsl(180 100% 48%), hsl(262 80% 60%))',
                                        color: 'hsl(216 100% 4%)',
                                        minHeight: '52px',
                                        minWidth: '160px',
                                        maxWidth: '220px',
                                        boxShadow: '0 0 20px hsl(180 100% 48% / 0.4), 0 0 40px hsl(180 100% 48% / 0.15)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        transition: 'all 300ms ease-in-out',
                                        fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                                        flex: '0 0 auto'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 0 30px hsl(180 100% 48% / 0.5), 0 0 60px hsl(180 100% 48% / 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 0 20px hsl(180 100% 48% / 0.4), 0 0 40px hsl(180 100% 48% / 0.15)';
                                    }}
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        Start Earning
                                        <svg className={styles.arrowIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </span>
                                    <div className={styles.buttonShimmer}></div>
                                </Button>
                            </Link>

                            <Link href="/docs" className="w-auto">
                                <Button
                                    variant="outline"
                                    className="mobile-responsive-button font-bold w-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-4 lg:py-6"
                                    style={{
                                        borderColor: 'hsl(180 100% 48%)',
                                        color: 'hsl(180 100% 48%)',
                                        minHeight: '52px',
                                        minWidth: '160px',
                                        maxWidth: '220px',
                                        background: 'transparent',
                                        borderRadius: '12px',
                                        transition: 'all 300ms ease-in-out',
                                        borderWidth: '2px',
                                        fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                                        flex: '0 0 auto'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'hsl(180 100% 48% / 0.15)';
                                        e.currentTarget.style.borderColor = 'hsl(180 100% 48%)';
                                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 0 20px hsl(180 100% 48% / 0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.borderColor = 'hsl(180 100% 48%)';
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    View Documentation
                                </Button>
                            </Link>

                            <Link href="https://discord.gg/TWNybCBr" target="_blank" rel="noopener noreferrer" className="w-auto">
                                <Button
                                    variant="ghost"
                                    className="mobile-responsive-button font-bold w-auto px-4 sm:px-6 md:px-8 lg:px-12 py-4 md:py-4 lg:py-6"
                                    style={{
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))',
                                        minHeight: '52px',
                                        minWidth: '160px',
                                        maxWidth: '220px',
                                        background: 'hsl(var(--background) / 0.3)',
                                        borderRadius: '12px',
                                        transition: 'all 300ms ease-in-out',
                                        borderWidth: '1px',
                                        fontSize: 'clamp(0.875rem, 2.5vw, 1.125rem)',
                                        flex: '0 0 auto',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'hsl(var(--background) / 0.5)';
                                        e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                                        e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'hsl(var(--background) / 0.3)';
                                        e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                        e.currentTarget.style.borderColor = 'hsl(var(--border))';
                                    }}
                                >
                                    Join Community
                                </Button>
                            </Link>
                        </div>

                        {/* Trust Indicators - Partner Logos */}
                        <div className="mt-8 sm:mt-10 lg:mt-12">
                            <p className="text-xs sm:text-sm text-muted-foreground/60 mb-3 sm:mb-4 uppercase tracking-wider">
                                Powered By
                            </p>
                            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 sm:gap-6 md:gap-8 opacity-60 hover:opacity-100 transition-opacity duration-300">
                                <div className={`${styles.partnerBadge} text-sm sm:text-base font-semibold`}>
                                    SEI Network
                                </div>
                                <div className={`${styles.partnerBadge} text-sm sm:text-base font-semibold`}>
                                    Pyth Network
                                </div>
                                <div className={`${styles.partnerBadge} text-sm sm:text-base font-semibold`}>
                                    Yei Finance
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative order-1 lg:order-2 flex justify-center items-center">
                        <div className={`${styles.ctaVisualContainer} relative w-full max-w-md lg:max-w-lg xl:max-w-xl`}>
                            {/* Main Container with Enhanced Glass Morphism */}
                            <div
                                className="aspect-square w-full shadow-2xl backdrop-blur-md flex items-center justify-center relative overflow-hidden cursor-pointer transition-all duration-500 ease-out"
                                style={{
                                    borderRadius: '2.5rem',
                                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.18), hsl(var(--secondary) / 0.15), hsl(var(--accent) / 0.20))',
                                    boxShadow: '0 25px 50px hsl(var(--primary) / 0.2), 0 0 80px hsl(var(--primary) / 0.15)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05) rotateY(5deg)';
                                    e.currentTarget.style.boxShadow = '0 35px 70px hsl(var(--primary) / 0.3), 0 0 100px hsl(var(--primary) / 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1) rotateY(0deg)';
                                    e.currentTarget.style.boxShadow = '0 25px 50px hsl(var(--primary) / 0.2), 0 0 80px hsl(var(--primary) / 0.15)';
                                }}
                            >
                                {/* Animated Background Orbs */}
                                <div className="absolute inset-0">
                                    {[...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`absolute rounded-full opacity-30 ${styles.float}`}
                                            style={{
                                                background: i % 3 === 0
                                                    ? 'radial-gradient(circle, hsl(var(--primary) / 0.7), transparent 70%)'
                                                    : i % 3 === 1
                                                    ? 'radial-gradient(circle, hsl(var(--secondary) / 0.6), transparent 70%)'
                                                    : 'radial-gradient(circle, hsl(var(--accent) / 0.5), transparent 70%)',
                                                width: `${60 + i * 25}px`,
                                                height: `${60 + i * 25}px`,
                                                left: `${10 + (i * 10)}%`,
                                                top: `${5 + (i * 12)}%`,
                                                filter: 'blur(2px)',
                                                animationDuration: `${2.5 + i * 0.5}s`,
                                                animationDelay: `${i * 0.15}s`
                                            } as React.CSSProperties}
                                        />
                                    ))}
                                </div>

                                {/* Central Content - Financial Flow Visualization */}
                                <div className="text-center p-6 sm:p-8 relative z-10">
                                    {/* Financial Flow Visualization Container */}
                                    <div className="relative mb-6 sm:mb-8">
                                        <div className={styles.flowVisualizationContainer}>
                                            <FinancialFlowVisualization />
                                        </div>
                                    </div>

                                    {/* Enhanced Text with Gradient Animation */}
                                    <div
                                        className={`font-bold mb-3 leading-tight ${styles.gradientShift}`}
                                        style={{
                                            fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                                            background: 'linear-gradient(45deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)), hsl(var(--primary)))',
                                            backgroundSize: '300% 300%',
                                            WebkitBackgroundClip: 'text',
                                            backgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            textShadow: 'none'
                                        } as React.CSSProperties}
                                    >
                                        Secure Vaults
                                    </div>
                                    <div
                                        className={`font-medium ${styles.textGlow} mb-4`}
                                        style={{
                                            fontSize: 'clamp(1rem, 3vw, 1.5rem)',
                                            color: 'hsl(var(--primary-glow))',
                                            textShadow: '0 0 8px hsl(var(--primary-glow) / 0.6)'
                                        }}
                                    >
                                        Automated Returns
                                    </div>

                                    {/* Live Performance Indicator */}
                                    <div className={styles.livePerformance}>
                                        <div className={styles.performanceDot}></div>
                                        <span className="text-xs sm:text-sm">
                                            Active Optimization
                                        </span>
                                    </div>
                                </div>

                                {/* Enhanced Floating Particles */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`absolute rounded-full ${styles.particleFloat}`}
                                            style={{
                                                width: `${3 + (i % 3)}px`,
                                                height: `${3 + (i % 3)}px`,
                                                background: i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                                                left: `${15 + i * 7}%`,
                                                top: `${20 + (i % 4) * 18}%`,
                                                animationDuration: `${3.5 + i * 0.4}s`,
                                                animationDelay: `${i * 0.25}s`,
                                                boxShadow: `0 0 8px ${i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}`
                                            } as React.CSSProperties}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Enhanced Overlay Effects */}
                            <div
                                className={`absolute inset-0 pointer-events-none ${styles.shimmer}`}
                                style={{
                                    borderRadius: '2.5rem',
                                    background: 'linear-gradient(135deg, transparent 0%, hsl(var(--primary) / 0.15) 50%, transparent 100%)'
                                }}
                            />

                            {/* Outer Glow Ring - Enhanced */}
                            <div
                                className={`absolute inset-[-6px] pointer-events-none opacity-70 ${styles.gradientShift}`}
                                style={{
                                    borderRadius: '2.75rem',
                                    background: 'linear-gradient(45deg, hsl(var(--primary) / 0.4), hsl(var(--secondary) / 0.3), hsl(var(--accent) / 0.35), hsl(var(--primary) / 0.4))',
                                    backgroundSize: '300% 300%',
                                    filter: 'blur(12px)',
                                    zIndex: -1
                                } as React.CSSProperties}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
