import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Tweet {
  id: string;
  author: string;
  handle: string;
  content: string;
  likes: number;
  retweets: number;
  sentiment: number;
  timestamp: string;
  url: string;
  hashtags: string[];
}

interface TwitterSentimentResponse {
  tweets: Tweet[];
  aggregated: {
    totalTweets: number;
    totalEngagement: number;
    averageSentiment: number;
    bullishPercent: number;
    bearishPercent: number;
    topHashtags: string[];
  };
  trendingHashtags: string[];
}

const generateMockTweets = (limit: number): Tweet[] => {
  const tweetTemplates = [
    { content: 'SEI is looking incredibly strong today. The charts are screaming bullish! 🚀', hashtags: ['SEI', 'SeiNetwork'] },
    { content: 'Just bought more SEI at these levels. This dip is a gift. Stack up while you can!', hashtags: ['SEI', 'crypto'] },
    { content: 'SEI technical analysis: Key support at current levels, expecting bounce soon.', hashtags: ['SEI', 'Trading'] },
    { content: 'The SEI ecosystem is growing so fast. These developer updates are insane!', hashtags: ['SEI', 'DeFi'] },
    { content: 'SEI TVL hitting new highs. DeFi on Sei going parabolic.', hashtags: ['SEI', 'DeFi'] },
    { content: 'Warning: SEI showing signs of weakness. Take profits if you can.', hashtags: ['SEI'] },
    { content: 'SEI vs the world. This chain is going to change everything.', hashtags: ['SEI', 'crypto'] },
    { content: 'My SEI price prediction: $5 by end of year. Do your own research.', hashtags: ['SEI', 'price'] },
    { content: 'Just staked my SEI tokens. Earning great yields in the Sei DeFi ecosystem.', hashtags: ['SEI', 'staking'] },
    { content: 'SEI network performance is next level. TPS numbers are incredible.', hashtags: ['SEI', 'SeiNetwork'] },
  ];

  const handles = [
    { author: 'Crypto Insider', handle: '@CryptoInsider' },
    { author: 'Trading Pro', handle: '@TradingPro' },
    { author: 'DeFi Analyst', handle: '@DeFiAnalyst' },
    { author: 'SEI Fanatic', handle: '@SEIfanatic' },
    { author: 'Tech Analysis', handle: '@TechAnalysis' },
    { author: 'Crypto King', handle: '@CryptoKing' },
    { author: 'Market Watch', handle: '@MarketWatch' },
  ];

  const tweets: Tweet[] = [];

  for (let i = 0; i < limit; i++) {
    const template = tweetTemplates[i % tweetTemplates.length];
    const user = handles[i % handles.length];
    const sentiment = 35 + Math.random() * 40;
    const likes = Math.floor(10 + Math.random() * 5000);
    const retweets = Math.floor(5 + Math.random() * 1000);

    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 48));

    tweets.push({
      id: `tweet-${i}`,
      author: user.author,
      handle: user.handle,
      content: template.content,
      likes,
      retweets,
      sentiment: Math.round(sentiment * 10) / 10,
      timestamp: date.toISOString(),
      url: `https://twitter.com/i/status/${i}`,
      hashtags: template.hashtags,
    });
  }

  return tweets.sort((a, b) => b.likes + b.retweets - (a.likes + a.retweets));
};

const extractHashtags = (tweets: Tweet[]): string[] => {
  const hashtagCounts: Record<string, number> = {};

  tweets.forEach((tweet) => {
    tweet.hashtags.forEach((tag) => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });

  return Object.entries(hashtagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const query = searchParams.get('query') || 'SEI';

    const tweets = generateMockTweets(limit);
    const topHashtags = extractHashtags(tweets);

    const totalSentiment = tweets.reduce((sum, tweet) => sum + tweet.sentiment, 0);
    const avgSentiment = totalSentiment / tweets.length;
    const bullishTweets = tweets.filter((t) => t.sentiment >= 60).length;
    const totalEngagement = tweets.reduce((sum, t) => sum + t.likes + t.retweets, 0);

    return NextResponse.json({
      success: true,
      data: {
        tweets,
        aggregated: {
          totalTweets: tweets.length,
          totalEngagement,
          averageSentiment: Math.round(avgSentiment * 10) / 10,
          bullishPercent: Math.round((bullishTweets / tweets.length) * 100),
          bearishPercent: Math.round(((tweets.length - bullishTweets) / tweets.length) * 100),
          topHashtags,
        },
        trendingHashtags: ['#SEI', '#SeiNetwork', '#SEIMars', '#SeiArmy', '#crypto'],
        query,
      },
    });
  } catch (error) {
    console.error('[Twitter Sentiment API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Twitter sentiment data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}