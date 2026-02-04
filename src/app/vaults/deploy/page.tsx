"use client"

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Rocket, Settings, DollarSign, Shield, TrendingUp, AlertTriangle, CheckCircle, Code, Zap } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

interface VaultConfig {
  name: string;
  symbol: string;
  strategy: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  initialLiquidity: string;
  maxTVL: string;
  performanceFee: number;
  managementFee: number;
}

const DeployVaultPage = () => {
  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentHash, setDeploymentHash] = useState('');
  
  // Three.js and animation refs
  const mountRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  
  const [config, setConfig] = useState<VaultConfig>({
    name: '',
    symbol: '',
    strategy: 'concentrated_liquidity',
    tokenA: 'SEI',
    tokenB: 'USDC',
    fee: 0.003,
    initialLiquidity: '',
    maxTVL: '',
    performanceFee: 2.0,
    managementFee: 0.5
  });

  const strategies = [
    { id: 'concentrated_liquidity', name: 'Concentrated Liquidity', description: 'Capital efficient liquidity provision', risk: 'Medium' },
    { id: 'yield_farming', name: 'Yield Farming', description: 'Automated yield optimization', risk: 'Low' },
    { id: 'arbitrage', name: 'Arbitrage', description: 'Cross-DEX arbitrage opportunities', risk: 'High' },
    { id: 'delta_neutral', name: 'Delta Neutral', description: 'Market neutral strategies', risk: 'Low' },
    { id: 'hedge', name: 'Hedge Strategy', description: 'Risk hedging mechanisms', risk: 'Medium' }
  ];

  const tokens = ['SEI', 'USDC', 'USDT', 'ETH', 'BTC', 'ATOM', 'DAI'];

  const handleDeploy = async () => {
    setIsDeploying(true);
    
    // Simulate deployment process
    setTimeout(() => {
      setDeploymentHash('0x' + Math.random().toString(16).substr(2, 64));
      setStep(4);
      setIsDeploying(false);
    }, 3000);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400 bg-green-400/10';
      case 'Medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'High': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  // Three.js Background Setup
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

      // Colors for particles
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
      opacity: 0.3,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    newScene.add(particleSystem);

    // Geometric shapes for depth
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
        opacity: 0.15,
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
      
      // Rotate particles
      particleSystem.rotation.x += 0.001;
      particleSystem.rotation.y += 0.002;

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

  // GSAP Animations for form steps
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current.children,
        { 
          opacity: 0, 
          y: 50, 
          rotationX: -10,
          scale: 0.95 
        },
        { 
          opacity: 1, 
          y: 0, 
          rotationX: 0,
          scale: 1,
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'back.out(1.4)'
        }
      );
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-background relative text-white">
      {/* Three.js Background */}
      <div 
        ref={mountRef} 
        className="fixed inset-0 z-0"
        style={{ 
          background: 'radial-gradient(ellipse at center, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.05) 50%, transparent 100%)'
        }}
      />
      
      {/* Background overlay to reduce 3D visual interference */}
      <div className="fixed inset-0 z-5 bg-gradient-to-b from-background/70 via-background/60 to-background/70 pointer-events-none" />

      {/* Navigation */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />
      
      {/* Header - Enhanced */}
      <div className="relative z-10" style={{ paddingTop: '1.5rem' }}>
        <div 
          className="border-b border-white/10 backdrop-blur-xl mb-8" 
          style={{
            background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.15) 0%, rgba(0, 245, 212, 0.08) 50%, rgba(255, 32, 110, 0.12) 100%)',
            boxShadow: '0 8px 32px rgba(0, 245, 212, 0.1), 0 0 0 1px rgba(155, 93, 229, 0.2)'
          }}
        >
          <div className="container mx-auto max-w-4xl px-4 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center gap-6 mb-6">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.25), rgba(155, 93, 229, 0.25))',
                    backdropFilter: 'blur(20px)',
                    border: '2px solid rgba(0, 245, 212, 0.3)',
                    boxShadow: '0 0 40px rgba(0, 245, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <Rocket className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-secondary">
                Deploy New Vault
              </h1>
              <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
                Create and deploy sophisticated AI-powered yield strategies on the SEI blockchain
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-4xl px-4 py-16" ref={formRef}>
        {/* Progress Steps - Enhanced */}
        <div className="flex items-center justify-center mb-16">
          <div 
            className="flex items-center gap-8 p-6 rounded-2xl backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
            }}
          >
            {[
              { num: 1, label: 'Configure', icon: Settings },
              { num: 2, label: 'Tokens', icon: DollarSign },
              { num: 3, label: 'Review', icon: Shield },
              { num: 4, label: 'Deploy', icon: Rocket }
            ].map(({ num, label, icon: Icon }, index) => (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center gap-3">
                  <div 
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 relative ${
                      step >= num 
                        ? 'text-white shadow-2xl' 
                        : 'border-white/20 text-gray-400'
                    }`}
                    style={{
                      background: step >= num 
                        ? 'linear-gradient(135deg, rgba(0, 245, 212, 0.3), rgba(155, 93, 229, 0.3))' 
                        : 'rgba(255, 255, 255, 0.05)',
                      borderColor: step >= num ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 255, 255, 0.2)',
                      boxShadow: step >= num 
                        ? '0 0 30px rgba(0, 245, 212, 0.4), 0 0 60px rgba(155, 93, 229, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                        : 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    {step > num ? (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    ) : (
                      <Icon className="w-8 h-8" />
                    )}
                    
                    {/* Animated ring for active step */}
                    {step === num && (
                      <div 
                        className="absolute inset-0 rounded-2xl animate-pulse"
                        style={{
                          border: '3px solid rgba(0, 245, 212, 0.8)',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      />
                    )}
                  </div>
                  <div className={`text-sm font-semibold transition-all ${
                    step >= num ? 'text-primary' : 'text-gray-400'
                  }`}>
                    {label}
                  </div>
                </div>
                {index < 3 && (
                  <div className="flex items-center">
                    <div 
                      className={`w-24 h-1 rounded-full transition-all duration-500 ${
                        step > num 
                          ? 'bg-gradient-to-r from-primary to-accent' 
                          : 'bg-white/10'
                      }`}
                      style={{
                        boxShadow: step > num 
                          ? '0 0 20px rgba(0, 245, 212, 0.5)' 
                          : 'none'
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-8">
            <div 
              className="backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.3), rgba(155, 93, 229, 0.3))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0, 245, 212, 0.4)',
                    boxShadow: '0 0 20px rgba(0, 245, 212, 0.3)'
                  }}
                >
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                  Basic Configuration
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">Vault Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({...config, name: e.target.value})}
                    placeholder="e.g., SEI Optimized Yield Vault"
                    className="w-full rounded-xl px-6 py-4 text-white text-lg font-medium placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(0, 245, 212, 0.6)';
                      e.target.style.boxShadow = '0 0 30px rgba(0, 245, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">Symbol</label>
                  <input
                    type="text"
                    value={config.symbol}
                    onChange={(e) => setConfig({...config, symbol: e.target.value.toUpperCase()})}
                    placeholder="e.g., SOYV"
                    className="w-full rounded-xl px-6 py-4 text-white text-lg font-medium placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(0, 245, 212, 0.6)';
                      e.target.style.boxShadow = '0 0 30px rgba(0, 245, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>
            </div>

            <div 
              className="backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.3), rgba(255, 32, 110, 0.3))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(155, 93, 229, 0.4)',
                    boxShadow: '0 0 20px rgba(155, 93, 229, 0.3)'
                  }}
                >
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                  Strategy Selection
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {strategies.map((strategy) => {
                  const isSelected = config.strategy === strategy.id;
                  return (
                    <div
                      key={strategy.id}
                      onClick={() => setConfig({...config, strategy: strategy.id})}
                      className={`group p-6 rounded-2xl border-2 cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
                        isSelected ? 'shadow-2xl' : ''
                      }`}
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, rgba(0, 245, 212, 0.15), rgba(155, 93, 229, 0.15))'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                        borderColor: isSelected ? 'rgba(0, 245, 212, 0.6)' : 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: isSelected 
                          ? '0 0 40px rgba(0, 245, 212, 0.4), 0 0 80px rgba(155, 93, 229, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                          : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(155, 93, 229, 0.4)';
                          e.currentTarget.style.boxShadow = '0 0 30px rgba(155, 93, 229, 0.3), 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className={`text-xl font-bold mb-2 transition-all ${
                            isSelected ? 'text-primary' : 'text-white group-hover:text-accent'
                          }`}>
                            {strategy.name}
                          </div>
                          <div className="text-muted-foreground text-base font-medium">
                            {strategy.description}
                          </div>
                        </div>
                        <div 
                          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${getRiskColor(strategy.risk)}`}
                          style={{
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                          }}
                        >
                          {strategy.risk} Risk
                        </div>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="mt-4 flex items-center gap-2 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-semibold">Selected Strategy</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!config.name || !config.symbol}
              className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
              style={{
                background: !config.name || !config.symbol 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(135deg, rgba(0, 245, 212, 0.8), rgba(155, 93, 229, 0.8))',
                border: '2px solid rgba(0, 245, 212, 0.4)',
                boxShadow: !config.name || !config.symbol 
                  ? 'none' 
                  : '0 0 40px rgba(0, 245, 212, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)'
              }}
              onMouseEnter={(e) => {
                if (config.name && config.symbol) {
                  e.currentTarget.style.boxShadow = '0 0 60px rgba(0, 245, 212, 0.6), 0 15px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (config.name && config.symbol) {
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 245, 212, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <span>Continue to Token Configuration</span>
                <DollarSign className="w-6 h-6" />
              </div>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div 
              className="backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(0, 245, 212, 0.3))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-primary">
                  Token Configuration
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">Token A</label>
                  <select
                    value={config.tokenA}
                    onChange={(e) => setConfig({...config, tokenA: e.target.value})}
                    className="w-full rounded-xl px-6 py-4 text-white text-lg font-medium transition-all duration-300 focus:outline-none focus:scale-105 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                      e.target.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {tokens.map(token => (
                      <option key={token} value={token} className="bg-gray-800 text-white">{token}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">Token B</label>
                  <select
                    value={config.tokenB}
                    onChange={(e) => setConfig({...config, tokenB: e.target.value})}
                    className="w-full rounded-xl px-6 py-4 text-white text-lg font-medium transition-all duration-300 focus:outline-none focus:scale-105 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                      e.target.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {tokens.map(token => (
                      <option key={token} value={token} className="bg-gray-800 text-white">{token}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-primary mb-3">Pool Fee (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={config.fee}
                    onChange={(e) => setConfig({...config, fee: parseFloat(e.target.value)})}
                    className="w-full rounded-xl px-6 py-4 text-white text-lg font-medium placeholder-gray-400 transition-all duration-300 focus:outline-none focus:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                      border: '2px solid rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                      e.target.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => setStep(1)}
                className="py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <Settings className="w-6 h-6" />
                  <span>Back to Configuration</span>
                </div>
              </button>
              <button
                onClick={() => setStep(3)}
                className="py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.8), rgba(155, 93, 229, 0.8))',
                  border: '2px solid rgba(0, 245, 212, 0.4)',
                  boxShadow: '0 0 40px rgba(0, 245, 212, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 60px rgba(0, 245, 212, 0.6), 0 15px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 245, 212, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <span>Continue to Review</span>
                  <Shield className="w-6 h-6" />
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div 
              className="backdrop-blur-xl border rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset'
              }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(255, 206, 84, 0.3))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  <Shield className="w-6 h-6 text-yellow-400" />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                  Review & Deploy
                </h2>
              </div>

              <div className="space-y-8">
                <div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Name:</span> 
                      <span className="text-primary font-bold">{config.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Symbol:</span> 
                      <span className="text-accent font-bold">{config.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Strategy:</span> 
                      <span className="text-secondary font-bold">{strategies.find(s => s.id === config.strategy)?.name}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Pair:</span> 
                      <span className="text-green-400 font-bold">{config.tokenA}-{config.tokenB}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Fee:</span> 
                      <span className="text-blue-400 font-bold">{(config.fee * 100).toFixed(3)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Network:</span> 
                      <span className="text-purple-400 font-bold">SEI Testnet</span>
                    </div>
                  </div>
                </div>

                <div 
                  className="rounded-2xl p-6 backdrop-blur-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(255, 206, 84, 0.1))',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    boxShadow: '0 0 30px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    <span className="text-xl font-bold text-yellow-400">Deployment Requirements</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-white font-medium">Gas fee: ~0.1 SEI</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-white font-medium">Minimum liquidity: 1 SEI</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-white font-medium">Verified on SeiTrace</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-white font-medium">Deploy time: 30-60s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => setStep(2)}
                className="py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 group relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <DollarSign className="w-6 h-6" />
                  <span>Back to Tokens</span>
                </div>
              </button>
              <button
                onClick={handleDeploy}
                disabled={isDeploying}
                className="py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 disabled:hover:scale-100 group relative overflow-hidden flex items-center justify-center gap-3"
                style={{
                  background: isDeploying 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(59, 130, 246, 0.8))',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: isDeploying 
                    ? 'none' 
                    : '0 0 40px rgba(16, 185, 129, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  opacity: isDeploying ? '0.5' : '1',
                  cursor: isDeploying ? 'not-allowed' : 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isDeploying) {
                    e.currentTarget.style.boxShadow = '0 0 60px rgba(16, 185, 129, 0.6), 0 15px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDeploying) {
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }
                }}
              >
                {isDeploying ? (
                  <>
                    <div 
                      className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"
                      style={{ 
                        borderWidth: '3px',
                        animation: 'spin 1s linear infinite'
                      }}
                    />
                    <span>Deploying Vault...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-6 h-6" />
                    <span>Deploy Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-8">
            <div 
              className="backdrop-blur-xl border rounded-3xl p-12 transition-all duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.1))',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 0 60px rgba(16, 185, 129, 0.3), 0 25px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Success Icon */}
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8), rgba(52, 211, 153, 0.8))',
                  boxShadow: '0 0 40px rgba(16, 185, 129, 0.6), 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(20px)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              >
                <CheckCircle className="w-12 h-12 text-white" />
                
                {/* Animated ring */}
                <div 
                  className="absolute inset-0 rounded-full border-4 border-green-400/60"
                  style={{
                    animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                  }}
                />
              </div>

              {/* Success Message */}
              <h2 className="text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                Vault Deployed Successfully!
              </h2>
              <p className="text-xl text-muted-foreground font-medium mb-8 max-w-2xl mx-auto">
                Your sophisticated AI-powered yield vault has been successfully deployed to the SEI blockchain
              </p>
              
              {/* Transaction Details */}
              <div 
                className="rounded-2xl p-6 mb-8 backdrop-blur-xl mx-auto max-w-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                }}
              >
                <div className="text-lg font-semibold text-muted-foreground mb-3">Transaction Hash</div>
                <div 
                  className="font-mono text-primary text-lg font-bold break-all p-4 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(59, 130, 246, 0.1))',
                    border: '1px solid rgba(0, 245, 212, 0.3)'
                  }}
                >
                  {deploymentHash}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  className="px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 group relative overflow-hidden flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.8))',
                    border: '2px solid rgba(59, 130, 246, 0.4)',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(20px)',
                    minWidth: '200px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 50px rgba(59, 130, 246, 0.6), 0 15px 35px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.4), 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <Code className="w-5 h-5" />
                  <span>View on SeiTrace</span>
                </button>
                
                <button 
                  onClick={() => window.location.href = '/vaults'}
                  className="px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-500 hover:scale-105 group relative overflow-hidden flex items-center gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(155, 93, 229, 0.8), rgba(255, 32, 110, 0.8))',
                    border: '2px solid rgba(155, 93, 229, 0.4)',
                    boxShadow: '0 0 30px rgba(155, 93, 229, 0.4), 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(20px)',
                    minWidth: '200px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 50px rgba(155, 93, 229, 0.6), 0 15px 35px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 30px rgba(155, 93, 229, 0.4), 0 10px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Manage Vault</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployVaultPage;