import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

export const runtime = 'edge';

// Chat request schema
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  vaultAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid vault address').optional(),
  context: z.object({
    currentPage: z.string().optional(),
    vaultData: z.any().optional(),
    userPreferences: z.any().optional()
  }).optional(),
  chainId: z.number().refine(id => id === 1328, 'Must be SEI testnet (1328)').default(1328)
})

/**
 * Chat with Eliza AI agent
 * POST /api/eliza/chat - Send message to Eliza agent and get AI response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    const validatedData = ChatRequestSchema.parse(body)
    
    // Call Eliza agent
    const elizaResponse = await callElizaAgent(validatedData)
    
    return NextResponse.json({
      success: true,
      data: elizaResponse,
      timestamp: new Date().toISOString(),
      chainId: 1328
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid chat request',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Error in Eliza chat:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to communicate with AI agent',
        chainId: 1328
      },
      { status: 500 }
    )
  }
}

// Agent and session cache (in-memory for edge runtime)
const AGENT_ID = 'a823d035-4008-0c15-a813-b5e540c102ef' // Kairos agent ID
const USER_ID = '123e4567-e89b-12d3-a456-426614174000' // Default dashboard user UUID

/**
 * Call Eliza agent with user message using session-based messaging
 */
async function callElizaAgent(data: z.infer<typeof ChatRequestSchema>) {
  const ELIZA_AGENT_URL = process.env.ELIZA_AGENT_URL || 'https://vibrant-harmony-production.up.railway.app'

  try {
    // Create a new session for each message (sessions auto-renew for 30 min)
    const sessionResponse = await fetch(`${ELIZA_AGENT_URL}/api/messaging/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: AGENT_ID,
        userId: USER_ID
      }),
      signal: AbortSignal.timeout(5000)
    })

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.status}`)
    }

    const { sessionId } = await sessionResponse.json()

    // Send message to the session
    const messageResponse = await fetch(
      `${ELIZA_AGENT_URL}/api/messaging/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.message
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout for AI processing
      }
    )

    if (!messageResponse.ok) {
      throw new Error(`Message failed: ${messageResponse.status}`)
    }

    await messageResponse.json()

    // Wait for agent to process and respond (retry with exponential backoff)
    interface Message {
      authorId: string
      content: string
      isAgent?: boolean
    }

    interface MessagesResponse {
      messages: Message[]
    }

    let agentResponse: Message | null = null
    const maxRetries = 6 // Try up to 6 times

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Wait before checking (increasing delays: 2s, 3s, 4s, 5s, 6s, 7s)
      const waitTime = 2000 + (attempt * 1000)
      await new Promise(resolve => setTimeout(resolve, waitTime))

      const messagesResponse = await fetch(
        `${ELIZA_AGENT_URL}/api/messaging/sessions/${sessionId}/messages`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        }
      )

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${messagesResponse.status}`)
      }

      const data = await messagesResponse.json() as MessagesResponse
      const messages = data.messages || []

      // Find the agent's response (last message from agent)
      const agentMessages = messages.filter((msg) => msg.authorId === AGENT_ID || msg.isAgent)

      if (agentMessages.length > 0) {
        agentResponse = agentMessages[agentMessages.length - 1]
        break
      }
    }

    return {
      message: agentResponse?.content || 'The AI agent is processing your request. This may take a moment...',
      confidence: agentResponse ? 0.95 : 0.6,
      actions: [],
      suggestions: [
        'Ask about specific vault strategies',
        'Request current APY rates',
        'Inquire about rebalancing frequency'
      ],
      metadata: {
        model: 'kairos-eliza-agent',
        responseTime: '~2s',
        processingSource: 'eliza-agent',
        chainOptimized: 'SEI',
        sessionId: sessionId
      }
    }
  } catch (error) {
    console.error('Failed to call Eliza agent, using fallback response:', error)

    // Fallback response if Eliza is unavailable
    return {
      message: generateFallbackResponse(data.message, data.vaultAddress),
      confidence: 0.6,
      actions: [],
      suggestions: [
        'What vault strategies do you offer?',
        'How does automated rebalancing work?',
        'What are the current APY rates?',
        'Explain Delta Neutral strategy'
      ],
      metadata: {
        model: 'fallback-responses',
        responseTime: 'instant',
        processingSource: 'ui-fallback',
        chainOptimized: 'SEI',
        fallbackReason: error instanceof Error ? error.message : 'Eliza agent unavailable'
      }
    }
  }
}

/**
 * Generate fallback response when Eliza is unavailable
 */
