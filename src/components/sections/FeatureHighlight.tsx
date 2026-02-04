"use client";

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AIOrb3D from '@/components/AIOrb3D';

gsap.registerPlugin(ScrollTrigger);

// Pre-calculated static positions to avoid hydration mismatch
const STATIC_DATA_POINTS = [
    { top: 20, left: 85 }, // i=0: 20 + sin(0) * 25 = 20, 50 + cos(0) * 35 = 85
    { top: 41.65, left: 67.5 }, // i=1: 20 + sin(π/3) * 25 ≈ 41.65, 50 + cos(π/3) * 35 ≈ 67.5
    { top: 41.65, left: 32.5 }, // i=2: 20 + sin(2π/3) * 25 ≈ 41.65, 50 + cos(2π/3) * 35 ≈ 32.5
    { top: 20, left: 15 }, // i=3: 20 + sin(π) * 25 = 20, 50 + cos(π) * 35 = 15
    { top: -1.65, left: 32.5 }, // i=4: 20 + sin(4π/3) * 25 ≈ -1.65, 50 + cos(4π/3) * 35 ≈ 32.5
    { top: -1.65, left: 67.5 } // i=5: 20 + sin(5π/3) * 25 ≈ -1.65, 50 + cos(5π/3) * 35 ≈ 67.5
];

// Pre-calculated line endpoints to avoid hydration mismatch
const STATIC_LINE_ENDPOINTS = [
    { x2: 260, y2: 160 }, // i=0: 160 + cos(0) * 100 = 260, 160 + sin(0) * 100 = 160
    { x2: 110, y2: 73.2 }, // i=1: 160 + cos(2π/3) * 100 = 110, 160 + sin(2π/3) * 100 = 246.8
    { x2: 110, y2: 246.8 } // i=2: 160 + cos(4π/3) * 100 = 110, 160 + sin(4π/3) * 100 = 73.2
];

const features = [
    {
        title: 'Advanced Risk Management',
        description: 'Sophisticated algorithms continuously monitor and adjust positions to minimize impermanent loss while maximizing yield opportunities.',
        icon: '🛡️',
        color: '#00f5d4',
        gradient: 'from-cyan-400/20 to-emerald-400/20'
    },
    {
        title: 'Lightning-Fast Execution',
        description: 'Leverage SEI\'s 400ms block times for instant rebalancing and optimal trade execution across DeFi protocols.',
        icon: '⚡',
        color: '#9b5de5',
        gradient: 'from-purple-400/20 to-violet-400/20'
    },
    {
        title: 'Intelligent Portfolio Optimization',
        description: 'AI-driven analysis identifies the most profitable liquidity provision opportunities and automatically allocates capital.',
        icon: '🧠',
        color: '#ff206e',
        gradient: 'from-pink-400/20 to-rose-400/20'
    }
];

