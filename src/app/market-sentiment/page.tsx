"use client"

import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { TrendingUp, TrendingDown, Brain, Target, Activity, Clock, Hash } from 'lucide-react';
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
  
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
      case 'bullish': return '#00d050'; // Vibrant green
      case 'bearish': return '#ff2a2a'; // Sharp red
      default: return '#0033ff'; // Electric blue
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
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current.children,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out' }
      );
    }
    
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { opacity: 0, y: 50 },
        { 
          opacity: 1, y: 0, 
          duration: 1, stagger: 0.05, 
          ease: 'expo.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 80%',
          }
        }
      );
    }
  }, [isLoading, filteredSentimentData]);

  // Load external fonts for editorial look
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Syne:wght@400;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f0ec] text-[#111111] overflow-x-hidden selection:bg-[#ff2a2a] selection:text-white pb-24">
      {/* Light navigation variant since background is light */}
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <main className="pt-32 px-4 md:px-8 max-w-[1600px] mx-auto">
        
        {/* Editorial Header */}
        <header ref={headerRef} className="mb-16 border-b-2 border-[#111] pb-12">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
            <div className="max-w-3xl">
              <h4 className="font-['Syne'] text-sm font-bold tracking-widest uppercase mb-4 text-[#ff2a2a] flex items-center gap-2">
                <Hash className="w-4 h-4" /> Issue N° 42 / Sentiment Report
              </h4>
              <h1 className="font-['Cormorant_Garamond'] text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight mb-6">
                The Market <br/>
                <span className="italic font-light">Psychology.</span>
              </h1>
              <p className="font-['Syne'] text-xl md:text-2xl text-[#444] font-bold max-w-xl">
                AI-driven analysis interpreting fear, greed, and the underlying mathematical truth of the network.
              </p>
            </div>
            
            <div className="flex flex-col gap-6 text-right w-full lg:w-auto">
              <div className="border-t-2 border-[#111] pt-4 flex flex-col items-start lg:items-end">
                <span className="font-['Syne'] text-xs font-bold uppercase tracking-widest text-[#666] mb-1">Overall Sentiment</span>
                <span className="font-['Cormorant_Garamond'] text-6xl font-bold leading-none" style={{ color: getSentimentColor(marketStats.sentimentScore > 60 ? 'bullish' : marketStats.sentimentScore < 40 ? 'bearish' : 'neutral') }}>
                  {marketStats.sentimentScore.toFixed(1)}
                </span>
                <span className="font-['Syne'] text-sm font-bold uppercase mt-2">Score / 100</span>
              </div>
              
              <div className="flex gap-4 self-start lg:self-end">
                <div className="px-4 py-2 border border-[#111] font-['Syne'] text-xs font-bold uppercase">
                  Confidence: {marketStats.confidenceLevel}%
                </div>
                <div className="px-4 py-2 bg-[#111] text-[#f4f0ec] font-['Syne'] text-xs font-bold uppercase flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00d050] animate-pulse" />
                  Live AI
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Core Metrics Masonry / Editorial Layout */}
        <section className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#111] border-2 border-[#111]">
            {[
              { label: 'Technical Context', value: marketStats.technicalScore.toFixed(1), desc: 'RSI, MACD, MA Signals', color: '#0033ff' },
              { label: 'Fundamental Base', value: marketStats.fundamentalScore.toFixed(1), desc: 'TVL, Vol, On-chain', color: '#00d050' },
              { label: 'Social Velocity', value: marketStats.socialScore.toFixed(1), desc: 'Community & Trends', color: '#ff2a2a' },
              { label: 'Bullish Triggers', value: marketStats.bullishIndicators, desc: 'Active Positive Signals', color: '#111111' }
            ].map((stat, i) => (
              <div key={i} className="bg-[#f4f0ec] p-8 lg:p-10 flex flex-col justify-between group hover:bg-[#111] hover:text-[#f4f0ec] transition-colors duration-500">
                <div className="font-['Syne'] text-xs font-bold uppercase tracking-widest text-[#666] group-hover:text-[#aaa] mb-12">
                  {stat.label}
                </div>
                <div>
                  <div className="font-['Cormorant_Garamond'] text-6xl font-bold mb-4" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="font-['Syne'] text-sm font-bold uppercase border-t border-[#ccc] group-hover:border-[#333] pt-4">
                    {stat.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Filters */}
        <section className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center border-y-2 border-[#111] py-4 gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-['Syne'] text-xs font-bold uppercase tracking-widest">Timeframe //</span>
            {['1h', '24h', '7d', '30d'].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`font-['Syne'] text-sm font-bold uppercase px-4 py-1 rounded-full border border-[#111] transition-all ${
                  selectedTimeframe === tf ? 'bg-[#111] text-[#f4f0ec]' : 'hover:bg-[#e4dfd9]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-['Syne'] text-xs font-bold uppercase tracking-widest">Category //</span>
            {[
              { value: 'all', label: 'All' },
              { value: 'technical', label: 'Technical' },
              { value: 'fundamental', label: 'Fundamental' },
              { value: 'social', label: 'Social' }
            ].map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value as 'all' | 'fundamental' | 'technical' | 'social')}
                className={`font-['Syne'] text-sm font-bold uppercase px-4 py-1 border-b-2 transition-all ${
                  selectedCategory === cat.value ? 'border-[#ff2a2a] text-[#ff2a2a]' : 'border-transparent hover:border-[#111]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sentiment Grid */}
        <section>
          {isLoading && filteredSentimentData.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-[#111] border-r-transparent rounded-full animate-spin mb-6" />
              <div className="font-['Syne'] text-sm font-bold uppercase tracking-widest">Gathering Intelligence...</div>
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSentimentData.map((item, i) => {
                const Icon = getSentimentIcon(item.trend);
                const color = getSentimentColor(item.trend);
                return (
                  <article 
                    key={i} 
                    className="border-2 border-[#111] p-6 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-500 bg-white shadow-[8px_8px_0px_0px_rgba(17,17,17,1)]"
                  >
                    <div>
                      <header className="flex justify-between items-start mb-6">
                        <div className="font-['Syne'] text-[10px] font-bold uppercase tracking-widest px-3 py-1 border border-[#111] rounded-full">
                          {item.category}
                        </div>
                        <div className="flex items-center gap-2 font-['Syne'] text-xs font-bold uppercase" style={{ color }}>
                          <Icon className="w-4 h-4" />
                          {item.trend}
                        </div>
                      </header>
                      
                      <h3 className="font-['Cormorant_Garamond'] text-3xl font-bold leading-tight mb-4">
                        {item.metric}
                      </h3>
                      <p className="font-['Syne'] text-sm leading-relaxed text-[#444] font-medium mb-8">
                        {item.description}
                      </p>
                    </div>

                    <div className="border-t border-[#111] pt-4 flex justify-between items-end">
                      <div>
                        <div className="font-['Syne'] text-[10px] font-bold uppercase text-[#666] mb-1">Score</div>
                        <div className="font-['Cormorant_Garamond'] text-4xl font-bold">{item.value}<span className="text-xl">%</span></div>
                      </div>
                      <div className="text-right">
                        <div className="font-['Syne'] text-[10px] font-bold uppercase text-[#666] mb-1">AI Confidence</div>
                        <div className="font-['Syne'] text-lg font-bold">{item.confidence}%</div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Footer Methodology */}
        <section className="mt-24 border-t-2 border-[#111] pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-['Cormorant_Garamond'] text-2xl font-bold mb-4 flex items-center gap-2">
                <Target className="w-6 h-6" /> Technical Context
              </h4>
              <p className="font-['Syne'] text-sm text-[#444] leading-relaxed">
                Based on price action indicators including RSI (14-period), MACD signals, and moving averages (SMA 50/200). These reflect chart patterns and trading signals, not fundamental value.
              </p>
            </div>
            <div>
              <h4 className="font-['Cormorant_Garamond'] text-2xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6" /> Fundamental Base
              </h4>
              <p className="font-['Syne'] text-sm text-[#444] leading-relaxed">
                Evaluates ecosystem health through on-chain metrics: TVL, trading volume, network performance (TPS, validators), and DeFi protocol adoption. Measures intrinsic value and growth potential.
              </p>
            </div>
            <div>
              <h4 className="font-['Cormorant_Garamond'] text-2xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6" /> Social Velocity
              </h4>
              <p className="font-['Syne'] text-sm text-[#444] leading-relaxed">
                Uses the Crypto Fear & Greed Index, which analyzes market volatility, momentum, social media trends, surveys, and dominance. Reflects overall market psychology and investor sentiment.
              </p>
            </div>
          </div>
          
          <div className="mt-16 pt-8 border-t border-[#111] flex flex-col md:flex-row justify-between items-center gap-4 font-['Syne'] text-xs font-bold uppercase tracking-widest text-[#666]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
            <div>
              Powered by AI & Real-Time Market Data
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default MarketSentimentPage;