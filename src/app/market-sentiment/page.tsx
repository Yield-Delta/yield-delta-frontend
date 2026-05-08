'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, RefreshCw, Calendar } from 'lucide-react';
import FearGreedGauge from '@/components/sentiment/FearGreedGauge';
import SentimentScoreDisplay from '@/components/sentiment/SentimentScoreDisplay';
import RadarChart from '@/components/sentiment/RadarChart';
import SentimentBreakdown from '@/components/sentiment/SentimentBreakdown';
import { MetricCard } from '@/components/sentiment/MetricCard';
import { SentimentTimeline } from '@/components/sentiment/SentimentTimeline';
import { SentimentTable } from '@/components/sentiment/SentimentTable';
import { SentimentFilters } from '@/components/sentiment/SentimentFilters';

interface SentimentData {
  metric: string;
  value: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  description: string;
  category: 'fundamental' | 'technical' | 'social';
}

interface MarketStats {
  bullishIndicators: number;
  fearIndex: number;
  sentimentScore: number;
  confidenceLevel: number;
  technicalScore: number;
  fundamentalScore: number;
  socialScore: number;
}

interface HistoricalDataPoint {
  timestamp: Date;
  label: string;
  sentiment: number;
  change: number;
}

interface SocialPost {
  id: string;
  source: string;
  type: 'reddit' | 'twitter' | 'news' | 'on-chain';
  title: string;
  sentiment: number;
  engagement: number;
  timestamp: Date;
  url?: string;
  metrics: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
}