export default function FeatureHighlight() {
    const containerRef = useRef<HTMLDivElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
    const centerImageRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        // Animate cards on scroll with staggered effect
        cardsRef.current.forEach((card, index) => {
            if (card) {
                const staggerDelay = index * 0.15;
                const rotationDirection = index % 2 === 0 ? -10 : 10;
                
                gsap.fromTo(card,
                    {
                        opacity: 0,
                        y: 80,
                        scale: 0.9,
                        rotationY: rotationDirection,
                        rotationX: 5
                    },
                    {
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotationY: 0,
                        rotationX: 0,
                        duration: 1.2,
                        delay: staggerDelay,
                        ease: "power3.out",
                        scrollTrigger: {
                            trigger: card,
                            start: "top 85%",
                            end: "bottom 15%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            }
        });

        // Animate center 3D element
        if (centerImageRef.current) {
            gsap.fromTo(centerImageRef.current,
                {
                    opacity: 0,
                    scale: 0.5,
                    rotationY: 180
                },
                {
                    opacity: 1,
                    scale: 1,
                    rotationY: 0,
                    duration: 1.5,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: centerImageRef.current,
                        start: "top 75%",
                        end: "bottom 25%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
    <section className="py-16 relative overflow-hidden" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-30">
                    <div
                        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
                        style={{
                            background: 'radial-gradient(circle, #00f5d4 0%, transparent 70%)',
                            animationDelay: '0s'
                        }}
                    />
                    <div
                        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
                        style={{
                            background: 'radial-gradient(circle, #9b5de5 0%, transparent 70%)',
                            animationDelay: '2s'
                        }}
                    />
                    <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl animate-pulse"
                        style={{
                            background: 'radial-gradient(circle, #ff206e 0%, transparent 70%)',
                            animationDelay: '4s'
                        }}
                    />
                </div>
            </div>

            <div ref={containerRef} className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-24">
                    <h2 
                        className="mb-6 holo-text"
                        style={{
                            fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                            fontWeight: 'bold',
                            color: 'hsl(var(--foreground))',
                            lineHeight: '1.1'
                        }}
                    >
                        Next-Generation DeFi Features
                    </h2>
                    <p 
                        className="max-w-4xl mx-auto"
                        style={{
                            fontSize: '1.25rem',
                            color: 'hsl(var(--muted-foreground))',
                            lineHeight: '1.4'
                        }}
                    >
                        Experience the future of decentralized finance with cutting-edge technology built for the SEI ecosystem
                    </p>
                </div>

                {/* Layout with Orb and Feature Cards */}
                <div className="relative max-w-7xl mx-auto">
                    {/* Floating Orb - Positioned for better visual balance */}
                    <div className="absolute top-12 left-0 md:left-8 lg:left-16 transform z-20">
                        <div
                            ref={centerImageRef}
                            className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96"
                        >
                            {/* Main 3D Container */}
                            <div className="relative w-full h-full transform-gpu perspective-1000">
                                {/* Central Orb */}
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 backdrop-blur-xl border-2 border-primary/40 animate-float">
                                    {/* Inner Glow */}
                                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-sm animate-pulse"></div>

                                    {/* Core AI 3D Orb */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="transform hover:scale-110 transition-transform duration-300">
                                            <AIOrb3D size={320} color="#00f5d4" animated={true} />
                                        </div>
                                    </div>

                                    {/* Rotating Rings */}
                                    <div className="absolute inset-0 rounded-full border-2 border-primary/60 animate-spin" style={{ animationDuration: '8s' }} />
                                    <div className="absolute inset-6 rounded-full border border-secondary/60 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                                    <div className="absolute inset-12 rounded-full border border-accent/40 animate-spin" style={{ animationDuration: '4s' }} />
                                </div>

                                {/* Floating Data Points - Only render on client to avoid hydration mismatch */}
                                {isMounted && STATIC_DATA_POINTS.map((point, i) => (
                                    <div
                                        key={i}
                                        className="absolute w-4 h-4 rounded-full animate-ping"
                                        style={{
                                            background: `${features[i % 3].color}`,
                                            top: `${point.top}%`,
                                            left: `${point.left}%`,
                                            animationDelay: `${i * 0.5}s`,
                                            animationDuration: '3s'
                                        }}
                                    />
                                ))}

                                {/* Connecting Lines - Only render on client to avoid hydration mismatch */}
                                {isMounted && (
                                    <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 320 320">
                                        <defs>
                                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.8"/>
                                                <stop offset="50%" stopColor="#9b5de5" stopOpacity="0.6"/>
                                                <stop offset="100%" stopColor="#ff206e" stopOpacity="0.8"/>
                                            </linearGradient>
                                        </defs>
                                        {STATIC_LINE_ENDPOINTS.map((endpoint, i) => (
                                            <line
                                                key={i}
                                                x1="160"
                                                y1="160"
                                                x2={endpoint.x2}
                                                y2={endpoint.y2}
                                                stroke="url(#lineGradient)"
                                                strokeWidth="2"
                                                className="animate-pulse"
                                                style={{ animationDelay: `${i * 0.5}s` }}
                                            />
                                        ))}
                                    </svg>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Feature Cards - Vertical Layout */}
                    <div className="pt-20 pb-20 lg:pl-96">
                        <div className="flex flex-col items-center justify-center" style={{ gap: '3rem' }}>
                            {features.map((feature, index) => (
                                <div
                                    key={feature.title}
                                    className="w-full"
                                    style={{ maxWidth: '480px' }}
                                >
                                    <Card
                                        ref={el => { cardsRef.current[index] = el; }}
                                        className="h-full transition-all duration-500 transform hover:scale-105 hover:-translate-y-2"
                                        style={{
                                            background: 'linear-gradient(135deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.4) 100%)',
                                            backdropFilter: 'blur(20px)',
                                            border: '2px solid hsl(var(--primary) / 0.2)',
                                            borderRadius: '1rem',
                                            padding: '2rem',
                                            minHeight: '280px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.border = '2px solid hsl(var(--primary) / 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.border = '2px solid hsl(var(--primary) / 0.2)';
                                        }}
                                    >
                                        <div 
                                            className="mb-6"
                                            style={{
                                                width: '4rem',
                                                height: '4rem',
                                                borderRadius: '1rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '2rem',
                                                background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}40)`,
                                                boxShadow: `0 8px 32px ${feature.color}30`,
                                                transform: 'scale(1)',
                                                transition: 'transform 0.3s ease'
                                            }}
                                        >
                                            {feature.icon}
                                        </div>
                                        <h3
                                            style={{
                                                fontSize: '1.5rem !important',
                                                fontWeight: '700 !important',
                                                color: 'hsl(var(--foreground)) !important',
                                                lineHeight: '1.3 !important',
                                                margin: '0 0 1rem 0 !important',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {feature.title}
                                        </h3>
                                        <p
                                            style={{
                                                fontSize: '1.0625rem !important',
                                                color: 'hsl(var(--muted-foreground)) !important',
                                                lineHeight: '1.7 !important',
                                                margin: '0 !important',
                                                flexGrow: '1',
                                                display: 'flex',
                                                alignItems: 'center',
                                                textAlign: 'left',
                                                fontWeight: '400 !important'
                                            }}
                                        >
                                            {feature.description}
                                        </p>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom CTA Section */}
                <div 
                    className="text-center"
                    style={{
                        marginTop: '6rem',
                        marginBottom: '4rem'
                    }}
                >
                    <div 
                        className="inline-flex items-center space-x-4 rounded-full"
                        style={{
                            padding: '1rem 2rem',
                            background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--secondary) / 0.1) 50%, hsl(var(--accent) / 0.1) 100%)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid hsl(var(--primary) / 0.2)'
                        }}
                    >
                        <span 
                            style={{
                                fontSize: '1.125rem !important',
                                fontWeight: '500 !important',
                                color: 'hsl(var(--primary)) !important',
                                textAlign: 'center'
                            }}
                        >
                            Ready to experience the future?
                        </span>
                        <div 
                            className="animate-pulse"
                            style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: 'hsl(var(--primary))',
                                borderRadius: '50%'
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
