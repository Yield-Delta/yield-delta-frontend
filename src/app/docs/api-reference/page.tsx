import { DocsBackButton } from '@/components/docs/DocsBackButton'
import { CodeBlock } from '@/components/docs/CodeBlock'
import { Database, Code, Zap, Shield, TrendingUp, Link as LinkIcon, Terminal } from 'lucide-react'

/**
 * Render the API Reference documentation page for Yield Delta, including sections for base configuration, authentication, health, vaults, AI predictions, market data, code examples, error codes, and next steps.
 *
 * @returns The React element for the complete API reference documentation page.
 */
export default function APIReferencePage() {
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

      {/* Hero Section with Gradient */}
      <div className="mb-12 relative overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(6, 182, 212, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
        }}
      >
        <div className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 50%)',
          }}
        />
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
              }}
            >
              <Code className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
              API Reference
            </h1>
          </div>

          <p className="text-lg text-gray-200 leading-relaxed font-medium max-w-3xl">
            Complete API reference for integrating with Yield Delta&apos;s AI-powered yield optimization platform on SEI Network.
          </p>
        </div>
      </div>

      {/* Base Configuration Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Base URL Card */}
        <div className="overflow-hidden rounded-2xl group transition-all duration-500 hover:scale-[1.01]"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
              borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <LinkIcon className="w-6 h-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
              <h3 className="text-xl font-bold text-white">Base URL</h3>
            </div>
          </div>
          <div className="p-6 space-y-3">
            <div className="p-4 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
              }}
            >
              <p className="text-sm font-semibold text-gray-400 mb-2">Production</p>
              <code className="text-sm text-cyan-400 font-mono">https://www.yielddelta.xyz/api</code>
            </div>
            <div className="p-4 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
              }}
            >
              <p className="text-sm font-semibold text-gray-400 mb-2">Development</p>
              <code className="text-sm text-cyan-400 font-mono">http://localhost:3000/api</code>
            </div>
          </div>
        </div>

        {/* Chain Information Card */}
        <div className="overflow-hidden rounded-2xl group transition-all duration-500 hover:scale-[1.01]"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
              <h3 className="text-xl font-bold text-white">Chain Information</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {[
                { label: 'Network', value: 'SEI Network' },
                { label: 'Testnet Chain ID', value: '1328' },
                { label: 'Mainnet Chain ID', value: '1329' },
                { label: 'Block Time', value: '~400ms' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <span className="text-sm font-semibold text-gray-300">{item.label}</span>
                  <span className="text-sm font-bold text-purple-400">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Authentication */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          Authentication
        </h2>

        <div className="mb-8 overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6">
            <p className="text-gray-200 font-medium mb-4">
              Some endpoints require API key authentication. Include your API key in the request headers:
            </p>

            <CodeBlock language="javascript" code={`const headers = {
  'X-API-Key': 'your-api-key-here',
  'Content-Type': 'application/json'
};

// Example usage:
fetch('https://www.yielddelta.xyz/api/vaults', {
  method: 'GET',
  headers: headers
});`} />

            <div className="mt-6 p-4 rounded-xl"
              style={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <p className="text-sm font-semibold text-gray-300">
                <span className="text-cyan-400 font-bold">Public endpoints</span> (no authentication required):
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {['/health', '/market/data', '/vaults'].map((endpoint, index) => (
                  <code key={index} className="px-3 py-1.5 rounded-lg text-sm font-mono"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#22d3ee',
                    }}
                  >
                    {endpoint}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.08) 100%)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <h3 className="text-xl font-bold text-white">Rate Limiting</h3>
          </div>
          <div className="p-6">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <span className="text-sm font-semibold text-gray-300">Limit</span>
                <span className="text-sm font-bold text-amber-400">100 requests per minute</span>
              </div>
              <div className="p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <p className="text-sm font-semibold text-gray-300 mb-3">Response Headers</p>
                <div className="space-y-2">
                  {[
                    { header: 'X-RateLimit-Limit', desc: 'Total request limit' },
                    { header: 'X-RateLimit-Remaining', desc: 'Remaining requests' },
                    { header: 'X-RateLimit-Reset', desc: 'Reset timestamp' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <code className="px-2 py-1 rounded text-xs font-mono"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#fbbf24',
                        }}
                      >
                        {item.header}
                      </code>
                      <span className="text-sm text-gray-400">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Health Endpoints */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-8 flex items-center gap-3">
          <Terminal className="w-8 h-8 text-green-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          Health
        </h2>

        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">GET /health</h3>
            <p className="text-gray-300 font-medium">Check API and service health status.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "status": "healthy",
  "timestamp": "2024-01-23T15:30:00Z",
  "version": "1.0.0",
  "chain": "SEI",
  "chainId": 1328,
  "services": {
    "api": "operational",
    "ai_engine": "operational",
    "blockchain": "operational"
  }
}`} />
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Vault Endpoints */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8 flex items-center gap-3">
          <Database className="w-8 h-8 text-blue-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          Vaults
        </h2>

        {/* GET /vaults */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">GET /vaults</h3>
            <p className="text-gray-300 font-medium">List all vaults with optional filtering.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-4">Query Parameters</h4>
            <div className="overflow-x-auto mb-6 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                      borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <th className="px-6 py-4 text-left font-bold text-white">Parameter</th>
                    <th className="px-6 py-4 text-left font-bold text-white">Type</th>
                    <th className="px-6 py-4 text-left font-bold text-white">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { param: 'strategy', type: 'string', desc: 'Filter by strategy type' },
                    { param: 'active', type: 'boolean', desc: 'Filter by active status' },
                    { param: 'page', type: 'number', desc: 'Page number (default: 1)' },
                    { param: 'limit', type: 'number', desc: 'Items per page (default: 50, max: 1000)' },
                  ].map((row, index) => (
                    <tr key={index}
                      style={{
                        borderBottom: index < 3 ? '1px solid rgba(59, 130, 246, 0.15)' : 'none',
                      }}
                    >
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 rounded text-sm font-mono"
                          style={{
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#60a5fa',
                          }}
                        >
                          {row.param}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-purple-400">{row.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": [
    {
      "address": "0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE",
      "name": "SEI-USDC Concentrated LP",
      "strategy": "concentrated_liquidity",
      "tokenA": "SEI",
      "tokenB": "USDC",
      "fee": 0.003,
      "tickSpacing": 60,
      "tvl": 1250000,
      "apy": 0.125,
      "chainId": 1328,
      "active": true,
      "performance": {
        "totalReturn": 0.087,
        "sharpeRatio": 1.45,
        "maxDrawdown": 0.023,
        "winRate": 0.68
      }
    }
  ],
  "count": 1,
  "chainId": 1328
}`} />
          </div>
        </div>

        {/* POST /vaults */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">POST /vaults</h3>
            <p className="text-gray-300 font-medium">Create a new vault.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-3">Request Body</h4>
            <CodeBlock language="json" code={`{
  "name": "SEI-USDC Concentrated LP",
  "strategy": "concentrated_liquidity",
  "tokenA": "SEI",
  "tokenB": "USDC",
  "fee": 0.003,
  "tickSpacing": 60,
  "chainId": 1328
}`} />

            <h4 className="font-bold text-white mb-3 mt-6">Strategy Types</h4>
            <div className="grid md:grid-cols-2 gap-3 mb-6">
              {[
                { strategy: 'concentrated_liquidity', desc: 'Concentrated liquidity positions' },
                { strategy: 'yield_farming', desc: 'Yield farming strategies' },
                { strategy: 'arbitrage', desc: 'Cross-DEX arbitrage' },
                { strategy: 'hedge', desc: 'Hedging strategies' },
                { strategy: 'stable_max', desc: 'Stablecoin maximizer' },
                { strategy: 'sei_hypergrowth', desc: 'High-risk SEI growth strategy' },
                { strategy: 'blue_chip', desc: 'Blue-chip token strategy' },
                { strategy: 'delta_neutral', desc: 'Delta neutral market making' },
              ].map((item, index) => (
                <div key={index} className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                  }}
                >
                  <code className="text-sm font-mono text-purple-400">{item.strategy}</code>
                  <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "name": "SEI-USDC Concentrated LP",
    "strategy": "concentrated_liquidity",
    "tokenA": "SEI",
    "tokenB": "USDC",
    "fee": 0.003,
    "tickSpacing": 60,
    "tvl": 0,
    "apy": 0,
    "chainId": 1328,
    "active": true
  },
  "message": "Vault created successfully",
  "chainId": 1328
}`} />
          </div>
        </div>

        {/* GET /vaults/{address} */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
              borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">GET /vaults/{'{address}'}</h3>
            <p className="text-gray-300 font-medium">Get detailed vault information.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-3">Parameters</h4>
            <div className="p-4 rounded-xl mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
              }}
            >
              <code className="text-sm font-mono text-cyan-400">address</code>
              <span className="text-sm text-gray-400 ml-2">- SEI vault address (required)</span>
            </div>

            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "address": "0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE",
    "name": "SEI-USDC Concentrated LP",
    "strategy": "concentrated_liquidity",
    "tokenA": "SEI",
    "tokenB": "USDC",
    "fee": 0.003,
    "tvl": 1250000,
    "apy": 0.125,
    "position": {
      "lowerTick": -887220,
      "upperTick": 887220,
      "liquidity": "1000000000000000000",
      "tokensOwed0": "50000000",
      "tokensOwed1": "125000000"
    },
    "risk": {
      "impermanentLoss": 0.023,
      "volatility": 0.18
    }
  },
  "chainId": 1328
}`} />
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* AI Predictions */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-8 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          AI Predictions
        </h2>

        {/* POST /ai/predict */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)',
              borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">POST /ai/predict</h3>
            <p className="text-gray-300 font-medium">Generate AI-powered liquidity range predictions.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-3">Request Body</h4>
            <CodeBlock language="json" code={`{
  "vaultAddress": "0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE",
  "marketData": {
    "currentPrice": 0.485,
    "volume24h": 15678234,
    "volatility": 0.25,
    "liquidity": 125000000
  },
  "timeframe": "1d",
  "chainId": 1328
}`} />

            <h4 className="font-bold text-white mb-3 mt-6">Timeframe Options</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {['1h', '4h', '1d', '7d', '30d'].map((timeframe, index) => (
                <div key={index} className="px-4 py-2 rounded-xl"
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <code className="text-sm font-mono text-purple-400">{timeframe}</code>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "vaultAddress": "0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE",
    "prediction": {
      "optimalRange": {
        "lowerPrice": 0.425,
        "upperPrice": 0.545,
        "lowerTick": -12000,
        "upperTick": 12000,
        "currentTick": 0,
        "tickSpacing": 60
      },
      "confidence": 0.87,
      "expectedReturn": {
        "daily": 0.0012,
        "weekly": 0.0084,
        "monthly": 0.036
      },
      "riskMetrics": {
        "impermanentLossRisk": 0.18,
        "rebalanceFrequency": "medium",
        "maxDrawdown": 0.12,
        "sharpeRatio": 1.45
      },
      "seiOptimizations": {
        "gasOptimized": true,
        "fastFinality": true,
        "parallelExecution": true,
        "estimatedGasCost": 0.001,
        "blockConfirmations": 1
      }
    },
    "metadata": {
      "modelVersion": "2.1.0",
      "features": [
        "price_momentum",
        "volatility_clustering",
        "liquidity_depth",
        "sei_specific_metrics"
      ],
      "processingTime": "~500ms",
      "chainOptimized": "SEI"
    }
  },
  "timestamp": "2024-01-23T15:30:00Z",
  "chainId": 1328
}`} />
          </div>
        </div>

        {/* POST /ai/rebalance */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(236, 72, 153, 0.08) 100%)',
              borderBottom: '1px solid rgba(236, 72, 153, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">POST /ai/rebalance</h3>
            <p className="text-gray-300 font-medium">Trigger or schedule vault rebalancing.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-3">Request Body</h4>
            <CodeBlock language="json" code={`{
  "vaultAddress": "0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE",
  "strategy": "threshold_based",
  "parameters": {
    "newLowerTick": -15000,
    "newUpperTick": 15000,
    "slippageTolerance": 0.005,
    "maxGasPrice": 0.001,
    "deadline": 1706023800
  },
  "chainId": 1328
}`} />

            <h4 className="font-bold text-white mb-3 mt-6">Strategy Options</h4>
            <div className="grid md:grid-cols-3 gap-3 mb-6">
              {[
                { strategy: 'immediate', desc: 'Execute rebalance immediately' },
                { strategy: 'scheduled', desc: 'Schedule for future execution' },
                { strategy: 'threshold_based', desc: 'Execute when thresholds are met' },
              ].map((item, index) => (
                <div key={index} className="p-3 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                  }}
                >
                  <code className="text-sm font-mono text-pink-400">{item.strategy}</code>
                  <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": {
    "transactionHash": "0xabc123...",
    "status": "pending",
    "gasUsed": "0.001",
    "executionTime": "450ms",
    "newPosition": {
      "lowerTick": -15000,
      "upperTick": 15000,
      "liquidity": "1050000000000000000"
    }
  },
  "timestamp": "2024-01-23T15:30:00Z",
  "chainId": 1328
}`} />
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Market Data */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-8">
          Market Data
        </h2>

        {/* GET /market/data */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
              borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">GET /market/data</h3>
            <p className="text-gray-300 font-medium">Get current market data for SEI ecosystem tokens.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-4">Query Parameters</h4>
            <div className="overflow-x-auto mb-6 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
              }}
            >
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
                      borderBottom: '1px solid rgba(6, 182, 212, 0.3)',
                    }}
                  >
                    <th className="px-6 py-4 text-left font-bold text-white">Parameter</th>
                    <th className="px-6 py-4 text-left font-bold text-white">Type</th>
                    <th className="px-6 py-4 text-left font-bold text-white">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { param: 'symbols', type: 'string', desc: 'Comma-separated symbols (e.g., "SEI-USDC,ATOM-SEI")' },
                    { param: 'timeframe', type: 'string', desc: 'Data timeframe (1m, 5m, 15m, 1h, 4h, 1d)' },
                  ].map((row, index) => (
                    <tr key={index}
                      style={{
                        borderBottom: index < 1 ? '1px solid rgba(6, 182, 212, 0.15)' : 'none',
                      }}
                    >
                      <td className="px-6 py-4">
                        <code className="px-2 py-1 rounded text-sm font-mono"
                          style={{
                            background: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#22d3ee',
                          }}
                        >
                          {row.param}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-cyan-400">{row.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": [
    {
      "symbol": "SEI-USDC",
      "price": 0.485,
      "change24h": 0.023,
      "changePercent24h": 4.98,
      "volume24h": "14.2M",
      "volumeUSD24h": 14200000,
      "high24h": 0.492,
      "low24h": 0.467,
      "liquidity": {
        "totalLocked": 125000000,
        "sei": 257732474,
        "usdc": 125000000
      },
      "seiMetrics": {
        "blockTime": 0.4,
        "tps": 5000,
        "gasPrice": 0.000001,
        "validators": 100
      },
      "timestamp": "2024-01-23T15:30:00Z",
      "source": "SEI_DEX_AGGREGATOR"
    }
  ],
  "timestamp": "2024-01-23T15:30:00Z",
  "chainId": 1328
}`} />
          </div>
        </div>

        {/* GET /market/arbitrage */}
        <div className="overflow-hidden rounded-2xl mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
            }}
          >
            <h3 className="text-2xl font-bold text-white mb-2">GET /market/arbitrage</h3>
            <p className="text-gray-300 font-medium">Scan for arbitrage opportunities across SEI DEXes.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-white mb-3">Response</h4>
            <CodeBlock language="json" code={`{
  "success": true,
  "data": [
    {
      "path": ["SEI", "USDC", "SEI"],
      "exchanges": ["DragonSwap", "SeiSwap"],
      "profit": 0.0125,
      "profitUSD": 156.25,
      "confidence": 0.92,
      "gasEstimate": 0.002,
      "netProfit": 0.0105,
      "execution": {
        "optimal": true,
        "urgency": "medium",
        "estimatedTime": "800ms"
      }
    }
  ],
  "scan": {
    "totalOpportunities": 1,
    "avgProfit": 0.0125,
    "timestamp": "2024-01-23T15:30:00Z"
  },
  "chainId": 1328
}`} />
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Code Examples */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-8">
          Code Examples
        </h2>

        <div className="space-y-8">
          {/* Fetching Vault Data */}
          <div className="overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            }}
          >
            <div className="p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
                borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <h3 className="text-xl font-bold text-white">Fetching Vault Data</h3>
            </div>
            <div className="p-6">
              <CodeBlock language="javascript" code={`const response = await fetch('https://www.yielddelta.xyz/api/vaults', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});

