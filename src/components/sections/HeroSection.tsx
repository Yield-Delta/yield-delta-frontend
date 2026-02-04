
'use client'

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Hero3DProgressive from '@/components/Hero3DProgressive';
import DebugEnv from '@/components/DebugEnv';
import glassCardStyles from '@/components/GlassCard.module.css';
import heroStyles from '@/components/Hero.module.css';
import gsap from 'gsap';
import { useVaultStats } from '@/hooks/useVaultStats';

export default function HeroSection() {
    const heroTextRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);

    // Get real vault statistics
    const { totalTVL, averageAPY, isLoading } = useVaultStats();

    // Format numbers for display
    const formatTVL = (amount: number) => {
        if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
        return `$${amount.toFixed(0)}`;
    };

    const formatAPY = (apy: number) => {
        return `${(apy * 100).toFixed(1)}%`;
    };

    useEffect(() => {
        if (heroTextRef.current) {
            const textElements = heroTextRef.current.children;
            const elementsToAnimate = Array.from(textElements).slice(1);
            gsap.fromTo(
                elementsToAnimate,
                { opacity: 0, y: 50, filter: 'blur(10px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, stagger: 0.3, ease: 'power3.out', delay: 0.5 }
            );
        }
        if (ctaRef.current) {
            gsap.fromTo(
                ctaRef.current,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.8, delay: 2, ease: 'back.out(1.7)' }
            );
        }
        if (statsRef.current) {
            gsap.fromTo(
                statsRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1, delay: 2.5, ease: 'power2.out' }
            );
        }
    }, []);

    return (
        <section className={`${heroStyles.section} hero-section`}>
            <div className={`absolute inset-0 ${heroStyles.neuralGrid} opacity-30`} />

            <div className="absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className={heroStyles.dataStream}
                        style={{
                            left: `${10 + i * 12}%`,
                            animationDelay: `${i * 0.5}s`,
                            height: '200px',
                        }}
                    />
                ))}
            </div>

            {/* Responsive 2-column grid layout using CSS Module grid */}
            <div className={`relative z-10 ${heroStyles.heroGrid}`}>

                {/* Left Column: Text Content */}
                <div className={heroStyles.heroTextContainer}>
                    <div ref={heroTextRef}>
                        <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 lg:mb-8 leading-tight mobile-responsive-heading">
                            <span
                                className={`${heroStyles.heroTitleAnimated} gradient-text-fallback`}
                                style={{
                                    background: 'linear-gradient(45deg, #00f5d4, #9b5de5, #ff206e, #fbae3c, #00f5d4, #9b5de5)',
                                    backgroundSize: '400% 400%',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    animation: 'gradient-shift 3s ease-in-out infinite',
                                    fontWeight: '800',
                                    display: 'inline-block'
                                }}
                            >
                                Your Liquidity,
                            </span>
                            <br />
                            <span
                                className={`${heroStyles.heroTitleAnimated} gradient-text-fallback`}
                                style={{
                                    background: 'linear-gradient(45deg, #00f5d4, #9b5de5, #ff206e, #fbae3c, #00f5d4, #9b5de5)',
                                    backgroundSize: '400% 400%',
                                    WebkitBackgroundClip: 'text',
                                    backgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    animation: 'gradient-shift 3s ease-in-out infinite',
                                    fontWeight: '800',
                                    display: 'inline-block'
                                }}
                            >
                                Evolved
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl text-primary-glow mb-6 sm:mb-8 lg:mb-8 mobile-responsive-subheading leading-relaxed">
                            Harness the power of AI-driven liquidity optimization on SEI.
                            Maximize yields, minimize risk, and let ElizaOS handle the
                            complexity.
                        </p>

                        <div
                            ref={ctaRef}
                            className={`${heroStyles.heroButtonContainer}`}
                        >
                            <Button
                                className={`${heroStyles.heroButton} ${heroStyles.heroPrimaryButton}`}
                                onClick={() => window.location.href = '/vaults'}
                            >
                                Launch App
                            </Button>
                            <Button
                                variant="outline"
                                className={`${heroStyles.heroButton} ${heroStyles.heroSecondaryButton}`}
                                onClick={() => window.location.href = '/docs'}
                            >
                                View Documentation
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column: 3D Scene + Features (grouped together) */}
                <div className={heroStyles.hero3dFeaturesWrapper}>

                    {/* 3D Visualization Container */}
                    <div className={heroStyles.hero3dContainer}>
                        <div className={`${heroStyles.enhanced3dContainer} ${heroStyles.responsive3dHeight}`}>
                            <Hero3DProgressive />
                        </div>
                    </div>

                    {/* Features section - Positioned under 3D on desktop/tablet, after 3D on mobile */}
                    <div className={heroStyles.heroFeaturesContainer}>
                        <div className={heroStyles.heroFeaturesGrid}>
                            {[
                                { icon: '⚡', text: 'AI optimization' },
                                { icon: '🛡️', text: 'Over 50% less IL' },
                                { icon: '🚀', text: 'SEI integration' },
                            ].map((feature, i) => (
                                <div
                                    key={i}
                                    className={heroStyles.heroFeatureItem}
                                >
                                    <span className="text-lg lg:text-xl flex-shrink-0">{feature.icon}</span>
                                    <span className="text-sm lg:text-base">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats section - Desktop/Tablet only */}
                    <div ref={statsRef} className={heroStyles.heroStatsWrapper}>
                        <div className="hidden md:block">
                            <div className={heroStyles.heroStatsContainer}>
                                {[
                                    { value: isLoading ? 'Loading...' : formatTVL(totalTVL), label: 'Total TVL' },
                                    { value: isLoading ? 'Loading...' : formatAPY(averageAPY), label: 'Avg APY' },
                                    { value: '400ms', label: 'Block Time' },
                                ].map((stat, i) => (
                                    <Card key={i} className={`${glassCardStyles.heroStatsCard} ${heroStyles.heroStatsCard}`}>
                                        <div className={`${heroStyles.heroStatsValue} text-primary-glow`}>
                                            {stat.value}
                                        </div>
                                        <div className={`${heroStyles.heroStatsLabel} text-primary-glow`}>
                                            {stat.label}
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Mobile Hero TVL Card + Secondary Stats Layout */}
                        <div className="block md:hidden">
                            <Card className={`${glassCardStyles.heroStatsCard} ${heroStyles.heroPrimaryStatsCard} mb-3`}>
                                <div className={`${heroStyles.heroPrimaryStatsValue} text-primary-glow`}>
                                    {isLoading ? 'Loading...' : formatTVL(totalTVL)}
                                </div>
                                <div className={`${heroStyles.heroPrimaryStatsLabel} text-primary-glow`}>
                                    Total Value Locked
                                </div>
                            </Card>

                            <div className="grid grid-cols-2 gap-3">
                                <Card className={`${glassCardStyles.heroStatsCard} ${heroStyles.heroSecondaryStatsCard}`}>
                                    <div className={`${heroStyles.heroSecondaryStatsValue} text-primary-glow`}>
                                        {isLoading ? 'Loading...' : formatAPY(averageAPY)}
                                    </div>
                                    <div className={`${heroStyles.heroSecondaryStatsLabel} text-primary-glow`}>
                                        Avg APY
                                    </div>
                                </Card>
                                <Card className={`${glassCardStyles.heroStatsCard} ${heroStyles.heroSecondaryStatsCard}`}>
                                    <div className={`${heroStyles.heroSecondaryStatsValue} text-primary-glow`}>
                                        400ms
                                    </div>
                                    <div className={`${heroStyles.heroSecondaryStatsLabel} text-primary-glow`}>
                                        Block Time
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Debug component to verify environment variables (development only) */}
            {process.env.NODE_ENV === 'development' && <DebugEnv />}
        </section>
    );
}