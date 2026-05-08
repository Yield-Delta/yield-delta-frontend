import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  numComments: number;
  sentiment: number;
  timestamp: string;
  url: string;
  flair?: string;
}

interface RedditSentimentResponse {
  posts: RedditPost[];
  aggregated: {
    totalPosts: number;
    totalComments: number;
    averageSentiment: number;
    bullishPercent: number;
    bearishPercent: number;
    topKeywords: string[];
  };
  trendingTopics: string[];
}

const subreddits = ['cryptocurrency', 'CryptoMarkets', 'SOLcoin', ' SeiNetwork'];

const generateMockPosts = (limit: number): RedditPost[] => {
  const postTemplates = [
    { title: 'SEI looking incredibly bullish - here is my analysis', keywords: ['bullish', 'analysis', 'price target'] },
    { title: 'Just loaded up on SEI, feels like an opportunity', keywords: ['opportunity', 'buy', 'dip'] },
    { title: 'SEI technical analysis: What to expect next', keywords: ['technical', 'analysis', 'support'] },
    { title: 'Is SEI the next big thing? My DD inside', keywords: ['DD', 'research', 'potential'] },
    { title: 'SEI news: Major development announced', keywords: ['news', 'development', 'announcement'] },
    { title: 'SEI vs Solana - comparison and thoughts', keywords: ['comparison', 'vs', 'thoughts'] },
    { title: 'Warning: SEI showing weakness - be careful', keywords: ['warning', 'weakness', 'caution'] },
    { title: 'SEI defi farming strategies that actually work', keywords: ['defi', 'farming', 'strategy'] },
    { title: 'SEI price prediction - too conservative or realistic?', keywords: ['prediction', 'price', 'target'] },
    { title: 'My complete SEI portfolio strategy', keywords: ['portfolio', 'strategy', 'allocation'] },
  ];

  const flairs = ['DD', 'Discussion', 'News', 'Meme', 'Analysis', 'Opinion'];

  const posts: RedditPost[] = [];

  for (let i = 0; i < limit; i++) {
    const template = postTemplates[i % postTemplates.length];
    const sentiment = 30 + Math.random() * 45;
    const score = Math.floor(10 + Math.random() * 5000);
    const numComments = Math.floor(5 + Math.random() * 500);
    const subreddit = subreddits[i % subreddits.length];

    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72));

    posts.push({
      id: `reddit-${i}`,
      title: template.title,
      author: `user_${Math.floor(Math.random() * 10000)}`,
      subreddit,
      score,
      numComments,
      sentiment: Math.round(sentiment * 10) / 10,
      timestamp: date.toISOString(),
      url: `https://reddit.com/r/${subreddit}/comments/${i}`,
      flair: flairs[i % flairs.length],
    });
  }

  return posts.sort((a, b) => b.score - a.score);
};

const extractKeywords = (posts: RedditPost[]): string[] => {
  const keywordCounts: Record<string, number> = {};

  posts.forEach((post) => {
    const words = post.title.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      if (word.length > 3) {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
    });
  });

  return Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const sort = searchParams.get('sort') || 'hot';

    const posts = generateMockPosts(limit);
    const keywords = extractKeywords(posts);

    const totalSentiment = posts.reduce((sum, post) => sum + post.sentiment, 0);
    const avgSentiment = totalSentiment / posts.length;
    const bullishPosts = posts.filter((p) => p.sentiment >= 60).length;

    return NextResponse.json({
      success: true,
      data: {
        posts,
        aggregated: {
          totalPosts: posts.length,
          totalComments: posts.reduce((sum, p) => sum + p.numComments, 0),
          averageSentiment: Math.round(avgSentiment * 10) / 10,
          bullishPercent: Math.round((bullishPosts / posts.length) * 100),
          bearishPercent: Math.round(((posts.length - bullishPosts) / posts.length) * 100),
          topKeywords: keywords,
        },
        trendingTopics: ['SEI', 'SeiNetwork', 'DeFi', 'crypto', 'altcoin'],
        sort,
      },
    });
  } catch (error) {
    console.error('[Reddit Sentiment API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Reddit sentiment data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}