function generateFallbackResponse(message: string, vaultAddress?: string): string {
  const lowerMessage = message.toLowerCase()

  // Educational responses about what Yield Delta is
  if (lowerMessage.includes('what is') || lowerMessage.includes('what are') || lowerMessage.includes('explain')) {
    if (lowerMessage.includes('yield delta')) {
      return `**Yield Delta** is an automated DeFi vault platform on SEI blockchain.

**How it works:**
1. You deposit assets (SEI, USDC, etc.) into a vault
2. Our AI automatically manages positions 24/7
3. Vaults rebalance hourly to optimize yields
4. Earnings compound daily - no manual work needed!

**Why SEI?**
400ms finality and ~$0.15 gas costs make frequent rebalancing profitable. Try asking about our vault strategies!`
    }

    if (lowerMessage.includes('delta neutral')) {
      return `**Delta Neutral Strategy** (~7% APY)

This is our **safest strategy** - it protects you from price volatility!

**How it works:**
• Maintains balanced long/short positions
• Earns from trading fees, not price movements
• Minimizes impermanent loss risk
• Perfect for risk-averse users

The vault handles everything automatically - you just deposit and earn steady yields!`
    }
  }

  if (lowerMessage.includes('rebalance') || lowerMessage.includes('automated') || lowerMessage.includes('automatic')) {
    return `🤖 **Automated Rebalancing Explained**

Our vaults ${vaultAddress ? `(including ${vaultAddress.slice(0, 6)}...${vaultAddress.slice(-4)})` : ''} work completely on autopilot:

⏰ **Hourly Rebalancing:** AI monitors market conditions and adjusts positions
💰 **Daily Compounding:** Earnings are reinvested automatically
📊 **Smart Optimization:** Maximizes fee capture based on liquidity depth

**You do:** Deposit once
**Vault does:** Everything else

SEI's 400ms finality and ~$0.15 gas costs make this profitable!`
  }

  if (lowerMessage.includes('strategy') || lowerMessage.includes('strategies') || lowerMessage.includes('vault')) {
    return `📊 **Yield Delta Vault Strategies**

Choose your risk/reward profile:

🛡️ **Delta Neutral** (~7% APY)
• Lowest risk, market-neutral positions
• Protects against volatility
• Steady, predictable yields

🌾 **Yield Farming** (~12.23% APY)
• Balanced risk/reward
• Optimized liquidity provision
• Best for most users

⚡ **Arbitrage** (~10.3% APY)
• Active DEX trading strategy
• Exploits SEI's 400ms finality
• Higher frequency trades

All vaults rebalance hourly and compound daily automatically!`
  }
  
  if (lowerMessage.includes('gas') || lowerMessage.includes('cost')) {
    return `⚡ SEI's advantages: 400ms finality, ~$0.15 gas costs, and parallel execution make it ideal for active liquidity management compared to Ethereum's $50+ rebalancing costs.`
  }
  
  if (lowerMessage.includes('apy') || lowerMessage.includes('yield') || lowerMessage.includes('earn')) {
    return `💰 Current vault APYs (automatically compounded daily):

• Delta Neutral: ~7% APY (lowest risk)
• Yield Farming: ~12.23% APY (balanced)
• Arbitrage: ~10.3% APY (SEI-optimized)

Higher APYs are possible during high-volume periods. Our automated rebalancing maximizes fee capture without any manual intervention!`
  }
  
  return `🤖 I'm here to help with vault optimization questions! Our vaults automatically rebalance every hour and compound yields daily. Ask me about APY rates, strategy comparisons, or how our automated rebalancing works.`
}

/**
 * Get agent status
 * GET /api/eliza/chat - Check if Eliza agent is available
 */
export async function GET() {
  const ELIZA_AGENT_URL = process.env.ELIZA_AGENT_URL || 'https://vibrant-harmony-production.up.railway.app'

  try {
    // Check if agent is available via /api/agents endpoint
    const response = await fetch(`${ELIZA_AGENT_URL}/api/agents`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })

    const agentsData = response.ok ? await response.json() : null
    const agentInfo = agentsData?.data?.agents?.[0]

    return NextResponse.json({
      success: true,
      agentStatus: response.ok ? 'online' : 'error',
      agentId: agentInfo?.id || AGENT_ID,
      agentName: agentInfo?.name || 'Kairos',
      agentUrl: ELIZA_AGENT_URL,
      capabilities: [
        'automated_vault_strategies',
        'hourly_rebalancing',
        'daily_compounding',
        'apy_optimization',
        'market_analysis',
        'session_based_chat'
      ],
      fallbackMode: !response.ok,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      agentStatus: 'offline',
      agentName: 'Kairos',
      agentUrl: ELIZA_AGENT_URL,
      error: error instanceof Error ? error.message : 'Connection failed',
      fallbackMode: true,
      fallbackCapabilities: [
        'automated_strategies_info',
        'apy_rates',
        'rebalancing_info',
        'vault_comparisons'
      ],
      timestamp: new Date().toISOString()
    })
  }
}