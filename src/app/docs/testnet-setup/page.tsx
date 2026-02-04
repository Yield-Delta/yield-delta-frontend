import Link from 'next/link';
import { DocsBackButton } from '@/components/docs/DocsBackButton'

/**
 * Renders the SEI Testnet Setup documentation page with step-by-step wallet installation, network configuration,
 * testnet faucet instructions, connection guidance for Yield Delta, troubleshooting tips, and additional resources.
 *
 * @returns The page JSX containing instructional content and navigation links for configuring and using SEI Atlantic-2 Testnet.
 */
export default function TestnetSetupPage() {
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

      <h1 className="text-4xl font-bold mb-8">SEI Testnet Setup Guide</h1>

      <div className="docs-alert-base docs-alert-info mb-8">
        <p className="text-lg font-semibold mb-2">🧪 Yield Delta is Currently on SEI Testnet</p>
        <p className="mb-4">
          Yield Delta is currently deployed on the <strong>SEI Atlantic-2 Testnet</strong>. This means all transactions are for testing purposes only and use testnet tokens with no real value.
        </p>
        <p className="text-sm text-muted-foreground">
          Before you can interact with the platform, you need to configure your wallet to connect to the SEI testnet.
        </p>
      </div>

      <p className="text-lg text-muted-foreground mb-8">
        This guide will walk you through setting up your wallet to connect to SEI testnet and getting test tokens to start using Yield Delta.
      </p>

      <h2 className="text-2xl font-semibold mb-4">🎯 Prerequisites</h2>

      <ul className="space-y-2 mb-8">
        <li>A web browser (Chrome, Firefox, or Brave recommended)</li>
        <li>One of the supported wallets:
          <ul className="ml-6 mt-2 space-y-1">
            <li><strong>Compass Wallet</strong> (Recommended for SEI)</li>
            <li><strong>Fin Wallet</strong></li>
            <li><strong>MetaMask</strong></li>
          </ul>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">📱 Step 1: Install a Wallet</h2>

      <h3 className="text-xl font-semibold mb-4">Option A: Compass Wallet (Recommended)</h3>

      <div className="docs-glass-card mb-6">
        <p className="mb-4">Compass is the native wallet for SEI Network with built-in testnet support.</p>

        <ol className="space-y-3 list-decimal list-inside">
          <li>Visit <a href="https://compasswallet.io" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">compasswallet.io</a></li>
          <li>Click &quot;Download&quot; and select your browser extension</li>
          <li>Follow the installation prompts</li>
          <li>Create a new wallet or import an existing one</li>
          <li className="text-red-400 font-semibold">⚠️ SAVE YOUR SEED PHRASE SECURELY - Never share it with anyone!</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mb-4">Option B: MetaMask</h3>

      <div className="docs-glass-card mb-8">
        <p className="mb-4">MetaMask is a popular EVM wallet that can be configured for SEI.</p>

        <ol className="space-y-3 list-decimal list-inside">
          <li>Visit <a href="https://metamask.io" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">metamask.io</a></li>
          <li>Click &quot;Download&quot; for your browser</li>
          <li>Install the extension and create/import a wallet</li>
          <li className="text-red-400 font-semibold">⚠️ SAVE YOUR SEED PHRASE SECURELY</li>
        </ol>
      </div>

      <h2 className="text-2xl font-semibold mb-4">🔧 Step 2: Configure SEI Testnet</h2>

      <h3 className="text-xl font-semibold mb-4">For Compass Wallet</h3>

      <div className="docs-glass-card mb-6">
        <p className="mb-4">Compass has built-in SEI testnet support:</p>

        <ol className="space-y-3 list-decimal list-inside">
          <li>Open Compass wallet extension</li>
          <li>Click the network dropdown at the top</li>
          <li>Select <strong>&quot;atlantic-2&quot;</strong> (SEI Testnet)</li>
          <li>Confirm the network switch</li>
        </ol>

        <div className="docs-alert-base docs-alert-success mt-4">
          <p className="text-sm">
            ✅ <strong>You&apos;re done!</strong> Compass automatically configured the testnet RPC and chain ID.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">For MetaMask</h3>

      <div className="docs-glass-card mb-6">
        <p className="mb-4">You need to manually add SEI testnet to MetaMask:</p>

        <ol className="space-y-3 list-decimal list-inside mb-4">
          <li>Open MetaMask extension</li>
          <li>Click the network dropdown</li>
          <li>Click &quot;Add Network&quot; at the bottom</li>
          <li>Click &quot;Add a network manually&quot;</li>
          <li>Enter the following details:</li>
        </ol>

        <div className="docs-table-container mb-4">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Network Name:</td>
                <td className="py-2 font-mono">SEI Atlantic-2 Testnet</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">RPC URL:</td>
                <td className="py-2 font-mono">https://evm-rpc-testnet.sei-apis.com</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Chain ID:</td>
                <td className="py-2 font-mono">1328</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4 font-semibold">Currency Symbol:</td>
                <td className="py-2 font-mono">SEI</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-semibold">Block Explorer:</td>
                <td className="py-2 font-mono">https://seitrace.com</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ol start={6} className="space-y-3 list-decimal list-inside">
          <li>Click &quot;Save&quot;</li>
          <li>Switch to the SEI Atlantic-2 Testnet network</li>
        </ol>

        <div className="docs-alert-base docs-alert-success mt-4">
          <p className="text-sm">
            ✅ <strong>Success!</strong> Your MetaMask is now configured for SEI testnet.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Quick Add via Chainlist</h3>

      <div className="docs-glass-card mb-8">
        <p className="mb-4">
          <strong>Alternative method:</strong> Use Chainlist for one-click network addition
        </p>

        <ol className="space-y-3 list-decimal list-inside">
          <li>Visit <a href="https://chainlist.org" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">chainlist.org</a></li>
          <li>Enable &quot;Testnets&quot; toggle at the top</li>
          <li>Search for &quot;SEI&quot;</li>
          <li>Find &quot;SEI Atlantic-2&quot; and click &quot;Add to MetaMask&quot;</li>
          <li>Approve the connection in your wallet</li>
        </ol>
      </div>

      <h2 className="text-2xl font-semibold mb-4">💰 Step 3: Get Testnet Tokens</h2>

      <h3 className="text-xl font-semibold mb-4">SEI Testnet Faucet</h3>

      <div className="docs-glass-card mb-6">
        <p className="mb-4">You need testnet SEI to pay for transaction gas fees:</p>

        <ol className="space-y-3 list-decimal list-inside">
          <li>Copy your wallet address from Compass/MetaMask</li>
          <li>Visit the SEI testnet faucet:
            <ul className="ml-6 mt-2 space-y-1">
              <li><a href="https://atlantic-2.app.sei.io/faucet" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Official SEI Faucet</a></li>
              <li><a href="https://faucet.sei.io" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Alternative Faucet</a></li>
            </ul>
          </li>
          <li>Paste your address and request tokens</li>
          <li>Wait 10-30 seconds for tokens to arrive</li>
          <li>Check your wallet balance</li>
        </ol>

        <div className="docs-alert-base docs-alert-info mt-4">
          <p className="text-sm">
            💡 <strong>Tip:</strong> The faucet typically provides 1-10 SEI. This is more than enough for testing on Yield Delta.
          </p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Additional Test Tokens</h3>

      <div className="docs-glass-card mb-8">
        <p className="mb-4">For full testing, you may want testnet versions of other tokens:</p>

        <ul className="space-y-2">
          <li>
            <strong>Test USDC:</strong> Available through the <a href="https://atlantic-2.app.sei.io/faucet" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">SEI faucet</a>
          </li>
          <li>
            <strong>Test ATOM:</strong> Request from <a href="https://faucet.cosmos.network" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">Cosmos faucet</a> (if bridging)
          </li>
        </ul>

        <p className="mt-4 text-sm text-muted-foreground">
          Note: Token availability varies by faucet. Check the faucet interface for available tokens.
        </p>
      </div>

      <h2 className="text-2xl font-semibold mb-4">✅ Step 4: Connect to Yield Delta</h2>

      <div className="docs-glass-card mb-6">
        <p className="mb-4">Now you&apos;re ready to use Yield Delta on testnet:</p>

        <ol className="space-y-3 list-decimal list-inside">
          <li>Visit <Link href="/" className="text-primary hover:text-primary/80">Yield Delta</Link></li>
          <li>Click &quot;Connect Wallet&quot; in the top-right corner</li>
          <li>Select your wallet (Compass, MetaMask, or Fin)</li>
          <li>Approve the connection request</li>
          <li>Ensure you&apos;re on the SEI Atlantic-2 Testnet</li>
        </ol>

        <div className="docs-alert-base docs-alert-success mt-4">
          <p className="text-sm">
            🎉 <strong>You&apos;re connected!</strong> You should see your wallet address and testnet SEI balance in the navigation bar.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">🚀 Next Steps</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="docs-nav-card">
          <h3 className="font-semibold mb-2">📊 Explore Vaults</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Browse available yield strategies and deposit testnet tokens
          </p>
          <a href="/vaults" className="text-primary hover:text-primary/80 text-sm font-medium">
            View Vaults →
          </a>
        </div>

        <div className="docs-nav-card">
          <h3 className="font-semibold mb-2">🧠 Try AI Rebalancing</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Let AI optimize your portfolio for maximum returns
          </p>
          <a href="/portfolio/rebalance" className="text-primary hover:text-primary/80 text-sm font-medium">
            Start Rebalancing →
          </a>
        </div>

        <div className="docs-nav-card">
          <h3 className="font-semibold mb-2">💬 Chat with Kairos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ask our AI assistant about DeFi strategies
          </p>
          <p className="text-sm text-muted-foreground">
            Click the chat button in the bottom-right
          </p>
        </div>

        <div className="docs-nav-card">
          <h3 className="font-semibold mb-2">📈 View Dashboard</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Track your portfolio performance and analytics
          </p>
          <Link href="/dashboard" className="text-primary hover:text-primary/80 text-sm font-medium">
            Open Dashboard →
          </Link>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">🔍 Troubleshooting</h2>

      <div className="space-y-4 mb-8">
        <div className="docs-trouble-card">
          <p className="font-semibold mb-2">❌ Wallet won&apos;t connect</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Ensure you&apos;re on the SEI Atlantic-2 Testnet (Chain ID: 1328)</li>
            <li>• Try refreshing the page</li>
            <li>• Disconnect and reconnect your wallet</li>
            <li>• Clear browser cache and cookies</li>
          </ul>
        </div>

        <div className="docs-trouble-card">
          <p className="font-semibold mb-2">❌ Transaction fails with &quot;insufficient funds&quot;</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Request more testnet SEI from the faucet</li>
            <li>• Ensure you have at least 0.1 SEI for gas fees</li>
            <li>• Check you&apos;re not trying to spend more than your balance</li>
          </ul>
        </div>

        <div className="docs-trouble-card">
          <p className="font-semibold mb-2">❌ Network mismatch error</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Open your wallet and manually switch to SEI Atlantic-2</li>
            <li>• Verify the Chain ID is 1328</li>
            <li>• Remove and re-add the network if configured incorrectly</li>
          </ul>
        </div>

        <div className="docs-trouble-card">
          <p className="font-semibold mb-2">❌ Faucet not working</p>
          <ul className="text-sm space-y-1 ml-4">
            <li>• Try an alternative faucet link</li>
            <li>• Wait a few minutes and try again (rate limits)</li>
            <li>• Join the <a href="https://discord.gg/TWNybCBr" className="text-primary hover:text-primary/80">SEI Discord</a> and ask in #faucet channel</li>
          </ul>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">ℹ️ Important Notes</h2>

      <div className="space-y-4 mb-8">
        <div className="docs-alert-base docs-alert-warning">
          <p className="font-semibold mb-2">⚠️ Testnet Tokens Have No Value</p>
          <p className="text-sm">
            All tokens on testnet are for testing only. They cannot be traded for real money and have no monetary value. Never send mainnet tokens to testnet addresses!
          </p>
        </div>

        <div className="docs-alert-base docs-alert-info">
          <p className="font-semibold mb-2">🔄 Testnet Can Be Reset</p>
          <p className="text-sm">
            Testnets may be periodically reset, causing all balances and transactions to be wiped. This is normal and expected behavior.
          </p>
        </div>

        <div className="docs-alert-base docs-alert-purple">
          <p className="font-semibold mb-2">🚀 Mainnet Coming Soon</p>
          <p className="text-sm">
            Yield Delta will launch on SEI mainnet in the future. When that happens, we&apos;ll update this guide with mainnet instructions. Stay tuned!
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">📚 Additional Resources</h2>

      <ul className="space-y-2 mb-8">
        <li>
          <a href="https://docs.sei.io" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            SEI Network Documentation
          </a>
        </li>
        <li>
          <a href="https://discord.gg/TWNybCBr" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            SEI Discord Community
          </a>
        </li>
        <li>
          <a href="https://seitrace.com" className="text-primary hover:text-primary/80" target="_blank" rel="noopener noreferrer">
            SEI Block Explorer
          </a>
        </li>
        <li>
          <a href="/docs/getting-started" className="text-primary hover:text-primary/80">
            Yield Delta Getting Started Guide
          </a>
        </li>
        <li>
          <a href="/docs/understanding-metrics" className="text-primary hover:text-primary/80">
            Understanding Vault Metrics
          </a>
        </li>
      </ul>

      <hr className="my-8" />

      <p className="text-center text-muted-foreground italic">
        Need help? Join our <a href="https://discord.gg/TWNybCBr" className="text-primary hover:text-primary/80">Discord community</a> for support! 💬
      </p>
    </div>
  );
}

export const metadata = {
  title: 'SEI Testnet Setup - Yield Delta Documentation',
  description: 'Complete guide to setting up your wallet for SEI testnet and connecting to Yield Delta.',
};