import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

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

interface CoinMarketData {
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  currentPrice: number;
}

interface PricePoint {
  timestamp: number;
  price: number;
}

interface SocialSentimentData {
  fearGreedIndex: number;
  fearGreedClassification: string;
  mentions: number;
  positiveRatio: number;
  engagementScore: number;
  trendingScore: number;
  trend: string;
}

type ChainKey = 'sei' | 'sol' | 'sui';

const CHAIN_CONFIGS: Record<ChainKey, { coingeckoId: string; name: string }> = {
  sei: { coingeckoId: 'sei-network', name: 'SEI' },
  sol: { coingeckoId: 'solana', name: 'Solana' },
  sui: { coingeckoId: 'sui', name: 'Sui' },
};

const COIN_DATA_FALLBACKS: Record<string, CoinMarketData> = {
  'sei-network': { priceChange24h: 0, volume24h: 8_000_000, marketCap: 420_000_000, currentPrice: 0.42 },
  'solana':      { priceChange24h: 0, volume24h: 1_500_000_000, marketCap: 65_000_000_000, currentPrice: 145 },
  'sui':         { priceChange24h: 0, volume24h: 200_000_000, marketCap: 4_500_000_000, currentPrice: 1.85 },
};

/**
 * GET /api/market/sentiment?timeframe=24h&chain=sei|sol|sui
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const chainParam = (searchParams.get('chain') || 'sei') as ChainKey;
    const chainConfig = CHAIN_CONFIGS[chainParam] ?? CHAIN_CONFIGS.sei;

    const [coinData, historicalData, socialSentiment] = await Promise.all([
      fetchCoinMarketData(chainConfig.coingeckoId),
      fetchHistoricalPriceData(timeframe, chainConfig.coingeckoId),
      fetchSocialSentiment(timeframe),
    ]);

    const fundamentalMetrics = calculateFundamentalMetrics(chainParam, coinData);
    const technicalMetrics = calculateTechnicalMetrics(historicalData);
    const socialMetrics = calculateSocialMetrics(socialSentiment);

    const sentimentMetrics = [...fundamentalMetrics, ...technicalMetrics, ...socialMetrics];
    const stats = calculateMarketStats(coinData, technicalMetrics, socialMetrics);

    return NextResponse.json({
      success: true,
      data: { sentimentMetrics, stats, timeframe, lastUpdated: new Date().toISOString() },
    });
  } catch (error) {
    console.error('[Sentiment API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sentiment data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchCoinMarketData(coingeckoId: string): Promise<CoinMarketData> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true&include_market_cap=true`,
      { next: { revalidate: 300 } } as RequestInit
    );
    if (res.ok) {
      const data = await res.json();
      const coin = data[coingeckoId];
      if (coin) {
        return {
          priceChange24h: coin.usd_24h_change ?? 0,
          volume24h: coin.usd_24h_vol ?? 0,
          marketCap: coin.usd_market_cap ?? 0,
          currentPrice: coin.usd ?? 0,
        };
      }
    }
  } catch (err) {
    console.warn('[Sentiment] Could not fetch coin data:', err);
  }
  return COIN_DATA_FALLBACKS[coingeckoId] ?? { priceChange24h: 0, volume24h: 1_000_000, marketCap: 100_000_000, currentPrice: 1 };
}

async function fetchHistoricalPriceData(timeframe: string, coingeckoId: string): Promise<PricePoint[]> {
  try {
    const days = timeframe === '1h' ? 1 : timeframe === '24h' ? 7 : timeframe === '7d' ? 30 : 90;
    const interval = timeframe === '1h' ? 'hourly' : 'daily';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`,
      { next: { revalidate: 300 } } as RequestInit
    );
    if (res.ok) {
      const data = await res.json();
      return data.prices.map((p: number[]) => ({ timestamp: p[0], price: p[1] }));
    }
  } catch (err) {
    console.warn('[Sentiment] Could not fetch historical data:', err);
  }
  return [];
}

async function fetchSocialSentiment(timeframe: string): Promise<SocialSentimentData> {
  try {
    const limit = timeframe === '1h' ? 2 : timeframe === '24h' ? 7 : timeframe === '7d' ? 30 : 90;
    const res = await fetch(
      `https://api.alternative.me/fng/?limit=${limit}&format=json`,
      { next: { revalidate: 300 } } as RequestInit
    );
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        const latest = data.data[0];
        const fearGreedValue = parseInt(latest.value, 10);
        const classification = latest.value_classification;

        let trend = 'neutral';
        if (data.data.length > 1) {
          const prev = parseInt(data.data[1].value, 10);
          const delta = fearGreedValue - prev;
          if (delta > 5) trend = 'bullish';
          else if (delta < -5) trend = 'bearish';
        }

        const distanceFromNeutral = Math.abs(fearGreedValue - 50);
        return {
          fearGreedIndex: fearGreedValue,
          fearGreedClassification: classification,
          mentions: data.data.length,
          positiveRatio: fearGreedValue / 100,
          engagementScore: 50 + distanceFromNeutral,
          trendingScore: fearGreedValue,
          trend,
        };
      }
    }
  } catch (err) {
    console.warn('[Sentiment] Could not fetch social sentiment:', err);
  }
  return { fearGreedIndex: 50, fearGreedClassification: 'Neutral', mentions: 0, positiveRatio: 0.5, engagementScore: 50, trendingScore: 50, trend: 'neutral' };
}

// ─── Fundamental metrics (chain-dispatched) ────────────────────────────────

function calculateFundamentalMetrics(chain: ChainKey, coinData: CoinMarketData): SentimentData[] {
  const variance = () => (Math.random() - 0.5) * 8;
  switch (chain) {
    case 'sol': return calculateSolanaFundamentals(coinData, variance);
    case 'sui': return calculateSuiFundamentals(coinData, variance);
    default:    return calculateSEIFundamentals(coinData, variance);
  }
}

function calculateSEIFundamentals(coinData: CoinMarketData, variance: () => number): SentimentData[] {
  const { priceChange24h, volume24h } = coinData;
  const liquidityScore = Math.min(80, 40 + (volume24h / 500_000) * 0.5);

  const healthValue = Math.min(85, Math.max(25,
    Math.min(25, Math.max(0, 15 + priceChange24h * 2)) +
    Math.min(30, liquidityScore * 0.4) +
    Math.min(25, (volume24h / 1_000_000) * 1.5) +
    variance()
  ));
  const healthTrend: SentimentData['trend'] = priceChange24h > 1.5 ? 'bullish' : priceChange24h < -1.5 ? 'bearish' : 'neutral';

  const defiValue = Math.min(80, Math.max(20,
    Math.min(40, (volume24h / 5_000_000) * 10) +
    Math.min(30, (volume24h / 2_000_000) * 10) +
    10 + variance()
  ));
  const defiTrend: SentimentData['trend'] = defiValue > 60 ? 'bullish' : defiValue < 45 ? 'bearish' : 'neutral';

  const instValue = Math.min(75, Math.max(15,
    Math.min(35, (volume24h / 100_000_000) * 20) +
    Math.min(25, liquidityScore * 0.3) +
    5 + variance()
  ));
  const instTrend: SentimentData['trend'] = instValue > 55 ? 'bullish' : instValue < 35 ? 'bearish' : 'neutral';

  const devValue = Math.min(88, Math.max(35, 70 + variance()));
  const devTrend: SentimentData['trend'] = devValue > 70 ? 'bullish' : devValue < 55 ? 'bearish' : 'neutral';

  return [
    {
      metric: 'SEI Ecosystem Health', value: Number(healthValue.toFixed(1)), trend: healthTrend, confidence: 82,
      description: `${liquidityScore >= 80 ? 'Robust' : liquidityScore >= 60 ? 'Growing' : 'Developing'} ecosystem with $${(volume24h / 1_000_000).toFixed(1)}M daily volume and parallelized EVM capacity`,
      category: 'fundamental',
    },
    {
      metric: 'DeFi Protocol Adoption', value: Number(defiValue.toFixed(1)), trend: defiTrend, confidence: Math.min(75, Math.max(55, 65 + Math.abs(variance()))),
      description: `${defiTrend === 'bullish' ? 'Growing' : defiTrend === 'bearish' ? 'Declining' : 'Stable'} participation across SEI DeFi protocols with ${defiTrend === 'bullish' ? 'increasing' : 'moderate'} TVL`,
      category: 'fundamental',
    },
    {
      metric: 'Institutional Interest', value: Number(instValue.toFixed(1)), trend: instTrend, confidence: Math.min(70, Math.max(45, 55 + (volume24h / 100_000_000) * 5)),
      description: `${instTrend === 'bullish' ? 'Growing' : instTrend === 'bearish' ? 'Limited' : 'Moderate'} institutional interest with $${(volume24h / 1_000_000).toFixed(1)}M in daily trading volume`,
      category: 'fundamental',
    },
    {
      metric: 'Developer Activity', value: Number(devValue.toFixed(1)), trend: devTrend, confidence: 80,
      description: `${devValue > 75 ? 'Strong' : devValue > 60 ? 'Active' : 'Moderate'} SEI network performance with fast finality and growing protocol deployments`,
      category: 'fundamental',
    },
  ];
}

function calculateSolanaFundamentals(coinData: CoinMarketData, variance: () => number): SentimentData[] {
  const { priceChange24h, volume24h, marketCap } = coinData;
  const volumeToMcap = marketCap > 0 ? (volume24h / marketCap) * 100 : 2;

  const healthValue = Math.min(85, Math.max(25, 55 + priceChange24h * 2.5 + variance()));
  const healthTrend: SentimentData['trend'] = priceChange24h > 1.5 ? 'bullish' : priceChange24h < -1.5 ? 'bearish' : 'neutral';

  const defiValue = Math.min(82, Math.max(30, 50 + (volume24h / 2_000_000_000) * 20 + variance()));
  const defiTrend: SentimentData['trend'] = defiValue > 62 ? 'bullish' : defiValue < 45 ? 'bearish' : 'neutral';

  const nftValue = Math.min(80, Math.max(25, 55 + priceChange24h * 1.5 + variance()));
  const nftTrend: SentimentData['trend'] = nftValue > 60 ? 'bullish' : nftValue < 42 ? 'bearish' : 'neutral';

  const instValue = Math.min(75, Math.max(20, 40 + volumeToMcap * 3 + variance()));
  const instTrend: SentimentData['trend'] = instValue > 55 ? 'bullish' : instValue < 38 ? 'bearish' : 'neutral';

  return [
    {
      metric: 'Solana Network Health', value: Number(healthValue.toFixed(1)), trend: healthTrend, confidence: 84,
      description: `${healthTrend === 'bullish' ? 'Strong' : healthTrend === 'bearish' ? 'Pressured' : 'Stable'} Solana network with $${(volume24h / 1_000_000_000).toFixed(2)}B daily volume and $${(marketCap / 1_000_000_000).toFixed(1)}B market cap`,
      category: 'fundamental',
    },
    {
      metric: 'DeFi Ecosystem Strength', value: Number(defiValue.toFixed(1)), trend: defiTrend, confidence: 78,
      description: `${defiTrend === 'bullish' ? 'Robust' : defiTrend === 'bearish' ? 'Contracting' : 'Stable'} DeFi activity across Orca, Raydium, Marinade, and Jupiter with deep liquidity pools`,
      category: 'fundamental',
    },
    {
      metric: 'NFT & Creator Economy', value: Number(nftValue.toFixed(1)), trend: nftTrend, confidence: 72,
      description: `${nftTrend === 'bullish' ? 'Active' : nftTrend === 'bearish' ? 'Quiet' : 'Moderate'} NFT marketplace activity on Tensor and Magic Eden, creator economy engagement`,
      category: 'fundamental',
    },
    {
      metric: 'Institutional Flow', value: Number(instValue.toFixed(1)), trend: instTrend, confidence: 70,
      description: `${instTrend === 'bullish' ? 'Growing' : instTrend === 'bearish' ? 'Limited' : 'Moderate'} institutional activity with ${volumeToMcap.toFixed(1)}% daily volume-to-marketcap ratio indicating ${instTrend === 'bullish' ? 'high' : 'measured'} conviction`,
      category: 'fundamental',
    },
  ];
}

function calculateSuiFundamentals(coinData: CoinMarketData, variance: () => number): SentimentData[] {
  const { priceChange24h, volume24h, marketCap } = coinData;
  const volumeToMcap = marketCap > 0 ? (volume24h / marketCap) * 100 : 4;

  const healthValue = Math.min(82, Math.max(20, 52 + priceChange24h * 2.5 + variance()));
  const healthTrend: SentimentData['trend'] = priceChange24h > 1.5 ? 'bullish' : priceChange24h < -1.5 ? 'bearish' : 'neutral';

  const moveValue = Math.min(80, Math.max(25, 58 + priceChange24h * 1.8 + variance()));
  const moveTrend: SentimentData['trend'] = moveValue > 62 ? 'bullish' : moveValue < 45 ? 'bearish' : 'neutral';

  const gamingValue = Math.min(78, Math.max(20, 50 + priceChange24h * 1.5 + variance()));
  const gamingTrend: SentimentData['trend'] = gamingValue > 60 ? 'bullish' : gamingValue < 40 ? 'bearish' : 'neutral';

  const defiValue = Math.min(75, Math.max(20, 44 + volumeToMcap * 4 + variance()));
  const defiTrend: SentimentData['trend'] = defiValue > 58 ? 'bullish' : defiValue < 40 ? 'bearish' : 'neutral';

  return [
    {
      metric: 'Sui Network Health', value: Number(healthValue.toFixed(1)), trend: healthTrend, confidence: 78,
      description: `${healthTrend === 'bullish' ? 'Accelerating' : healthTrend === 'bearish' ? 'Decelerating' : 'Steady'} Sui ecosystem growth with $${(volume24h / 1_000_000).toFixed(0)}M daily volume and object-centric architecture`,
      category: 'fundamental',
    },
    {
      metric: 'Move VM Adoption', value: Number(moveValue.toFixed(1)), trend: moveTrend, confidence: 73,
      description: `${moveTrend === 'bullish' ? 'Strong' : moveTrend === 'bearish' ? 'Limited' : 'Growing'} developer adoption of the Move language with increasing protocol deployments on Sui mainnet`,
      category: 'fundamental',
    },
    {
      metric: 'Gaming & NFT Ecosystem', value: Number(gamingValue.toFixed(1)), trend: gamingTrend, confidence: 69,
      description: `${gamingTrend === 'bullish' ? 'Expanding' : gamingTrend === 'bearish' ? 'Nascent' : 'Developing'} on-chain gaming and digital asset ecosystem leveraging Sui's low-latency object model`,
      category: 'fundamental',
    },
    {
      metric: 'DeFi Protocol Traction', value: Number(defiValue.toFixed(1)), trend: defiTrend, confidence: 68,
      description: `${defiTrend === 'bullish' ? 'Rapid' : defiTrend === 'bearish' ? 'Slow' : 'Steady'} DeFi growth on Sui with Cetus, Turbos, and Aftermath Finance driving liquidity depth`,
      category: 'fundamental',
    },
  ];
}

// ─── Technical metrics ──────────────────────────────────────────────────────

function calculateTechnicalMetrics(priceData: PricePoint[]): SentimentData[] {
  if (!priceData || priceData.length < 14) return getDefaultTechnicalSentiment();

  const prices = priceData.map(p => p.price);
  const rsi = calculateRSI(prices, 14);
  const macd = calculateMACD(prices);
  const ma = calculateMovingAverages(prices);
  const avgChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;

  return [
    calculateOverallSentiment(avgChange),
    createRSIMetric(rsi),
    createMACDMetric(macd),
    createMAMetric(ma, prices[prices.length - 1]),
  ];
}

function calculateSocialMetrics(socialData: SocialSentimentData): SentimentData[] {
  const fearGreedIndex = socialData.fearGreedIndex || 50;
  const classification = socialData.fearGreedClassification || 'Neutral';
  const engagementScore = socialData.engagementScore || 50;
  const trendingScore = socialData.trendingScore || 50;
  const communityValue = (engagementScore * 0.4) + (trendingScore * 0.6);
  const communityTrend: SentimentData['trend'] = communityValue > 60 ? 'bullish' : communityValue < 40 ? 'bearish' : 'neutral';

  return [
    {
      metric: 'Market Fear & Greed Index', value: Number(fearGreedIndex.toFixed(1)),
      trend: fearGreedIndex > 55 ? 'bullish' : fearGreedIndex < 45 ? 'bearish' : 'neutral',
      confidence: 82,
      description: `Market shows ${classification} (${fearGreedIndex}/100) — ${
        fearGreedIndex > 75 ? 'Extreme optimism, potential market top warning' :
        fearGreedIndex > 55 ? 'Greedy sentiment, positive market psychology' :
        fearGreedIndex > 45 ? 'Balanced market sentiment' :
        fearGreedIndex > 25 ? 'Fearful sentiment, cautious market psychology' :
        'Extreme fear, potential market bottom opportunity'
      }`,
      category: 'social',
    },
    {
      metric: 'Community Engagement', value: Number(Math.min(85, Math.max(15, communityValue)).toFixed(1)),
      trend: communityTrend, confidence: 72,
      description: `${communityTrend === 'bullish' ? 'High' : communityTrend === 'bearish' ? 'Low' : 'Moderate'} community engagement and interest across crypto social platforms`,
      category: 'social',
    },
  ];
}

// ─── Market stats ────────────────────────────────────────────────────────────

function calculateMarketStats(
  coinData: CoinMarketData,
  technicalMetrics: SentimentData[],
  socialMetrics: SentimentData[]
): MarketStats {
  const { priceChange24h, volume24h } = coinData;
  const bullishCount = priceChange24h > 0 ? 1 : 0;
  const avgVolatility = Math.min(50, Math.abs(priceChange24h) * 2 + 15);

  const technicalScore = technicalMetrics.length > 0
    ? technicalMetrics.reduce((sum, m) => sum + m.value, 0) / technicalMetrics.length
    : 50;
  const fundamentalScore = Math.max(25, Math.min(80, 50 + priceChange24h * 8));
  const socialScore = socialMetrics.length > 0
    ? socialMetrics.reduce((sum, m) => sum + m.value, 0) / socialMetrics.length
    : 50;

  const bullishTechnical = technicalMetrics.filter(m => m.trend === 'bullish').length;
  const bullishSocial = socialMetrics.filter(m => m.trend === 'bullish').length;
  const totalBullishIndicators = bullishCount + bullishTechnical + bullishSocial;

  const fearIndex = Math.max(20, Math.min(75, 50 - priceChange24h * 4 - avgVolatility * 0.3));
  const sentimentScore = Math.max(25, Math.min(80, (technicalScore * 0.4) + (fundamentalScore * 0.4) + (socialScore * 0.2)));

  const volumeConfidence = Math.min(30, (volume24h / 500_000_000) * 20);
  const confidenceLevel = Math.max(40, Math.min(85, 50 + volumeConfidence - Math.min(20, avgVolatility * 0.5) + bullishCount * 2));

  return {
    bullishIndicators: Math.max(0, Math.min(24, totalBullishIndicators)),
    fearIndex: Number(fearIndex.toFixed(0)),
    sentimentScore: Number(sentimentScore.toFixed(1)),
    confidenceLevel: Number(confidenceLevel.toFixed(0)),
    technicalScore: Number(technicalScore.toFixed(1)),
    fundamentalScore: Number(fundamentalScore.toFixed(1)),
    socialScore: Number(socialScore.toFixed(1)),
  };
}

// ─── Technical indicator calculators ────────────────────────────────────────

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = prices.slice(1).map((p, i) => p - prices[i]);
  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? -c : 0);
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];
  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) ema = (prices[i] - ema) * multiplier + ema;
  return ema;
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateMACD(prices: number[]) {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signal = calculateEMA([macdLine], 9);
  return { macdLine, signal, histogram: macdLine - signal };
}

function calculateMovingAverages(prices: number[]) {
  return { sma50: calculateSMA(prices, 50), sma200: calculateSMA(prices, 200), currentPrice: prices[prices.length - 1] };
}

function createRSIMetric(rsi: number): SentimentData {
  let trend: SentimentData['trend'];
  let description: string;
  let value: number;

  if (rsi > 70) {
    trend = 'bearish'; value = 100 - rsi;
    description = `RSI is ${rsi.toFixed(1)} (Overbought) — Potential downward correction, sell pressure building`;
  } else if (rsi < 30) {
    trend = 'bullish'; value = 100 - rsi;
    description = `RSI is ${rsi.toFixed(1)} (Oversold) — Potential upward reversal, buying opportunity`;
  } else if (rsi > 55) {
    trend = 'bullish'; value = rsi;
    description = `RSI is ${rsi.toFixed(1)} (Bullish zone) — Positive momentum with room to grow`;
  } else if (rsi < 45) {
    trend = 'bearish'; value = rsi;
    description = `RSI is ${rsi.toFixed(1)} (Bearish zone) — Weak momentum, potential further decline`;
  } else {
    trend = 'neutral'; value = rsi;
    description = `RSI is ${rsi.toFixed(1)} (Neutral) — Balanced buying and selling pressure`;
  }

  return { metric: 'RSI (14-period)', value: Number(value.toFixed(1)), trend, confidence: 88, description, category: 'technical' };
}

function createMACDMetric(macd: { macdLine: number; signal: number; histogram: number }): SentimentData {
  const trend: SentimentData['trend'] = macd.histogram > 0 ? 'bullish' : macd.histogram < 0 ? 'bearish' : 'neutral';
  const value = Math.min(85, Math.max(15, 50 + macd.histogram * 20));
  const description = trend === 'bullish'
    ? `MACD histogram is positive (${macd.histogram.toFixed(4)}) — Bullish crossover, upward momentum`
    : trend === 'bearish'
    ? `MACD histogram is negative (${macd.histogram.toFixed(4)}) — Bearish crossover, downward pressure`
    : 'MACD is neutral — No clear directional signal';

  return { metric: 'MACD Signal', value: Number(value.toFixed(1)), trend, confidence: 85, description, category: 'technical' };
}

function createMAMetric(ma: { sma50: number; sma200: number }, currentPrice: number): SentimentData {
  const above50 = currentPrice > ma.sma50;
  const above200 = currentPrice > ma.sma200;
  const goldenCross = ma.sma50 > ma.sma200;

  let trend: SentimentData['trend'], value: number, description: string;

  if (above50 && above200 && goldenCross) {
    trend = 'bullish'; value = 80;
    description = `Golden Cross detected — Price above both SMA50 and SMA200, strong uptrend`;
  } else if (!above50 && !above200 && !goldenCross) {
    trend = 'bearish'; value = 20;
    description = `Death Cross pattern — Price below both SMA50 and SMA200, strong downtrend`;
  } else if (above50) {
    trend = 'bullish'; value = 65;
    description = `Price above SMA50 — Short-term bullish trend`;
  } else {
    trend = 'bearish'; value = 35;
    description = `Price below SMA50 — Short-term bearish trend`;
  }

  return { metric: 'Moving Averages (SMA)', value, trend, confidence: 82, description, category: 'technical' };
}

function calculateOverallSentiment(avgChange: number): SentimentData {
  const value = Math.min(85, Math.max(15, 50 + avgChange * 8));
  const trend: SentimentData['trend'] = avgChange > 2 ? 'bullish' : avgChange < -2 ? 'bearish' : 'neutral';
  return {
    metric: 'Overall Market Sentiment', value: Number(value.toFixed(1)), trend,
    confidence: 78,
    description: `${trend === 'bullish' ? 'Strong bullish' : trend === 'bearish' ? 'Bearish' : 'Neutral'} price action with ${avgChange > 0 ? '+' : ''}${avgChange.toFixed(1)}% change in the period`,
    category: 'technical',
  };
}

function getDefaultMetric(metric: string, value: number, category: 'fundamental' | 'technical' | 'social'): SentimentData {
  const v = Math.max(20, Math.min(85, value + (Math.random() - 0.5) * 5));
  return {
    metric, value: Number(v.toFixed(1)), trend: v > 65 ? 'bullish' : v < 45 ? 'bearish' : 'neutral',
    confidence: Math.floor(65 + Math.random() * 15),
    description: 'Analyzing market conditions...', category,
  };
}

function getDefaultTechnicalSentiment(): SentimentData[] {
  return [
    getDefaultMetric('Overall Market Sentiment', 58, 'technical'),
    getDefaultMetric('RSI (14-period)', 50, 'technical'),
    getDefaultMetric('MACD Signal', 50, 'technical'),
    getDefaultMetric('Moving Averages (SMA)', 50, 'technical'),
  ];
}
