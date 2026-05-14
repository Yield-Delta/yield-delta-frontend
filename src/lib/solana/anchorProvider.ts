import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { getSolanaConnection, type SolanaCluster } from './connection'
import idl from './idl/yield_vault.json'

export const VAULT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID || '11111111111111111111111111111111'
)

/** Read-only program instance (no signing) — for fetching account data. */
export function getReadOnlyProgram(cluster: SolanaCluster = 'devnet') {
  const connection = getSolanaConnection(cluster)
  // Dummy wallet satisfies the provider interface for read-only calls.
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: unknown) => tx,
    signAllTransactions: async (txs: unknown[]) => txs,
  }
  const provider = new AnchorProvider(connection, dummyWallet as any, {
    commitment: 'confirmed',
  })
  return new Program(idl as any, provider)
}

/**
 * Signing program instance — wraps the user's wallet (e.g. window.solana / Phantom)
 * so Anchor can build and send transactions.
 */
export function getSigningProgram(
  wallet: { publicKey: PublicKey; signTransaction: (tx: any) => Promise<any>; signAllTransactions: (txs: any[]) => Promise<any[]> },
  cluster: SolanaCluster = 'devnet'
) {
  const connection = getSolanaConnection(cluster)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  return new Program(idl as any, provider)
}
