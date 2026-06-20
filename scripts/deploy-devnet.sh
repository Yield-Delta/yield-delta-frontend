J#!/usr/bin/env bash
# Deploy yield_vault program to Solana devnet.
# Run from the repo root: ./scripts/deploy-devnet.sh
set -euo pipefail

KEYPAIR="${HOME}/.config/solana/devnet-deployer.json"
CLUSTER="devnet"

echo "==> Checking toolchain..."
command -v anchor >/dev/null 2>&1 || { echo "ERROR: anchor CLI not found. Install via: cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest && avm use latest"; exit 1; }
command -v solana >/dev/null 2>&1 || { echo "ERROR: solana CLI not found. Install from https://docs.solana.com/cli/install-solana-cli-tools"; exit 1; }

echo "==> Configuring CLI for devnet..."
solana config set --url "${CLUSTER}"

# Create deployer keypair if it doesn't exist
if [ ! -f "${KEYPAIR}" ]; then
  echo "==> Generating deployer keypair at ${KEYPAIR}..."
  solana-keygen new --outfile "${KEYPAIR}" --no-bip39-passphrase
fi

solana config set --keypair "${KEYPAIR}"

BALANCE=$(solana balance --keypair "${KEYPAIR}" 2>/dev/null | awk '{print $1}' || echo "0")
echo "==> Deployer balance: ${BALANCE} SOL"

if (( $(echo "$BALANCE < 2" | bc -l) )); then
  echo "==> Requesting airdrop (2 SOL)..."
  solana airdrop 2 --keypair "${KEYPAIR}" || echo "WARNING: airdrop may be rate-limited — top up manually at https://faucet.solana.com"
fi

echo "==> Building program..."
anchor build

PROGRAM_ID=$(solana address -k target/deploy/yield_vault-keypair.json)
echo "==> Program ID: ${PROGRAM_ID}"

# Patch declare_id! and Anchor.toml with the real program ID
echo "==> Patching declare_id! in lib.rs..."
sed -i "s|PLACEHOLDER_PROGRAM_ID|${PROGRAM_ID}|g" programs/yield_vault/src/lib.rs
sed -i "s|PLACEHOLDER_PROGRAM_ID|${PROGRAM_ID}|g" Anchor.toml
sed -i "s|\"address\": \"PLACEHOLDER_PROGRAM_ID\"|\"address\": \"${PROGRAM_ID}\"|g" src/lib/solana/idl/yield_vault.json

echo "==> Rebuilding with correct program ID..."
anchor build

echo "==> Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo "==> Copying IDL to frontend..."
cp target/idl/yield_vault.json src/lib/solana/idl/yield_vault.json

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "  1. Add to .env.local:  NEXT_PUBLIC_VAULT_PROGRAM_ID=${PROGRAM_ID}"
echo "  2. Run:  npx ts-node scripts/initialize-devnet-vault.ts"
echo "  3. Update vault addresses in src/lib/vaultCatalog.ts"
echo ""
echo "Program ID: ${PROGRAM_ID}"
