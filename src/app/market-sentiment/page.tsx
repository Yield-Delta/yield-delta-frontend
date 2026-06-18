"use client"

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import styles from './page.module.css';
import { TrendingUp, TrendingDown, Brain, Target, Activity, Eye, Clock } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMultiChainStore } from '@/stores/multiChainStore';
import { getChainMetadata } from '@/lib/chainConfig';
import { ChainType } from '@/types/chain';

gsap.registerPlugin(ScrollTrigger);

const CHAIN_OPTIONS = [
  { type: ChainType.EVM,     label: 'SEI',    color: '#dc2626', apiKey: 'sei' as const },
  { type: ChainType.SOLANA,  label: 'Solana', color: '#9945FF', apiKey: 'sol' as const },
  { type: ChainType.SUI,     label: 'Sui',    color: '#4DA2FF', apiKey: 'sui' as const },
] as const;

interface SentimentData {
  metric: string;
  value: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
  category: 'fundamental' | 'technical' | 'social';
}

const MarketSentimentPage = () => {
  const { activeChain } = useMultiChainStore();
  const activeChainType = activeChain ? getChainMetadata(activeChain).type : ChainType.EVM;
  const [selectedChainType, setSelectedChainType] = useState<ChainType>(activeChainType);
  const selectedChainOpt = CHAIN_OPTIONS.find(o => o.type === selectedChainType) ?? CHAIN_OPTIONS[0];

  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fundamental' | 'technical' | 'social'>('all');
  const mountRef = useRef<HTMLDivElement>(null);
  const statsCardsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [marketStats, setMarketStats] = useState({
    bullishIndicators: 12,
    fearIndex: 28,
    sentimentScore: 76.5,
    confidenceLevel: 84,
    technicalScore: 52,
    fundamentalScore: 65,
    socialScore: 55
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Follow wallet's active chain
  useEffect(() => {
    setSelectedChainType(activeChainType);
  }, [activeChainType]);

  // Fetch sentiment data from API
  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/market/sentiment?timeframe=${selectedTimeframe}&chain=${selectedChainOpt.apiKey}`);

        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data');
        }

        const data = await response.json();

        if (data.success) {
          setSentimentData(data.data.sentimentMetrics);
          setMarketStats(data.data.stats);
          setLastUpdate(new Date(data.data.lastUpdated));
        }
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
        // Keep existing data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentimentData();

    // Refresh every 15 minutes
    const interval = setInterval(fetchSentimentData, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [selectedTimeframe, selectedChainOpt.apiKey]);

  const getSentimentColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return '#10b981';
      case 'bearish': return '#ff206e';
      default: return '#f59e0b';
    }
  };

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingDown;
      default: return Activity;
    }
  };

  // Filter sentiment data based on selected category
  const filteredSentimentData = selectedCategory === 'all'
    ? sentimentData
    : sentimentData.filter(item => item.category === selectedCategory);

  // Three.js Setup for background (similar to market page)
  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount || scene) return;

    // Scene setup
    const newScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    currentMount.appendChild(renderer.domElement);

    // Particle system
    const particleCount = 800;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      // Colors for particles - sentiment theme (green/purple)
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.3 + 0.25, 0.8, 0.6); // Green to purple range
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    newScene.add(particleSystem);

    // Geometric shapes for depth
    const geometries = [
      new THREE.OctahedronGeometry(2),
      new THREE.TetrahedronGeometry(1.5),
      new THREE.IcosahedronGeometry(1),
    ];

    geometries.forEach((geometry, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: [0x10b981, 0x8b5cf6, 0x06b6d4][index],
        wireframe: true,
        transparent: true,
        opacity: 0.12,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60
      );
      newScene.add(mesh);
    });

    camera.position.z = 30;
    setScene(newScene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate particles
      particleSystem.rotation.x += 0.0008;
      particleSystem.rotation.y += 0.0015;

      // Rotate geometric shapes
      newScene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.008;
          child.rotation.y += 0.008;
        }
      });

      renderer.render(newScene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [scene]);

  // GSAP Animations
  useEffect(() => {
    if (statsCardsRef.current) {
      const cards = statsCardsRef.current.children;
      
      gsap.fromTo(
        cards,
        { 
          opacity: 0, 
          y: 80, 
          scale: 0.9 
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 1, 
          stagger: 0.15, 
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: statsCardsRef.current,
            start: 'top 85%',
          }
        }
      );
    }

    if (tableRef.current) {
      gsap.fromTo(
        tableRef.current,
        { opacity: 0, y: 60 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: tableRef.current,
            start: 'top 90%',
          }
        }
      );
    }
  }, []);

  const scoreCards = [
    { label: 'Technical Score', value: marketStats.technicalScore.toFixed(1), detail: 'RSI, MACD, moving averages', icon: Target, accent: '#00f5d4' },
    { label: 'Fundamental Score', value: marketStats.fundamentalScore.toFixed(1), detail: 'TVL, volume, network health', icon: Brain, accent: '#10b981' },
    { label: 'Social Score', value: marketStats.socialScore.toFixed(1), detail: 'Community and macro mood', icon: Activity, accent: '#9b5de5' },
    { label: 'Overall Sentiment', value: marketStats.sentimentScore.toFixed(1), detail: `${marketStats.bullishIndicators} bullish signals`, icon: TrendingUp, accent: '#ff206e' },
  ];

  const categories = [
    { value: 'all' as const, label: 'All Metrics', icon: Activity, accent: '#00f5d4' },
    { value: 'technical' as const, label: 'Technical', icon: Target, accent: '#00f5d4' },
    { value: 'fundamental' as const, label: 'Fundamental', icon: Brain, accent: '#10b981' },
    { value: 'social' as const, label: 'Social', icon: TrendingUp, accent: '#9b5de5' },
  ];

  return (
    <div className={styles.pageShell}>
      <div ref={mountRef} className={styles.threeLayer} />
      <div className={styles.gridLayer} aria-hidden />
      <div className={styles.pageVeil} aria-hidden />

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.liveBadge}>
              <span />
              AI SENTIMENT ENGINE
            </div>
            <div className={styles.chainTabs}>
              {CHAIN_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setSelectedChainType(opt.type)}
                  className={selectedChainType === opt.type ? styles.chainTabActive : styles.chainTab}
                  style={{ '--chain': opt.color } as React.CSSProperties}
                >
                  <span className={styles.chainTabDot} />
                  {opt.label}
                </button>
              ))}
            </div>
            <h1 className={styles.title}>
              Market psychology for <span>{selectedChainOpt.label} liquidity</span> decisions
            </h1>
            <p className={styles.subtitle}>
              A blended signal layer for technical pressure, on-chain fundamentals, and social market tone.
            </p>
          </div>

          <div className={styles.heroConsole}>
            <div className={styles.consoleHeader}>
              <Brain />
              <span>Composite Signal</span>
            </div>
            <div className={styles.sentimentScore}>{marketStats.sentimentScore.toFixed(1)}</div>
            <div className={styles.confidenceRail}>
              <span>Confidence</span>
              <strong>{marketStats.confidenceLevel}%</strong>
            </div>
            <div className={styles.confidenceTrack}>
              <div style={{ width: `${marketStats.confidenceLevel}%` }} />
            </div>
            <div className={styles.signalMeta}>
              <span>{marketStats.bullishIndicators} bullish signals</span>
              <span>Fear index {marketStats.fearIndex}</span>
            </div>
          </div>
        </section>

        <section ref={statsCardsRef} className={styles.scoreGrid}>
          {scoreCards.map((stat, index) => (
            <article
              key={index}
              className={styles.scoreCard}
              style={{ '--accent': stat.accent } as React.CSSProperties}
            >
              <div className={styles.scoreTopline}>
                <stat.icon />
                <span>{stat.detail}</span>
              </div>
              <div className={styles.scoreValue}>{stat.value}</div>
              <div className={styles.scoreLabel}>{stat.label}</div>
            </article>
          ))}
        </section>

        <section className={styles.filterDeck}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Analysis Period</span>
            <div className={styles.segmented}>
              {['1h', '24h', '7d', '30d'].map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={selectedTimeframe === timeframe ? styles.segmentActive : styles.segment}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Analysis Type</span>
            <div className={styles.categoryTabs}>
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={selectedCategory === category.value ? styles.categoryActive : styles.category}
                  style={{ '--accent': category.accent } as React.CSSProperties}
                >
                  <category.icon />
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section
          ref={tableRef}
          className={styles.metricsPanel}
        >
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.kicker}>Signal Matrix</span>
              <h2>
                <Eye />
              Sentiment Metrics
            </h2>
            </div>
            <span className={styles.resultCount}>{filteredSentimentData.length} metrics</span>
          </div>
          
          <div className={styles.tableWrap}>
            <table className={styles.metricsTable}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Score</th>
                  <th>Trend</th>
                  <th>Confidence</th>
                  <th>Analysis</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && filteredSentimentData.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className={styles.loadingState}>
                        <div />
                        <p>Loading sentiment data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSentimentData.map((item, index) => {
                  const SentimentIcon = getSentimentIcon(item.trend);
                  const trendColor = getSentimentColor(item.trend);
                  return (
                    <tr key={index}>
                      <td>
                        <div className={styles.metricName}>
                          <div className={styles.metricIcon}>
                            <Brain />
                          </div>
                          <div>
                            <strong>{item.metric}</strong>
                            <span>{item.category} analysis</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.scoreCell}>{item.value}%</div>
                      </td>
                      <td>
                        <div
                          className={styles.trendPill}
                          style={{ '--trend': trendColor } as React.CSSProperties}
                        >
                          <SentimentIcon />
                          {item.trend.toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div className={styles.confidenceCell}>
                          <span>{item.confidence}%</span>
                          <div><i style={{ width: `${item.confidence}%` }} /></div>
                        </div>
                      </td>
                      <td>
                        <p className={styles.analysisText}>{item.description}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.methodology}>
          <h3>
            <Eye />
            Understanding Our Sentiment Analysis
          </h3>
          <div className={styles.methodGrid}>
            <div>
              <h4>Technical Analysis</h4>
              <p>Based on price action indicators including RSI (14-period), MACD signals, and moving averages (SMA 50/200). These reflect chart patterns and trading signals, not fundamental value.</p>
            </div>
            <div>
              <h4>{selectedChainOpt.label} Fundamentals</h4>
              <p>
                {selectedChainType === ChainType.SOLANA
                  ? 'Evaluates Solana ecosystem health through network volume, DeFi TVL (Orca, Raydium, Jupiter), NFT marketplace activity on Tensor and Magic Eden, and institutional flow indicators.'
                  : selectedChainType === ChainType.SUI
                  ? 'Evaluates Sui ecosystem health through Move VM developer adoption, gaming and NFT activity leveraging the object-centric model, and DeFi protocol traction on Cetus, Turbos, and Aftermath.'
                  : 'Evaluates SEI ecosystem health through on-chain metrics: TVL, trading volume, network performance (TPS, validators), and DeFi protocol adoption. Measures intrinsic value and growth potential.'}
              </p>
            </div>
            <div>
              <h4>Social Sentiment</h4>
              <p>Uses the Crypto Fear & Greed Index from Alternative.me, which analyzes market volatility, momentum, social media trends, surveys, and Bitcoin dominance. Reflects overall market psychology and investor sentiment.</p>
            </div>
          </div>
          <div className={styles.disclaimer}>
            <p>
              <strong>Important:</strong> Sentiment scores are informational tools, not investment advice. Technical indicators may show bearish signals while fundamentals remain strong, or vice versa. Always conduct your own research and consider multiple factors before making investment decisions.
            </p>
          </div>
        </section>

        <footer className={styles.footerNote}>
          <div>
            <Clock />
            <span>Last analysis: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <p>Sentiment analysis updates every 15 minutes. Powered by real-time market data and AI.</p>
          <p>Fear & Greed Index data from <a href="https://alternative.me" target="_blank" rel="noopener noreferrer">Alternative.me</a>. Price data from <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer">CoinGecko</a>.</p>
        </footer>
      </main>
    </div>
  );
};

export default MarketSentimentPage;
