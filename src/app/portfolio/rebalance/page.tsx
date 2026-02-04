"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import AIChat from '@/components/AIChat';
import { BarChart3, TrendingUp, AlertTriangle, Zap, CheckCircle, RefreshCw, MessageCircle, X, Bot, Activity, Info, Wallet, Loader2 } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { useVaults } from '@/hooks/useVaults';
import { useMultipleVaultPositions } from '@/hooks/useMultipleVaultPositions';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { getTokenInfo } from '@/utils/tokenUtils';
import { useTokenPrices, convertToUSD } from '@/hooks/useTokenPrices';
import { calculateSimulatedYield } from '@/utils/simulatedYield';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

interface AIRecommendation {
  id: string;
  type: 'optimization' | 'risk_alert' | 'opportunity';
  vault: string;
  description: string;
  impact: string;
  confidence: number;
  timestamp: Date;
}

interface RebalanceEvent {
  id: string;
  timestamp: Date;
  vault: string;
  action: string;
  result: string;
  txHash?: string;
}

const RebalanceDashboardPage = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [rebalanceHistory, setRebalanceHistory] = useState<RebalanceEvent[]>([]);

  // Real data hooks
  const { address: userAddress } = useAccount();
  const { data: vaults, isLoading: vaultsLoading } = useVaults();
  const { data: tokenPrices, isLoading: pricesLoading } = useTokenPrices();

  // Get vault addresses for positions
  const vaultAddresses = useMemo(() => {
    return vaults?.map(v => v.address) || [];
  }, [vaults]);

  // Fetch user positions
  const { positions: rawPositions, isLoading: positionsLoading } = useMultipleVaultPositions(vaultAddresses);

  // Refs for animations
  const mountRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Combine vault data with positions for portfolio stats
  const vaultPositions = useMemo(() => {
    if (!vaults || !userAddress || !mounted) return [];

    return vaults
      .map(vault => {
        const positionData = rawPositions.find(p => p.address === vault.address);

        if (!positionData?.hasPosition || !positionData.position) return null;

        const position = positionData.position;

        // Get token info to determine correct decimals
        const tokenInfo = getTokenInfo(vault.tokenA);
        const decimals = tokenInfo?.decimals || 18;

        // Format values with correct decimals
        const shareValue = parseFloat(formatUnits(BigInt(position.shareValue), decimals));
        const totalDeposited = parseFloat(formatUnits(BigInt(position.totalDeposited), decimals));
        const totalWithdrawn = parseFloat(formatUnits(BigInt(position.totalWithdrawn), decimals));

        // Calculate P&L correctly: (currentValue + withdrawn) - deposited
        const totalValue = shareValue + totalWithdrawn;
        const pnl = totalValue - totalDeposited;
        const pnlPercent = totalDeposited > 0 ? (pnl / totalDeposited) * 100 : 0;

        return {
          address: vault.address,
          name: vault.name,
          strategy: vault.strategy,
          shares: position.shares,
          shareValue: position.shareValue,
          totalDeposited: position.totalDeposited,
          depositTime: position.depositTime,
          apy: vault.apy * 100,
          pnl,
          pnlPercent,
        };
      })
      .filter(pos => pos !== null);
  }, [vaults, userAddress, rawPositions, mounted]);

  // Calculate real portfolio stats in USD with simulated yield
  const portfolioStats = useMemo(() => {
    if (vaultPositions.length === 0 || !tokenPrices) {
      return {
        totalValue: 0,
        unrealizedPnL: 0,
        dailyChange: 0,
        avgAPY: 0,
        activePositions: 0,
        simulatedYield: 0,
      };
    }

    // Calculate total value, P&L, and simulated yield in USD
    let totalValueUSD = 0;
    let totalDepositedUSD = 0;
    let unrealizedPnLUSD = 0;
    let totalSimulatedYieldUSD = 0;

    vaultPositions.forEach(pos => {
      if (!vaults) return;
      const vault = vaults.find(v => v.address === pos.address);
      if (!vault) return;

      const tokenInfo = getTokenInfo(vault.tokenA);
      const decimals = tokenInfo?.decimals || 18;
      const tokenSymbol = tokenInfo?.symbol || 'SEI';

      // Get values in native token
      const shareValue = parseFloat(formatUnits(BigInt(pos.shareValue), decimals));
      const totalDeposited = parseFloat(formatUnits(BigInt(pos.totalDeposited), decimals));

      // Calculate simulated yield
      const depositTimestamp = parseInt(pos.depositTime) * 1000; // Convert to milliseconds
      const simulatedYield = calculateSimulatedYield(
        totalDeposited,
        depositTimestamp,
        vault.apy,
      );

      // Convert to USD
      const tokenPrice = tokenPrices[tokenSymbol as keyof typeof tokenPrices] || 0;
      const shareValueUSD = convertToUSD(shareValue, tokenSymbol, tokenPrices);
      const totalDepositedUSD_pos = convertToUSD(totalDeposited, tokenSymbol, tokenPrices);
      const pnlUSD = convertToUSD(pos.pnl, tokenSymbol, tokenPrices);
      const simulatedYieldUSD = simulatedYield.totalYield * tokenPrice;

      totalValueUSD += shareValueUSD;
      totalDepositedUSD += totalDepositedUSD_pos;
      unrealizedPnLUSD += pnlUSD;
      totalSimulatedYieldUSD += simulatedYieldUSD;
    });

    const dailyChange = totalDepositedUSD > 0 ? (unrealizedPnLUSD / totalDepositedUSD) * 100 : 0;
    const avgAPY = vaultPositions.reduce((sum, pos) => sum + pos.apy, 0) / vaultPositions.length;

    return {
      totalValue: totalValueUSD,
      unrealizedPnL: unrealizedPnLUSD,
      dailyChange,
      avgAPY,
      activePositions: vaultPositions.length,
      simulatedYield: totalSimulatedYieldUSD,
    };
  }, [vaultPositions, vaults, tokenPrices]);

  // Simulate AI analysis (in production, this would call the actual AI endpoint)
  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate mock AI recommendations based on actual positions
    const recommendations: AIRecommendation[] = vaultPositions.map((pos, index) => ({
      id: `rec-${index}`,
      type: index === 0 ? 'optimization' : index === 1 ? 'opportunity' : 'risk_alert',
      vault: pos.name,
      description: index === 0
        ? `Position in ${pos.name} could benefit from range adjustment based on current price movement`
        : index === 1
        ? `Higher yield opportunity detected in alternative strategy for ${pos.name}`
        : `Monitoring elevated volatility in ${pos.name} market conditions`,
      impact: index === 0 ? '+2.3% APY' : index === 1 ? '+5.1% APY' : 'Risk mitigation',
      confidence: 85 - (index * 10),
      timestamp: new Date(),
    }));

    setAiRecommendations(recommendations.length > 0 ? recommendations : [
      {
        id: 'default',
        type: 'optimization',
        vault: 'Portfolio',
        description: 'Your portfolio is currently optimized. No immediate actions recommended.',
        impact: 'Stable',
        confidence: 95,
        timestamp: new Date(),
      }
    ]);

    // Mock historical rebalance events
    setRebalanceHistory([
      {
        id: 'hist-1',
        timestamp: new Date(Date.now() - 86400000 * 2),
        vault: 'SEI-USDC LP',
        action: 'Range Adjustment',
        result: 'Increased yield by 3.2%',
        txHash: '0x1234...5678',
      },
      {
        id: 'hist-2',
        timestamp: new Date(Date.now() - 86400000 * 5),
        vault: 'ETH-USDT Arbitrage',
        action: 'Position Optimization',
        result: 'Reduced impermanent loss risk',
        txHash: '0xabcd...efgh',
      },
    ]);

    setIsAnalyzing(false);
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <Zap className="w-5 h-5 text-blue-400" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'risk_alert': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default: return <Info className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Three.js Setup
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
    const particleCount = 1000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i + 1] = (Math.random() - 0.5) * 100;
      positions[i + 2] = (Math.random() - 0.5) * 100;

      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.3 + 0.5, 0.7, 0.5);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      transparent: true,
      opacity: 0.2,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    newScene.add(particleSystem);

    // Geometric shapes
    const geometries = [
      new THREE.TetrahedronGeometry(2),
      new THREE.OctahedronGeometry(1.5),
      new THREE.IcosahedronGeometry(1),
    ];

    geometries.forEach((geometry, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: [0x00f5d4, 0x9b5de5, 0xff206e][index],
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50
      );
      newScene.add(mesh);
    });

    camera.position.z = 30;
    setScene(newScene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      particleSystem.rotation.x += 0.001;
      particleSystem.rotation.y += 0.002;

      newScene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.01;
          child.rotation.y += 0.01;
        }
      });

      renderer.render(newScene, camera);
    };

    animate();

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
    if (cardsRef.current) {
      const cards = cardsRef.current.children;

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 100,
          rotationX: -15,
          scale: 0.8
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          scale: 1,
          duration: 1.2,
          stagger: 0.2,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
          }
        }
      );
    }

    if (statsRef.current) {
      gsap.fromTo(
        statsRef.current.children,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 90%',
          }
        }
      );
    }
  }, []);

  const isLoading = !mounted || vaultsLoading || positionsLoading || pricesLoading;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Three.js Background */}
      <div
        ref={mountRef}
        className="fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.05) 50%, transparent 100%)'
        }}
      />

      {/* Background overlay */}
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-background/70 via-background/60 to-background/70 pointer-events-none" />

      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      {/* Header */}
      <div className="relative z-10" style={{ paddingTop: '1.5rem' }}>
        <div
          className="border-b border-white/10 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.08) 50%, rgba(255, 32, 110, 0.12) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(155, 93, 229, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 245, 212, 0.1)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #00f5d4 0%, #ff206e 100%)',
                    boxShadow: '0 0 30px rgba(0, 245, 212, 0.4)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-3xl font-extrabold flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #00f5d4 0%, #9b5de5 50%, #ff206e 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 30px rgba(0, 245, 212, 0.5)'
                    }}
                  >
                    AI Rebalancing Dashboard
                  </h1>
                  <p className="text-gray-300 mt-1 font-medium">Kairos AI automatically optimizes your positions</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400 font-medium">Portfolio Value</div>
                <div
                  className="text-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #00f5d4 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {isLoading ? '...' : formatCurrency(portfolioStats.totalValue)}
                </div>
                {!isLoading && portfolioStats.totalValue > 0 && (
                  <div
                    className={`text-sm font-bold ${
                      portfolioStats.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                    style={{
                      textShadow: `0 0 10px ${portfolioStats.dailyChange >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`
                    }}
                  >
                    {portfolioStats.dailyChange >= 0 ? '+' : ''}{portfolioStats.dailyChange.toFixed(2)}% P&L
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mr-3" />
            <span className="text-lg text-gray-300">Loading your portfolio...</span>
          </div>
        )}

        {/* No Wallet Connected */}
        {mounted && !userAddress && !vaultsLoading && (
          <div className="text-center py-20">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Please connect your wallet to view AI rebalancing insights</p>
          </div>
        )}

        {/* No Positions */}
        {mounted && userAddress && !isLoading && vaultPositions.length === 0 && (
          <div className="text-center py-20">
            <Info className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Active Positions</h2>
            <p className="text-gray-400 mb-6">Deposit to vaults to enable AI-powered rebalancing</p>
            <Link
              href="/vaults"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all"
            >
              Explore Vaults
            </Link>
          </div>
        )}

        {/* Main Content - Show when user has positions */}
        {!isLoading && userAddress && vaultPositions.length > 0 && (
          <>
            {/* Automated Rebalancing Info Banner */}
            <div
              className="mb-8 p-6 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.15) 0%, rgba(155, 93, 229, 0.15) 100%)',
                border: '1px solid rgba(0, 245, 212, 0.3)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #00f5d4 0%, #9b5de5 100%)',
                  }}
                >
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Automated AI Rebalancing Active</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Kairos AI continuously monitors your positions and automatically executes optimal rebalancing strategies.
                    This dashboard shows you what the AI is analyzing and recommending. You don&apos;t need to take manual action -
                    the AI handles optimization automatically using SEI&apos;s 400ms finality for lightning-fast execution.
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Unrealized P&L', value: formatCurrency(portfolioStats.unrealizedPnL), change: `${portfolioStats.dailyChange >= 0 ? '+' : ''}${portfolioStats.dailyChange.toFixed(1)}%`, color: '#10b981' },
                { label: 'Average APY', value: `${portfolioStats.avgAPY.toFixed(1)}%`, change: 'Across positions', color: '#3b82f6' },
                { label: 'Active Positions', value: portfolioStats.activePositions.toString(), change: 'Being monitored', color: '#9b5de5' },
                { label: 'AI Status', value: 'Active', change: '24/7 monitoring', color: '#f59e0b' }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="transition-all duration-500 hover:scale-105 cursor-pointer group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${stat.color}60`;
                    e.currentTarget.style.boxShadow = `0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px ${stat.color}40, 0 0 0 1px rgba(255, 255, 255, 0.15) inset`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
                  }}
                >
                  <div className="text-gray-300 text-sm mb-2 font-medium">{stat.label}</div>
                  <div
                    className="text-xl font-black mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${stat.color} 0%, #ffffff 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: `0 0 20px ${stat.color}40`
                    }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm font-bold" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}40` }}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* AI Analysis Section */}
            <div ref={cardsRef}>
              <div
                className="mb-8 group transition-all duration-500 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(155, 93, 229, 0.3)',
                  borderRadius: '24px',
                  padding: '2rem',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(155, 93, 229, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2
                    className="text-2xl font-black flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #fbae3c 0%, #ff206e 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 30px rgba(251, 174, 60, 0.5)'
                    }}
                  >
                    <Zap className="w-6 h-6" style={{ color: '#fbae3c', filter: 'drop-shadow(0 0 10px rgba(251, 174, 60, 0.7))' }} />
                    AI Analysis & Recommendations
                  </h2>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 font-bold px-6 py-3 rounded-xl disabled:opacity-50"
                    style={{
                      background: isAnalyzing
                        ? 'linear-gradient(135deg, rgba(251, 174, 60, 0.3) 0%, rgba(255, 32, 110, 0.3) 100%)'
                        : 'linear-gradient(135deg, #fbae3c 0%, #ff206e 100%)',
                      color: '#000000',
                      boxShadow: '0 10px 30px rgba(251, 174, 60, 0.4), 0 0 20px rgba(255, 32, 110, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Run Analysis
                      </>
                    )}
                  </button>
                </div>

                {isAnalyzing ? (
                  <div className="text-center py-12">
                    <div
                      className="w-20 h-20 rounded-full animate-spin mx-auto mb-6"
                      style={{
                        border: '4px solid rgba(251, 174, 60, 0.3)',
                        borderTop: '4px solid #fbae3c',
                        boxShadow: '0 0 40px rgba(251, 174, 60, 0.6)'
                      }}
                    />
                    <div
                      className="text-xl font-black mb-3"
                      style={{
                        background: 'linear-gradient(135deg, #fbae3c 0%, #ff206e 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 20px rgba(251, 174, 60, 0.5)'
                      }}
                    >
                      Kairos AI Analyzing
                    </div>
                    <div className="text-gray-300 font-medium">Scanning market conditions and optimizing strategies...</div>
                  </div>
                ) : aiRecommendations.length > 0 ? (
                  <div className="space-y-6">
                    <div
                      className="rounded-xl p-6 mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <div className="flex items-center gap-3 text-green-400 mb-3">
                        <CheckCircle className="w-6 h-6" style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.7))' }} />
                        <span className="font-black text-lg">Analysis Complete</span>
                      </div>
                      <p className="text-gray-200 font-medium text-lg">
                        Found <span className="font-black text-green-400">{aiRecommendations.length}</span> insights for your positions
                      </p>
                    </div>

                    {/* AI Recommendations */}
                    <div className="space-y-4">
                      {aiRecommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="transition-all duration-500 hover:scale-[1.02] group"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                            backdropFilter: 'blur(15px)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '20px',
                            padding: '1.5rem',
                            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div
                                className="flex items-center justify-center w-12 h-12 rounded-xl"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.2) 0%, rgba(155, 93, 229, 0.2) 100%)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(0, 245, 212, 0.3)',
                                  boxShadow: '0 0 20px rgba(0, 245, 212, 0.3)'
                                }}
                              >
                                {getRecommendationIcon(rec.type)}
                              </div>
                              <div>
                                <div
                                  className="font-black text-lg capitalize mb-1"
                                  style={{
                                    background: 'linear-gradient(135deg, #ffffff 0%, #00f5d4 100%)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                  }}
                                >
                                  {rec.vault}
                                </div>
                                <div className="text-sm text-gray-400 font-medium capitalize">
                                  {rec.type.replace('_', ' ')}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div
                                className="font-black text-lg"
                                style={{
                                  background: 'linear-gradient(135deg, #00f5d4 0%, #9b5de5 100%)',
                                  backgroundClip: 'text',
                                  WebkitBackgroundClip: 'text',
                                  WebkitTextFillColor: 'transparent'
                                }}
                              >
                                {rec.impact}
                              </div>
                              <div className="text-sm text-gray-400 font-bold">
                                {rec.confidence}% confidence
                              </div>
                            </div>
                          </div>

                          <div
                            className="text-sm font-medium rounded-xl p-4"
                            style={{
                              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)',
                              border: '1px solid rgba(155, 93, 229, 0.3)',
                              backdropFilter: 'blur(10px)',
                              color: '#e5e7eb'
                            }}
                          >
                            {rec.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3
                      className="w-20 h-20 mx-auto mb-6 opacity-50"
                      style={{
                        color: '#9b5de5',
                        filter: 'drop-shadow(0 0 20px rgba(155, 93, 229, 0.3))'
                      }}
                    />
                    <div
                      className="text-lg font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #9b5de5 0%, #00f5d4 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      Click &quot;Run Analysis&quot; to see AI recommendations
                    </div>
                  </div>
                )}
              </div>

              {/* Historical Activity */}
              {rebalanceHistory.length > 0 && (
                <div
                  className="group transition-all duration-500 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '24px',
                    padding: '2rem',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(59, 130, 246, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
                  }}
                >
                  <h3
                    className="text-2xl font-black mb-6 flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
                    }}
                  >
                    <Activity className="w-6 h-6" style={{ color: '#3b82f6', filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.7))' }} />
                    Recent AI Rebalancing Activity
                  </h3>

                  <div className="space-y-4">
                    {rebalanceHistory.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">{event.vault}</div>
                          <div className="text-sm text-gray-400">
                            {event.timestamp.toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-300">{event.action}</div>
                          <div className="text-sm text-green-400 font-medium">{event.result}</div>
                        </div>
                        {event.txHash && (
                          <div className="mt-2 text-xs text-gray-500 font-mono">
                            TX: {event.txHash}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* AI Chat Interface */}
      {showChat && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-end p-4 pointer-events-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 40,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '1rem'
          }}
        >
          <div
            className="pointer-events-auto w-full max-w-md h-[600px] mr-4 mb-20"
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: '28rem',
              minWidth: '320px',
              height: '600px',
              marginRight: '1rem',
              marginBottom: '5rem',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 245, 212, 0.2)',
              color: '#ffffff',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <AIChat
              className="h-full ai-chat-override"
              context={{
                currentPage: 'rebalance-dashboard',
                userPreferences: {
                  portfolioStats,
                  aiRecommendations,
                  rebalanceHistory,
                }
              }}
              initialMessage="Welcome to the AI Rebalancing Dashboard! I'm Kairos, your AI assistant. I automatically optimize your positions 24/7. Ask me about current recommendations, how automated rebalancing works, or your portfolio performance."
            />

            <style jsx>{`
              .ai-chat-override input {
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 100%) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                color: #ffffff !important;
                font-size: 14px !important;
                padding: 12px 16px !important;
                border-radius: 12px !important;
                backdrop-filter: blur(10px) !important;
                outline: none !important;
              }

              .ai-chat-override input:focus {
                border-color: rgba(0, 245, 212, 0.5) !important;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%) !important;
                box-shadow: 0 0 20px rgba(0, 245, 212, 0.2) !important;
              }

              .ai-chat-override input::placeholder {
                color: rgba(255, 255, 255, 0.4) !important;
              }

              .ai-chat-override * {
                color: #ffffff;
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Floating AI Chat Button */}
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
          isolation: 'isolate',
          pointerEvents: 'auto'
        }}
      >
        <div className="relative">
          {/* Glow Ring */}
          <div
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: 'linear-gradient(45deg, #00f5d4, #ff206e, #9b5de5, #00f5d4)',
              backgroundSize: '400% 400%',
              borderRadius: '50%',
              filter: 'blur(8px)',
              opacity: '0.6',
              transform: 'scale(1.4)'
            }}
          />

          {/* Main Button */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="relative text-white rounded-full transition-all duration-300 hover:scale-110 group"
            style={{
              position: 'relative',
              background: 'linear-gradient(135deg, #00f5d4 0%, #10b981 30%, #ff206e 70%, #9b5de5 100%)',
              border: '4px solid #ffffff',
              borderRadius: '50%',
              padding: '20px',
              boxShadow: '0 0 50px rgba(0, 245, 212, 0.8), 0 0 100px rgba(255, 32, 110, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              fontSize: '28px',
              backdropFilter: 'blur(20px)'
            }}
          >
            {showChat ? (
              <X className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
            ) : (
              <MessageCircle className="w-8 h-8" style={{ filter: 'drop-shadow(0 0 10px #ffffff)' }} />
            )}

            {/* Tooltip */}
            <div
              className="absolute -top-20 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
                backdropFilter: 'blur(20px)',
                border: '2px solid #00f5d4',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '700',
                color: '#ffffff',
                textShadow: '0 0 10px #00f5d4',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 50px rgba(0, 245, 212, 0.5)',
                zIndex: 999
              }}
            >
              {showChat ? 'Close AI Assistant' : 'Ask Kairos AI'}
            </div>
          </button>

          {/* Status Indicator */}
          {!showChat && (
            <div
              className="absolute -top-1 -right-1"
              style={{
                width: '18px',
                height: '18px',
                background: 'radial-gradient(circle, #00ff00 0%, #00cc00 100%)',
                borderRadius: '50%',
                border: '2px solid #ffffff',
                boxShadow: '0 0 20px rgba(0, 255, 0, 0.8)',
                animation: 'pulse 2s ease-in-out infinite'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default RebalanceDashboardPage;
