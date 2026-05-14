'use client'

import { useState, useCallback } from 'react'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'

import { useSolanaWallet } from './useSolanaWallet'
import { getReadOnlyProgram, getSigningProgram } from '@/lib/solana/anchorProvider'
import { getVaultStatePDA, getUserPositionPDA } from '@/lib/solana/pdas'

export interface SolanaVaultInfo {
  address: string
  name: string
  apy: number
  tvl: number
  strategy: string
  depositToken: string
  tokenMint: string
  tokenDecimals: number
  vaultMint: string
}

export interface UseSolanaVaultReturn {
  deposit: (vault: SolanaVaultInfo, amount: string) => Promise<{ signature: string }>
  withdraw: (vault: SolanaVaultInfo, shares: string) => Promise<{ signature: string }>
  getUserPosition: (vaultAddress: string) => Promise<{ shares: string; value: string }>
  isDepositing: boolean
  isWithdrawing: boolean
  error: string | null
}

function getPhantomWallet() {
  if (typeof window === 'undefined') throw new Error('Window not available')
  const w = (window as any).solana
  if (!w?.publicKey) throw new Error('Phantom wallet not connected')
  return w
}

export function useSolanaVault(): UseSolanaVaultReturn {
  const { address: walletAddress, isConnected } = useSolanaWallet()

  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deposit = useCallback(
    async (vault: SolanaVaultInfo, amount: string): Promise<{ signature: string }> => {
      if (!isConnected || !walletAddress) throw new Error('Wallet not connected')
      if (!amount || parseFloat(amount) <= 0) throw new Error('Invalid deposit amount')

      setIsDepositing(true)
      setError(null)
      try {
        const wallet = getPhantomWallet()
        const program = getSigningProgram(wallet, 'devnet')

        const userPubkey = new PublicKey(walletAddress)
        const tokenMint = new PublicKey(vault.tokenMint)
        const [vaultPDA] = getVaultStatePDA(tokenMint)
        const vaultMint = new PublicKey(vault.vaultMint)
        const amountRaw = new BN(Math.floor(parseFloat(amount) * 10 ** vault.tokenDecimals))

        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, userPubkey)
        const vaultTokenAccount = await getAssociatedTokenAddress(tokenMint, vaultPDA, true)
        const userShareAccount = await getAssociatedTokenAddress(vaultMint, userPubkey)
        const [userPositionPDA] = getUserPositionPDA(vaultPDA, userPubkey)

        const sig = await (program.methods as any)
          .deposit(amountRaw)
          .accounts({
            user: userPubkey,
            vaultState: vaultPDA,
            userTokenAccount,
            vaultTokenAccount,
            vaultMint,
            userShareAccount,
            userPosition: userPositionPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc()

        return { signature: sig }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Deposit failed'
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsDepositing(false)
      }
    },
    [walletAddress, isConnected]
  )

  const withdraw = useCallback(
    async (vault: SolanaVaultInfo, shares: string): Promise<{ signature: string }> => {
      if (!isConnected || !walletAddress) throw new Error('Wallet not connected')
      if (!shares || parseFloat(shares) <= 0) throw new Error('Invalid withdraw amount')

      setIsWithdrawing(true)
      setError(null)
      try {
        const wallet = getPhantomWallet()
        const program = getSigningProgram(wallet, 'devnet')

        const userPubkey = new PublicKey(walletAddress)
        const tokenMint = new PublicKey(vault.tokenMint)
        const [vaultPDA] = getVaultStatePDA(tokenMint)
        const vaultMint = new PublicKey(vault.vaultMint)
        const sharesRaw = new BN(Math.floor(parseFloat(shares) * 10 ** vault.tokenDecimals))

        const userTokenAccount = await getAssociatedTokenAddress(tokenMint, userPubkey)
        const vaultTokenAccount = await getAssociatedTokenAddress(tokenMint, vaultPDA, true)
        const userShareAccount = await getAssociatedTokenAddress(vaultMint, userPubkey)
        const [userPositionPDA] = getUserPositionPDA(vaultPDA, userPubkey)

        const sig = await (program.methods as any)
          .withdraw(sharesRaw)
          .accounts({
            user: userPubkey,
            vaultState: vaultPDA,
            userTokenAccount,
            vaultTokenAccount,
            vaultMint,
            userShareAccount,
            userPosition: userPositionPDA,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc()

        return { signature: sig }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Withdrawal failed'
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsWithdrawing(false)
      }
    },
    [walletAddress, isConnected]
  )

  const getUserPosition = useCallback(
    async (vaultAddress: string): Promise<{ shares: string; value: string }> => {
      if (!walletAddress) return { shares: '0', value: '0' }
      try {
        const program = getReadOnlyProgram('devnet')
        const vaultPDA = new PublicKey(vaultAddress)
        const [userPositionPDA] = getUserPositionPDA(vaultPDA, new PublicKey(walletAddress))

        const position = await (program.account as any).userPosition.fetchNullable(userPositionPDA)
        if (!position) return { shares: '0', value: '0' }

        const vaultState = await (program.account as any).vaultState.fetch(vaultPDA)
        const sharesNum: number = position.shares.toNumber()
        const totalShares: number = vaultState.totalShares.toNumber()
        const totalAssets: number = vaultState.totalAssets.toNumber()

        const userAssets =
          totalShares > 0 ? Math.floor((sharesNum * totalAssets) / totalShares) : 0

        return {
          shares: sharesNum.toString(),
          value: userAssets.toString(),
        }
      } catch {
        return { shares: '0', value: '0' }
      }
    },
    [walletAddress]
  )

  return { deposit, withdraw, getUserPosition, isDepositing, isWithdrawing, error }
}
