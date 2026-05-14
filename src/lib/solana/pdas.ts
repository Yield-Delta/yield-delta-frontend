import { PublicKey } from '@solana/web3.js'
import { VAULT_PROGRAM_ID } from './anchorProvider'

/** Seeds: ["vault", tokenMint] */
export function getVaultStatePDA(tokenMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), tokenMint.toBuffer()],
    VAULT_PROGRAM_ID
  )
}

/** Seeds: ["user_position", vaultPDA, userWallet] */
export function getUserPositionPDA(
  vaultPDA: PublicKey,
  userWallet: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_position'), vaultPDA.toBuffer(), userWallet.toBuffer()],
    VAULT_PROGRAM_ID
  )
}