const MarketSentimentPage = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fundamental' | 'technical' | 'social'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    bullishIndicators: 12,
    fearIndex: 28,
    sentimentScore: 76.5,
    confidenceLevel: 84,
    technicalScore: 52,
    fundamentalScore: 65,
    socialScore: 55,
  });
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [sentimentRes, historicalRes] = await Promise.all([
          fetch(`/api/market/sentiment?timeframe=${selectedTimeframe}`),
          fetch(`/api/market/sentiment/historical?timeframe=30d&limit=20`),
        ]);

        if (sentimentRes.ok) {
          const data = await sentimentRes.json();
          if (data.success) {
            setSentimentData(data.data.sentimentMetrics);
            setMarketStats(data.data.stats);
            setLastUpdate(new Date(data.data.lastUpdated));
          }
        }

        if (historicalRes.ok) {
          const histData = await historicalRes.json();
          if (histData.success) {
            setHistoricalData(
              histData.data.timeline.map((d: { timestamp: string; value: number; label: string; change?: number }) => ({
                timestamp: new Date(d.timestamp),
                sentiment: d.value,
                label: d.label,
                change: d.change || 0,
              }))
            );
            setSocialPosts(
              histData.data.socialFeed.map((p: { id: string; source: string; author?: string; title: string; sentiment: number; engagement: number; timestamp: string; url: string; metrics: { bullish: number; bearish: number; neutral: number } }) => ({
                id: p.id,
                source: p.author || p.source,
                type: p.source as 'reddit' | 'twitter' | 'news' | 'on-chain',
                title: p.title,
                sentiment: p.sentiment,
                engagement: p.engagement,
                timestamp: new Date(p.timestamp),
                url: p.url,
                metrics: p.metrics,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error fetching sentiment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeframe]);

  const radarData = [
    { axis: 'Technical', value: marketStats.technicalScore, color: '#06b6d4' },
    { axis: 'Fundamental', value: marketStats.fundamentalScore, color: '#10b981' },
    { axis: 'Social', value: marketStats.socialScore, color: '#8b5cf6' },
    { axis: 'Fear/Greed', value: 100 - marketStats.fearIndex, color: '#f59e0b' },
    { axis: 'Momentum', value: 65, color: '#ec4899' },
    { axis: 'Volume', value: 72, color: '#3b82f6' },
  ];

  const filteredSentimentData =
    selectedCategory === 'all'
      ? sentimentData
      : sentimentData.filter((item) => item.category === selectedCategory);

  const sources = [
    { value: 'reddit', label: 'Reddit', count: 156 },
    { value: 'twitter', label: 'Twitter/X', count: 234 },
    { value: 'news', label: 'News', count: 45 },
    { value: 'on-chain', label: 'On-chain', count: 89 },
  ];

  const timeRange = [
    { value: '1h', label: '1H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
  ];

  const tokenFilters = [
    { value: 'SEI', label: 'SEI' },
    { value: 'ETH', label: 'ETH' },
    { value: 'BTC', label: 'BTC' },
    { value: 'SOL', label: 'SOL' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dark" showWallet={true} showLaunchApp={false} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Market Sentiment</h1>
            <p className="text-gray-400">Real-time sentiment analysis across multiple data sources</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <RefreshCw className="w-4 h-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Live</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <FearGreedGauge value={marketStats.fearIndex} size="lg" classification={
              marketStats.fearIndex >= 75 ? 'Extreme Greed' :
              marketStats.fearIndex >= 55 ? 'Greed' :
              marketStats.fearIndex >= 45 ? 'Neutral' :
              marketStats.fearIndex >= 25 ? 'Fear' : 'Extreme Fear'
            } />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <SentimentScoreDisplay
              score={marketStats.sentimentScore}
              technicalScore={marketStats.technicalScore}
              fundamentalScore={marketStats.fundamentalScore}
              socialScore={marketStats.socialScore}
              confidence={marketStats.confidenceLevel}
              timeframe={selectedTimeframe}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <RadarChart data={radarData} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SentimentBreakdown
              technical={marketStats.technicalScore}
              fundamental={marketStats.fundamentalScore}
              social={marketStats.socialScore}
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Technical Score"
            value={marketStats.technicalScore.toFixed(1)}
            change={2.5}
            changeLabel="vs previous"
            trend={marketStats.technicalScore > 55 ? 'up' : marketStats.technicalScore < 45 ? 'down' : 'neutral'}
            icon={<Activity className="w-5 h-5 text-cyan-400" />}
            details={[
              { label: 'RSI', value: '58' },
              { label: 'MACD', value: 'Bullish' },
            ]}
            drillDownData={{
              title: 'Technical Indicators',
              items: [
                { label: 'RSI (14)', value: '58', change: 3.2 },
                { label: 'MACD', value: 'Bullish', change: 1.5 },
                { label: 'SMA 50', value: '$0.42' },
                { label: 'SMA 200', value: '$0.38' },
              ],
            }}
          />
          <MetricCard
            title="Fundamental Score"
            value={marketStats.fundamentalScore.toFixed(1)}
            change={-1.2}
            changeLabel="vs previous"
            trend={marketStats.fundamentalScore > 60 ? 'up' : 'neutral'}
            icon={<TrendingUp className="w-5 h-5 text-neon-green" />}
            details={[
              { label: 'TVL', value: '$125M' },
              { label: 'Volume', value: '$45M' },
            ]}
          />
          <MetricCard
            title="Social Score"
            value={marketStats.socialScore.toFixed(1)}
            change={5.8}
            changeLabel="vs previous"
            trend="up"
            icon={<TrendingDown className="w-5 h-5 text-purple-400" />}
            details={[
              { label: 'Mentions', value: '12.5K' },
              { label: 'Trend', value: 'Rising' },
            ]}
          />
          <MetricCard
            title="Bullish Signals"
            value={marketStats.bullishIndicators}
            subtitle="signals"
            change={3}
            changeLabel="24h"
            trend="up"
            icon={<Activity className="w-5 h-5 text-yellow-400" />}
            details={[
              { label: 'Technical', value: '8' },
              { label: 'Fundamental', value: '4' },
            ]}
          />
        </div>

        <div className="mb-8">
          <SentimentTimeline events={historicalData} />
        </div>

        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Social Feed</h2>
            <SentimentFilters
              sources={sources}
              timeRange={timeRange}
              tokenFilters={tokenFilters}
              onSourceChange={setSelectedSources}
              onTimeRangeChange={(v: string) => console.log('Time range:', v)}
              onTokenChange={setSelectedTokens}
            />
          </div>
          <SentimentTable data={socialPosts} />
        </div>

        <div
          className="p-6 rounded-xl"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Timeframe Selection</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['1h', '24h', '7d', '30d', '90d'].map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTimeframe === timeframe
                    ? 'bg-neon-green text-black'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <h4 className="text-purple-400 font-semibold mb-2">Technical Analysis</h4>
            <p className="text-sm text-gray-400">
              RSI, MACD, Moving Averages, and price action signals
            </p>
          </div>
          <div className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/20">
            <h4 className="text-neon-green font-semibold mb-2">Fundamental Analysis</h4>
            <p className="text-sm text-gray-400">
              TVL, Volume, Network metrics, Developer activity
            </p>
          </div>
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <h4 className="text-cyan-400 font-semibold mb-2">Social Sentiment</h4>
            <p className="text-sm text-gray-400">
              Fear & Greed Index, Social mentions, Community engagement
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-neon-green border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-medium">Loading sentiment data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketSentimentPage;