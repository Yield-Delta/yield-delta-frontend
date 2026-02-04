import { DocsBackButton } from '@/components/docs/DocsBackButton'
import { CodeBlock } from '@/components/docs/CodeBlock'

/**
 * Render the Getting Started documentation page for Yield Delta.
 *
 * The page presents installation and configuration steps, development and architecture
 * overviews, instructions for creating a first vault, AI feature summaries, testing
 * checks, common troubleshooting tips, and links to further documentation and community resources.
 *
 * @returns The rendered React element for the Getting Started documentation page.
 */
export default function GettingStartedPage() {
  return (
    <div className="docs-content rounded-2xl p-8"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      <DocsBackButton />

      <h1 className="text-4xl font-bold mb-8">Getting Started</h1>
      
      <p className="text-lg text-muted-foreground mb-8">
        Get up and running with Yield Delta in minutes. This guide will walk you through installation, configuration, and deploying your first AI-powered vault.
      </p>

      <h2 className="text-2xl font-semibold mb-4">📋 Prerequisites</h2>
      
      <p className="mb-4">Before starting, ensure you have:</p>
      
      <ul className="space-y-2 mb-8">
        <li><strong>Node.js</strong> 18+ installed</li>
        <li><strong>Bun</strong> package manager (<a href="https://bun.sh" className="text-primary hover:text-primary/80">Install Bun</a>)</li>
        <li><strong>Git</strong> for version control</li>
        <li><strong>SEI Wallet</strong> (Compass or Fin) for blockchain interaction</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">🚀 Quick Installation</h2>

      <h3 className="text-xl font-semibold mb-4">1. Clone the Repository</h3>
      
      <CodeBlock language="bash" code={`# Clone with submodules for complete setup
git clone --recurse-submodules https://github.com/yield-delta/yield-delta-protocol.git
cd sei-dlp-core`} />

      <h3 className="text-xl font-semibold mb-4">2. Install Dependencies</h3>
      
      <CodeBlock language="bash" code={`# Install all dependencies using bun
bun install

# Install AI engine dependencies
cd ai-engine
pip install -r requirements.txt
cd ..

# Install Kairos (ElizaOS) dependencies  
cd kairos
bun install
cd ..`} />

      <h3 className="text-xl font-semibold mb-4">3. Environment Configuration</h3>
      
      <CodeBlock language="bash" code={`# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local`} />

      <p className="mb-4">Required environment variables:</p>
      
      <CodeBlock language="bash" code={`# Core Configuration
NEXT_PUBLIC_SEI_CHAIN_ID=1328
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_VAULT_ADDRESS=0xYourVaultAddress

# Demo Mode (optional)
NEXT_PUBLIC_DEMO_MODE=true

# AI Engine
OPENAI_API_KEY=sk-your-openai-key
AI_ENGINE_URL=http://localhost:8000

# ElizaOS Integration
ELIZAOS_WS_URL=ws://localhost:8000/ws`} />

      <h3 className="text-xl font-semibold mb-4">4. Start Development</h3>
      
      <CodeBlock language="bash" code={`# Start all services
bun dev

# Or start individual services:
bun dev:frontend    # Next.js frontend on :3000
bun dev:ai          # AI engine on :8000  
bun dev:kairos       # ElizaOS agent on :3001`} />

      <h2 className="text-2xl font-semibold mb-4">🔧 Development Setup</h2>

      <h3 className="text-xl font-semibold mb-4">Project Structure</h3>
      
      <CodeBlock language="bash" code={`sei-dlp-core/
├── src/                 # Frontend application
│   ├── app/            # Next.js App Router
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── contracts/          # Smart contracts (Solidity)
├── ai-engine/          # Python AI/ML engine
├── kairos/              # ElizaOS agent
└── docs/               # Documentation`} />

      <h3 className="text-xl font-semibold mb-4">Database Setup</h3>
      
      <p className="mb-4">Yield Delta uses SQLite for development and PostgreSQL for production:</p>
      
      <CodeBlock language="bash" code={`# SQLite (automatic for development)
# Database file: ./data/yield-delta.db

# PostgreSQL (production)
DATABASE_URL=postgresql://user:pass@localhost:5432/yielddelta`} />

      <h3 className="text-xl font-semibold mb-4">Smart Contract Setup</h3>
      
      <p className="mb-4">Deploy contracts to SEI testnet:</p>
      
      <CodeBlock language="bash" code={`cd contracts

# Install Foundry dependencies
forge install

# Deploy to SEI devnet
forge script script/Deploy.s.sol \\
  --rpc-url https://evm-rpc-arctic-1.sei-apis.com \\
  --private-key $PRIVATE_KEY \\
  --broadcast

# Verify contract
forge verify-contract $CONTRACT_ADDRESS \\
  --chain-id 1328 \\
  --etherscan-api-key $SEISCAN_API_KEY`} />

      <h2 className="text-2xl font-semibold mb-4">🏗️ Architecture Overview</h2>

      <h3 className="text-xl font-semibold mb-4">Frontend (Next.js)</h3>
      <ul className="space-y-2 mb-6">
        <li><strong>Framework</strong>: Next.js 14 with App Router</li>
        <li><strong>Styling</strong>: Tailwind CSS + Radix UI</li>
        <li><strong>State</strong>: Zustand + TanStack Query</li>
        <li><strong>Web3</strong>: Wagmi + Viem</li>
        <li><strong>Animation</strong>: Framer Motion + GSAP + Three.js</li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">Backend Services</h3>
      <ul className="space-y-2 mb-6">
        <li><strong>API</strong>: Next.js API routes (serverless)</li>
        <li><strong>AI Engine</strong>: Python FastAPI with ONNX Runtime</li>
        <li><strong>Agent</strong>: ElizaOS for AI chat functionality</li>
        <li><strong>Database</strong>: SQLite (dev) / PostgreSQL (prod)</li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">Smart Contracts</h3>
      <ul className="space-y-2 mb-8">
        <li><strong>Standard</strong>: ERC-4626 vault standard</li>
        <li><strong>Language</strong>: Solidity with Foundry</li>
        <li><strong>Network</strong>: SEI EVM (Chain ID: 1328)</li>
        <li><strong>Features</strong>: Gas optimization, MEV protection</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">🎯 Your First Vault</h2>

      <h3 className="text-xl font-semibold mb-4">1. Enable Demo Mode</h3>
      
      <p className="mb-4">For safe testing, start with demo mode:</p>
      
      <CodeBlock language="bash" code={`# Add to .env.local
NEXT_PUBLIC_DEMO_MODE=true

# Restart development server
bun dev`} />

      <h3 className="text-xl font-semibold mb-4">2. Access the Application</h3>
      
      <p className="mb-4">Navigate to <code className="bg-muted px-2 py-1 rounded">http://localhost:3000</code> and you&apos;ll see:</p>
      
      <ul className="space-y-2 mb-6">
        <li><strong>Landing Page</strong>: Overview of platform features</li>
        <li><strong>Vault Showcase</strong>: Available investment strategies</li>
        <li><strong>Navigation</strong>: Access to vaults, portfolio, market data</li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">3. Create Your First Position</h3>
      
      <ol className="space-y-2 mb-6">
        <li><strong>Visit Vaults Page</strong> (<code className="bg-muted px-2 py-1 rounded">/vaults</code>)</li>
        <li><strong>Select a Strategy</strong> (e.g., &quot;SEI-USDC Concentrated Liquidity&quot;)</li>
        <li><strong>Click &quot;Deposit&quot;</strong> to open the deposit modal</li>
        <li><strong>Enter Amount</strong> (try 5 SEI in demo mode)</li>
        <li><strong>Confirm Transaction</strong> and watch the simulation</li>
      </ol>

      <h3 className="text-xl font-semibold mb-4">4. Explore AI Features</h3>
      
      <div className="space-y-4 mb-8">
        <div>
          <h4 className="font-semibold">Portfolio Rebalancing (<code className="bg-muted px-2 py-1 rounded">/portfolio/rebalance</code>)</h4>
          <ul className="ml-4 space-y-1">
            <li>View AI-generated recommendations</li>
            <li>Select actions to execute</li>
            <li>Watch real-time execution</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold">Kairos Chat (AI assistant button)</h4>
          <ul className="ml-4 space-y-1">
            <li>Ask questions about strategy</li>
            <li>Get personalized recommendations</li>
            <li>Learn about DeFi concepts</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold">Market Analytics (<code className="bg-muted px-2 py-1 rounded">/market</code>)</h4>
          <ul className="ml-4 space-y-1">
            <li>Real-time price data</li>
            <li>Liquidity metrics</li>
            <li>Trading opportunities</li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">🔍 Testing Your Setup</h2>

      <h3 className="text-xl font-semibold mb-4">Health Check</h3>
      
      <p className="mb-4">Verify all services are running:</p>
      
      <CodeBlock language="bash" code={`# Frontend health
curl http://localhost:3000/api/health

# AI engine health  
curl http://localhost:8000/health

# Check API documentation
curl http://localhost:3000/api/docs`} />

      <h3 className="text-xl font-semibold mb-4">Demo Mode Verification</h3>
      
      <ol className="space-y-2 mb-6">
        <li>Look for &quot;DEMO MODE&quot; badges in the UI</li>
        <li>Try a deposit - should complete in ~2 seconds</li>
        <li>Check browser console for demo logs</li>
        <li>Verify no real blockchain transactions</li>
      </ol>

      <h3 className="text-xl font-semibold mb-4">Production Readiness</h3>
      
      <CodeBlock language="bash" code={`# Build production version
bun run build

# Start production server
bun start

# Run tests
bun test`} />

      <h2 className="text-2xl font-semibold mb-4">🚨 Common Issues</h2>

      <h3 className="text-xl font-semibold mb-4">Port Conflicts</h3>
      <CodeBlock language="bash" code={`# Kill processes on common ports
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # AI Engine  
lsof -ti:3001 | xargs kill -9  # ElizaOS`} />

      <h3 className="text-xl font-semibold mb-4">Environment Variables</h3>
      <CodeBlock language="bash" code={`# Verify environment loading
bun run env-check

# Debug environment in browser
console.log(process.env)`} />

      <h3 className="text-xl font-semibold mb-4">Dependency Issues</h3>
      <CodeBlock language="bash" code={`# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Update dependencies
bun update`} />

      <h3 className="text-xl font-semibold mb-4">Wallet Connection</h3>
      <ul className="space-y-2 mb-8">
        <li>Ensure Compass/Fin wallet is installed</li>
        <li>Switch to SEI network (Chain ID: 1328)</li>
        <li>Check wallet has SEI for gas fees</li>
        <li>Try refreshing the page</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">📚 Next Steps</h2>

      <h3 className="text-xl font-semibold mb-4">Explore Features</h3>
      <ul className="space-y-2 mb-6">
        <li><a href="/docs/features" className="text-primary hover:text-primary/80">Core Features</a> - Deep dive into platform capabilities</li>
        <li><a href="/docs/api-reference" className="text-primary hover:text-primary/80">API Reference</a> - Integrate with Yield Delta APIs</li>
        <li><a href="/docs/smart-contracts" className="text-primary hover:text-primary/80">Smart Contracts</a> - Deploy your own vaults</li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">Development</h3>
      <ul className="space-y-2 mb-6">
        <li>Contributing - Help improve the platform</li>
        <li><a href="/docs/deployment" className="text-primary hover:text-primary/80">Deployment</a> - Deploy to production</li>
        <li><a href="/docs/ai-engine" className="text-primary hover:text-primary/80">AI Engine</a> - Customize AI models</li>
      </ul>

      <h3 className="text-xl font-semibold mb-4">Community</h3>
      <ul className="space-y-2 mb-8">
        <li><a href="https://discord.gg/TWNybCBr" className="text-primary hover:text-primary/80">Discord</a> - Join the community</li>
        <li><a href="https://github.com/yield-delta/yield-delta-protocol" className="text-primary hover:text-primary/80">GitHub</a> - View source code</li>
        <li><a href="https://x.com/yielddelta" className="text-primary hover:text-primary/80">Twitter</a> - Follow updates</li>
      </ul>

      <hr className="my-8" />

      <p className="text-center text-muted-foreground italic">
        Ready to optimize your yields with Yield Delta? Let&apos;s go! 🚀
      </p>
    </div>
  );
}

export const metadata = {
  title: 'Getting Started - Yield Delta Documentation',
  description: 'Get up and running with Yield Delta in minutes. Installation, configuration, and your first AI-powered vault.',
};