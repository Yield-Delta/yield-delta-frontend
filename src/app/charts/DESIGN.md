---
name: Yield Delta Charts Terminal
colors:
  primary: "#00f5d4"  # Brand Cyan
  secondary: "#9b5de5" # Brand Purple
  accent: "#ff206e"    # Brand Pink
  up: "#10b981"        # Emerald Success
  down: "#ef4444"      # Red Failure
  background: "#020617" # Slate 950
  surface: "rgba(15, 23, 42, 0.4)" # Translucent Slate
typography:
  display:
    fontFamily: Syne
    fontWeight: 800
  data:
    fontFamily: DM Mono
    fontWeight: 500
  body:
    fontFamily: Inter
    fontWeight: 400
rounded:
  lg: 12px
  xl: 16px
  "2xl": 24px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

## Overview

High-performance market data terminal designed for professional liquidity providers.
The aesthetic is "Premium Cyber-Finance" — combining the precision of a Bloomberg 
terminal with the futuristic atmosphere of a neural network interface.

## Colors

The palette uses deep oceanic slates for the foundation, allowing brand neon 
accents to define the visual hierarchy.

- **Brand Cyan (#00f5d4):** Primary action and system status.
- **Brand Purple (#9b5de5):** Secondary accents and technical indicators.
- **Emerald/Red:** Semantic colors for price movement and trend status.

## Typography

- **Syne:** Used for asset symbols and primary headings to provide a bold, innovative character.
- **DM Mono:** Used for all market data, timestamps, and technical values to ensure tabular alignment and a "terminal" feel.
- **Inter:** Used for descriptive labels and UI controls for maximum legibility.

## Layout & Motion

### Staggered Entrance
Components reveal sequentially using `framer-motion` to create a sense of 
"system booting up." 

- **Stagger Delay:** 100ms
- **Reveal Duration:** 600ms
- **Easing:** Cubic-bezier(0.16, 1, 0.3, 1)

### Depth & Layering
- **Glassmorphism:** Cards use `backdrop-filter: blur(16px)` with a 50% border opacity.
- **Background Mesh:** A combination of subtle white grids and brand-colored radial glows creates spatial depth.

## Components

### GlassCard (Terminal Panel)
- **Background:** `rgba(15, 23, 42, 0.4)`
- **Border:** `1px solid rgba(255, 255, 255, 0.05)`
- **Shadow:** Subtle shadow to separate from background glow.

### CyberButton (Sync Action)
- **Gradient:** Linear from Cyan to Purple at 20% opacity on hover.
- **Typography:** DM Mono, Bold, Uppercase, Tracking-widest.

## Do's and Don'ts

### Do
- Use DM Mono for any numeric data.
- Maintain consistent 16px or 24px gutters.
- Use brand colors for technical indicators.

### Don't
- Use generic sans-serif fonts for price data.
- Use solid, opaque backgrounds for secondary panels.
- Over-animate; stick to purposeful entrance and micro-interactions.
