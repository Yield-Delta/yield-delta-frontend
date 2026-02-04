'use client'

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function FinancialFlowVisualization() {
    const svgRef = useRef<SVGSVGElement>(null);
    const centralNodeRef = useRef<SVGGElement>(null);
    const yieldNodesRef = useRef<(SVGGElement | null)[]>([]);
    const flowLinesRef = useRef<(SVGPathElement | null)[]>([]);
    const particlesRef = useRef<(SVGCircleElement | null)[]>([]);

    useEffect(() => {
        if (!svgRef.current) return;

        // Capture refs at the beginning to use in cleanup
        const centralNode = centralNodeRef.current;
        const yieldNodes = [...yieldNodesRef.current];
        const flowLines = [...flowLinesRef.current];
        const particles = [...particlesRef.current];

        // GSAP Timeline for orchestrated animations
        // const tl = gsap.timeline({ repeat: -1 }); // Unused for now, but can be used for complex sequenced animations

        // Central node pulsing animation
        if (centralNodeRef.current) {
            gsap.to(centralNodeRef.current.querySelector('.central-core'), {
                scale: 1.1,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });

            // Rotate the central node's inner elements
            gsap.to(centralNodeRef.current.querySelector('.central-inner'), {
                rotation: 360,
                duration: 20,
                repeat: -1,
                ease: "none"
            });
        }

        // Yield nodes orbital animation
        yieldNodesRef.current.forEach((node, index) => {
            if (!node) return;

            const angle = (index * 360 / 8); // 8 yield nodes
            // const radius = 140; // Unused - radius is handled in SVG directly

            // Create orbital motion
            gsap.to(node, {
                rotation: 360,
                duration: 30 + index * 2,
                repeat: -1,
                ease: "none",
                transformOrigin: "center center",
            });

            // Pulsing glow effect
            gsap.to(node.querySelector('.yield-glow'), {
                opacity: 0.3 + Math.random() * 0.4,
                scale: 1.2,
                duration: 2 + Math.random(),
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });

            // Subtle floating motion
            gsap.to(node, {
                y: Math.sin(angle * Math.PI / 180) * 10,
                x: Math.cos(angle * Math.PI / 180) * 10,
                duration: 3 + Math.random() * 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });

        // Flow lines animation
        flowLinesRef.current.forEach((line, index) => {
            if (!line) return;

            // Animate stroke dashoffset for flow effect
            gsap.fromTo(line,
                {
                    strokeDasharray: "5 10",
                    strokeDashoffset: 0,
                },
                {
                    strokeDashoffset: -15,
                    duration: 2,
                    repeat: -1,
                    ease: "none"
                }
            );

            // Pulse opacity
            gsap.to(line, {
                opacity: 0.3,
                duration: 1.5 + index * 0.2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        });

        // Particle flow animation
        particlesRef.current.forEach((particle, index) => {
            if (!particle) return;

            const nodeIndex = Math.floor(index / 3); // 3 particles per yield node
            const angle = (nodeIndex * 360 / 8) * Math.PI / 180;
            const startRadius = 140;
            // const endRadius = 0; // Unused - end position is always center (0, 0)

            // Create path from yield node to center
            const path = {
                start: {
                    x: Math.cos(angle) * startRadius,
                    y: Math.sin(angle) * startRadius
                },
                end: { x: 0, y: 0 }
            };

            // Animate particle along path
            gsap.timeline({ repeat: -1, delay: index * 0.3 })
                .fromTo(particle,
                    {
                        x: path.start.x,
                        y: path.start.y,
                        scale: 0,
                        opacity: 0
                    },
                    {
                        x: path.end.x,
                        y: path.end.y,
                        scale: 1,
                        opacity: 1,
                        duration: 3,
                        ease: "power2.inOut"
                    }
                )
                .to(particle, {
                    scale: 0,
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.in"
                });
        });

        // Orbital rings animation - removed as rings are no longer displayed

        // Data flow pulse animation
        const pulseAnimation = () => {
            // Create expanding circles from center
            const pulseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            pulseCircle.setAttribute("r", "5");
            pulseCircle.setAttribute("fill", "none");
            pulseCircle.setAttribute("stroke", "url(#pulseGradient)");
            pulseCircle.setAttribute("stroke-width", "2");
            pulseCircle.setAttribute("opacity", "0.8");

            if (svgRef.current) {
                const pulseGroup = svgRef.current.querySelector('.pulse-group');
                if (pulseGroup) {
                    pulseGroup.appendChild(pulseCircle);

                    gsap.to(pulseCircle, {
                        attr: { r: 200 },
                        opacity: 0,
                        duration: 3,
                        ease: "power2.out",
                        onComplete: () => {
                            pulseCircle.remove();
                        }
                    });
                }
            }
        };

        // Trigger pulse every 2 seconds
        const pulseInterval = setInterval(pulseAnimation, 2000);

        return () => {
            clearInterval(pulseInterval);
            gsap.killTweensOf([
                centralNode,
                ...yieldNodes,
                ...flowLines,
                ...particles
            ]);
        };
    }, []);

    return (
        <svg
            ref={svgRef}
            className="w-full h-full"
            viewBox="-200 -200 400 400"
            style={{ filter: 'drop-shadow(0 0 30px hsl(180 100% 48% / 0.3))' }}
        >
            {/* Definitions for gradients and filters */}
            <defs>
                {/* Main gradients */}
                <linearGradient id="centralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(180 100% 48%)" />
                    <stop offset="100%" stopColor="hsl(262 80% 60%)" />
                </linearGradient>

                <radialGradient id="centralRadial">
                    <stop offset="0%" stopColor="hsl(180 100% 48%)" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="hsl(262 80% 60%)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="hsl(262 80% 60%)" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="yieldGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(120 100% 50%)" />
                    <stop offset="100%" stopColor="hsl(180 100% 48%)" />
                </linearGradient>

                <linearGradient id="yieldGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(45 100% 50%)" />
                    <stop offset="100%" stopColor="hsl(30 100% 60%)" />
                </linearGradient>

                <linearGradient id="yieldGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(280 100% 65%)" />
                    <stop offset="100%" stopColor="hsl(320 100% 60%)" />
                </linearGradient>

                <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(180 100% 48%)" stopOpacity="0" />
                    <stop offset="50%" stopColor="hsl(180 100% 48%)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(180 100% 48%)" stopOpacity="0" />
                </linearGradient>

                <radialGradient id="pulseGradient">
                    <stop offset="0%" stopColor="hsl(180 100% 48%)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="hsl(180 100% 48%)" stopOpacity="0" />
                </radialGradient>

                {/* Glow filter */}
                <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>

                {/* Blur filter for background elements */}
                <filter id="blur">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                </filter>
            </defs>

            {/* Background orbital rings - removed for cleaner look */}

            {/* Flow lines from yield nodes to center */}
            <g className="flow-lines">
                {[...Array(8)].map((_, i) => {
                    const angle = (i * 360 / 8) * Math.PI / 180;
                    const x = Math.cos(angle) * 140;
                    const y = Math.sin(angle) * 140;

                    return (
                        <path
                            key={`flow-${i}`}
                            ref={el => { flowLinesRef.current[i] = el; }}
                            d={`M ${x} ${y} Q ${x/2} ${y/2} 0 0`}
                            stroke="url(#flowGradient)"
                            strokeWidth="1.5"
                            fill="none"
                            opacity="0.6"
                        />
                    );
                })}
            </g>

            {/* Yield nodes */}
            <g className="yield-nodes">
                {[...Array(8)].map((_, i) => {
                    const angle = (i * 360 / 8) * Math.PI / 180;
                    const x = Math.cos(angle) * 140;
                    const y = Math.sin(angle) * 140;
                    const gradient = `yieldGradient${(i % 3) + 1}`;

                    return (
                        <g
                            key={`yield-${i}`}
                            ref={el => { yieldNodesRef.current[i] = el; }}
                            transform={`translate(${x}, ${y})`}
                        >
                            {/* Node glow */}
                            <circle
                                className="yield-glow"
                                r="25"
                                fill={`url(#${gradient})`}
                                opacity="0.2"
                                filter="url(#blur)"
                            />

                            {/* Node outer ring - removed for cleaner look */}

                            {/* Node core */}
                            <circle
                                r="12"
                                fill={`url(#${gradient})`}
                                opacity="0.8"
                            />

                            {/* Node inner detail */}
                            <circle
                                r="6"
                                fill="hsl(0 0% 100% / 0.9)"
                            />

                            {/* Yield indicator */}
                            <g className="yield-indicator" transform="scale(0.6)">
                                <path
                                    d="M -3 -2 L 3 -2 L 0 3 Z"
                                    fill={`url(#${gradient})`}
                                    opacity="0.8"
                                />
                            </g>
                        </g>
                    );
                })}
            </g>

            {/* Particle flow */}
            <g className="particles">
                {[...Array(24)].map((_, i) => (
                    <circle
                        key={`particle-${i}`}
                        ref={el => { particlesRef.current[i] = el; }}
                        r="2"
                        fill="hsl(180 100% 48%)"
                        opacity="0"
                    />
                ))}
            </g>

            {/* Central protocol node */}
            <g ref={centralNodeRef} className="central-node">
                {/* Central glow effect */}
                <circle
                    r="60"
                    fill="url(#centralRadial)"
                    filter="url(#blur)"
                    opacity="0.4"
                />

                {/* Outer ring - removed for cleaner look */}
                {/* Middle ring - removed for cleaner look */}

                {/* Core container */}
                <circle
                    className="central-core"
                    r="25"
                    fill="hsl(var(--background) / 0.9)"
                />

                {/* Protocol symbol - abstract geometric shape */}
                <g className="protocol-symbol" filter="url(#glow)">
                    {/* Hexagon shape - removed stroke for cleaner look */}

                    {/* Inner triangle */}
                    <path
                        d="M -8 -5 L 8 -5 L 0 10 Z"
                        fill="url(#centralGradient)"
                        opacity="0.6"
                    />

                    {/* Center dot */}
                    <circle
                        r="3"
                        fill="hsl(180 100% 48%)"
                    />
                </g>
            </g>

            {/* Pulse group for expanding circles */}
            <g className="pulse-group" />
        </svg>
    );
}