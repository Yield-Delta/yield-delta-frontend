'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, ArrowRight, Info, Shield, TrendingDown, CheckCircle2 } from 'lucide-react'
import { useSolanaWallet } from '@/hooks/useSolanaWallet'

interface SolanaVaultData {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
}

interface SolanaWithdrawModalProps {
  vault: SolanaVaultData | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (txSignature: string) => void
  userShares?: string
  userValue?: string
}

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return `${amount.toFixed(0)}`
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

export default function SolanaWithdrawModal({
  vault,
  isOpen,
  onClose,
  onSuccess,
  userShares = '0',
  userValue = '0',
}: SolanaWithdrawModalProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [transactionStatus, setTransactionStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const { address: walletAddress, isConnected: isWalletConnected } = useSolanaWallet()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTransactionStatus('idle')
      setErrorMessage(null)
      setShowSuccess(false)
      setTxSignature(null)
      setWithdrawAmount('')
    }
  }, [isOpen])

  const isValidAmount = withdrawAmount && parseFloat(withdrawAmount) > 0
  const vaultColor = vault ? getVaultColor(vault.strategy) : '#9945ff'

  const userSharesNum = parseFloat(userShares)
  const userValueNum = parseFloat(userValue)

  const handleWithdraw = async () => {
    if (!isValidAmount || !walletAddress || !vault) return

    if (parseFloat(withdrawAmount) > userSharesNum) {
      setErrorMessage('Insufficient shares. You cannot withdraw more than you own.')
      return
    }

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
    setWithdrawAmount(userShares)
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
            background: `linear-gradient(90deg, #ff6b6b, ${vaultColor})`,
          }}
        />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.1))',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                }}
              >
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  Withdraw from {vault?.name || 'Vault'}
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
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div 
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(153, 69, 255, 0.1)', border: '1px solid rgba(153, 69, 255, 0.2)' }}
              >
                <p className="text-xs text-white/50 mb-1">Your Shares</p>
                <p className="text-lg font-bold text-white">
                  {parseFloat(userShares).toFixed(4)} s{vault.name.slice(0,3).toUpperCase()}
                </p>
              </div>
              <div 
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(20, 241, 149, 0.1)', border: '1px solid rgba(20, 241, 149, 0.2)' }}
              >
                <p className="text-xs text-white/50 mb-1">Current Value</p>
                <p className="text-lg font-bold text-white">
                  ${formatCurrency(userValueNum)}
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
              <p className="text-white/60 text-sm">Please connect your Solana wallet to withdraw</p>
            </div>
          ) : userSharesNum === 0 ? (
            <div 
              className="p-6 rounded-2xl text-center mb-6"
              style={{ background: 'rgba(255, 217, 61, 0.1)', border: '1px solid rgba(255, 217, 61, 0.2)' }}
            >
              <TrendingDown className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
              <p className="text-white font-medium mb-2">No Shares to Withdraw</p>
              <p className="text-white/60 text-sm">You don't have any shares in this vault</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Withdraw Amount (Shares)
                </label>
                <div 
                  className="relative rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
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
                  <span className="text-white/50">Available: {userSharesNum.toFixed(4)} shares</span>
                  <span className="text-white/50">
                    ≈ ${(parseFloat(withdrawAmount || '0') * (userValueNum / userSharesNum)).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div 
                className="p-4 rounded-2xl mb-4"
                style={{ background: 'rgba(255, 217, 61, 0.1)', border: '1px solid rgba(255, 217, 61, 0.2)' }}
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200">
                    Withdrawing shares will convert them back to your deposited tokens. 
                    The value may have changed based on vault performance.
                  </p>
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
                    <p className="text-green-400 text-sm font-medium">Withdrawal Successful!</p>
                    <p className="text-white/50 text-xs mt-0.5 truncate">{txSignature}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleWithdraw}
                disabled={!isValidAmount || transactionStatus === 'pending' || userSharesNum === 0}
                className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                style={{
                  background: !isValidAmount || userSharesNum === 0 || transactionStatus === 'pending'
                    ? 'rgba(255, 107, 107, 0.3)'
                    : `linear-gradient(135deg, #ff6b6b, ${vaultColor})`,
                  color: !isValidAmount || userSharesNum === 0 || transactionStatus === 'pending' ? 'white/50' : 'white',
                  cursor: !isValidAmount || userSharesNum === 0 || transactionStatus === 'pending' ? 'not-allowed' : 'pointer',
                  opacity: !isValidAmount || userSharesNum === 0 || transactionStatus === 'pending' ? 0.5 : 1,
                }}
              >
                {transactionStatus === 'pending' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    {userSharesNum > 0 ? 'Withdraw Now' : 'No Shares Available'}
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
                Withdrawals are processed immediately. 
                Funds will be returned to your wallet.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return mounted ? createPortal(modalContent, document.body) : null
}