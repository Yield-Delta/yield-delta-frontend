"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { TrendingUp, ArrowRight, Loader2, Info } from 'lucide-react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useVaults } from '@/hooks/useVaults';

gsap.registerPlugin(ScrollTrigger);

const MarketPage = () => {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const statsCardsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  // Fetch real vault data from API
  const { data: vaults, isLoading, isError } = useVaults();

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
    return `$${num.toFixed(decimals)}`;
  };

  // Calculate total TVL from real vaults
  const totalTVL = vaults?.reduce((sum, v) => sum + v.tvl, 0) || 0;
  const avgAPY = vaults && vaults.length > 0
    ? (vaults.reduce((sum, v) => sum + v.apy, 0) / vaults.length) * 100
    : 0;

  // Three.js Setup for background
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

      // Colors for particles - market theme
      const color = new THREE.Color();
      color.setHSL(Math.random() * 0.4 + 0.4, 0.8, 0.6); // Blue to purple range
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
        color: [0x3b82f6, 0x8b5cf6, 0x06b6d4][index],
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

      particleSystem.rotation.x += 0.0008;
      particleSystem.rotation.y += 0.0015;

      newScene.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.x += 0.008;
          child.rotation.y += 0.008;
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
    if (statsCardsRef.current) {
      const cards = statsCardsRef.current.children;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 80, scale: 0.9 },
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
  }, [vaults]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Three.js Background */}
      <div
        ref={mountRef}
        className="fixed inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 40%, rgba(6, 182, 212, 0.05) 70%, transparent 100%)'
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 50%, rgba(6, 182, 212, 0.12) 100%)',
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
                  SEI Vaults Market
                </h1>
                <p className="text-gray-300 text-lg font-medium">
                  Live vault data on SEI Atlantic-2 Testnet (Chain ID 1328)
                </p>
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
                  <span className="text-green-300 font-semibold text-sm">Live Data</span>
                </div>
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span className="text-blue-300 font-medium text-sm">Chain ID</span>
                  <span className="text-blue-400 font-bold">1328</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        <div ref={statsCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              label: 'Total TVL',
              value: isLoading ? '...' : formatNumber(totalTVL),
              change: 'Live',
              icon: TrendingUp,
              color: 'blue'
            },
            {
              label: 'Active Vaults',
              value: isLoading ? '...' : (vaults?.length || 0).toString(),
              change: 'On SEI',
              icon: TrendingUp,
              color: 'green'
            },
            {
              label: 'Avg APY',
              value: isLoading ? '...' : `${avgAPY.toFixed(1)}%`,
              change: 'Current',
              icon: TrendingUp,
              color: 'purple'
            }
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
              onMouseEnter={(e) => {
                const colors = { blue: '#3b82f6', green: '#10b981', purple: '#8b5cf6' };
                const color = colors[stat.color as keyof typeof colors];
                e.currentTarget.style.borderColor = `${color}60`;
                e.currentTarget.style.boxShadow = `0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px ${color}40, 0 0 0 1px rgba(255, 255, 255, 0.15) inset`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset';
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <stat.icon className={`w-10 h-10 text-${stat.color}-400 group-hover:scale-110 transition-transform duration-300`} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
                <div
                  className={`text-xs font-bold text-${stat.color}-300 px-3 py-1.5 rounded-full`}
                  style={{
                    background: `rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'green' ? '16, 185, 129' : '139, 92, 246'}, 0.2)`,
                    border: `1px solid rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'green' ? '16, 185, 129' : '139, 92, 246'}, 0.4)`,
                    backdropFilter: 'blur(8px)',
                    boxShadow: `0 2px 10px rgba(${stat.color === 'blue' ? '59, 130, 246' : stat.color === 'green' ? '16, 185, 129' : '139, 92, 246'}, 0.15)`
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

        {/* Vaults Table - Real Data */}
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
              <TrendingUp className="w-6 h-6 text-blue-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
              Live Vaults
            </h2>
          </div>

          <div className="overflow-x-auto">
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400 mr-3" />
                <span className="text-lg text-gray-300">Loading vaults...</span>
              </div>
            )}

            {isError && (
              <div className="text-center py-20">
                <div className="text-red-400 text-lg mb-4">Failed to load vaults</div>
                <p className="text-gray-400">Please try again later</p>
              </div>
            )}

            {!isLoading && !isError && vaults && vaults.length === 0 && (
              <div className="text-center py-20">
                <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-xl font-bold text-white mb-2">No Vaults Available</div>
                <p className="text-gray-400">Vaults are being deployed. Check back soon!</p>
              </div>
            )}

            {!isLoading && !isError && vaults && vaults.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                    <th className="text-left p-6 font-semibold text-gray-300 text-sm">Vault</th>
                    <th className="text-right p-6 font-semibold text-gray-300 text-sm">Strategy</th>
                    <th className="text-right p-6 font-semibold text-gray-300 text-sm">TVL</th>
                    <th className="text-right p-6 font-semibold text-gray-300 text-sm">APY</th>
                    <th className="text-right p-6 font-semibold text-gray-300 text-sm">Pair</th>
                    <th className="text-center p-6 font-semibold text-gray-300 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vaults.map((vault) => (
                    <tr
                      key={vault.address}
                      className="border-t border-white/10 transition-all duration-300 hover:scale-[1.01]"
                      style={{ background: 'transparent' }}
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
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                            style={{
                              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
                            }}
                          >
                            {vault.tokenA.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{vault.name}</div>
                            <div className="text-sm text-gray-300 font-medium">Chain ID: {vault.chainId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div
                          className="inline-block px-4 py-1.5 rounded-full text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            color: '#c4b5fd',
                            boxShadow: '0 2px 10px rgba(139, 92, 246, 0.2)'
                          }}
                        >
                          {vault.strategy.replace('_', ' ').toUpperCase()}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="font-bold text-white text-lg">{formatNumber(vault.tvl)}</div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="text-green-400 font-bold text-lg" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}>
                          {(vault.apy * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="font-bold text-cyan-400">{vault.tokenA}-{vault.tokenB}</div>
                      </td>
                      <td className="p-6 text-center">
                        <button
                          onClick={() => router.push(`/vault?address=${vault.address}`)}
                          className="text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 mx-auto font-bold hover:scale-105 group"
                          style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(139, 92, 246, 0.8) 100%)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(59, 130, 246, 0.5)',
                            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 12px 35px rgba(59, 130, 246, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.3)';
                          }}
                        >
                          View Details
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div
          className="mt-16 text-center text-gray-300 text-sm p-8 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)' }}></div>
            <span className="font-semibold">Live data from SEI Atlantic-2 Testnet</span>
          </div>
          <p className="font-medium">All vault data is fetched directly from smart contracts • Chain ID: 1328</p>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
