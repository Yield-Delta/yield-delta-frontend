'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, ArrowRight, Info, Shield, TrendingUp, Coins, Zap, CheckCircle2 } from 'lucide-react'
import { useSolanaWallet } from '@/hooks/useSolanaWallet'
import { useMultiChainStore } from '@/stores/multiChainStore'
import { ChainId, ChainType } from '@/types/chain'

interface SolanaVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  tokenMint?: string
  tokenDecimals?: number
}

interface SolanaDepositModalProps {
  vault: SolanaVaultData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (txSignature: string) => void
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return `${amount.toFixed(0)}`
}

const getRiskLevel = (apy: number): 'Low' | 'Medium' | 'High' => {
  const apyPercentage = apy * 100
  if (apyPercentage < 15) return 'Low'
  if (apyPercentage < 25) return 'Medium'
  return 'High'
}

const getVaultColor = (strategy: string) => {
  const colors: Record<string, string> = {
    concentrated_liquidity: '#9945ff',
    yield_farming: '#14f195',
    stable_max: '#00d4ff',
    margin: '#ff6b6b',
    leveraged: '#ffd93d',
    staked_sol: '#8b5cf6',
  }
  return colors[strategy] || '#9945ff'
}

export default function SolanaDepositModal({
  vault,
  isOpen,
  onClose,
  onSuccess,
}: SolanaDepositModalProps) {
  const [depositAmount, setDepositAmount] = useState('')
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const { address: walletAddress, isConnected: isWalletConnected, balance } = useSolanaWallet()
  const { solana } = useMultiChainStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTransactionStatus('idle')
      setErrorMessage(null)
      setShowSuccess(false)
      setTxSignature(null)
      setDepositAmount('')
    }
  }, [isOpen])

  const isValidAmount = depositAmount && parseFloat(depositAmount) > 0
  const vaultColor = vault ? getVaultColor(vault.strategy) : '#9945ff'
  const riskLevel = vault ? getRiskLevel(vault.apy) : 'Medium'

  const handleDeposit = async () => {
    if (!isValidAmount || !walletAddress || !vault) return

    setTransactionStatus('pending')
    setErrorMessage(null)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockSignature = `${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}-${Date.now()}`
      setTxSignature(mockSignature)
      setTransactionStatus('success')
      setShowSuccess(true)
      onSuccess(mockSignature)
    } catch (err) {
      setTransactionStatus('error')
      setErrorMessage('Transaction failed. Please try again.')
    }
  }

  const handleMax = () => {
    if (balance) {
      const maxAmount = Math.max(0, parseFloat(balance) - 0.01)
      setDepositAmount(maxAmount.toFixed(4))
    }
  }

  if (!mounted || !isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div 
        className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(20, 10, 40, 0.95), rgba(30, 15, 50, 0.98))',
          border: '1px solid rgba(153, 69, 255, 0.3)',
          boxShadow: `0 0 60px rgba(153, 69, 255, 0.2), 0 25px 50px rgba(0, 0, 0, 0.5)`,
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(90deg, ${vaultColor}, #14f195)`,
          }}
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${vaultColor}40, ${vaultColor}20)`,
                  border: `1px solid ${vaultColor}50`,
                }}
              >
                <Coins className="w-6 h-6" style={{ color: vaultColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  Deposit to {vault?.name || 'Vault'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span 
                    className="px-2 py-0.5 text-xs font-medium rounded-full"
                    style={{ 
                      background: `${vaultColor}20`, 
                      color: vaultColor,
                      border: `1px solid ${vaultColor}30`
                    }}
                  >
                    Solana
                  </span>
                  <span 
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                      riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {riskLevel} Risk
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {vault && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div 
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(153, 69, 255, 0.1)', border: '1px solid rgba(153, 69, 255, 0.2)' }}
              >
                <p className="text-xs text-white/50 mb-1">APY</p>
                <p className="text-lg font-bold" style={{ color: vaultColor }}>
                  {(vault.apy * 100).toFixed(1)}%
                </p>
              </div>
              <div 
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(20, 241, 149, 0.1)', border: '1px solid rgba(20, 241, 149, 0.2)' }}
              >
                <p className="text-xs text-white/50 mb-1">TVL</p>
                <p className="text-lg font-bold text-white">
                  ${formatCurrency(vault.tvl)}
                </p>
              </div>
              <div 
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)' }}
              >
                <p className="text-xs text-white/50 mb-1">Strategy</p>
                <p className="text-sm font-medium text-white capitalize">
                  {vault.strategy.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}

          {!isWalletConnected ? (
            <div 
              className="p-6 rounded-2xl text-center mb-6"
              style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.2)' }}
            >
              <Shield className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <p className="text-white font-medium mb-2">Wallet Not Connected</p>
              <p className="text-white/60 text-sm">Please connect your Solana wallet to deposit</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Deposit Amount (SOL)
                </label>
                <div 
                  className="relative rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-4 bg-transparent text-white text-xl font-medium placeholder-white/30 focus:outline-none"
                    disabled={transactionStatus === 'pending'}
                  />
                  <button
                    onClick={handleMax}
                    className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1 text-sm font-medium rounded-lg transition-all"
                    style={{ 
                      background: `${vaultColor}20`, 
                      color: vaultColor,
                      border: `1px solid ${vaultColor}30`
                    }}
                  >
                    MAX
                  </button>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-white/50">Balance: {balance || '0'} SOL</span>
                  <span className="text-white/50">
                    ≈ ${(parseFloat(depositAmount || '0') * 100).toFixed(2)} USD
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div 
                  className="p-4 rounded-2xl mb-4 flex items-center gap-3"
                  style={{ background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.2)' }}
                >
                  <Info className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              {showSuccess && txSignature && (
                <div 
                  className="p-4 rounded-2xl mb-4 flex items-center gap-3"
                  style={{ background: 'rgba(20, 241, 149, 0.1)', border: '1px solid rgba(20, 241, 149, 0.2)' }}
                >
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-400 text-sm font-medium">Deposit Successful!</p>
                    <p className="text-white/50 text-xs mt-0.5 truncate">{txSignature}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleDeposit}
                disabled={!isValidAmount || transactionStatus === 'pending' || !isWalletConnected}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                style={{
                  background: !isValidAmount || !isWalletConnected || transactionStatus === 'pending'
                    ? 'rgba(153, 69, 255, 0.3)'
                    : `linear-gradient(135deg, ${vaultColor}, #14f195)`,
                  color: !isValidAmount || !isWalletConnected || transactionStatus === 'pending' ? 'white/50' : 'white',
                  cursor: !isValidAmount || !isWalletConnected || transactionStatus === 'pending' ? 'not-allowed' : 'pointer',
                  opacity: !isValidAmount || !isWalletConnected || transactionStatus === 'pending' ? 0.5 : 1,
                }}
              >
                {transactionStatus === 'pending' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    {isWalletConnected ? 'Deposit Now' : 'Connect Wallet First'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </>
          )}

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/40">
                Deposits will start earning yield immediately. 
                View your positions in the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return mounted ? createPortal(modalContent, document.body) : null
}