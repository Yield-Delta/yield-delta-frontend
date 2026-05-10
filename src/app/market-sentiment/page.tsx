"use client"

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, TrendingDown, Brain, Target, Activity, Clock, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Public_Sans, Space_Grotesk } from 'next/font/google';

gsap.registerPlugin(ScrollTrigger);

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-public-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
});

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
  
  const mainRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Heritage Color Palette
  const colors = {
    primary: "#1A1C1E",    // Deep Ink
    secondary: "#6C7278",  // Slate
    tertiary: "#B8422E",   // Boston Clay (Accent)
    neutral: "#F7F5F2",    // Warm Limestone (Background)
    bullish: "#2D6A4F",    // Heritage Green
    bearish: "#B8422E",    // Heritage Red (using Boston Clay)
  };

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentimentData();

    const interval = setInterval(fetchSentimentData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const getSentimentColor = (trend: string) => {
    switch (trend) {
      case 'bullish': return colors.bullish;
      case 'bearish': return colors.bearish;
      default: return colors.primary;
    }
  };

  const getSentimentIcon = (trend: string) => {
    switch (trend) {
      case 'bullish': return TrendingUp;
      case 'bearish': return TrendingDown;
      default: return Activity;
    }
  };

  const filteredSentimentData = selectedCategory === 'all'
    ? sentimentData
    : sentimentData.filter(item => item.category === selectedCategory);

  useEffect(() => {
    if (!isLoading) {
      const ctx = gsap.context(() => {
        // Staggered Entrance for Header
        gsap.from(".heritage-header-item", {
          opacity: 0,
          y: 30,
          duration: 1.2,
          stagger: 0.15,
          ease: "expo.out",
        });

        // Scroll Reveal for Cards
        gsap.from(".sentiment-card", {
          opacity: 0,
          y: 40,
          duration: 1,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 85%",
          }
        });

        // Magnetic Reveal for border
        gsap.to(".heritage-divider", {
          scaleX: 1,
          duration: 1.5,
          ease: "expo.inOut",
          stagger: 0.2,
        });
      }, mainRef);

      return () => ctx.revert();
    }
  }, [isLoading, filteredSentimentData]);

  return (
    <div className={`min-h-screen ${publicSans.variable} ${spaceGrotesk.variable} bg-[#1A1C1E] text-[#F7F5F2] selection:bg-[#B8422E] selection:text-white transition-colors duration-700`} style={{ fontFamily: 'var(--font-public-sans)' }}>
      <style jsx global>{`
        .font-heritage-sans { font-family: var(--font-public-sans); }
        .font-heritage-grotesk { font-family: var(--font-space-grotesk); }
        .heritage-caps { 
          font-family: var(--font-space-grotesk); 
          font-size: 0.75rem; 
          text-transform: uppercase; 
          letter-spacing: 0.2em; 
          font-weight: 700;
        }
        .heritage-dark-card {
          background-color: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .heritage-dark-card:hover {
          background-color: rgba(255, 255, 255, 0.04);
          border-color: rgba(184, 66, 46, 0.3);
        }
      `}</style>
      
      {/* Heritage Atmospheric Overlays */}
      <div className="fixed inset-0 pointer-events-none z-[99] opacity-[0.08] mix-blend-overlay overflow-hidden">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <filter id="heritageNoise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#heritageNoise)" />
        </svg>
      </div>

      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main ref={mainRef} className="pt-32 px-6 md:px-12 lg:px-20 max-w-[1800px] mx-auto pb-32">
        
        {/* Editorial Header - Dark Heritage Style */}
        <header ref={headerRef} className="mb-24 relative">
          <div className="flex flex-col lg:flex-row justify-between items-baseline gap-12">
            <div className="max-w-4xl">
              <div className="heritage-header-item flex items-center gap-3 heritage-caps text-[#B8422E] mb-6">
                <span className="w-8 h-[1px] bg-[#B8422E]" />
                Volume XLII / Sentiment Analysis Core
              </div>
              <h1 className="heritage-header-item text-7xl md:text-[9rem] font-black leading-[0.85] tracking-tighter mb-8 lowercase text-white">
                The market <br/>
                <span className="italic font-extralight block mt-2 ml-4 md:ml-12 opacity-80">Psychology.</span>
              </h1>
              <div className="heritage-divider w-full h-[1px] bg-white/10 origin-left scale-x-0 mb-8" />
              <p className="heritage-header-item text-xl md:text-3xl font-medium max-w-2xl leading-tight text-[#F7F5F2]/70">
                AI-orchestrated intelligence deciphering the mathematical resonance of collective fear, greed, and network sentiment.
              </p>
            </div>
            
            <div className="heritage-header-item w-full lg:w-auto flex flex-col items-end gap-10">
              <div className="text-right flex flex-col items-end">
                <span className="heritage-caps text-[#6C7278] mb-4">Sentiment_Index</span>
                <div className="relative group">
                  <span className="text-8xl md:text-[10rem] font-black leading-none tracking-tighter" style={{ color: getSentimentColor(marketStats.sentimentScore > 60 ? 'bullish' : marketStats.sentimentScore < 40 ? 'bearish' : 'neutral') }}>
                    {marketStats.sentimentScore.toFixed(0)}
                  </span>
                  <div className="absolute -top-4 -right-8 text-2xl font-black text-white/40">/100</div>
                  <div className="absolute bottom-4 left-0 w-0 h-2 bg-[#B8422E]/40 group-hover:w-full transition-all duration-700" />
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 heritage-caps bg-[#F7F5F2] text-[#1A1C1E] px-4 py-2 rounded-sm shadow-2xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live_Node_Analysis
                </div>
                <div className="heritage-caps text-[#6C7278] tracking-widest">
                  CONFIDENCE_LEVEL: {marketStats.confidenceLevel}%
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* High-Contrast Core Stats Grid */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 border border-white/5">
            {[
              { label: 'Technical_Pulse', value: marketStats.technicalScore.toFixed(1), desc: 'RSI, MACD, MA Signals', color: '#F7F5F2' },
              { label: 'Fundamental_Anchor', value: marketStats.fundamentalScore.toFixed(1), desc: 'TVL, Vol, On-chain', color: '#00f5d4' },
              { label: 'Social_Velocity', value: marketStats.socialScore.toFixed(1), desc: 'Global Trend Momentum', color: colors.tertiary },
              { label: 'Active_Signals', value: marketStats.bullishIndicators, desc: 'Positive Network Triggers', color: '#F7F5F2' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#1A1C1E] p-10 flex flex-col justify-between hover:bg-white/[0.03] group transition-all duration-500 cursor-default relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-0 bg-[#B8422E]/40 group-hover:h-full transition-all duration-500" />
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-[#6C7278] mb-16">
                  {stat.label}
                </div>
                <div>
                  <div className="text-7xl font-black mb-6 group-hover:scale-105 transition-transform origin-left duration-500" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="heritage-caps pt-6 border-t border-white/10 text-[#6C7278] group-hover:text-[#F7F5F2]">
                    {stat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Minimalist Filter Navigation */}
        <section className="mb-16 flex flex-col lg:flex-row justify-between items-start lg:items-center py-6 border-y border-white/10 gap-8">
          <div className="flex items-center gap-6 flex-wrap">
            <span className="heritage-caps text-[#6C7278]">Timeframe {"//"}</span>
            {['1h', '24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`heritage-caps px-6 py-2 rounded-full border transition-all ${
                  selectedTimeframe === tf 
                    ? 'bg-[#F7F5F2] text-[#1A1C1E] border-[#F7F5F2]' 
                    : 'border-white/10 text-[#F7F5F2]/40 hover:border-[#F7F5F2]/60 hover:text-[#F7F5F2]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-6 flex-wrap">
            <span className="heritage-caps text-[#6C7278]">Category {"//"}</span>
            {[
              { value: 'all', label: 'All_Metrics' },
              { value: 'technical', label: 'Technical' },
              { value: 'fundamental', label: 'Fundamental' },
              { value: 'social', label: 'Social' }
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value as 'all' | 'fundamental' | 'technical' | 'social')}
                className={`heritage-caps px-2 py-1 relative group ${
                  selectedCategory === cat.value ? 'text-[#B8422E]' : 'text-[#F7F5F2]/40'
                }`}
              >
                {cat.label}
                <div className={`absolute bottom-0 left-0 h-[2px] bg-[#B8422E] transition-all duration-500 ${selectedCategory === cat.value ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </button>
            ))}
          </div>
        </section>

        {/* Sentiment Journal Grid */}
        <section>
          {isLoading && filteredSentimentData.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-2 border-[#B8422E] border-r-transparent rounded-full animate-spin mb-8" />
              <div className="heritage-caps tracking-[0.4em] text-[#6C7278]">Node_Synchronizing...</div>
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
              {filteredSentimentData.map((item, i) => {
                const Icon = getSentimentIcon(item.trend);
                const color = getSentimentColor(item.trend);
                return (
                  <article 
                    key={i} 
                    className="sentiment-card bg-[#1A1C1E] p-12 flex flex-col justify-between hover:z-10 hover:bg-white/[0.02] transition-all duration-700 relative overflow-hidden group/card"
                  >
                    <div className="absolute top-0 left-0 w-1 h-0 bg-[#B8422E] group-hover/card:h-full transition-all origin-top duration-700" />
                    
                    <div>
                      <header className="flex justify-between items-start mb-12">
                        <div className="heritage-caps px-3 py-1 bg-white/5 text-[#6C7278] rounded-sm">
                          {item.category}
                        </div>
                        <div className="flex items-center gap-2 heritage-caps" style={{ color }}>
                          <Icon className="w-3.5 h-3.5" />
                          {item.trend}
                        </div>
                      </header>
                      
                      <h3 className="text-4xl font-black leading-tight mb-6 tracking-tighter group-hover/card:text-white transition-colors duration-500">
                        {item.metric}
                      </h3>
                      <p className="text-sm leading-relaxed text-[#6C7278] font-medium mb-12 max-w-[90%] group-hover/card:text-[#F7F5F2]/70 transition-colors">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-8 border-t border-white/5 flex justify-between items-end">
                      <div>
                        <div className="heritage-caps text-[#6C7278] mb-2 tracking-widest">Score_Metric</div>
                        <div className="text-5xl font-black tracking-tighter text-[#F7F5F2]">{item.value}<span className="text-lg ml-1 font-bold text-white/40">%</span></div>
                      </div>
                      <div className="text-right">
                        <div className="heritage-caps text-[#6C7278] mb-2 tracking-widest">Confidence</div>
                        <div className="text-2xl font-black text-[#F7F5F2]">{item.confidence}%</div>
                      </div>
                    </div>
                    
                    {/* Hover Reveal Link */}
                    <div className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#B8422E] opacity-0 group-hover/card:opacity-100 translate-x-[-10px] group-hover/card:translate-x-0 transition-all duration-700">
                      View_Deep_Analysis <ChevronRight className="w-3 h-3" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Methodology Footer - Architectural Blocks */}
        <section className="mt-40 border-t-4 border-[#B8422E] pt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 text-[#B8422E]">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tight text-white">Technical_Pulse</h4>
              </div>
              <p className="text-sm text-[#6C7278] leading-relaxed font-medium">
                Analysis derived from multi-timeframe price action nodes including RSI (14), MACD convergence, and volume-weighted averages. These reflect mathematical momentum rather than intrinsic valuation.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#B8422E]/10 text-[#B8422E]">
                  <Brain className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tight text-white">Fundamental_Base</h4>
              </div>
              <p className="text-sm text-[#6C7278] leading-relaxed font-medium">
                Real-time evaluation of network health: Total Value Locked (TVL), validator synchronization, and protocol-level throughput. Measures the structural integrity of the underlying ecosystem.
              </p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/5 text-[#B8422E]">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tight text-white">Social_Velocity</h4>
              </div>
              <p className="text-sm text-[#6C7278] leading-relaxed font-medium">
                Quantification of collective sentiment via cross-platform volatility index and community momentum surveys. Reflects the psychological resonance of the broader market participant pool.
              </p>
            </div>
          </div>
          
          <div className="mt-32 pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 heritage-caps text-[#6C7278]">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-[#B8422E]" />
              Sync_Timestamp: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-6">
              <span>Verified_By_Yield_Delta_AI</span>
              <span className="text-white/20">{"//"}</span>
              <span>All_Signals_Normal</span>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default MarketSentimentPage;