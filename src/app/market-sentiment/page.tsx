"use client"

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, TrendingDown, Brain, Target, Activity, Eye, Clock } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SentimentData {
  metric: string;
  value: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
  category: 'fundamental' | 'technical' | 'social';
}

const MarketSentimentPage = () => {
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

  // Fetch sentiment data from API
  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/market/sentiment?timeframe=${selectedTimeframe}`);

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
  }, [selectedTimeframe]);

  const getSentimentColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
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

  return (
    <div className="min-h-screen bg-background relative">
      {/* Three.js Background */}
      <div 
        ref={mountRef} 
        className="fixed inset-0 z-0"
        style={{ 
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, rgba(6, 182, 212, 0.05) 70%, transparent 100%)'
        }}
      />
      
      {/* Background overlay */}
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-background/70 via-background/60 to-background/70 pointer-events-none" />

      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      {/* Header */}
      <div className="relative z-10" style={{ paddingTop: '1.5rem' }}>
        <div 
          className="border-b border-white/20 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(6, 182, 212, 0.12) 100%)',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-purple-400 to-cyan-400">
                  Market Sentiment Analysis
                </h1>
                <p className="text-gray-300 text-lg font-medium">AI-driven sentiment analysis and market psychology insights</p>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" style={{ boxShadow: '0 0 12px rgba(16, 185, 129, 0.9)' }}></div>
                  <span className="text-green-300 font-semibold text-sm">AI Powered</span>
                </div>
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span className="text-purple-300 font-medium text-sm">Confidence</span>
                  <span className="text-purple-400 font-bold">{marketStats.confidenceLevel}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        <div ref={statsCardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Technical Score', value: marketStats.technicalScore.toFixed(1), change: 'RSI, MACD, MA', icon: Target, color: 'cyan' },
            { label: 'Fundamental Score', value: marketStats.fundamentalScore.toFixed(1), change: 'TVL, Volume, Network', icon: Brain, color: 'green' },
            { label: 'Social Score', value: marketStats.socialScore.toFixed(1), change: 'Community Sentiment', icon: Activity, color: 'purple' },
            { label: 'Overall Sentiment', value: marketStats.sentimentScore.toFixed(1), change: `${marketStats.bullishIndicators} Bullish Signals`, icon: TrendingUp, color: 'orange' }
          ].map((stat, index) => (
            <div 
              key={index} 
              className="group cursor-pointer transition-all duration-500 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                padding: '2rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <stat.icon className={`w-10 h-10 text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
                <div
                  className={`text-xs font-bold text-${stat.color}-300 px-3 py-1.5 rounded-full`}
                  style={{
                    background: `rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'green' ? '16, 185, 129' : stat.color === 'purple' ? '139, 92, 246' : stat.color === 'cyan' ? '6, 182, 212' : '245, 158, 11'}, 0.2)`,
                    border: `1px solid rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'green' ? '16, 185, 129' : stat.color === 'purple' ? '139, 92, 246' : stat.color === 'cyan' ? '6, 182, 212' : '245, 158, 11'}, 0.4)`,
                    backdropFilter: 'blur(8px)',
                    boxShadow: `0 2px 10px rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'green' ? '16, 185, 129' : stat.color === 'purple' ? '139, 92, 246' : stat.color === 'cyan' ? '6, 182, 212' : '245, 158, 11'}, 0.15)`
                  }}
                >
                  {stat.change}
                </div>
              </div>
              <div className="text-3xl font-black mb-2 text-white group-hover:text-white transition-colors" style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>{stat.value}</div>
              <div className="text-gray-300 text-sm font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Timeframe Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <span className="text-gray-300 text-base font-semibold whitespace-nowrap">Analysis Period:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {['1h', '24h', '7d', '30d'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-5 py-2.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 min-w-[60px] ${
                  selectedTimeframe === timeframe
                    ? 'text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  background: selectedTimeframe === timeframe
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: selectedTimeframe === timeframe
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: selectedTimeframe === timeframe
                    ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                    : '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12">
          <span className="text-gray-300 text-base font-semibold whitespace-nowrap">Analysis Type:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: 'all' as const, label: 'All Metrics', icon: Activity },
              { value: 'technical' as const, label: 'Technical', icon: Target },
              { value: 'fundamental' as const, label: 'Fundamental', icon: Brain },
              { value: 'social' as const, label: 'Social', icon: TrendingUp }
            ].map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-5 py-2.5 rounded-full font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
                  selectedCategory === category.value
                    ? 'text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
                style={{
                  background: selectedCategory === category.value
                    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: selectedCategory === category.value
                    ? '1px solid rgba(6, 182, 212, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: selectedCategory === category.value
                    ? '0 4px 20px rgba(6, 182, 212, 0.4)'
                    : '0 4px 15px rgba(0, 0, 0, 0.1)'
                }}
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sentiment Analysis Table */}
        <div 
          ref={tableRef}
          className="overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '32px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
          }}
        >
          <div className="p-8 border-b border-white/20">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Eye className="w-6 h-6 text-green-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
              Sentiment Metrics
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                  <th className="text-left p-6 font-semibold text-gray-300 text-sm">Metric</th>
                  <th className="text-right p-6 font-semibold text-gray-300 text-sm">Score</th>
                  <th className="text-right p-6 font-semibold text-gray-300 text-sm">Trend</th>
                  <th className="text-right p-6 font-semibold text-gray-300 text-sm">Confidence</th>
                  <th className="text-left p-6 font-semibold text-gray-300 text-sm">Analysis</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && filteredSentimentData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-300 font-medium">Loading sentiment data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSentimentData.map((item, index) => {
                  const SentimentIcon = getSentimentIcon(item.trend);
                  return (
                    <tr 
                      key={index} 
                      className="border-t border-white/10 transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        background: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 50%, #06b6d4 100%)',
                              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
                            }}
                          >
                            <Brain className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{item.metric}</div>
                            <div className="text-sm text-gray-300 font-medium">AI Analysis</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="font-bold text-white text-lg">{item.value}%</div>
                      </td>
                      <td className="p-6 text-right">
                        <div 
                          className={`flex items-center justify-end gap-2 font-bold ${getSentimentColor(item.trend)}`}
                          style={{
                            filter: 'drop-shadow(0 0 8px currentColor)'
                          }}
                        >
                          <SentimentIcon className="w-5 h-5" />
                          {item.trend.toUpperCase()}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="font-bold text-white">{item.confidence}%</div>
                      </td>
                      <td className="p-6">
                        <div className="text-gray-300 text-sm max-w-xs">{item.description}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Disclaimer */}
        <div
          className="mt-12 p-8 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            Understanding Our Sentiment Analysis
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300 text-sm">
            <div>
              <h4 className="font-semibold text-cyan-400 mb-2">📈 Technical Analysis</h4>
              <p>Based on price action indicators including RSI (14-period), MACD signals, and moving averages (SMA 50/200). These reflect chart patterns and trading signals, not fundamental value.</p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">🏗️ Fundamental Analysis</h4>
              <p>Evaluates ecosystem health through on-chain metrics: TVL, trading volume, network performance (TPS, validators), and DeFi protocol adoption. Measures intrinsic value and growth potential.</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-2">💬 Social Sentiment</h4>
              <p>Uses the Crypto Fear & Greed Index from Alternative.me, which analyzes market volatility, momentum, social media trends, surveys, and Bitcoin dominance. Reflects overall market psychology and investor sentiment.</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-xs text-center">
              ⚠️ <strong>Important:</strong> Sentiment scores are informational tools, not investment advice. Technical indicators may show bearish signals while fundamentals remain strong, or vice versa. Always conduct your own research and consider multiple factors before making investment decisions.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div
          className="mt-8 text-center text-gray-300 text-sm p-8 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-green-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
            <span className="font-semibold">Last analysis: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <p className="font-medium">Sentiment analysis updates every 15 minutes • Powered by Real-Time Market Data & AI</p>
          <p className="text-xs text-gray-400 mt-2">Fear & Greed Index data from <a href="https://alternative.me" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Alternative.me</a> • Price data from <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">CoinGecko</a></p>
        </div>
      </div>
    </div>
  );
};

export default MarketSentimentPage;