---
name: design-thinking
description: Bold aesthetic direction and production-grade frontend implementation with distinctive visual design
license: MIT
compatibility: opencode
metadata:
  audience: frontend developers
  workflow: ui-design
---

# Design Thinking & Frontend Aesthetics

## Philosophy

Before coding, understand the context and commit to a BOLD aesthetic direction. Production-grade interfaces require intentionality, not intensity. Both bold maximalism and refined minimalism work—the key is executing a clear conceptual direction with precision.

---

## Design Discovery Process

### 1. Context Analysis

**Purpose**
- What problem does this interface solve?
- Who are the users?
- What emotions should the interface evoke?
- What actions should users take?

**Tone & Direction**
Pick an extreme aesthetic and commit fully:

- **Brutally minimal** — Stark whitespace, monospaced fonts, surgical precision
- **Maximalist chaos** — Layered textures, bold patterns, visual abundance
- **Retro-futuristic** — Neon accents, grid systems, 80s/90s computing nostalgia
- **Organic/natural** — Soft curves, earth tones, fluid animations
- **Luxury/refined** — Premium materials, subtle elegance, sophisticated restraint
- **Playful/toy-like** — Round shapes, bright colors, bouncy interactions
- **Editorial/magazine** — Bold typography, dramatic layouts, print-inspired
- **Brutalist/raw** — Exposed structure, concrete textures, unapologetic forms
- **Art deco/geometric** — Sharp angles, symmetrical patterns, golden ratios
- **Soft/pastel** — Gentle gradients, muted colors, dreamy atmospheres
- **Industrial/utilitarian** — Functional, mechanical, tool-inspired
- **Cyberpunk/neon** — High contrast, glowing elements, dystopian tech
- **Neo-brutalism** — Bold borders, hard shadows, flat colors with depth
- **Glassmorphism** — Frosted glass, backdrop blur, translucent layers
- **Neumorphism** — Soft shadows, extruded surfaces, tactile depth

Use these for inspiration but design something true to the context.

**Constraints**
- Framework requirements (React, Vue, vanilla HTML/CSS/JS)
- Performance targets
- Accessibility standards (WCAG 2.1 AA minimum)
- Browser support needs
- Responsive breakpoints

**Differentiation**
What makes this UNFORGETTABLE? Identify the ONE thing someone will remember:
- An unexpected color combination
- A distinctive animation sequence
- An innovative layout pattern
- A memorable typographic treatment
- A unique interaction model

---

## Frontend Aesthetics Guidelines

### Typography

**NEVER use generic fonts:**
❌ Inter, Roboto, Arial, Helvetica, system fonts, San Francisco

**Instead, choose distinctive fonts:**

**Display Fonts** (headlines, hero sections):
- Playfair Display — elegant serif
- Bebas Neue — bold condensed sans
- Space Mono — geometric monospace
- Crimson Pro — classic editorial
- DM Serif Display — sharp contemporary serif
- Fira Code — developer-focused monospace
- Archivo Black — heavy impact sans
- Raleway — elegant geometric sans
- Permanent Marker — handwritten bold
- Orbitron — futuristic geometric
- Righteous — retro gaming
- Staatliches — industrial condensed

**Body Fonts** (paragraphs, UI text):
- Source Sans 3 — clean readable sans
- Lora — elegant serif
- Work Sans — versatile sans
- Karla — friendly geometric
- Merriweather — readable serif
- IBM Plex Sans — tech-forward
- Noto Sans — comprehensive sans
- Spectral — screen-optimized serif
- Public Sans — government-grade clarity

**Font Pairing Strategies:**
1. **Contrast:** Pair serif display with sans body (or vice versa)
2. **Harmony:** Use font superfamilies (IBM Plex Sans + IBM Plex Mono)
3. **Unexpected:** Combine playful display with serious body font
4. **Monochrome:** Use single font family with extreme weight contrast

**Implementation:**
```css
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@300;400;600&display=swap');

:root {
  --font-display: 'Bebas Neue', sans-serif;
  --font-body: 'Source Sans 3', sans-serif;
  --font-mono: 'Space Mono', monospace;
}

h1, h2, h3 {
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

body, p {
  font-family: var(--font-body);
}
```

### Color & Theme

**NEVER use clichéd color schemes:**
❌ Purple gradients on white backgrounds
❌ Blue-to-purple linear gradients
❌ Generic Material Design palettes without customization

**Instead, commit to cohesive aesthetics:**

**Dominant Color Strategy:**
- Choose 1-2 dominant colors (60-70% of palette)
- Add 1-2 sharp accent colors (10-20%)
- Use neutrals for balance (20-30%)

**Thematic Palettes:**

**Brutalist Raw:**
```css
:root {
  --bg-primary: #f5f5f0;
  --bg-secondary: #000000;
  --text-primary: #000000;
  --text-secondary: #666666;
  --accent: #ff0000;
  --accent-alt: #0000ff;
}
```