const { data } = await response.json();
console.log('Vaults:', data);`} />
            </div>
          </div>

          {/* Creating a Vault */}
          <div className="overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            }}
          >
            <div className="p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <h3 className="text-xl font-bold text-white">Creating a Vault</h3>
            </div>
            <div className="p-6">
              <CodeBlock language="javascript" code={`const response = await fetch('https://www.yielddelta.xyz/api/vaults', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  body: JSON.stringify({
    name: 'My SEI Vault',
    strategy: 'concentrated_liquidity',
    tokenA: 'SEI',
    tokenB: 'USDC',
    fee: 0.003,
    tickSpacing: 60,
    chainId: 1328,
  }),
});

const { data } = await response.json();
console.log('Created vault:', data.address);`} />
            </div>
          </div>

          {/* Getting AI Predictions */}
          <div className="overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            }}
          >
            <div className="p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)',
                borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
              }}
            >
              <h3 className="text-xl font-bold text-white">Getting AI Predictions</h3>
            </div>
            <div className="p-6">
              <CodeBlock language="javascript" code={`const response = await fetch('https://www.yielddelta.xyz/api/ai/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  body: JSON.stringify({
    vaultAddress: '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE',
    marketData: {
      currentPrice: 0.485,
      volume24h: 15678234,
      volatility: 0.25,
      liquidity: 125000000,
    },
    timeframe: '1d',
    chainId: 1328,
  }),
});

