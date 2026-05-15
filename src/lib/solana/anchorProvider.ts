import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor'
import { PublicKey, type Transaction, type VersionedTransaction } from '@solana/web3.js'
import { getSolanaConnection, type SolanaCluster } from './connection'
import idlData from './idl/yield_vault.json'

const idl = idlData as Idl

export const VAULT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID || '11111111111111111111111111111111'
)

interface AnchorWallet {
  publicKey: PublicKey
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>
  signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]>
}

/** Read-only program instance (no signing) — for fetching account data. */
export function getReadOnlyProgram(cluster: SolanaCluster = 'devnet') {
  const connection = getSolanaConnection(cluster)
  // Dummy wallet satisfies the provider interface for read-only calls.
  const dummyWallet: AnchorWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
  }
  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: 'confirmed',
  })
  return new Program(idl, provider)
}

/**
 * Signing program instance — wraps the user's wallet (e.g. window.solana / Phantom)
 * so Anchor can build and send transactions.
 */
export function getSigningProgram(
  wallet: AnchorWallet,
  cluster: SolanaCluster = 'devnet'
) {
  const connection = getSolanaConnection(cluster)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  return new Program(idl, provider)
}