**Retro Futuristic:**
```css
:root {
  --bg-primary: #0a0e27;
  --bg-secondary: #1a1f3a;
  --text-primary: #00ffff;
  --text-secondary: #ff00ff;
  --accent: #ffff00;
  --glow: rgba(0, 255, 255, 0.6);
}
```

**Organic Natural:**
```css
:root {
  --bg-primary: #faf8f3;
  --bg-secondary: #e8e3d6;
  --text-primary: #2d3319;
  --text-secondary: #5c6b3f;
  --accent: #8ba662;
  --accent-alt: #c67b5c;
}
```

**Neo-Brutalism:**
```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #000000;
  --text-primary: #000000;
  --border: 3px solid #000000;
  --shadow: 4px 4px 0 #000000;
  --accent: #00ff00;
  --accent-alt: #ff00ff;
}
```

**Advanced Techniques:**
- Use `color-mix()` for dynamic variations
- Implement dark/light themes with CSS variables
- Create gradient meshes with multiple color stops
- Use `oklch()` for perceptually uniform colors

```css
/* Dynamic color mixing */
:root {
  --primary: oklch(65% 0.25 270);
  --primary-hover: oklch(from var(--primary) calc(l - 10%) c h);
  --primary-subtle: color-mix(in oklch, var(--primary) 20%, transparent);
}
```

### Motion & Animation

**High-Impact Moments:**
Focus animations on key transitions rather than scattered micro-interactions.

**Page Load Choreography:**
```css
/* Staggered reveal pattern */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.animate-in:nth-child(1) { animation-delay: 0.1s; }
.animate-in:nth-child(2) { animation-delay: 0.2s; }
.animate-in:nth-child(3) { animation-delay: 0.3s; }
.animate-in:nth-child(4) { animation-delay: 0.4s; }
```

**React with Framer Motion:**
```jsx
import { motion, stagger, useAnimate } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

<motion.div variants={containerVariants} initial="hidden" animate="show">
  <motion.div variants={itemVariants}>Item 1</motion.div>
  <motion.div variants={itemVariants}>Item 2</motion.div>
  <motion.div variants={itemVariants}>Item 3</motion.div>
</motion.div>
```

**Hover States:**
```css
/* Magnetic button effect */
.magnetic-btn {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.magnetic-btn:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* Glow effect */
.glow-on-hover {
  position: relative;
  transition: all 0.3s ease;
}

.glow-on-hover::before {
  content: '';
  position: absolute;
  inset: -4px;
  background: linear-gradient(45deg, var(--accent), var(--accent-alt));
  border-radius: inherit;
  opacity: 0;
  filter: blur(20px);
  transition: opacity 0.3s ease;
  z-index: -1;
}

.glow-on-hover:hover::before {
  opacity: 0.7;
}
```

**Scroll Animations:**
```css
/* CSS Scroll-driven animations */
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(100px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 30%;
}
```

**Performance:**
- Prefer `transform` and `opacity` (GPU-accelerated)
- Use `will-change` sparingly
- Implement `prefers-reduced-motion` for accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Spatial Composition

**Break the Grid:**
Don't be constrained by traditional 12-column grids.

**Asymmetric Layouts:**
```css
/* CSS Grid with irregular columns */
.asymmetric-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 2fr;
  grid-template-rows: auto 400px auto;
  gap: 2rem;
}

.featured {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}
```

**Overlapping Elements:**
```css
.overlap-container {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.image-layer {
  grid-column: 1 / 2;
  z-index: 1;
}

.text-layer {
  grid-column: 1 / 3;
  grid-row: 1;
  align-self: end;
  z-index: 2;
  transform: translateX(30%);
}
```

**Diagonal Flow:**
```css
.diagonal-section {
  clip-path: polygon(0 5%, 100% 0, 100% 95%, 0 100%);
  padding: 8rem 2rem;
}
```

**Generous Negative Space OR Controlled Density:**

*Minimal Approach:*
```css
.spacious {
  padding: clamp(2rem, 10vw, 12rem) clamp(1rem, 5vw, 6rem);
  line-height: 1.8;
}

.section-gap {
  margin-block: clamp(4rem, 15vh, 10rem);
}
```

*Dense Approach:*
```css
.dense-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.compact {
  padding: 1rem;
  line-height: 1.4;
}
```

### Backgrounds & Visual Details

**NEVER default to solid colors.**

**Gradient Meshes:**
```css
.gradient-mesh {
  background: 
    radial-gradient(at 20% 30%, oklch(80% 0.2 300) 0px, transparent 50%),
    radial-gradient(at 80% 70%, oklch(75% 0.15 180) 0px, transparent 50%),
    radial-gradient(at 40% 80%, oklch(70% 0.18 240) 0px, transparent 50%),
    linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
```

