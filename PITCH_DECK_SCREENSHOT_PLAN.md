# Yield Delta Pitch Deck Screenshot Plan

Working deck order and where to capture visuals from the current frontend.

## Capture Defaults

- Use a 16:9 viewport when possible: `1440x810` or `1920x1080`.
- Prefer dark-mode routes without browser chrome for final deck screenshots.
- Avoid screenshots where wallet modals, browser bars, testnet banners, or chat bubbles cover core content.
- Best new proof link: `/backtest`.

## Slide Map

| Slide | Purpose | Best Source | Capture Notes | Status |
| --- | --- | --- | --- | --- |
| 1. Title | Brand and one-line thesis | `/` | Capture hero only. Existing hero has strong title treatment. | Ready |
| 2. Problem | LP positions go stale too fast | No dedicated screen | Use a designed slide rather than app screenshot. Could create a simple stale-range visual later. | Missing visual |
| 3. Why Now | Fast chains make automated rebalancing viable | `/docs` or `/docs/testnet-setup` | Use SEI speed / testnet details as supporting proof, not the main slide visual. | Partial |
| 4. Product / How It Works | Show actual flow/dashboard | `/vaults`, `/vault?address=<vault-address>`, `/portfolio/rebalance` | Best: vault grid plus rebalance page. Capture clean state with no wallet modal open. | Ready |
| 5. Proof / Traction | 52% IL reduction and clean backtest chart | `/backtest` | Purpose-built screenshot page. Use this as the primary proof visual. | Ready |
| 5. Appendix proof | Backtesting detail | `/docs/impermanent-loss-reduction` | Use for appendix or methodology screenshot, not the main proof slide. | Ready |
| 6. Competition | Alternatives and why Yield Delta wins | No dedicated screen | Needs custom slide content. Source notes exist in `VAULT_APYS_FINAL.md` around arbitrage competition assumptions. | Missing visual |
| 7. Business Model | Fees and simple revenue model | No dedicated screen | Needs custom slide content. No app route found. | Missing visual |
| 8. Roadmap / Ask | Use of funds, audit, mainnet, hires, timeline | `MULTICHAIN_EXPANSION_ROADMAP.md`, `docs/IMPERMANENT_LOSS_PROTECTION.md` | Source material exists, but no screenshot-ready page. | Missing visual |
| 9. Founder | Photo, solo build, ex-Apple, ex-Guild Mortgage | No founder route or founder image found | `public/IMG_0797.png` and `public/IMG_0805.png` are product screenshots, not founder photos. | Missing asset |
| 10. Appendix | Tables, assumptions, methodology | `docs/IMPERMANENT_LOSS_PROTECTION.md`, `/docs/impermanent-loss-reduction` | Good for backup slides or investor follow-up. | Ready |

## Recommended Screenshot Set

Use these as the core deck visuals:

1. `/`  
   Slide 1 title/background brand capture.

2. `/vaults`  
   Slide 4 product surface: vault catalog, APYs, chain selector, deposit entry points.

3. `/portfolio/rebalance`  
   Slide 4 how-it-works: AI position control and rebalancing logic.

4. `/backtest`  
   Slide 5 proof: 52% IL reduction snapshot.

5. `/docs/impermanent-loss-reduction`  
   Slide 10 appendix: methodology and supporting table.

## Existing Public Images

- `public/IMG_0797.png`: product screenshot with wallet modal overlap. Not deck-ready as-is.
- `public/IMG_0805.png`: product screenshot of vaults page. More usable, but browser chrome/testnet overlay makes it weaker than a fresh capture.
- `public/yei-logo.jpeg`, `public/logo*.svg`: brand assets.
- No founder photo found in `public/`.

## Needed Deck-Only Visuals

These are not present as app routes and should be designed directly in the deck, or built as small screenshot pages:

- Problem: stale LP range / IL leakage visual.
- Competition: alternatives matrix.
- Business model: fee stack and revenue logic.
- Roadmap / Ask: timeline plus use of funds.
- Founder: photo and credibility block.