const { data } = await response.json();
console.log('AI Prediction:', data.prediction);`} />
            </div>
          </div>

          {/* Smart Contract Interaction */}
          <div className="overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
            }}
          >
            <div className="p-6"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%)',
                borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <h3 className="text-xl font-bold text-white">Interacting with Smart Contracts</h3>
            </div>
            <div className="p-6">
              <CodeBlock language="javascript" code={`import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://evm-rpc-arctic-1.sei-apis.com');
const signer = new ethers.Wallet(privateKey, provider);

const vaultABI = [...]; // Your vault ABI
const vaultAddress = '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE';
const vault = new ethers.Contract(vaultAddress, vaultABI, signer);

// Deposit into vault
const amount0 = ethers.parseEther('10'); // 10 SEI
const amount1 = ethers.parseUnits('5', 6); // 5 USDC

const tx = await vault.deposit(amount0, amount1, signer.address);
await tx.wait();
console.log('Deposited successfully!');`} />
            </div>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Error Codes */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-8">
          Error Codes
        </h2>

        <div className="overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <th className="px-6 py-4 text-left font-bold text-white">Code</th>
                  <th className="px-6 py-4 text-left font-bold text-white">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '400', desc: 'Bad Request - Invalid request data' },
                  { code: '401', desc: 'Unauthorized - Invalid or missing API key' },
                  { code: '404', desc: 'Not Found - Resource not found' },
                  { code: '429', desc: 'Too Many Requests - Rate limit exceeded' },
                  { code: '500', desc: 'Internal Server Error - Server error' },
                ].map((row, index) => (
                  <tr key={index}
                    className="transition-all duration-300 hover:bg-red-500/[0.08]"
                    style={{
                      borderBottom: index < 4 ? '1px solid rgba(239, 68, 68, 0.15)' : 'none',
                    }}
                  >
                    <td className="px-6 py-4">
                      <code className="px-3 py-1.5 rounded-lg text-sm font-mono font-bold"
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                        }}
                      >
                        {row.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-medium">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Next Steps */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-8">
          Next Steps
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            { title: 'Getting Started', href: '/docs/getting-started', desc: 'Set up your development environment', color: 'blue' },
            { title: 'Features', href: '/docs/features', desc: 'Explore platform capabilities', color: 'purple' },
            { title: 'Vaults', href: '/vaults', desc: 'Browse available vaults', color: 'cyan' },
            { title: 'Discord', href: 'https://discord.gg/TWNybCBr', desc: 'Join the community for support', color: 'green' },
          ].map((link, index) => {
            const colorMap = {
              blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
              purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
              cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
              green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }
            }
            const colors = colorMap[link.color as keyof typeof colorMap]

            const hoverClasses = {
              blue: 'hover:border-blue-500 hover:shadow-blue-500/40',
              purple: 'hover:border-purple-500 hover:shadow-purple-500/40',
              cyan: 'hover:border-cyan-500 hover:shadow-cyan-500/40',
              green: 'hover:border-green-500 hover:shadow-green-500/40'
            }

            return (
              <a
                key={index}
                href={link.href}
                className={`block p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group ${hoverClasses[link.color as keyof typeof hoverClasses]}`}
                style={{
                  background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255, 255, 255, 0.03) 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
                }}
              >
                <h3 className="text-xl font-bold text-white mb-2">{link.title}</h3>
                <p className="text-sm text-gray-300 font-medium">{link.desc}</p>
              </a>
            )
          })}
        </div>
      </div>

      {/* Final Call to Action */}
      <div className="p-8 rounded-2xl text-center"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.08) 50%, rgba(6, 182, 212, 0.1) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
        }}
      >
        <p className="text-lg text-gray-200 font-medium">
          Need help? Join our{' '}
          <a href="https://discord.gg/TWNybCBr" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            Discord
          </a>
          {' '}or check the{' '}
          <a href="/docs" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
            documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}