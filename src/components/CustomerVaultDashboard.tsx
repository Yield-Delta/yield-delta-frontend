import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { Address, Abi } from 'viem';
import type { Vault } from '../types/api';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Clock,
  Shield
} from 'lucide-react';
import styles from './CustomerVaultDashboard.module.css';

interface CustomerVaultDashboardProps {
  vaultAddress: Address;
  vaultABI: Abi;
}

const CustomerVaultDashboard: React.FC<CustomerVaultDashboardProps> = ({ vaultAddress, vaultABI }) => {
  const { address } = useAccount();
  const [depositAmount0, setDepositAmount0] = useState('');
  const [depositAmount1, setDepositAmount1] = useState('');
  const [withdrawShares, setWithdrawShares] = useState('');
  // Demo simulation flag - controlled by environment variable
  const [isDemoMode] = useState(process.env.NEXT_PUBLIC_DEMO_MODE === 'true');
  const [withdrawalStatus, setWithdrawalStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [withdrawalHash, setWithdrawalHash] = useState<string | null>(null);
  // State for vault metadata
  const [vaultMetadata, setVaultMetadata] = useState<Vault | null>(null);

  // Fetch vault metadata from API
  useEffect(() => {
    const fetchVaultMetadata = async () => {
      try {
        const response = await fetch('/api/vaults');
        const result = await response.json();

        if (result.success) {
          // Find the specific vault by address
          const vault = result.data.find((v: Vault) =>
            v.address.toLowerCase() === vaultAddress.toLowerCase()
          );

          if (vault) {
            setVaultMetadata(vault);
          }
        }
      } catch (error) {
        console.error('Failed to fetch vault metadata:', error);
      }
    };

    if (vaultAddress) {
      fetchVaultMetadata();
    }
  }, [vaultAddress]);

  // Read customer statistics
  const { data: customerStats } = useReadContract({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'getCustomerStats',
    args: [address],
    query: {
      enabled: !!address,
    },
  }) as { data: readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined, error: Error | null };

  // Demo fallback data when getCustomerStats is not available - vault-specific data
  const getVaultSpecificDemoData = (): readonly [bigint, bigint, bigint, bigint, bigint, bigint] | undefined => {
    if (!isDemoMode) return undefined;

    // Vault-specific demo data matching dashboard positions
    const vaultDemoData: { [key: string]: readonly [bigint, bigint, bigint, bigint, bigint, bigint] } = {
      // SEI-USDC Concentrated LP
      '0xf6a791e4773a60083aa29aaccdc3ba5e900974fe': [
        BigInt('2450000000000000000000'), // 2450 SEI DLP shares
        BigInt('6250450000000000000000'), // $6,250.45 share value
        BigInt('5799670000000000000000'), // $5,799.67 total deposited (value - pnl)
        BigInt('0'),                     // $0.00 total withdrawn
        BigInt(Date.now() - 7200000),    // Deposited 2 hours ago
        BigInt('79200')                  // 22 hours remaining
      ],
      // ATOM-SEI Yield Farm
      '0x6f4cf61bbf63dce0094ca1fba25545f8c03cd8e6': [
        BigInt('1800000000000000000000'), // 1800 SEI DLP shares
        BigInt('4150320000000000000000'), // $4,150.32 share value
        BigInt('3824650000000000000000'), // $3,824.65 total deposited (value - pnl)
        BigInt('0'),                     // $0.00 total withdrawn
        BigInt(Date.now() - 5400000),    // Deposited 1.5 hours ago
        BigInt('81000')                  // 22.5 hours remaining
      ],
      // ETH-USDT Arbitrage Bot
      '0x22fc4c01face783bd47a1ef2b6504213c85906a1': [
        BigInt('950000000000000000000'),  // 950 SEI DLP shares
        BigInt('2890120000000000000000'), // $2,890.12 share value
        BigInt('2655230000000000000000'), // $2,655.23 total deposited (value - pnl)
        BigInt('0'),                     // $0.00 total withdrawn
        BigInt(Date.now() - 4500000),    // Deposited 1.25 hours ago
        BigInt('82200')                  // 22.8 hours remaining
      ],
      // Delta Neutral LP Vault
      '0xae6f27fdf2d15c067a0ebc256ce05a317b671b81': [
        BigInt('1200000000000000000000'), // 1200 SEI DLP shares
        BigInt('1460000000000000000000'), // $1,460.00 share value
        BigInt('1221000000000000000000'), // $1,221.00 total deposited (value - pnl)
        BigInt('0'),                     // $0.00 total withdrawn
        BigInt(Date.now() - 3600000),    // Deposited 1 hour ago
        BigInt('82800')                  // 23 hours remaining
      ]
    };

    return vaultDemoData[vaultAddress.toLowerCase()] || [
      BigInt('5000000000000000000'),   // Default 5 SEI DLP shares
      BigInt('5400000000000000000'),   // Default $5.40 share value
      BigInt('5000000000000000000'),   // Default $5.00 total deposited
      BigInt('0'),                     // Default $0.00 total withdrawn
      BigInt(Date.now() - 3600000),    // Default deposited 1 hour ago
      BigInt('82800')                  // Default 23 hours remaining
    ];
  };

  const demoCustomerStats = getVaultSpecificDemoData();

  // Read vault information
  const { data: vaultInfo } = useReadContract({
    address: vaultAddress,
    abi: vaultABI,
    functionName: 'getVaultInfo',
  }) as { data: {
    token0?: string;
    token1?: string;
    strategy?: string;
    totalValueLocked?: bigint;
    poolFee?: number;
    isActive?: boolean;
  } | undefined };

  // Contract write functions
  const { writeContract: deposit, isPending: isDepositing } = useWriteContract();
  const { writeContract: withdraw, isPending: isWithdrawing } = useWriteContract();

  // Parse customer stats if available (use demo data as fallback)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [shares, shareValue, totalDeposited, totalWithdrawn, _depositTime, lockTimeRemaining] =
    customerStats || demoCustomerStats || [];

  // Calculate metrics
  const shareValueNum = shareValue ? Number(formatUnits(shareValue, 18)) : 0;
  const totalDepositedNum = totalDeposited ? Number(formatUnits(totalDeposited, 18)) : 0;
  const totalWithdrawnNum = totalWithdrawn ? Number(formatUnits(totalWithdrawn, 18)) : 0;

  console.log('Debug - Unrealized Gains Calculation:', {
    shareValue: shareValueNum,
    totalDeposited: totalDepositedNum,
    totalWithdrawn: totalWithdrawnNum,
    demoMode: isDemoMode,
    vaultAddress: vaultAddress.toLowerCase()
  });

  const unrealizedGains = shareValueNum - totalDepositedNum + totalWithdrawnNum;

  const canWithdraw = isDemoMode ? true : lockTimeRemaining ? Number(lockTimeRemaining) === 0 : false;

  const handleDeposit = async (): Promise<void> => {
    if (!depositAmount0 || !depositAmount1) return;

    try {
      deposit({
        address: vaultAddress,
        abi: vaultABI,
        functionName: 'deposit',
        args: [
          parseUnits(depositAmount0, 18),
          parseUnits(depositAmount1, 18),
          address
        ]
      });
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async (): Promise<void> => {
    if (!withdrawShares) return;

    console.log('🏦 [CustomerVaultDashboard] Withdrawal initiated', {
      withdrawShares,
      isDemoMode,
      vaultAddress
    });

    // Reset withdrawal state
    setWithdrawalStatus('pending');
    setWithdrawalHash(null);

    try {
      if (isDemoMode) {
        // DEMO MODE: Simulate successful withdrawal
        console.log('🎭 [CustomerVaultDashboard] Demo mode: Simulating successful withdrawal');

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate fake transaction hash
        const fakeHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        setWithdrawalHash(fakeHash);
        setWithdrawalStatus('success');

        console.log('🎉 [CustomerVaultDashboard] Demo withdrawal completed successfully!', {
          shares: withdrawShares,
          fakeHash
        });

        // Reset withdrawal amount after success
        setTimeout(() => {
          setWithdrawShares('');
          setWithdrawalStatus('idle');
          setWithdrawalHash(null);
        }, 5000);

        return;
      }

      // REAL MODE: Use actual blockchain transaction
      withdraw({
        address: vaultAddress,
        abi: vaultABI,
        functionName: 'withdraw',
        args: [
          parseUnits(withdrawShares, 18),
          address
        ]
      });
    } catch (error) {
      console.error('Withdrawal failed:', error);
      setWithdrawalStatus('error');

      // Reset error state after a delay
      setTimeout(() => {
        setWithdrawalStatus('idle');
      }, 5000);
    }
  };

  const formatTimeRemaining = (seconds: number | bigint | undefined): string => {
    if (!seconds || Number(seconds) <= 0) return 'Available';

    const secondsNum = Number(seconds);
    const hours = Math.floor(secondsNum / 3600);
    const minutes = Math.floor((secondsNum % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Helper function to format strategy names
  const formatStrategyName = (strategy: string): string => {
    const strategyNames: { [key: string]: string } = {
      'concentrated_liquidity': 'Concentrated Liquidity',
      'yield_farming': 'Yield Farming',
      'arbitrage': 'Arbitrage',
      'hedge': 'Hedge Strategy',
      'stable_max': 'Stable Max',
      'sei_hypergrowth': 'SEI Hypergrowth',
      'blue_chip': 'Blue Chip',
      'delta_neutral': 'Delta Neutral'
    };
    return strategyNames[strategy] || strategy.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardWrapper}>
        <div className={styles.dashboardHeader}>
          <Link href="/dashboard" className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </Link>

          <h1 className={styles.headerTitle}>
            {vaultMetadata ? vaultMetadata.name : 'Vault Dashboard'}
          </h1>

          <p className={styles.headerSubtitle}>
            {vaultMetadata ? (
              `${formatStrategyName(vaultMetadata.strategy)} • ${vaultMetadata.tokenA}-${vaultMetadata.tokenB} • ${(vaultMetadata.apy * 100).toFixed(1)}% APY`
            ) : (
              'Manage your AI-driven liquidity positions with advanced analytics and real-time optimization'
            )}
          </p>

          {isDemoMode && (
            <div className={styles.demoBadge}>
              <Shield size={16} />
              DEMO MODE
            </div>
          )}
        </div>

        {/* Portfolio Metrics Grid */}
        <div className={styles.metricsGrid}>
          {/* HIDDEN: Share count display - shares not calculated as expected */}
          {/* <div className={`${styles.metricCard} ${styles.fadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Wallet size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Your Shares</h3>
                <p className={styles.cardSubtitle}>SEI DLP tokens owned</p>
              </div>
            </div>
            <div className={styles.metricValue}>
              <span className={styles.primaryValue}>
                {shares ? formatUnits(shares, 18) : '0'}
              </span>
              <span className={styles.secondaryValue}>SEI DLP</span>
            </div>
            <p className={styles.secondaryValue}>
              Value: ${shareValue ? Number(formatUnits(shareValue, 18)).toFixed(2) : '0.00'}
            </p>
          </div> */}

          <div className={`${styles.metricCard} ${styles.fadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Total Deposited</h3>
                <p className={styles.cardSubtitle}>Lifetime deposits</p>
              </div>
            </div>
            <div className={styles.metricValue}>
              <span className={styles.primaryValue}>
                ${totalDeposited ? Number(formatUnits(totalDeposited, 18)).toFixed(2) : '0.00'}
              </span>
            </div>
            <p className={styles.secondaryValue}>
              Withdrawn: ${totalWithdrawn ? Number(formatUnits(totalWithdrawn, 18)).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className={`${styles.metricCard} ${styles.fadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Unrealized Gains</h3>
                <p className={styles.cardSubtitle}>Current P&L</p>
              </div>
            </div>
            <div className={styles.metricValue}>
              <span className={`${styles.primaryValue} ${unrealizedGains >= 0 ? styles.positiveValue : styles.negativeValue}`}>
                {unrealizedGains >= 0 ? '+' : ''}${unrealizedGains.toFixed(2)}
              </span>
            </div>
            <p className={styles.secondaryValue}>
              {unrealizedGains >= 0 ? 'Profit' : 'Loss'}
            </p>
          </div>

          <div className={`${styles.metricCard} ${styles.fadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Clock size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Withdrawal Status</h3>
                <p className={styles.cardSubtitle}>Lock period status</p>
              </div>
            </div>
            <div className={`${styles.statusBadge} ${canWithdraw ? styles.statusSuccess : styles.statusPending}`}>
              {canWithdraw ? 'Available' : formatTimeRemaining(Number(lockTimeRemaining))}
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className={styles.actionsGrid}>
          {/* Deposit Section */}
          <div className={`${styles.actionCard} ${styles.fadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <PlusCircle size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Deposit Funds</h3>
                <p className={styles.cardSubtitle}>Add liquidity to your position</p>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <label className={styles.inputLabel}>
                  {vaultMetadata?.tokenA || vaultInfo?.token0 || 'Token0'} Amount
                </label>
                <input
                  type="number"
                  value={depositAmount0}
                  onChange={(e) => setDepositAmount0(e.target.value)}
                  placeholder="0.00"
                  className={styles.styledInput}
                />
              </div>
              <div className={styles.inputWrapper}>
                <label className={styles.inputLabel}>
                  {vaultMetadata?.tokenB || vaultInfo?.token1 || 'Token1'} Amount
                </label>
                <input
                  type="number"
                  value={depositAmount1}
                  onChange={(e) => setDepositAmount1(e.target.value)}
                  placeholder="0.00"
                  className={styles.styledInput}
                />
              </div>
            </div>

            <button
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount0 || !depositAmount1}
              className={styles.primaryButton}
            >
              {isDepositing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className={`w-5 h-5 ${styles.spinning}`} />
                  Depositing...
                </div>
              ) : (
                'Deposit Funds'
              )}
            </button>

            <div className={styles.infoSection}>
              <p className={styles.infoText}>
                💡 24-hour minimum lock period applies to new deposits
              </p>
            </div>
          </div>

          {/* Withdraw Section */}
          <div className={`${styles.actionCard} ${styles.fadeInUp}`}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <MinusCircle size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Withdraw Funds</h3>
                <p className={styles.cardSubtitle}>Remove liquidity from your position</p>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.inputWrapper}>
                <label className={styles.inputLabel}>
                  Shares to Withdraw
                </label>
                <input
                  type="number"
                  value={withdrawShares}
                  onChange={(e) => setWithdrawShares(e.target.value)}
                  placeholder="0.00"
                  max={shares ? formatUnits(shares, 18) : '0'}
                  className={styles.styledInput}
                />
                <p className={styles.secondaryValue} style={{ marginTop: '0.5rem' }}>
                  Available: {shares ? formatUnits(shares, 18) : '0'} SEI DLP
                </p>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawShares || !canWithdraw || withdrawalStatus === 'pending'}
              className={withdrawalStatus === 'success' ? styles.primaryButton : styles.secondaryButton}
            >
              {withdrawalStatus === 'pending' ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className={`w-5 h-5 ${styles.spinning}`} />
                  Processing Withdrawal...
                </div>
              ) : withdrawalStatus === 'success' ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Withdrawal Successful!
                </div>
              ) : withdrawalStatus === 'error' ? (
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Withdrawal Failed
                </div>
              ) : isWithdrawing ? (
                'Withdrawing...'
              ) : (
                'Withdraw Funds'
              )}
            </button>

            {/* Transaction Status */}
            {withdrawalStatus !== 'idle' && (
              <div className={`${styles.statusBadge} ${
                withdrawalStatus === 'success' ? styles.statusSuccess :
                withdrawalStatus === 'error' ? styles.statusError :
                styles.statusPending
              }`} style={{ marginTop: '1rem', justifyContent: 'center' }}>
                {withdrawalStatus === 'pending' && 'Transaction is being processed...'}
                {withdrawalStatus === 'success' && `Withdrawal successful! ${withdrawShares} shares withdrawn.`}
                {withdrawalStatus === 'error' && 'Transaction failed. Please try again.'}

                {withdrawalHash && withdrawalStatus === 'success' && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    Transaction Hash: {withdrawalHash.substring(0, 6)}...{withdrawalHash.substring(withdrawalHash.length - 4)}
                  </div>
                )}
              </div>
            )}

            <div className={styles.infoSection}>
              <p className={styles.infoText}>
                ⚠️ 0.5% withdrawal fee applies • Gas optimized on SEI
              </p>
            </div>
          </div>
        </div>

        {/* Vault Information Section */}
        <div className={`${styles.metricCard} ${styles.fadeInUp}`} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Shield size={24} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Vault Information</h3>
              <p className={styles.cardSubtitle}>Smart contract details and configuration</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <p className={styles.cardSubtitle}>Strategy</p>
              <p className={styles.primaryValue} style={{ fontSize: '1.1rem' }}>
                {vaultMetadata ? formatStrategyName(vaultMetadata.strategy) : (vaultInfo?.strategy || 'AI Dynamic Liquidity')}
              </p>
            </div>
            <div>
              <p className={styles.cardSubtitle}>Token Pair</p>
              <p className={styles.primaryValue} style={{ fontSize: '1.1rem' }}>
                {vaultMetadata ? `${vaultMetadata.tokenA}-${vaultMetadata.tokenB}` : 'Loading...'}
              </p>
            </div>
            <div>
              <p className={styles.cardSubtitle}>Current APY</p>
              <p className={`${styles.primaryValue} ${styles.positiveValue}`} style={{ fontSize: '1.1rem' }}>
                {vaultMetadata ? `${(vaultMetadata.apy * 100).toFixed(1)}%` : 'Loading...'}
              </p>
            </div>
            <div>
              <p className={styles.cardSubtitle}>Total Value Locked</p>
              <p className={styles.primaryValue} style={{ fontSize: '1.1rem' }}>
                {vaultMetadata ? `$${(vaultMetadata.tvl / 1000).toFixed(0)}K` :
                 vaultInfo?.totalValueLocked ? `$${Number(formatUnits(vaultInfo.totalValueLocked, 18)).toFixed(2)}` : '$0.00'}
              </p>
            </div>
            <div>
              <p className={styles.cardSubtitle}>Pool Fee</p>
              <p className={styles.primaryValue} style={{ fontSize: '1.1rem' }}>
                {vaultMetadata ? `${(vaultMetadata.fee * 100).toFixed(2)}%` :
                 vaultInfo?.poolFee ? `${(vaultInfo.poolFee / 10000)}%` : '0.3%'}
              </p>
            </div>
            <div>
              <p className={styles.cardSubtitle}>Status</p>
              <div className={`${styles.statusBadge} ${(vaultMetadata?.active ?? vaultInfo?.isActive) ? styles.statusSuccess : styles.statusError}`}>
                {(vaultMetadata?.active ?? vaultInfo?.isActive) ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerVaultDashboard;