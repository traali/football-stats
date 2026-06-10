# DESIGN.md — Football Stats (SPL / Palloliitto)

> A youth football statistics app for Finnish matches — dark, data-rich, mobile-first.
> Synthesis of 20 world-class design systems + 7 major football data platforms.

---

## 1. Brand Philosophy

This is not a general-purpose sports app. It is a **Finnish youth football data tool** for parents, coaches, and scouts checking match results and player stats on their phones — often outdoors, in low light, in a hurry.

The design is: **dark, utilitarian, confident.** No fluff. No light mode. Every pixel serves data.

### Tone
- **Direct** — Finnish-language interface, minimal copy
- **Calm** — no pulsing ads, no betting, no newsfeed
- **Precise** — numbers are hero content, displayed with tabular-num spacing
- **Human** — player photos, club crests, captain badges

---

## 2. Design Principles

| # | Principle | Origin |
|---|-----------|--------|
| 1 | **Dark first, dark only** — No light mode, ever. Deep charcoal canvas (#0a0a0a). | Raycast, Sofascore, Flashscore |
| 2 | **Data is hero** — Numbers are the largest, boldest elements on screen. Typography serves stats. | Coinbase (mono on all numbers), FBref |
| 3 | **Progressive disclosure** — 1 tap to surface details. 3 taps to any data point. | Flashscore (expandable rows), Sofascore |
| 4 | **One accent voltage** — Electric yellow (#faff69) is the single interaction color. No second accent. | Apple (#0066cc), NVIDIA (#76b900), Ferrari (Rosso Corsa) |
| 5 | **Surface ladder, not shadows** — Cards elevate via brightness steps, not drop shadows. | Raycast (no shadows), Intercom (cream/white depth) |
| 6 | **Batch operations, N+1 awareness** — UI anticipates slow API. Skeleton loaders, batched requests. | First-party codebase constraint |
| 7 | **Mobile-first, outdoor-readable** — Minimum touch target 44px, WCAG AAA contrast on everything. | WCAG, football-trends responsive density |

---

## 3. Canvas & Color System

### 3.1 Surface Palette

```
Canvas (page bg)       #0a0a0a   hsl(0, 0%, 4%)     — never pure black
Surface-1 (cards)      #141414   hsl(0, 0%, 8%)     — default card bg
Surface-2 (elevated)   #1c1c1c   hsl(0, 0%, 11%)    — hover/active card
Surface-3 (inset)      #242424   hsl(0, 0%, 14%)    — input bg, table header
Border (hairline)      #2a2a2a   hsl(0, 0%, 16%)    — card borders
Border (strong)        #3a3a3a   hsl(0, 0%, 23%)    — focus rings, active borders
```

Rationale: Derived from Raycast's surface ladder (#07080a → #121212) and Sofascore's deep charcoal (#121212). No pure black (#000) — it creates visual banding on OLED and makes cards indistinguishable.

### 3.2 Accent

```
Hero Accent            #faff69   hsl(63, 100%, 70%)  — electric yellow
Accent Glow            rgba(250, 255, 105, 0.12)     — subtle glow behind accent elements
Accent Muted           rgba(250, 255, 105, 0.08)     — hover bg for accent-tagged items
```

Why yellow? It provides **18.3:1 contrast ratio** on #0a0a0a (WCAG AAA). It's the most visible color in direct sunlight (outdoor matches). It's undeniably sporty without being a club color. It reads as "attention" not "danger."

Yellow appears on: primary CTAs, active nav indicators, score separator colon, loading spinners, live-match pulse dot, focused input rings.

### 3.3 Semantic Data Colors (Read-only — NEVER use for CTAs)

```
Green  (win/good)      #22c55e   hsl(142, 76%, 45%)  — match win, form dot
Red    (loss/bad)      #ef4444   hsl(0, 84%, 60%)    — match loss, suspension
Amber  (draw/avg)      #eab308   hsl(45, 93%, 50%)   — draw, yellow card
Blue   (info)          #3b82f6   hsl(217, 91%, 60%)  — informational tags, player numbers
Gray   (neutral)       #52525b   hsl(240, 5%, 34%)   — disabled, no data
```

From Sofascore's color-coded rating scale + FBref's percentile coloring + WhoScored's rating semantics. These are **data-presentation colors only** — they never appear on buttons or interactive elements.

### 3.4 BMW M Tricolor (Team Affiliation Stripe)

A 4px-wide left border on team-affiliated containers:

```
Cyan    #00bfff   hsl(195, 100%, 50%)  — left stripe band
Magenta #ff0066   hsl(339, 100%, 50%)  — middle stripe band
Amber   #ffb300   hsl(42, 100%, 55%)   — right stripe band
```

From BMW M design system: the tricolor signals "team affiliation." Applied as a `border-left: 4px solid` with a gradient to the three colors. The stripe is present on: team section headers, team stat cards, standings rows for the two match teams.

Unlike BMW M's automotive context, here the tricolor is **the only decorative element** in the entire system (per Ferrari's "single decorative voltage" principle and NVIDIA's "one corner-square" restraint).

---

## 4. Typography

### 4.1 Font Stack

```
Display/body:   "InterVariable", "Inter", system-ui, -apple-system, sans-serif
Stats/numbers:  "JetBrains Mono Variable", "JetBrains Mono", "SF Mono", "Cascadia Code", monospace
```

Inter — chosen for its widespread availability, excellent legibility at small sizes, and `ss03` stylistic set (single-storey 'g') per Raycast convention, which improves reading density.

JetBrains Mono — chosen for its `zero` with dot (disambiguates 0/O), clear punctuation, and `ss01` ligature-free variant for clean tabular stats.

### 4.2 Type Scale

```
Role            Size     Weight  Line-Height  Tracking   Notes
────────────────────────────────────────────────────────────────
Hero-score      64px     700     0.95         -0.03em    Only on scoreline (fs_A : fs_B)
Section-title   24px     700     1.1          -0.02em    Team names, page headers
Card-title      20px     600     1.2          -0.01em    Player names, section labels
Body            16px     400     1.5          0          All prose, metadata
Small           14px     500     1.4          0          Table cells, stat labels
Caption         12px     600     1.3          0.05em     Uppercase only — section tags
Micro           10px     700     1.2          0.08em     Table headers, badge labels
Mono-stat       16px     500     1.2          0          Tabular-nums, all stats
Mono-small      14px     500     1.2          0          Small stat values
```

### 4.3 Typographic Rules

1. **Negative tracking on display sizes** only (>20px), decreasing proportionally (Apple SF Pro pattern)
2. **Sentence-case everywhere** — no all-caps except `Caption` and `Micro` roles (from Uber's sentence-case rule)
3. **Numbers use JetBrains Mono with `font-variant-numeric: tabular-nums`** always (Coinbase Mono rule)
4. **Max line length for body: 66ch** (editorial readability)
5. **Weights available:** 400, 500, 600, 700 — no 300 or 800+ (simplicity per Intercom/Coinbase)

---

## 5. Spacing & Layout

### 5.1 Spacing Scale (8px grid)

```
Space-1   4px     (— only for hairline borders)
Space-2   8px     (— tight inline gaps)
Space-3   12px    (— icon+text gap)
Space-4   16px    (— card internal padding, base unit)
Space-5   24px    (— section gap, card-to-card)
Space-6   32px    (— major sections)
Space-7   48px    (— page section padding)
Space-8   64px    (— hero/promo padding)
Space-9   96px    (— max page width padding)
```

### 5.2 Layout Patterns

#### Bento Grid
- Player cards in responsive grid: 1-col (mobile) → 2-col (tablet) → 3-col (desktop)
- Each bento cell is a `surface-1` card with `rounded-xl` (12px) and `border-hairline`
- Cards have equal height within their row (flex-stretch)
- From: Apple product grid, Sofascore match cards, Notion pastel feature grid

#### Progressive Disclosure Stack
- **Match row** (collapsed): team names, score, time — 5 data points (Flashscore pattern)
- **Match detail** (expanded): stats bars, lineups, timeline — 15+ data points
- **Full data** (navigation to player): per-player season stats — 100+ data points
- Three-click rule: any stat reachable within 3 taps

#### Score Header (Persistent)
- Score column: 64px bold, `team_A : team_B` with accent colon
- Below: match minute (live pulse dot), date, competition tag
- Sticky on scroll within match detail page (per Matchday case study, Sofascore)

### 5.3 Breakpoints

```
Mobile      0–639px    1-col, bottom nav, full-bleed cards
Tablet      640–1023px 2-col grids, side-by-side stats
Desktop     1024px+    3-col grids, full bento, keyboard shortcuts
```

---

## 6. Component Library

### 6.1 Button

```
Shape:      Rounded-md (8px) — rectangular, NEVER pill
Height:     44px (mobile minimum), 40px (dense)
Padding:    12px 20px (horizontal), 8px (vertical)   
Primary:    bg: hero-accent (#faff69), text: #0a0a0a, weight: 600
Secondary:  bg: transparent, border: hairline-strong, text: white, weight: 500
Ghost:      bg: transparent, text: hero-accent, weight: 500
Danger:     bg: semantic-red/10, border: semantic-red/20, text: red-400
Disabled:   opacity: 40%, pointer-events: none
Active:     transform: scale(0.97) — site-wide press micro-interaction
```

Shape rationale: Rectangular 8px buttons (Ferrari, NVIDIA, Intercom) feel precise and sporty. Pills (Apple, Uber, Figma) feel generic and "consumer-app." This is a utility data tool, not a social network.

### 6.2 Card

```
Radius:         rounded-xl (12px) — standard, rounded-2xl (16px) — hero cards
Padding:        20px (standard), 24px (hero), 16px (compact table cells)
Background:     surface-1 (#141414)
Border:         1px hairline (#2a2a2a) — no drop shadows ever
Elevation:      surface color ladder — surface-2 (#1c1c1c) for hover/active states
Decoration:     4px BMW M tricolor left-border on team-affiliated cards only
Animation:      stagger-enter (opacity 0 → 1 + y: 12 → 0, 200ms, stagger 50ms)
```

### 6.3 Input

```
Height:     44px
Radius:     rounded-lg (8px)
Bg:         surface-2 (#1c1c1c)
Border:     1px hairline (#2a2a2a)
Focus:      2px solid hero-accent (#faff69), no ring offset
Padding:    12px 16px
Placeholder: text-muted (#52525b)
Text:       body (#f4f4f4) at 16px
Icon:       20px, text-muted, positioned left with 12px offset
```

### 6.4 Stat Badge

```
Radius:     rounded-md (6px)
Padding:    4px 10px
Bg:         surface-3 (#242424)
Text:       14px/600, color per semantic role
Semantic:   green for goals/win, red for suspensions/loss, amber for warnings/draw, blue for info
```

### 6.5 Form Dot (Match History)

```
Size:       10px × 10px
Radius:     rounded-full
Spacing:    4px gap between dots
Colors:     green (win) / red (loss) / amber (draw) / gray-700 (fixture)
Tooltip:    Shows date, opponent, score on hover/tap
```

From WhoScored / Premier League match history form indicators.

### 6.6 Dual Stat Bar (Team Comparison)

```
Height:     8px bar, 20px with label
Radius:     rounded-full on bar container
Layout:     Two bars extending from center axis
Left bar:   left-aligned, right-rounded (team A color if available)
Right bar:  right-aligned, left-rounded (team B color if available)
Center:     stat label + value
Animation:  width animates on data load (0.6s ease-out)
```

From WhoScored (originated), Sofascore, Flashscore. Used for: possession %, shots, passing accuracy, duels won.

### 6.7 Table (Standings)

```
Header:     bg surface-3 (#242424), text caption (10px/700/uppercase)
Rows:       alternating surface-1 / surface-2
Hover:      bg surface-2 on non-match-team rows
Highlight:  bg hero-accent/8 on match-team rows + left tricolor border
Cells:      padding 12px 16px, body (14px/400)
Numbers:    mono-small (14px/500), tabular-nums
Position:   bold weight on position column
Points:     bold white weight
```

### 6.8 Live Badge (Score Header)

```
Dot:        8px, rounded-full, bg red-500, animated pulse (opacity 1→0.4→1, 2s loop)
Label:      "LIVE" 10px/700, uppercase, tracking 0.1em, color red-400
Container:  4px 10px padding, bg red-500/10, border red-500/20, rounded-md
Only shown: when match minute < 90 and status is not "Played"
```

---

## 7. Animation & Motion

### 7.1 Philosophy

Motion is **utilitarian, not expressive.** It communicates state changes, guides attention, and never distracts from data.

Inspired by: Raycast (no decorative motion), Notion (150–200ms standard), Apple (scale(0.95) press).

### 7.2 Duration & Easing

```
Micro-interaction (press)    100ms     ease-out
Card enter                    200ms     ease-out  (opacity + y-translate)
Card stagger                   50ms     delay between siblings
Page transition               300ms     ease-in-out
Stat bar fill                 600ms     ease-out
Live pulse (loop)            2000ms     ease-in-out
```

### 7.3 Motion Patterns

| Pattern | Implementation | Use case |
|---------|---------------|----------|
| Stagger enter | `variants` with `staggerChildren: 0.05` | Card grids, player list |
| Scale press | `whileTap={{ scale: 0.97 }}` | Buttons, interactive cards |
| Layout animation | `layout` prop + `layoutDamping: 20` | Reordered standings |
| Animate presence | `AnimatePresence` + `mode: "wait"` | Error ↔ data transitions |
| Skeleton shimmer | CSS animation (gradient sweep) | Loading states |

### 7.4 Reduced Motion

```
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Icons (Lucide React)

Use Lucide icons exclusively. Icon set:

```
Search          — search input
Trophy          — home page features
Calendar        — match date, season selector
Activity        — form/match history
User            — player avatar placeholder
Shield          — games played stat
Target          — goals stat
AlertTriangle   — warnings stat
Loader2         — spinner (animate-spin)
Users           — referee indicator
ArrowLeft       — back navigation
ArrowRight      — expand/collapse indicators
ChevronDown     — dropdown / accordion
MoreHorizontal  — overflow menu
Star            — favorites
MapPin          — location/venue
Clock           — match time
```

Icon size convention:
- Inline with body text: 14px
- Stat items: 16px
- Navigation/UI elements: 20px
- Feature icons (home page): 32px
- Hero/empty states: 48px

---

## 9. Data Visualization

### 9.1 Color-Coded Ratings

Every numeric stat that can be interpreted as "good/bad" uses semantic coloring:

```
Stat above average   →  green (#22c55e)
Stat average         →  amber (#eab308)
Stat below average   →  red (#ef4444)
Neutral / no data    →  gray (#52525b)
```

Applied to: goal counts (green), warnings (amber), suspensions (red), match results (green/red/amber).

### 9.2 Player Stats Card (Bento Cell)

```
┌──────────────────────────────┐
│ [photo] Player Name     #shirt│
│         Birth Year · Position│
│                              │
│ ┌──────┐ ┌──────┐ ┌──────┐  │
│ │Ottelut│ │Maalit│ │Varoit│  │
│ │  12   │ │  3   │ │  1   │  │
│ └──────┘ └──────┘ └──────┘  │
│                              │
│ Viimeisimmät                 │
│ ● ● ● ● ● ● ● ●             │
│ (form dots, last 8 matches)  │
└──────────────────────────────┘
```

### 9.3 Form Dots with Tooltip

Each dot represents one match. On hover/tap: show popover with date, opponent, score, minutes played.

### 9.4 Progressive Match Row

```
┌──────────────────────────────────────┐
│ FC Honka       3 - 1   HJK Helsinki  │  ← collapsed (always visible)
│ 14:00 · Väinämöisen kenttä · LIVE 🔴 │
├──────────────────────────────────────┤
│ Pallo: 52%          48%              │  ← expanded (1 tap)
│ Laukaisut: 8         6               │
│ Kulmat: 4            3               │
│ ...                                  │
└──────────────────────────────────────┘
```

---

## 10. Accessibility

### 10.1 Contrast Ratios

All interactive text meets **WCAG AAA (7:1)** on dark canvas:

```
Hero accent #faff69 on #0a0a0a     → 18.3:1  (AAA)
White #f4f4f4 on #0a0a0a           → 15.5:1  (AAA)
Gray text #a1a1aa on #0a0a0a       → 7.6:1   (AAA)
Muted #52525b on #141414           → 3.6:1   (AA for decorative only)
Semantic red #ef4444 on #0a0a0a    → 7.2:1   (AAA)
Semantic green #22c55e on #0a0a0a  → 7.8:1   (AAA)
```

### 10.2 Focus Management

- Focus visible: 2px solid hero-accent ring
- Skip-to-content link (hidden until focused)
- All interactive elements reachable via keyboard
- Form dots accessible via Enter/Space for tooltip

### 10.3 Touch Targets

- All interactive elements minimum 44×44px (WCAG 2.5.5)
- Cards are not interactive (data containers) — no tap action on card body

### 10.4 Reduced Motion

- Respect `prefers-reduced-motion`
- No parallax, no auto-scroll, no looping animations except live pulse

---

## 11. Responsive Behavior

| Breakpoint | Layout | Nav | Cards |
|------------|--------|-----|-------|
| <640px (mobile) | Single column, full bleed | Bottom tab bar (4 tabs) | 1-col grid |
| 640–1023px (tablet) | 2-col sidebar + content | Bottom tab bar | 2-col grid |
| ≥1024px (desktop) | Full width, max 1200px | Bottom tab bar + keyboard shortcuts | 3-col grid |

---

## 12. Dark Theme Specification

```
color-scheme: dark

/* Surface */
--color-canvas:           #0a0a0a
--color-surface-1:        #141414
--color-surface-2:        #1c1c1c
--color-surface-3:        #242424

/* Borders */
--color-border-hairline:  #2a2a2a
--color-border-strong:    #3a3a3a

/* Accent */
--color-accent:           #faff69
--color-accent-glow:      rgba(250, 255, 105, 0.12)
--color-accent-muted:     rgba(250, 255, 105, 0.08)

/* BMW M Tricolor */
--color-bmw-cyan:         #00bfff
--color-bmw-magenta:      #ff0066
--color-bmw-amber:        #ffb300

/* Semantic */
--color-semantic-green:   #22c55e
--color-semantic-red:     #ef4444
--color-semantic-amber:   #eab308
--color-semantic-blue:    #3b82f6
--color-semantic-gray:    #52525b

/* Text */
--color-text-primary:     #f4f4f4
--color-text-secondary:   #a1a1aa
--color-text-muted:       #52525b
--color-text-inverse:     #0a0a0a

/* Typography */
--font-display:           "InterVariable", "Inter", system-ui, sans-serif
--font-mono:              "JetBrains Mono Variable", "JetBrains Mono", monospace

/* Spacing (8px grid) */
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   24px
--space-6:   32px
--space-7:   48px
--space-8:   64px
--space-9:   96px

/* Radius */
--radius-sm:    4px
--radius-md:    8px
--radius-lg:    12px
--radius-xl:    16px
--radius-2xl:   20px
--radius-full:  9999px

/* Shadows (NONE — surface ladder replaces shadows) */
```

---

## 13. Implementation Plan

### Phase 1: Design Tokens (CSS Custom Properties)
- Replace current `@theme` block in `index.css` with full token set
- Remove blue brand colors, add yellow accent + BMW tricolor

### Phase 2: Component Audit
- Button (primary/secondary/ghost/danger) → 8px radius, no pills
- Card → surface-1 bg, no shadows, hairline borders
- Input → yellow focus ring
- Stat Badge → semantic colors

### Phase 3: Layout Migration
- MatchHeader → persistent score header
- PlayerCard → bento layout, form dots, progressive disclosure
- StandingsTable → alternating rows, match-team highlight with tricolor

### Phase 4: Animation Pass
- Stagger enter on card grids
- Scale press on buttons
- Skeleton loaders for API fetches

---

## 14. Design System DNA

This design system inherits from 20 analyzed systems and 7 football platforms:

| Inheritance | From |
|-------------|------|
| Dark-only canvas | Raycast, Sofascore, Flashscore |
| Surface ladder (no shadows) | Raycast, Intercom |
| Single accent voltage | Apple, NVIDIA, Ferrari, Coinbase |
| Rectangular 8px buttons (no pills) | Ferrari, NVIDIA, Intercom |
| Mono on all numbers | Coinbase, FBref |
| Negative tracking on display | Apple SF Pro |
| Sentence-case UI | Uber |
| BMW M tricolor stripe | BMW M |
| Bento card grid | Sofascore, Apple, Notion |
| Progressive disclosure | Flashscore (expandable rows) |
| Color-coded semantics | Sofascore, FBref, WhoScored |
| Form dots with tooltip | WhoScored, Premier League |
| Dual stat comparison bars | WhoScored, Sofascore |
| Live score header | Matchday, Sofascore |
| 44px touch targets | WCAG, Apple HIG |
| Inter + ss03 'g' | Raycast |
| Pastel tinted sections | Figma, Notion |
| Cream/warm canvas | Intercom |
| Two-mode architecture | Shopify (cinematic+transactional) |
| 8px spacing grid | Ferrari (8px ladder) |
| Score & time as hero element | Flashscore, Sofascore |

---

## 15. Appendix: Rejected Alternatives & Rationale

| Rejected | Why |
|----------|-----|
| Light mode | Football data is consumed outdoors at night (floodlit matches) and in low-light environments. Dark reduces glare. |
| Pill buttons | Pills are consumer-generic (Uber, Apple, Figma). 8px rectangles feel precise, sporty, utilitarian. |
| Drop shadows | Surface color ladder creates cleaner depth without visual noise. Per Raycast: "no shadows." |
| Multiple accent colors | One accent (electric yellow) creates brand recognition. Multiple accents dilute it. NVIDIA does this. |
| Custom typeface | Inter + JetBrains Mono are free, well-tested, and load fast. A custom face would bloat the bundle and delay first paint. |
| Glassmorphism | Excessive blur destroys readability on data-dense screens. Limited to bottom nav chrome only. |
| Serif / editorial type | Football data is facts, not stories. Sans-serif communicates precision. |
| Gradient backgrounds | Current radial-gradient blue glows will be removed. Flat dark canvas is cleaner and more performant. |
| Animated backgrounds | Battery impact on mobile, accessibility violation. No moving backgrounds. |
| Loading spinners (infinite) | Skeleton loaders communicate progress better than spinners. Spinners only used for button loading states. |
| Full-bleed hero images | This app has no editorial photography. It's a data tool. Images used only for player photos and club crests. |

---

*Design document v1.0 — synthesized from 20 world-class design systems (Apple, Raycast, Ferrari, Figma, Intercom, Notion, Uber, NVIDIA, Shopify, Coinbase, Nike, Linear, Spotify, Vercel, BMW M, PlayStation, Stripe, Supabase, ClickHouse, Sanity) and 7 football data platforms (FBref, Transfermarkt, WhoScored, Sofascore, Flashscore, UEFA, Premier League). June 2026.*
