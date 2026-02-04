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
        id: 'pyth',
        name: 'Pyth Network',
        logo: (
            <Image src="/pyth-logo.svg" alt="Pyth Network" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'Real-Time Oracle Data',
        description: 'Powered by Pyth Network\'s high-fidelity, low-latency price feeds. Our vaults leverage real-time market data from 450+ price feeds across crypto, equities, and commodities.',
        features: [
            'Sub-second price updates',
            '450+ asset price feeds',
            'Institutional-grade accuracy',
            'Cross-chain compatible'
        ],
        color: '#6B47ED',
        gradient: 'linear-gradient(135deg, #6B47ED 0%, #E6DAFE 100%)',
        link: 'https://pyth.network'
    },
    {
        id: 'yei',
        name: 'Yei Finance',
        logo: (
            <Image src="/yei-logo.jpeg" alt="Yei Finance" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'SEI Native Lending',
        description: 'Deep integration with Yei Finance, the leading lending protocol on SEI. Our strategies optimize borrowing and lending positions to maximize capital efficiency.',
        features: [
            'Optimized lending rates',
            'Flash loan strategies',
            'Collateral management',
            'Yield aggregation'
        ],
        color: '#00F5D4',
        gradient: 'linear-gradient(135deg, #00F5D4 0%, #00B4A0 100%)',
        link: 'https://yei.finance'
    },
    {
        id: 'dragonswap',
        name: 'DragonSwap',
        logo: (
            <Image src="/drago.png" alt="DragonSwap" width={100} height={100} className={styles.partnerLogo} />
        ),
        tagline: 'Premier SEI DEX',
        description: 'Seamless integration with DragonSwap, SEI\'s leading decentralized exchange. Our vaults leverage concentrated liquidity positions to maximize trading fees and optimize capital efficiency.',
        features: [
            'Concentrated liquidity pools',
            'Automated range optimization',
            'MEV protection',
            'Cross-pool arbitrage'
        ],
        color: '#FF6B6B',
        gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FE5196 100%)',
        link: 'https://dragonswap.app'
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
                        Powered By Industry Leaders
                    </div>
                    <h2 className={`${styles.title} holo-text`}>
                        Integrated Protocols
                    </h2>
                    <p className={styles.subtitle}>
                        Built on the most trusted infrastructure in DeFi, ensuring reliable
                        data feeds and optimal capital efficiency for your investments.
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
                        <span className={styles.trustValue}>$50B+</span>
                        <span className={styles.trustLabel}>Total Value Secured</span>
                    </div>
                    <div className={styles.trustDivider} />
                    <div className={styles.trustItem}>
                        <span className={styles.trustValue}>450+</span>
                        <span className={styles.trustLabel}>Price Feeds</span>
                    </div>
                    <div className={styles.trustDivider} />
                    <div className={styles.trustItem}>
                        <span className={styles.trustValue}>400ms</span>
                        <span className={styles.trustLabel}>Update Latency</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