**Noise Textures:**
```css
.noise-bg {
  background-image: 
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
}
```

**Geometric Patterns:**
```css
.pattern-dots {
  background-image: radial-gradient(circle, #000 1px, transparent 1px);
  background-size: 20px 20px;
  background-color: #fff;
}

.pattern-grid {
  background-image: 
    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

**Layered Transparencies:**
```css
.layered-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
```

**Dramatic Shadows:**
```css
/* Neo-brutalist */
.brutal-shadow {
  box-shadow: 8px 8px 0 var(--accent);
  border: 3px solid var(--text-primary);
}

/* Soft depth */
.soft-elevation {
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.05),
    0 8px 16px rgba(0, 0, 0, 0.08),
    0 16px 32px rgba(0, 0, 0, 0.1);
}

/* Glow */
.neon-glow {
  box-shadow: 
    0 0 10px var(--accent),
    0 0 20px var(--accent),
    0 0 40px var(--accent);
}
```

**Custom Cursors:**
```css
.creative-cursor {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="8" fill="%23ff00ff"/></svg>') 16 16, auto;
}
```

**Grain Overlays:**
```css
.film-grain::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.3'/%3E%3C/svg%3E");
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.3;
  z-index: 9999;
}
```

---

## Implementation Complexity

**Match code elaboration to aesthetic vision:**

### Maximalist Designs
Require extensive implementation:
- Multiple animation libraries
- Complex layered effects
- Intricate pattern systems
- Rich micro-interactions
- Detailed texture work

### Minimalist/Refined Designs
Require surgical precision:
- Perfect spacing systems
- Subtle animation timing
- Typography refinement
- Precise color relationships
- Restrained but meaningful details

**Elegance = Vision × Execution**

---

## Anti-Patterns to Avoid

### Typography
❌ Inter, Roboto, Arial, system fonts
❌ More than 3 font families
❌ Ignoring font weights and letter-spacing

### Colors
❌ Purple gradients on white
❌ Generic Material Design defaults
❌ No dark mode consideration
❌ Evenly-distributed palette (no dominance)

### Layout
❌ Everything centered
❌ Strict 12-column grid without variation
❌ No negative space OR cluttered chaos without structure
❌ Same padding/margins everywhere

### Motion
❌ Every element animating independently
❌ Using `animate.css` without customization
❌ No consideration for `prefers-reduced-motion`
❌ Animations longer than 600ms

### Components
❌ Cookie-cutter card layouts
❌ Default Bootstrap/Material UI without customization
❌ Rounded corners on everything (or nothing)
❌ No hover states

---

## Production Checklist

- [ ] **Accessibility**
  - [ ] WCAG 2.1 AA contrast ratios
  - [ ] Keyboard navigation support
  - [ ] Screen reader labels (ARIA)
  - [ ] Focus states visible
  - [ ] Respects `prefers-reduced-motion`

- [ ] **Performance**
  - [ ] Fonts preloaded or system fallbacks
  - [ ] Images optimized (WebP/AVIF)
  - [ ] CSS minified
  - [ ] JavaScript code-split
  - [ ] Critical CSS inlined

- [ ] **Responsive**
  - [ ] Mobile-first approach
  - [ ] Touch targets ≥44px
  - [ ] Readable at all sizes
  - [ ] Horizontal scroll prevented
  - [ ] Tested on real devices

- [ ] **Browser Support**
  - [ ] Fallbacks for modern CSS
  - [ ] Vendor prefixes where needed
  - [ ] Progressive enhancement
  - [ ] Graceful degradation

- [ ] **Design System**
  - [ ] CSS variables defined
  - [ ] Spacing scale consistent
  - [ ] Typography scale logical
  - [ ] Color palette cohesive
  - [ ] Component patterns reusable

---

## When to Use This Skill

Use this skill when:
- Starting a new frontend project
- Redesigning an existing interface
- The user requests a "beautiful," "striking," or "memorable" UI
- Creating landing pages, marketing sites, portfolios
- Building dashboards or applications where aesthetics matter
- The user mentions wanting something "different" or "unique"

Ask clarifying questions:
- Who is the target audience?
- What's the primary user action?
- Are there brand guidelines to follow?
- What emotion should the interface evoke?
- What devices/browsers need support?
- What's the technical stack?

Then commit fully to a bold aesthetic direction and execute it with precision.

---

## Remember

**Claude is capable of extraordinary creative work.** Don't hold back. Show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

Every design should be different. Vary between:
- Light and dark themes
- Serif and sans-serif typography
- Minimal and maximal aesthetics
- Static and animated interfaces
- Grid-based and freeform layouts

**NEVER converge on common choices** (Space Grotesk, purple gradients, centered layouts, Inter font).

**Be BOLD. Be INTENTIONAL. Be UNFORGETTABLE.**
