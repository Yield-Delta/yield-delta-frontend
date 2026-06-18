'use client'

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './IntegrationCarousel.module.css';

gsap.registerPlugin(ScrollTrigger);

interface Integration {
    id: string;
    name: string;
    logo: React.ReactNode;
    tagline: string;
    description: string;
    features: string[];
    color: string;
    gradient: string;
    link: string;
}

const integrations: Integration[] = [
    {
        id: 'dragonswap',
        name: 'DragonSwap',
        logo: (
            <Image src="/drago.png" alt="DragonSwap" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'Premier SEI DEX',
        description: 'Yield Delta routes liquidity through DragonSwap\'s concentrated pools on SEI. AI-managed vaults auto-rebalance LP ranges to capture trading fees while minimizing impermanent loss.',
        features: [
            'Concentrated liquidity pools',
            'Automated range rebalancing',
            'Fee yield compounding',
            'MEV-resistant routing'
        ],
        color: '#FF6B6B',
        gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FE5196 100%)',
        link: 'https://dragonswap.app'
    },
    {
        id: 'raydium',
        name: 'Raydium',
        logo: (
            <svg viewBox="0 0 100 100" className={styles.partnerLogo} fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" fill="#0d1117" stroke="#1de9b6" strokeWidth="2" />
                <polygon points="50,18 72,38 72,62 50,82 28,62 28,38" fill="none" stroke="#1de9b6" strokeWidth="2.5" />
                <circle cx="50" cy="50" r="10" fill="#1de9b6" opacity="0.9" />
                <line x1="50" y1="18" x2="50" y2="40" stroke="#1de9b6" strokeWidth="2" opacity="0.6" />
                <line x1="72" y1="38" x2="58" y2="45" stroke="#1de9b6" strokeWidth="2" opacity="0.6" />
                <line x1="72" y1="62" x2="58" y2="55" stroke="#1de9b6" strokeWidth="2" opacity="0.6" />
                <line x1="50" y1="82" x2="50" y2="60" stroke="#1de9b6" strokeWidth="2" opacity="0.6" />
                <line x1="28" y1="62" x2="42" y2="55" stroke="#1de9b6" strokeWidth="2" opacity="0.6" />
                <line x1="28" y1="38" x2="42" y2="45" stroke="#1de9b6" strokeWidth="2" opacity="0.6" />
            </svg>
        ),
        tagline: 'Solana\'s Leading DEX',
        description: 'Yield Delta taps Raydium\'s CLMM pools and order-book hybrid liquidity on Solana. Vaults deploy capital into high-volume pairs and auto-harvest swap fees for continuous compounding.',
        features: [
            'CLMM concentrated pools',
            'Hybrid AMM + order book',
            'High-volume pair routing',
            'Auto-compounding fees'
        ],
        color: '#1de9b6',
        gradient: 'linear-gradient(135deg, #1de9b6 0%, #0070f3 100%)',
        link: 'https://raydium.io'
    },
    {
        id: 'cetus',
        name: 'Cetus Protocol',
        logo: (
            <svg viewBox="0 0 100 100" className={styles.partnerLogo} fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="46" fill="#0d1117" stroke="#29b6f6" strokeWidth="2" />
                <path d="M50 22 C34 22, 22 34, 22 50 C22 66, 34 78, 50 78" stroke="#29b6f6" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path d="M50 30 C38 30, 30 38, 30 50 C30 62, 38 70, 50 70" stroke="#29b6f6" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
                <path d="M50 38 C42 38, 38 43, 38 50 C38 57, 42 62, 50 62" stroke="#29b6f6" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
                <circle cx="50" cy="50" r="5" fill="#29b6f6" />
                <circle cx="72" cy="36" r="4" fill="#29b6f6" opacity="0.8" />
                <circle cx="72" cy="64" r="4" fill="#29b6f6" opacity="0.8" />
                <line x1="72" y1="36" x2="72" y2="64" stroke="#29b6f6" strokeWidth="2" opacity="0.4" />
            </svg>
        ),
        tagline: 'Sui\'s Premier DEX',
        description: 'On Sui, Yield Delta connects to Cetus Protocol\'s concentrated liquidity engine. Strategies target deep pools in high-fee tiers, with tick-level precision for maximum capital utilization.',
        features: [
            'Tick-level CLMM positions',
            'Multi-fee-tier pool access',
            'Sui object-native LP tokens',
            'Auto tick-range adjustment'
        ],
        color: '#29b6f6',
        gradient: 'linear-gradient(135deg, #29b6f6 0%, #4DA2FF 100%)',
        link: 'https://app.cetus.zone'
    },
    {
        id: 'yei',
        name: 'Yei Finance',
        logo: (
            <Image src="/yei-logo.jpeg" alt="Yei Finance" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'SEI Native Lending',
        description: 'Vaults on SEI use Yei Finance as the borrowing layer — strategies can collateralize assets, borrow stables, and redeploy into DEX positions to unlock leveraged yield loops.',
        features: [
            'Collateral-backed borrowing',
            'Leveraged yield loops',
            'Flash loan strategies',
            'Health factor monitoring'
        ],
        color: '#00F5D4',
        gradient: 'linear-gradient(135deg, #00F5D4 0%, #00B4A0 100%)',
        link: 'https://yei.finance'
    },
    {
        id: 'pyth',
        name: 'Pyth Network',
        logo: (
            <Image src="/pyth-logo.svg" alt="Pyth Network" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'Real-Time Price Oracle',
        description: 'Every vault decision is priced against Pyth\'s sub-second feeds. Rebalances, liquidation guards, and fee-capture thresholds all trigger from live on-chain data — never stale prices.',
        features: [
            'Sub-second price updates',
            '450+ asset price feeds',
            'Pull-model on-demand pricing',
            'Cross-chain feed compatibility'
        ],
        color: '#6B47ED',
        gradient: 'linear-gradient(135deg, #6B47ED 0%, #E6DAFE 100%)',
        link: 'https://pyth.network'
    },
    {
        id: 'sei',
        name: 'SEI Network',
        logo: (
            <Image src="/chains/sei.svg" alt="SEI Network" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'DeFi-Optimized L1',
        description: 'SEI is Yield Delta\'s primary settlement chain — purpose-built for DeFi with native order-matching, parallel execution, and sub-400ms finality that keeps vault rebalancing costs low.',
        features: [
            'Native order-book matching',
            'Parallel EVM + Cosmos execution',
            'Sub-400ms finality',
            'Low gas for frequent rebalances'
        ],
        color: '#E84142',
        gradient: 'linear-gradient(135deg, #E84142 0%, #FF8C69 100%)',
        link: 'https://sei.io'
    }
];

export default function IntegrationCarousel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const slidesRef = useRef<(HTMLDivElement | null)[]>([]);
    const progressRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const goToSlide = useCallback((index: number) => {
        if (!carouselRef.current) return;

        const newIndex = ((index % integrations.length) + integrations.length) % integrations.length;
        setActiveIndex(newIndex);

        // Animate out current slides
        slidesRef.current.forEach((slide, i) => {
            if (!slide) return;

            const isActive = i === newIndex;
            const isPrev = i === ((newIndex - 1 + integrations.length) % integrations.length);
            const isNext = i === ((newIndex + 1) % integrations.length);

            gsap.to(slide, {
                x: isActive ? '0%' : isPrev ? '-120%' : isNext ? '120%' : '200%',
                scale: isActive ? 1 : 0.75,
                opacity: isActive ? 1 : isPrev || isNext ? 0.3 : 0,
                rotateY: isActive ? 0 : isPrev ? 25 : isNext ? -25 : 0,
                z: isActive ? 50 : 0,
                duration: 0.8,
                ease: 'power3.out'
            });
        });

        // Animate progress bar
        if (progressRef.current) {
            gsap.to(progressRef.current, {
                width: `${((newIndex + 1) / integrations.length) * 100}%`,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    }, []);

    const nextSlide = useCallback(() => {
        goToSlide(activeIndex + 1);
    }, [activeIndex, goToSlide]);

    const prevSlide = useCallback(() => {
        goToSlide(activeIndex - 1);
    }, [activeIndex, goToSlide]);

    // Auto-play functionality
    useEffect(() => {
        if (isAutoPlaying && isMounted) {
            autoPlayRef.current = setInterval(() => {
                nextSlide();
            }, 5000);
        }

        return () => {
            if (autoPlayRef.current) {
                clearInterval(autoPlayRef.current);
            }
        };
    }, [isAutoPlaying, nextSlide, isMounted]);

    // Initial animation setup
    useEffect(() => {
        if (!containerRef.current || !isMounted) return;

        // Animate section title on scroll
        gsap.fromTo(
            containerRef.current.querySelector(`.${styles.sectionHeader}`),
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        // Initialize slide positions
        slidesRef.current.forEach((slide, i) => {
            if (!slide) return;
            gsap.set(slide, {
                x: i === 0 ? '0%' : '120%',
                scale: i === 0 ? 1 : 0.75,
                opacity: i === 0 ? 1 : 0.3,
                rotateY: i === 0 ? 0 : -25
            });
        });

        // Animate carousel container on scroll
        gsap.fromTo(
            carouselRef.current,
            { opacity: 0, scale: 0.9 },
            {
                opacity: 1,
                scale: 1,
                duration: 1.2,
                delay: 0.3,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 70%',
                    toggleActions: 'play none none reverse'
                }
            }
        );

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, [isMounted]);

    // Floating particles animation
    const renderParticles = () => {
        if (!isMounted) return null;
        return Array.from({ length: 20 }).map((_, i) => (
            <div
                key={i}
                className={styles.particle}
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`,
                    width: `${2 + Math.random() * 4}px`,
                    height: `${2 + Math.random() * 4}px`,
                    background: integrations[activeIndex].color
                }}
            />
        ));
    };

    return (
        <section ref={containerRef} className={styles.section}>
            {/* Animated Background */}
            <div className={styles.backgroundGlow}>
                <div
                    className={styles.glowOrb1}
                    style={{ background: `radial-gradient(circle, ${integrations[activeIndex].color}40 0%, transparent 70%)` }}
                />
                <div
                    className={styles.glowOrb2}
                    style={{ background: `radial-gradient(circle, ${integrations[activeIndex].color}30 0%, transparent 70%)` }}
                />
            </div>

            {/* Floating Particles */}
            <div className={styles.particlesContainer}>
                {renderParticles()}
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className={styles.sectionHeader}>
                    <div className={styles.badge}>
                        <span className={styles.badgeDot} />
                        DeFi Ecosystem Connections
                    </div>
                    <h2 className={`${styles.title} holo-text`}>
                        DEXes, Lending & Oracles
                    </h2>
                    <p className={styles.subtitle}>
                        Yield Delta plugs directly into the top DEXes on SEI, Solana, and Sui —
                        routing vault capital through concentrated liquidity pools, lending markets,
                        and real-time oracle feeds to maximize yield automatically.
                    </p>
                </div>

                {/* Carousel Container */}
                <div
                    ref={carouselRef}
                    className={styles.carouselContainer}
                    onMouseEnter={() => setIsAutoPlaying(false)}
                    onMouseLeave={() => setIsAutoPlaying(true)}
                >
                    {/* 3D Carousel Stage */}
                    <div className={styles.carouselStage}>
                        {integrations.map((integration, index) => (
                            <div
                                key={integration.id}
                                ref={el => { slidesRef.current[index] = el; }}
                                className={`${styles.slide} ${activeIndex === index ? styles.slideActive : ''}`}
                            >
                                <div
                                    className={styles.slideCard}
                                    style={{
                                        '--accent-color': integration.color,
                                        '--accent-gradient': integration.gradient
                                    } as React.CSSProperties}
                                >
                                    {/* Glow Effect */}
                                    <div className={styles.cardGlow} />

                                    {/* Card Content */}
                                    <div className={styles.cardHeader}>
                                        <div className={styles.logoContainer}>
                                            {integration.logo}
                                            <div className={styles.logoRing} />
                                            <div className={styles.logoRing2} />
                                        </div>
                                        <div className={styles.headerText}>
                                            <h3 className={styles.partnerName}>{integration.name}</h3>
                                            <span className={styles.partnerTagline}>{integration.tagline}</span>
                                        </div>
                                    </div>

                                    <p className={styles.description}>
                                        {integration.description}
                                    </p>

                                    <div className={styles.features}>
                                        {integration.features.map((feature, i) => (
                                            <div
                                                key={i}
                                                className={styles.featureItem}
                                                style={{ animationDelay: `${i * 0.1}s` }}
                                            >
                                                <svg
                                                    className={styles.featureIcon}
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <a
                                        href={integration.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.learnMore}
                                    >
                                        Learn More
                                        <svg viewBox="0 0 20 20" fill="currentColor" className={styles.arrowIcon}>
                                            <path
                                                fillRule="evenodd"
                                                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Controls */}
                    <div className={styles.navigation}>
                        <button
                            onClick={prevSlide}
                            className={styles.navButton}
                            aria-label="Previous slide"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Dots Indicator */}
                        <div className={styles.dots}>
                            {integrations.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`${styles.dot} ${activeIndex === index ? styles.dotActive : ''}`}
                                    style={{
                                        background: activeIndex === index ? integrations[activeIndex].color : undefined
                                    }}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextSlide}
                            className={styles.navButton}
                            aria-label="Next slide"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className={styles.progressContainer}>
                        <div
                            ref={progressRef}
                            className={styles.progressBar}
                            style={{ background: integrations[activeIndex].gradient }}
                        />
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className={styles.trustSection}>
                    <div className={styles.trustItem}>
                        <span className={styles.trustValue}>3</span>
                        <span className={styles.trustLabel}>DEX Integrations</span>
                    </div>
                    <div className={styles.trustDivider} />
                    <div className={styles.trustItem}>
                        <span className={styles.trustValue}>450+</span>
                        <span className={styles.trustLabel}>Oracle Price Feeds</span>
                    </div>
                    <div className={styles.trustDivider} />
                    <div className={styles.trustItem}>
                        <span className={styles.trustValue}>SEI · SOL · SUI</span>
                        <span className={styles.trustLabel}>Supported Chains</span>
                    </div>
                    <div className={styles.trustDivider} />
                    <div className={styles.trustItem}>
                        <span className={styles.trustValue}>2</span>
                        <span className={styles.trustLabel}>Lending Protocols</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
