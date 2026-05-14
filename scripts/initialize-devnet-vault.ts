/**
 * Initialize devnet vaults after deploying the yield_vault program.
 * Run with:  npx ts-node scripts/initialize-devnet-vault.ts
 *
 * Prerequisites:
 *   1. Deploy the program:  ./scripts/deploy-devnet.sh
 *   2. Set NEXT_PUBLIC_VAULT_PROGRAM_ID in .env.local
 *   3. Have devnet SOL in your deployer wallet (~0.1 SOL per vault)
 */

import * as anchor from '@coral-xyz/anchor'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getMint } from '@solana/spl-token'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// ── Config ────────────────────────────────────────────────────────────────────

const DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com'
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID!)

// Devnet token mints
const DEVNET_USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const NATIVE_SOL_MINT  = new PublicKey('So11111111111111111111111111111111111111112')

const DEPLOYER_KEYPAIR_PATH =
  process.env.DEPLOYER_KEYPAIR ||
  `${process.env.HOME}/.config/solana/devnet-deployer.json`

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadKeypair(filePath: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  return Keypair.fromSecretKey(Uint8Array.from(raw))
}

function getVaultStatePDA(tokenMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), tokenMint.toBuffer()],
    PROGRAM_ID
  )
}

async function initializeVault(
  program: Program,
  authority: Keypair,
  tokenMint: PublicKey,
  label: string
) {
  const [vaultPDA, bump] = getVaultStatePDA(tokenMint)

  // Check if already initialized
  const existing = await program.provider.connection.getAccountInfo(vaultPDA)
  if (existing) {
    console.log(`  ⚠ ${label} vault already initialized at ${vaultPDA.toBase58()}`)
    return vaultPDA
  }

  const vaultMintKeypair = Keypair.generate()

  await (program.methods as any)
    .initialize()
    .accounts({
      authority: authority.publicKey,
      vaultState: vaultPDA,
      tokenMint,
      vaultMint: vaultMintKeypair.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([authority, vaultMintKeypair])
    .rpc()

  console.log(`  ✅ ${label} vault initialized`)
  console.log(`     Vault PDA:   ${vaultPDA.toBase58()}`)
  console.log(`     Vault Mint:  ${vaultMintKeypair.publicKey.toBase58()}`)
  console.log(`     Token Mint:  ${tokenMint.toBase58()}`)

  return vaultPDA
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID) {
    console.error('ERROR: NEXT_PUBLIC_VAULT_PROGRAM_ID is not set in .env.local')
    process.exit(1)
  }

  const deployer = loadKeypair(DEPLOYER_KEYPAIR_PATH)
  const connection = new Connection(DEVNET_RPC, 'confirmed')

  const wallet = new anchor.Wallet(deployer)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  anchor.setProvider(provider)

  const idl = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../src/lib/solana/idl/yield_vault.json'), 'utf-8')
  )
  const program = new Program(idl, provider)

  console.log('Deployer:', deployer.publicKey.toBase58())
  console.log('Program: ', PROGRAM_ID.toBase58())
  console.log('RPC:     ', DEVNET_RPC)
  console.log('')

  console.log('==> Initializing USDC vault...')
  const usdcVaultPDA = await initializeVault(program, deployer, DEVNET_USDC_MINT, 'USDC')

  console.log('')
  console.log('==> Initializing SOL vault...')
  const solVaultPDA = await initializeVault(program, deployer, NATIVE_SOL_MINT, 'SOL')

  console.log('')
  console.log('==> Done! Update src/lib/vaultCatalog.ts with these addresses:')
  console.log('')
  console.log(`  USDC vault PDA: ${usdcVaultPDA.toBase58()}`)
  console.log(`  SOL  vault PDA: ${solVaultPDA.toBase58()}`)
  console.log('')
  console.log('Then fetch vault accounts to get vaultMint addresses:')
  console.log(`  anchor account VaultState ${usdcVaultPDA.toBase58()} --provider.cluster devnet`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
