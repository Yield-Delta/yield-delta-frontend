import { DocsBackButton } from '@/components/docs/DocsBackButton'
import { CodeBlock } from '@/components/docs/CodeBlock'
import { Shield, Zap, CheckCircle, ExternalLink } from 'lucide-react'
import { CopyButton } from '@/components/docs/CopyButton'

/**
 * Render the Smart Contracts documentation page for Yield Delta on SEI Network.
 *
 * Presents network information, core contract cards (with interfaces, addresses, and copy actions),
 * contract interface reference sections (IStrategyVault, IVaultFactory, IAIOracle), integration examples,
 * security and bug-bounty details, gas optimization and estimates, deployment addresses (testnet/mainnet),
 * resources, and a final call-to-action.
 *
 * @returns The page's JSX element.
 */
export default function SmartContractsPage() {
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
              <Shield className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))' }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
              Smart Contracts
            </h1>
          </div>

          <p className="text-lg text-gray-200 leading-relaxed font-medium max-w-3xl">
            Comprehensive guide to Yield Delta&apos;s smart contracts deployed on SEI Network.
            Our contracts implement AI-powered yield optimization, automated rebalancing, and secure vault management.
          </p>
        </div>
      </div>

      {/* Network Information - Enhanced Card */}
      <div className="mb-12 overflow-hidden rounded-2xl group transition-all duration-500 hover:scale-[1.01]"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
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
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-green-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
            <h3 className="text-xl font-bold text-white">Network Information</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Chain', value: 'SEI Network (EVM)', icon: '⛓️' },
              { label: 'Testnet Chain ID', value: '1328', icon: '🔧' },
              { label: 'Mainnet Chain ID', value: '1329', icon: '🌐' },
              { label: 'Block Time', value: '~400ms', icon: '⚡' },
              { label: 'Finality', value: 'Instant', icon: '✨' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-300">{item.label}</span>
                </div>
                <span className="text-sm font-bold text-green-400">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Core Contracts */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-8">
          Core Contracts
        </h2>
        <div className="p-4 mb-6 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-yellow-400">
            <strong>Note:</strong> Addresses marked with &quot;(Example)&quot; are placeholder addresses for demonstration.
            All other addresses are deployed on SEI Testnet (atlantic-2).
          </p>
        </div>
      </div>

      <div className="grid gap-6 mb-12">
        {[
          {
            name: 'StrategyVault (Native SEI)',
            description: 'AI-driven vault for native SEI token liquidity management.',
            interface: 'IStrategyVault',
            address: '0x1ec7d0E455c0Ca2Ed4F2c27bc8F7E3542eeD6565', // SEI Testnet - atlantic-2
            features: [
              'Native SEI optimization',
              'Gas-efficient operations',
              'Automated compounding',
              'Dynamic range adjustment'
            ],
            color: 'green',
            icon: '💎'
          },
          {
            name: 'StrategyVault (USDC)',
            description: 'AI-driven dynamic liquidity vault that automatically manages concentrated liquidity positions.',
            interface: 'IStrategyVault',
            address: '0xbCB883594435D92395fA72D87845f87BE78d202E', // SEI Testnet - atlantic-2
            features: [
              'Automated position management',
              'AI-powered rebalancing',
              'Compound interest generation',
              'Impermanent loss mitigation'
            ],
            color: 'cyan',
            icon: '🎯'
          },
          {
            name: 'VaultFactory',
            description: 'Factory contract for creating new strategy vaults with different configurations.',
            interface: 'IVaultFactory',
            address: '0x1ec598666F2A7322A7C954455018e3CFB5A13A99', // SEI Testnet - atlantic-2
            features: [
              'Vault creation with custom parameters',
              'Strategy template management',
              'Access control and permissions',
              'Vault registry maintenance'
            ],
            color: 'purple',
            icon: '🏭'
          },
          {
            name: 'AIOracle',
            description: 'Oracle contract that provides AI-powered predictions for optimal rebalancing.',
            interface: 'IAIOracle',
            address: '0xA3437847337d953ED6c9eB130840D04c249973e5', // SEI Testnet - atlantic-2
            features: [
              'AI model registration',
              'Rebalance signal generation',
              'Confidence scoring',
              'Multi-signature validation'
            ],
            color: 'blue',
            icon: '🤖'
          },
          {
            name: 'RewardsDistributor (Example)',
            description: 'Manages and distributes rewards to vault participants.',
            interface: 'IRewardsDistributor',
            address: '0x9876543210987654321098765432109876543210',
            features: [
              'Automated reward distribution',
              'Multi-token reward support',
              'Vesting schedules',
              'Performance-based bonuses'
            ],
            color: 'green',
            icon: '💰'
          }
        ].map((contract, index) => {
          const colorMap = {
            cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
            purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
            blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
            green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }
          }
          const colors = colorMap[contract.color as keyof typeof colorMap]

          const hoverClasses = {
            cyan: 'hover:border-cyan-500 hover:shadow-cyan-500/40',
            purple: 'hover:border-purple-500 hover:shadow-purple-500/40',
            blue: 'hover:border-blue-500 hover:shadow-blue-500/40',
            green: 'hover:border-green-500 hover:shadow-green-500/40'
          }

          return (
            <div key={index} className={`overflow-hidden rounded-2xl group transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl ${hoverClasses[contract.color as keyof typeof hoverClasses]}`}
              style={{
                background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255, 255, 255, 0.03) 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset`,
              }}
            >
              <div className="p-6"
                style={{
                  background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255, 255, 255, 0.05) 100%)`,
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${colors.text} 0%, ${colors.text}CC 100%)`,
                      boxShadow: `0 4px 16px ${colors.glow}`,
                    }}
                  >
                    {contract.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white">{contract.name}</h3>
                </div>
                <p className="text-gray-300 text-sm font-medium leading-relaxed">
                  {contract.description}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-400 w-24">Interface</span>
                    <code className="px-3 py-1.5 rounded-lg text-sm font-bold"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                      }}
                    >
                      {contract.interface}
                    </code>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-400 w-24">Address</span>
                    <div className="flex-1 flex items-center gap-2">
                      <code className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: `1px solid ${colors.border}`,
                          color: colors.text,
                        }}
                      >
                        {contract.address}
                      </code>
                      <CopyButton
                        text={contract.address}
                        className="transition-all duration-300"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${colors.border}`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <span className="text-sm font-semibold text-gray-400 mb-3 block">Features</span>
                  <div className="grid gap-2">
                    {contract.features.map((feature, fIndex) => (
                      <div key={fIndex} className="flex items-center gap-3 p-3 rounded-lg"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: `1px solid ${colors.border}40`,
                        }}
                      >
                        <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: colors.text }} />
                        <span className="text-sm text-gray-300 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Contract Interfaces */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-8">
          Contract Interfaces
        </h2>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">IStrategyVault</h3>
        <p className="mb-4">Core interface for interacting with strategy vaults.</p>

        <CodeBlock language="solidity" code={`interface IStrategyVault {
    // Events
    event Deposited(address indexed user, uint256 amount0, uint256 amount1, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount0, uint256 amount1);
    event Rebalanced(int24 newTickLower, int24 newTickUpper, uint256 timestamp);
    event FeesCollected(uint256 fee0, uint256 fee1);

    // View functions
    function totalValueLocked() external view returns (uint256);
    function getCurrentPosition() external view returns (
        int24 tickLower,
        int24 tickUpper,
        uint128 liquidity
    );
    function getUserShares(address user) external view returns (uint256);
    function getPerformanceMetrics() external view returns (
        uint256 apy,
        uint256 sharpeRatio,
        uint256 maxDrawdown
    );

    // State-changing functions
    function deposit(
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 amount0Min,
        uint256 amount1Min,
        address recipient,
        uint256 deadline
    ) external returns (uint256 shares, uint256 amount0, uint256 amount1);

    function withdraw(
        uint256 shares,
        uint256 amount0Min,
        uint256 amount1Min,
        address recipient,
        uint256 deadline
    ) external returns (uint256 amount0, uint256 amount1);

    function rebalance(
        int24 newTickLower,
        int24 newTickUpper,
        uint256 deadline,
        bytes calldata aiSignature
    ) external;

    function collectFees() external returns (uint256 fee0, uint256 fee1);
    function compound() external;
}`} />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">IVaultFactory</h3>
        <p className="mb-4">Factory interface for creating and managing vaults.</p>

        <CodeBlock language="solidity" code={`interface IVaultFactory {
    // Structs
    struct VaultParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickSpacing;
        string name;
        string strategy;
        address oracle;
        uint256 rebalanceThreshold;
    }

    // Events
    event VaultCreated(
        address indexed vault,
        address indexed creator,
        address token0,
        address token1,
        string strategy
    );

    // Functions
    function createVault(
        VaultParams calldata params
    ) external payable returns (address vault);

    function getVault(bytes32 salt) external view returns (address);
    function getVaultByIndex(uint256 index) external view returns (address);
    function allVaultsLength() external view returns (uint256);
    function isVault(address vault) external view returns (bool);
    function setVaultImplementation(address newImplementation) external;
    function updateOracle(address vault, address newOracle) external;
}`} />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">IAIOracle</h3>
        <p className="mb-4">Oracle interface for AI-powered predictions.</p>

        <CodeBlock language="solidity" code={`interface IAIOracle {
    // Structs
    struct RebalanceSignal {
        int24 newTickLower;
        int24 newTickUpper;
        uint256 confidence;
        uint256 expectedAPY;
        uint256 gasEstimate;
        uint256 timestamp;
        bytes signature;
    }

    struct MarketData {
        uint256 price;
        uint256 volume24h;
        uint256 volatility;
        uint256 liquidity;
    }

    // Events
    event SignalGenerated(
        address indexed vault,
        int24 tickLower,
        int24 tickUpper,
        uint256 confidence
    );
    event ModelUpdated(string model, address signer);

    // Functions
    function requestRebalanceSignal(
        address vault,
        MarketData calldata data
    ) external returns (bytes32 requestId);

    function getSignal(
        bytes32 requestId
    ) external view returns (RebalanceSignal memory);

    function validateSignature(
        bytes32 requestId,
        bytes calldata signature
    ) external view returns (bool);

    function registerModel(
        string calldata modelId,
        address signer
    ) external;

    function setConfidenceThreshold(uint256 threshold) external;
}`} />
      </div>

      <hr className="my-8" />

      {/* Integration Guide */}
      <h2 className="text-2xl font-semibold mb-4">Integration Guide</h2>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Connect to SEI Network</h3>
        <p className="mb-4">Configure your Web3 provider to connect to SEI.</p>

        <CodeBlock language="javascript" code={`import { ethers } from 'ethers';

// Testnet configuration
const TESTNET_CONFIG = {
  chainId: 1328,
  name: 'SEI Atlantic-2 Testnet',
  rpcUrl: 'https://evm-rpc-testnet.sei-apis.com',
  explorer: 'https://seitrace.com/atlantic-2',
  nativeCurrency: {
    name: 'SEI',
    symbol: 'SEI',
    decimals: 18
  }
};

// Connect to SEI
const provider = new ethers.JsonRpcProvider(TESTNET_CONFIG.rpcUrl);

// Connect wallet
const signer = new ethers.Wallet(privateKey, provider);

// Or use MetaMask
if (window.ethereum) {
  await window.ethereum.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: '0x' + TESTNET_CONFIG.chainId.toString(16),
      chainName: TESTNET_CONFIG.name,
      rpcUrls: [TESTNET_CONFIG.rpcUrl],
      blockExplorerUrls: [TESTNET_CONFIG.explorer],
      nativeCurrency: TESTNET_CONFIG.nativeCurrency
    }]
  });
}`} />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Interact with Vaults</h3>
        <p className="mb-4">Example of depositing into a strategy vault.</p>

        <CodeBlock language="javascript" code={`import { ethers } from 'ethers';
import VAULT_ABI from './abis/StrategyVault.json';

// Vault configuration
const VAULT_ADDRESS = '0xf6A791e4773A60083AA29aaCCDc3bA5E900974fE';
const TOKEN0_ADDRESS = '0x...'; // SEI
const TOKEN1_ADDRESS = '0x...'; // USDC

// Initialize contract
const vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

// Approve tokens first
const token0 = new ethers.Contract(TOKEN0_ADDRESS, ERC20_ABI, signer);
const token1 = new ethers.Contract(TOKEN1_ADDRESS, ERC20_ABI, signer);

const amount0 = ethers.parseEther('10'); // 10 SEI
const amount1 = ethers.parseUnits('100', 6); // 100 USDC

await token0.approve(VAULT_ADDRESS, amount0);
await token1.approve(VAULT_ADDRESS, amount1);

// Deposit into vault
const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour
const tx = await vault.deposit(
  amount0,
  amount1,
  0, // amount0Min - set slippage protection
  0, // amount1Min - set slippage protection
  signer.address,
  deadline
);

const receipt = await tx.wait();
console.log('Deposit successful:', receipt.transactionHash);

// Check your shares
const shares = await vault.getUserShares(signer.address);
console.log('Your vault shares:', ethers.formatEther(shares));`} />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Monitor Vault Performance</h3>
        <p className="mb-4">Track your vault positions and earnings.</p>

        <CodeBlock language="javascript" code={`// Get vault metrics
const tvl = await vault.totalValueLocked();
const metrics = await vault.getPerformanceMetrics();

console.log('Total Value Locked:', ethers.formatEther(tvl));
console.log('APY:', metrics.apy / 100, '%');
console.log('Sharpe Ratio:', metrics.sharpeRatio / 100);
console.log('Max Drawdown:', metrics.maxDrawdown / 100, '%');

// Get current position
const position = await vault.getCurrentPosition();
console.log('Current tick range:', position.tickLower, '-', position.tickUpper);
console.log('Liquidity:', position.liquidity.toString());

// Calculate your share value
const userShares = await vault.getUserShares(signer.address);
const totalShares = await vault.totalSupply();
const userValue = (tvl * userShares) / totalShares;

console.log('Your position value:', ethers.formatEther(userValue));

// Listen to vault events
vault.on('Rebalanced', (tickLower, tickUpper, timestamp) => {
  console.log('Vault rebalanced:', {
    newRange: [tickLower, tickUpper],
    time: new Date(timestamp * 1000)
  });
});

vault.on('FeesCollected', (fee0, fee1) => {
  console.log('Fees collected:', {
    token0: ethers.formatEther(fee0),
    token1: ethers.formatUnits(fee1, 6)
  });
});`} />
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3">Create Custom Vault</h3>
        <p className="mb-4">Deploy your own strategy vault using the factory.</p>

        <CodeBlock language="javascript" code={`import FACTORY_ABI from './abis/VaultFactory.json';

const FACTORY_ADDRESS = '0x1234567890123456789012345678901234567890';
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

// Define vault parameters
const vaultParams = {
  token0: '0x...', // SEI address
  token1: '0x...', // USDC address
  fee: 3000, // 0.3% fee tier
  tickSpacing: 60,
  name: 'My Custom SEI-USDC Vault',
  strategy: 'concentrated_liquidity',
  oracle: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
  rebalanceThreshold: 500 // 5% threshold
};

// Create vault (requires deployment fee)
const deploymentFee = ethers.parseEther('0.1');
const tx = await factory.createVault(vaultParams, { value: deploymentFee });
const receipt = await tx.wait();

// Get vault address from events
const event = receipt.logs.find(
  log => log.topics[0] === factory.interface.getEventTopic('VaultCreated')
);
const decodedEvent = factory.interface.decodeEventLog('VaultCreated', event.data, event.topics);
const vaultAddress = decodedEvent.vault;

console.log('New vault deployed at:', vaultAddress);`} />
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Security */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-green-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          Security
        </h2>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Audit Status</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              name: 'CertiK Audit',
              description: 'Comprehensive security audit completed',
              status: 'Passed',
              icon: '🛡️'
            },
            {
              name: 'OpenZeppelin Audit',
              description: 'Smart contract security review',
              status: 'Passed',
              icon: '✅'
            }
          ].map((audit, index) => (
            <div key={index} className="overflow-hidden rounded-2xl group transition-all duration-500 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{audit.icon}</span>
                    <div>
                      <p className="font-bold text-lg text-white">{audit.name}</p>
                      <p className="text-sm text-gray-300 font-medium">{audit.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm font-semibold text-gray-400">Status:</span>
                  <div className="px-4 py-1.5 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.2)',
                    }}
                  >
                    <span className="text-green-400 font-bold text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {audit.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Security Features</h3>
        <div className="grid gap-3">
          {[
            {
              title: 'Multi-signature Control',
              description: 'Critical functions require multiple signatures',
              icon: '🔐'
            },
            {
              title: 'Time-locked Operations',
              description: 'Major changes have mandatory delay periods',
              icon: '⏱️'
            },
            {
              title: 'Slippage Protection',
              description: 'Built-in protection against price manipulation',
              icon: '🛡️'
            },
            {
              title: 'Emergency Pause',
              description: 'Ability to halt operations in case of issues',
              icon: '⏸️'
            },
            {
              title: 'Reentrancy Guards',
              description: 'Protection against reentrancy attacks',
              icon: '🔒'
            }
          ].map((feature, index) => (
            <div key={index} className="flex items-start gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                {feature.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <strong className="text-white font-bold">{feature.title}</strong>
                </div>
                <p className="text-sm text-gray-300 font-medium">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Bug Bounty Program</h3>
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
            <p className="text-gray-200 font-medium leading-relaxed">
              We maintain an active bug bounty program to ensure the security of our contracts.
            </p>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { level: 'Critical', amount: 'Up to $100,000', color: '#ef4444' },
                { level: 'High', amount: 'Up to $25,000', color: '#f59e0b' },
                { level: 'Medium', amount: 'Up to $5,000', color: '#eab308' },
                { level: 'Low', amount: 'Up to $1,000', color: '#84cc16' }
              ].map((bounty, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${bounty.color}40`,
                  }}
                >
                  <span className="font-bold" style={{ color: bounty.color }}>{bounty.level}</span>
                  <span className="text-sm font-bold text-white">{bounty.amount}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl"
              style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <p className="text-sm text-gray-300 font-medium">
                Report vulnerabilities to:{' '}
                <a href="mailto:security@yielddelta.xyz" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
                  security@yielddelta.xyz
                </a>
              </p>
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

      {/* Gas Optimization */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400 mb-8 flex items-center gap-3">
          <Zap className="w-8 h-8 text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
          Gas Optimization
        </h2>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">SEI Network Advantages</h3>
        <div className="p-6 rounded-2xl mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <p className="text-gray-200 font-medium leading-relaxed mb-6">
            SEI Network provides significant gas optimizations compared to other EVM chains:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Parallel execution', description: 'Multiple transactions processed simultaneously', icon: '⚡' },
              { title: 'Optimistic parallelization', description: 'Reduced transaction conflicts', icon: '🔄' },
              { title: 'Native order matching', description: 'Built-in DEX functionality', icon: '🎯' },
              { title: 'Fast finality', description: '400ms block times', icon: '⏱️' }
            ].map((advantage, index) => (
              <div key={index} className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(6, 182, 212, 0.2)',
                }}
              >
                <span className="text-2xl">{advantage.icon}</span>
                <div>
                  <strong className="text-white font-bold block mb-1">{advantage.title}</strong>
                  <span className="text-sm text-gray-300 font-medium">{advantage.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Gas Estimates</h3>
        <div className="overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <th className="px-6 py-4 text-left font-bold text-white">Operation</th>
                  <th className="px-6 py-4 text-right font-bold text-white">Gas Used</th>
                  <th className="px-6 py-4 text-right font-bold text-white">Cost (SEI)</th>
                  <th className="px-6 py-4 text-right font-bold text-white">Cost (USD)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { operation: 'Deposit', gas: '~150,000', sei: '0.0015', usd: '$0.001' },
                  { operation: 'Withdraw', gas: '~120,000', sei: '0.0012', usd: '$0.0008' },
                  { operation: 'Rebalance', gas: '~300,000', sei: '0.003', usd: '$0.002' },
                  { operation: 'Collect Fees', gas: '~80,000', sei: '0.0008', usd: '$0.0005' },
                  { operation: 'Create Vault', gas: '~500,000', sei: '0.005', usd: '$0.003' }
                ].map((row, index) => (
                  <tr key={index}
                    className="transition-all duration-300 hover:bg-purple-500/[0.08]"
                    style={{
                      borderBottom: index < 4 ? '1px solid rgba(139, 92, 246, 0.15)' : 'none',
                    }}
                  >
                    <td className="px-6 py-4 font-bold text-white">{row.operation}</td>
                    <td className="px-6 py-4 text-right text-purple-400 font-bold">{row.gas}</td>
                    <td className="px-6 py-4 text-right text-cyan-400 font-bold">{row.sei}</td>
                    <td className="px-6 py-4 text-right text-green-400 font-bold">{row.usd}</td>
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

      {/* Deployment Addresses */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-8">
          Deployment Addresses
        </h2>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">SEI Atlantic-2 Testnet (Chain ID: 1328)</h3>
        <div className="overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
                    borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <th className="px-6 py-4 text-left font-bold text-white">Contract</th>
                  <th className="px-6 py-4 text-left font-bold text-white">Address</th>
                  <th className="px-6 py-4 text-center font-bold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'StrategyVault (Native SEI)', address: '0x1ec7d0E455c0Ca2Ed4F2c27bc8F7E3542eeD6565' },
                  { name: 'StrategyVault (USDC)', address: '0xbCB883594435D92395fA72D87845f87BE78d202E' },
                  { name: 'VaultFactory', address: '0x1ec598666F2A7322A7C954455018e3CFB5A13A99' },
                  { name: 'AIOracle', address: '0xA3437847337d953ED6c9eB130840D04c249973e5' },
                  { name: 'RewardsDistributor (Example)', address: '0x9876543210987654321098765432109876543210' },
                  { name: 'Governance (Example)', address: '0xFEDCBA9876543210FEDCBA9876543210FEDCBA98' }
                ].map((contract, index) => (
                  <tr key={index}
                    className="transition-all duration-300 hover:bg-blue-500/[0.08]"
                    style={{
                      borderBottom: index < 5 ? '1px solid rgba(59, 130, 246, 0.15)' : 'none',
                    }}
                  >
                    <td className="px-6 py-4 font-bold text-white">{contract.name}</td>
                    <td className="px-6 py-4">
                      <code className="px-3 py-1.5 rounded-lg font-mono text-xs"
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#60a5fa',
                        }}
                      >
                        {contract.address}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <CopyButton
                          text={contract.address}
                          className="transition-all duration-300"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                          }}
                        />
                        <a
                          href={`https://seitrace.com/address/${contract.address}?chain=atlantic-2`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg transition-all duration-300"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          <ExternalLink className="w-4 h-4 text-cyan-400" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-6">Mainnet (Chain ID: 1329)</h3>
        <div className="p-6 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          }}
        >
          <p className="text-gray-200 font-medium">
            Mainnet contracts will be deployed after final audit completion.
            Join our{' '}
            <a href="https://discord.gg/TWNybCBr" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              Discord
            </a>
            {' '}for deployment updates.
          </p>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-16 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5) 50%, transparent)',
        }}
      />

      {/* Resources */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-8">
          Resources
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {[
          {
            title: 'GitHub Repository',
            description: 'Source code and documentation',
            href: 'https://github.com/yield-delta/yield-delta-protocol/contracts',
            icon: '📚',
            color: 'purple'
          },
          {
            title: 'API Reference',
            description: 'Complete API documentation',
            href: '/docs/api-reference',
            icon: '📖',
            color: 'blue'
          },
          {
            title: 'SEI Explorer',
            description: 'View transactions on-chain',
            href: 'https://seitrace.com',
            icon: '🔍',
            color: 'cyan'
          },
          {
            title: 'Discord Community',
            description: 'Get help and connect with developers',
            href: 'https://discord.gg/TWNybCBr',
            icon: '💬',
            color: 'green'
          }
        ].map((resource, index) => {
          const colorMap = {
            purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.3)', text: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)' },
            blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)', text: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' },
            cyan: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' },
            green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }
          }
          const colors = colorMap[resource.color as keyof typeof colorMap]

          const hoverClasses = {
            purple: 'hover:border-purple-500 hover:shadow-purple-500/40',
            blue: 'hover:border-blue-500 hover:shadow-blue-500/40',
            cyan: 'hover:border-cyan-500 hover:shadow-cyan-500/40',
            green: 'hover:border-green-500 hover:shadow-green-500/40'
          }

          return (
            <a
              key={index}
              href={resource.href}
              target={resource.href.startsWith('http') ? '_blank' : undefined}
              rel={resource.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`block p-6 rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group ${hoverClasses[resource.color as keyof typeof hoverClasses]}`}
              style={{
                background: `linear-gradient(135deg, ${colors.bg} 0%, rgba(255, 255, 255, 0.03) 100%)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.text} 0%, ${colors.text}CC 100%)`,
                    boxShadow: `0 4px 16px ${colors.glow}`,
                  }}
                >
                  {resource.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-white">{resource.title}</h3>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm text-gray-300 font-medium">{resource.description}</p>
                </div>
              </div>
            </a>
          )
        })}
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
          <a href="https://discord.gg/TWNybCBr" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
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

export const metadata = {
  title: 'Smart Contracts - Yield Delta Documentation',
  description: 'Comprehensive guide to Yield Delta smart contracts on SEI Network',
};