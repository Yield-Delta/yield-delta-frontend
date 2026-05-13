# Solana Frontend Wiring Guide

## Goal

Replace the mocked implementations in `src/hooks/useSolanaVault.ts` with real Anchor program calls. The UI components (SolanaDepositModal, SolanaWithdrawModal, SolanaVaultCard) are already built and do not need to change.

---

## Prerequisites

The following must exist before starting this phase:

- [ ] Anchor program deployed to devnet (see `SOLANA_ANCHOR_PROGRAM.md`)
- [ ] `NEXT_PUBLIC_VAULT_PROGRAM_ID` set in `.env.local`
- [ ] IDL at `src/lib/solana/idl/yield_vault.json`
- [ ] Vault catalog at `src/lib/solana/vaultCatalog.ts`

---

## Step 1 — Install Anchor Client

```bash
npm install @coral-xyz/anchor
```

Add type generation to `tsconfig.json` if not present:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

---

## Step 2 — Create Anchor Provider Utility

Create `src/lib/solana/anchorProvider.ts`:

```typescript
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import { getSolanaConnection } from './connection'
import idl from './idl/yield_vault.json'

export const VAULT_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_VAULT_PROGRAM_ID!
)

export function getAnchorProgram(wallet: any, cluster: 'devnet' | 'mainnet-beta' = 'devnet') {
  const connection = getSolanaConnection(cluster)
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  })
  return new Program(idl as Idl, VAULT_PROGRAM_ID, provider)
}
```

---

## Step 3 — Create PDA Helpers

Create `src/lib/solana/pdas.ts`:

```typescript
import { PublicKey } from '@solana/web3.js'
import { VAULT_PROGRAM_ID } from './anchorProvider'

export function getVaultStatePDA(tokenMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), tokenMint.toBuffer()],
    VAULT_PROGRAM_ID
  )
}

export function getUserPositionPDA(
  vaultPDA: PublicKey,
  userWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_position'), vaultPDA.toBuffer(), userWallet.toBuffer()],
    VAULT_PROGRAM_ID
  )
}
```

---

## Step 4 — Rewrite `useSolanaVault.ts`

Replace the mock `deposit`, `withdraw`, and `getUserPosition` implementations.

### `deposit` (real)

```typescript
const deposit = useCallback(async (vault: SolanaVaultInfo, amount: string) => {
  if (!isWalletConnected || !walletAddress) throw new Error('Wallet not connected')

  const provider = getPhantomProvider()  // window.solana
  const program = getAnchorProgram(provider, 'devnet')

  const tokenMint = new PublicKey(vault.tokenMint)
  const [vaultPDA] = getVaultStatePDA(tokenMint)
  const amountLamports = Math.floor(parseFloat(amount) * 10 ** vault.tokenDecimals)

  setIsDepositing(true)
  try {
    const userTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      new PublicKey(walletAddress)
    )
    const vaultTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      vaultPDA,
      true  // allow owner off curve (PDA)
    )
    const vaultMint = new PublicKey(vault.vaultMint)
    const userShareAccount = await getAssociatedTokenAddress(
      vaultMint,
      new PublicKey(walletAddress)
    )

    const tx = await program.methods
      .deposit(new BN(amountLamports))
      .accounts({
        user: new PublicKey(walletAddress),
        vaultState: vaultPDA,
        userTokenAccount,
        vaultTokenAccount,
        vaultMint,
        userShareAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc()

    return { signature: tx }
  } finally {
    setIsDepositing(false)
  }
}, [walletAddress, isWalletConnected])
```

### `withdraw` (real)

```typescript
const withdraw = useCallback(async (vault: SolanaVaultInfo, shares: string) => {
  if (!isWalletConnected || !walletAddress) throw new Error('Wallet not connected')

  const provider = getPhantomProvider()
  const program = getAnchorProgram(provider, 'devnet')

  const tokenMint = new PublicKey(vault.tokenMint)
  const [vaultPDA] = getVaultStatePDA(tokenMint)
  const sharesRaw = Math.floor(parseFloat(shares) * 10 ** vault.tokenDecimals)

  setIsWithdrawing(true)
  try {
    const tx = await program.methods
      .withdraw(new BN(sharesRaw))
      .accounts({
        user: new PublicKey(walletAddress),
        vaultState: vaultPDA,
        // ... same accounts pattern as deposit
      })
      .rpc()

    return { signature: tx }
  } finally {
    setIsWithdrawing(false)
  }
}, [walletAddress, isWalletConnected])
```

### `getUserPosition` (real)

```typescript
const getUserPosition = useCallback(async (vaultAddress: string) => {
  if (!walletAddress) return { shares: '0', value: '0' }

  try {
    const program = getAnchorProgram(/* read-only provider */, 'devnet')
    const vaultPDA = new PublicKey(vaultAddress)
    const [userPositionPDA] = getUserPositionPDA(vaultPDA, new PublicKey(walletAddress))

    const position = await program.account.userPosition.fetchNullable(userPositionPDA)
    if (!position) return { shares: '0', value: '0' }

    // Fetch vault state to calculate USD value
    const vaultState = await program.account.vaultState.fetch(vaultPDA)
    const userAssets = (position.shares.toNumber() * vaultState.totalAssets.toNumber())
      / vaultState.totalShares.toNumber()

    return {
      shares: position.shares.toString(),
      value: userAssets.toString(),
    }
  } catch {
    return { shares: '0', value: '0' }
  }
}, [walletAddress])
```

---

## Step 5 — Wire Solana Vaults into `/vaults` Page

Edit `src/app/vaults/page.tsx` to show a chain tab and render `SolanaVaultList` when Solana is selected:

```tsx
import { SOLANA_DEVNET_VAULTS } from '@/lib/solana/vaultCatalog'
import SolanaVaultList from '@/components/SolanaVaultList'

// Add a chain selector tab (SEI | Solana)
// Render <SolanaVaultList vaults={SOLANA_DEVNET_VAULTS} /> for Solana tab
```

---

## Step 6 — Environment Variables Checklist

```env
# .env.local — must be set before wiring works
NEXT_PUBLIC_VAULT_PROGRAM_ID=<from anchor deploy output>
NEXT_PUBLIC_SOLANA_DEVNET_RPC=https://api.devnet.solana.com
# Optional premium RPC:
NEXT_PUBLIC_HELIUS_API_KEY=<your helius key>
```

---

## Testing the Wiring

1. Start dev server: `npm run dev`
2. Connect Phantom wallet set to **Solana Devnet**
3. Get devnet SOL: `solana airdrop 2 <your_address> --url devnet`
4. Get devnet USDC from https://spl-token-faucet.com
5. Navigate to `/vaults`, select Solana tab
6. Click Deposit on a vault → approve in Phantom
7. Check transaction on https://explorer.solana.com?cluster=devnet
8. Verify position updates on the card after deposit
9. Click Withdraw → approve → verify position clears

---

## Common Issues

| Issue | Cause | Fix |
|---|---|---|
| `Account not found` on deposit | User's ATA doesn't exist | `createAssociatedTokenAccountIdempotent` before CPI |
| `Program not found` | Wrong `NEXT_PUBLIC_VAULT_PROGRAM_ID` | Double-check `.env.local` and rebuild |
| `Simulation failed` | Stale blockhash | Add `skipPreflight: false` and retry |
| Position shows 0 after deposit | PDA seeds mismatch between program and frontend | Re-check seed order in `pdas.ts` |
| Wallet not signing | Phantom on wrong network | Ensure wallet is set to Devnet |
