import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface HistoricalDataPoint {
  timestamp: string;
  value: number;
  label: string;
  change?: number;
}

interface SocialFeedItem {
  id: string;
  source: 'reddit' | 'twitter' | 'news';
  author?: string;
  title: string;
  sentiment: number;
  engagement: number;
  timestamp: string;
  url: string;
  metrics: {
    bullish: number;
    bearish: number;
    neutral: number;
  };
}

interface SocialSentiment {
  reddit: {
    posts: number;
    comments: number;
    sentiment: number;
    trendingTopics: string[];
  };
  twitter: {
    tweets: number;
    mentions: number;
    sentiment: number;
    trendingHashtags: string[];
  };
  news: {
    articles: number;
    sentiment: number;
    headlines: string[];
  };
}

interface HistoricalSentimentResponse {
  timeline: HistoricalDataPoint[];
  socialFeed: SocialFeedItem[];
  aggregated: {
    sentiment: number;
    bullishPercent: number;
    bearishPercent: number;
    neutralPercent: number;
    engagement: number;
  };
  bySource: SocialSentiment;
}

const generateMockTimeline = (days: number): HistoricalDataPoint[] => {
  const timeline: HistoricalDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const baseValue = 45 + Math.sin(i / 3) * 15 + (Math.random() - 0.5) * 10;
    const value = Math.max(10, Math.min(90, baseValue));

    const labels = ['Market consolidation', 'Bullish momentum', 'Profit taking', 'Recovery phase', 'Sideways movement'];
    const label = labels[Math.floor(Math.abs(value / 20))];

    const prevValue = timeline.length > 0 ? timeline[timeline.length - 1].value : value;
    const change = value - prevValue;

    timeline.push({
      timestamp: date.toISOString(),
      value: Math.round(value * 10) / 10,
      label,
      change: Math.round(change * 10) / 10,
    });
  }

  return timeline;
};

const generateMockSocialFeed = (limit: number): SocialFeedItem[] => {
  const redditPosts = [
    { title: 'SEI looking strong at current levels - here is why', author: 'CryptoWhale2024' },
    { title: 'Just aped into SEI, potential 10x incoming?', author: 'degen_trader_99' },
    { title: 'SEI DeFi TVL hits new ATH - institutional interest growing', author: 'defi_analyst' },
    { title: 'Why SEI will flip Solana in 2025', author: 'maximalist_sui_fan' },
    { title: 'Warning: SEI showing early signs of distribution', author: 'bearish_but_correct' },
  ];

  const twitterPosts = [
    { title: 'Breaking: Major protocol launching on SEI next week', author: '@CryptoInsider' },
    { title: 'SEI TPS looking insane rn 🔥', author: '@SEIfanatic' },
    { title: 'My SEI position is getting heavy, who else is bullish?', author: '@TradingPro' },
    { title: 'SEI forming cup and handle on daily - targets incoming', author: '@TechAnalysis' },
  ];

  const newsArticles = [
    { title: 'SEI Network Announces Major Partnership with Leading DeFi Protocol', author: 'CryptoNews' },
    { title: 'Analysts Predict SEI to Reach New All-Time Highs', author: 'MarketWatch' },
    { title: 'SEI Developer Activity Hits Record Levels', author: 'BlockchainDaily' },
  ];

  const feed: SocialFeedItem[] = [];

  for (let i = 0; i < limit; i++) {
    const sourceType = i < limit * 0.4 ? 'reddit' : i < limit * 0.7 ? 'twitter' : 'news';
    let posts;
    let author;

    switch (sourceType) {
      case 'reddit':
        posts = redditPosts;
        author = posts[i % posts.length].author;
        break;
      case 'twitter':
        posts = twitterPosts;
        author = posts[i % posts.length].author;
        break;
      case 'news':
        posts = newsArticles;
        author = posts[i % posts.length].author;
        break;
    }

    const sentiment = 40 + Math.random() * 30;
    const engagement = Math.floor(100 + Math.random() * 9000);

    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 48));

    feed.push({
      id: `post-${i}`,
      source: sourceType,
      author,
      title: posts[i % posts.length].title,
      sentiment: Math.round(sentiment * 10) / 10,
      engagement,
      timestamp: date.toISOString(),
      url: `https://example.com/post/${i}`,
      metrics: {
        bullish: Math.round((sentiment / 100) * 80 + Math.random() * 20),
        bearish: Math.round(((100 - sentiment) / 100) * 60 + Math.random() * 10),
        neutral: Math.round(Math.random() * 30 + 10),
      },
    });
  }

  return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const generateSocialSentiment = (): SocialSentiment => {
  return {
    reddit: {
      posts: Math.floor(500 + Math.random() * 5000),
      comments: Math.floor(2000 + Math.random() * 20000),
      sentiment: Math.round((45 + Math.random() * 30) * 10) / 10,
      trendingTopics: ['SEILaunch', 'DeFiSummer', 'SEIMoons', 'SeiMaxis'],
    },
    twitter: {
      tweets: Math.floor(1000 + Math.random() * 10000),
      mentions: Math.floor(5000 + Math.random() * 50000),
      sentiment: Math.round((40 + Math.random() * 35) * 10) / 10,
      trendingHashtags: ['#SEI', '#SeiNetwork', '#SEIMars', '#SeiArmy'],
    },
    news: {
      articles: Math.floor(20 + Math.random() * 200),
      sentiment: Math.round((50 + Math.random() * 25) * 10) / 10,
      headlines: [
        'SEI Network Sees Record Breaking Transaction Volume',
        'Institutional Investors Show Interest in SEI Ecosystem',
        'SEI DeFi TVL Reaches New Milestone',
      ],
    },
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeSocial = searchParams.get('includeSocial') !== 'false';

    let days: number;
    switch (timeframe) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '1d':
        days = 24;
        break;
      default:
        days = 30;
    }

    const timeline = generateMockTimeline(days);
    const socialFeed = includeSocial ? generateMockSocialFeed(limit) : [];
    const socialSentiment = includeSocial ? generateSocialSentiment() : null;

    const avgSentiment = timeline.reduce((sum, d) => sum + d.value, 0) / timeline.length;
    const bullishDays = timeline.filter((d) => d.change && d.change > 0).length;

    return NextResponse.json({
      success: true,
      data: {
        timeline,
        socialFeed,
        aggregated: {
          sentiment: Math.round(avgSentiment * 10) / 10,
          bullishPercent: Math.round((bullishDays / timeline.length) * 100),
          bearishPercent: Math.round(((timeline.length - bullishDays) / timeline.length) * 100),
          neutralPercent: Math.round(Math.random() * 20 + 10),
          engagement: socialFeed.reduce((sum, item) => sum + item.engagement, 0),
        },
        bySource: socialSentiment,
        timeframe,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Historical Sentiment API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch historical sentiment data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}