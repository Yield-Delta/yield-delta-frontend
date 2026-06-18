# Sui Overflow 2026 Submission Checklist

Use this as the final readiness list before submitting Yield Delta to Sui Overflow 2026.

Source notes:
- Official site: https://overflow.sui.io/
- Sui Overflow 2026 runs May-August 2026.
- The project should be submitted to one best-fit track.
- Best-fit primary track for Yield Delta: DeFi & Payments.
- Secondary positioning: Explorations, if the pitch emphasizes multichain Sui + Solana coordination.

## 1. Track and Positioning

- [ ] Pick one primary track: DeFi & Payments.
- [ ] Write a one-sentence project description:
  - Yield Delta is an AI-managed liquidity vault platform expanding to Sui, helping users route capital into risk-aware DeFi strategies across Sui, Solana, and SEI.
- [ ] Make the Sui value proposition explicit:
  - Why Sui object ownership matters.
  - How Sui users deposit, track, and manage vault positions.
  - What is actually built on or integrated with Sui.
- [ ] Avoid making Solana sound like the main submission chain.
- [ ] Make the homepage, README, demo video, and pitch use the same wording.

## 2. Sui Product Readiness

- [ ] Confirm Sui wallet connection works in the browser.
- [ ] Confirm Sui network selection is clear: devnet, testnet, or mainnet.
- [ ] Show a Sui-specific vault or strategy in the UI.
- [ ] Make deposit flow demoable, even if using testnet/mock funds.
- [ ] Make withdrawal flow demoable or clearly mark it as prototype.
- [ ] Show a user portfolio state after connecting a Sui wallet.
- [ ] Add clear loading, empty, and error states for Sui wallet/vault screens.
- [ ] Remove or relabel any SEI-only copy that appears inside the Sui user journey.

## 3. Smart Contract and Integration Readiness

- [ ] Decide what is real on-chain vs simulated for the submission.
- [ ] Document deployed Sui package/object IDs if any exist.
- [ ] Add a `contracts/sui/README.md` with build, test, and deploy instructions.
- [ ] Run Sui Move tests if Sui Move contracts are included.
- [ ] Include transaction examples or screenshots for the demo flow.
- [ ] Make any mock data obvious in code/docs so judges do not confuse prototype data for live TVL.
- [ ] Document any third-party dependencies: Pyth, DeepBook, wallet adapters, backend services.

## 4. Demo Flow

- [ ] Prepare a 2-3 minute demo script.
- [ ] Demo path:
  - Open landing page.
  - Explain Sui Overflow track and problem.
  - Connect Sui wallet.
  - View Sui/multichain vault options.
  - Deposit or simulate deposit.
  - Show portfolio/risk/yield view.
  - Explain AI routing/rebalancing.
- [ ] Keep the demo focused on one user outcome: safer automated liquidity allocation on Sui.
- [ ] Record a clean demo video with readable text and no console errors.
- [ ] Have a fallback recording in case the live demo breaks.

## 5. Repository Readiness

- [ ] Update `README.md` with:
  - Project summary.
  - Sui Overflow 2026 track.
  - Sui-specific architecture.
  - Setup instructions.
  - Demo instructions.
  - Known limitations.
- [ ] Add screenshots or GIFs of the Sui flow.
- [ ] Add `.env.example` values needed for local demo.
- [ ] Confirm `npm install` or `bun install` path is documented.
- [ ] Confirm `npm run dev` starts the app locally.
- [ ] Confirm `npx tsc --noEmit` passes.
- [ ] Run a production build before final submission.
- [ ] Check the repo for secrets, private keys, and production RPC credentials.
- [ ] Make sure the default branch contains the final submission work.

## 6. Landing Page and Pitch Polish

- [ ] Homepage clearly says Sui Overflow 2026.
- [ ] Hero explains Sui + Solana + SEI without diluting the Sui submission.
- [ ] Navigation to `/vaults`, `/docs`, and portfolio/demo pages works.
- [ ] Add a Sui-focused section or card if the current page still feels too generic.
- [ ] Make CTAs point to working routes.
- [ ] Check mobile layout for the hero, integration carousel, and vault cards.
- [ ] Check browser console for hydration or image errors.

## 7. Technical Quality

- [ ] No uncaught client-side errors in the demo path.
- [ ] Wallet connection failures are handled gracefully.
- [ ] RPC/network failures show useful user feedback.
- [ ] No broken images, missing logos, or dead links.
- [ ] TypeScript passes.
- [ ] Critical tests pass, especially wallet and vault hooks.
- [ ] Validate accessibility basics: buttons have labels, text contrast is readable, keyboard navigation works for core flow.

## 8. Submission Assets

- [ ] Project name: Yield Delta.
- [ ] Short description under platform character limit.
- [ ] Long description with problem, solution, Sui integration, and impact.
- [ ] GitHub repository link.
- [ ] Live demo URL.
- [ ] Demo video URL.
- [ ] Team member names and roles.
- [ ] Track selection: DeFi & Payments.
- [ ] Sponsor/special prize eligibility notes, if applicable.
- [ ] Contact email and social links.

## 9. Final Review Before Submit

- [ ] Open the live demo in a fresh browser profile.
- [ ] Connect wallet from scratch.
- [ ] Complete the exact demo path without local-only assumptions.
- [ ] Verify README setup works on a clean checkout.
- [ ] Verify all links in the submission form.
- [ ] Make sure the pitch does not overclaim live TVL, mainnet deployment, audits, or production readiness.
- [ ] Submit before the official deadline shown in the Sui Overflow portal.

