---
version: alpha
name: AgriOrbit
description: >
  NASA Earth-observation agricultural decision-support for Bangladesh.
  Space-grade satellite data translated into a calm, farm-level 3-season crop plan.
  Bilingual (English / বাংলা), dark "space × earth × agriculture" theme.
colors:
  primary: "#B8FF3D"
  secondary: "#00E5FF"
  tertiary: "#FBBF24"
  neutral: "#050B14"
  surface: "#0B1626"
  surface-raised: "#101F36"
  on-surface: "#FFFFFF"
  on-surface-muted: "#8FA3B8"
  danger: "#FF5C5C"
  season-rabi: "#93C5FD"
  season-kharif1: "#FBBF24"
  season-kharif2: "#22D3EE"
  line: "rgb(255 255 255 / 0.1)"
typography:
  headline-display:
    fontFamily: "Space Grotesk, Noto Sans Bengali, sans-serif"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: "Space Grotesk, Noto Sans Bengali, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  body-lg:
    fontFamily: "Inter, Noto Sans Bengali, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
  body-md:
    fontFamily: "Inter, Noto Sans Bengali, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  label-mono:
    fontFamily: "JetBrains Mono, Noto Sans Bengali, monospace"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.06em
rounded:
  sm: 0.75rem
  md: 1rem
  lg: 1.5rem
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  gutter: 32px
  container: 1240px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 0.8rem
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 0.8rem
  chip:
    backgroundColor: "rgb(255 255 255 / 0.04)"
    textColor: "{colors.on-surface-muted}"
    rounded: "{rounded.full}"
    padding: 0.3rem
  card-glass:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
---

## Overview

AgriOrbit's visual identity is **Space × Earth × Agriculture**: the calm of a
night-sky observatory crossed with the optimism of a green field at dawn. The
audience is Bangladeshi farmers and extension workers, so the UI must feel
trustworthy and unhurried — never flashy. Data is "from orbit" (cyan, precise,
technical), decisions are "from the land" (lime, warm, actionable). Every number
has a visible source; every recommendation has a written reason. The product is
strictly bilingual: English and বাংলা (Noto Sans Bengali), with Bangla digits in
বাংলা mode.

## Colors

The palette is a deep navy space base with two electric accents and a strict
semantic split: **lime drives action**, **cyan carries data**, **amber marks
heat and alerts**, **red is danger only**.

- **Primary — Electric Lime (#B8FF3D):** agriculture, positive outcomes, and
  the single primary CTA per screen. Never decorative.
- **Secondary — Electric Cyan (#00E5FF):** NASA / satellite / data. Charts,
  links, source labels, map chrome.
- **Tertiary — Amber (#FBBF24):** Kharif-1 season, heat stress, warming
  deltas. Also used for warnings alongside danger.
- **Neutral — Deep Space Navy (#050B14):** page background, the "night sky"
  the whole product floats on.
- **Surface (#0B1626) / Surface Raised (#101F36):** cards and raised tiles.
  Hierarchy comes from tonal layering, not drop shadows.
- **On-Surface (#FFFFFF) / Muted (#8FA3B8):** text. Body copy defaults to
  muted; headlines are pure white.
- **Season colors:** Rabi #93C5FD (cool winter blue), Kharif-1 #FBBF24,
  Kharif-2 #22D3EE (monsoon cyan) — used consistently in every chart.
- **Danger (#FF5C5C):** flood/waterlogging alerts only.

## Typography

Two families do the heavy lifting: **Space Grotesk** for display (geometric,
technical, "orbital") and **Inter** for body. **JetBrains Mono** is reserved for
eyebrows, data labels, and rule excerpts. **Noto Sans Bengali** is the fallback
for all Bengali text, and Bengali headings get looser line-height (1.3) and no
letter-spacing.

- **Headlines:** Space Grotesk 700, tight tracking (-0.01em), white.
- **Body:** Inter 400, 15–18px, muted slate, generous 1.65 line-height.
- **Labels/Eyebrows:** JetBrains Mono 600, uppercase, cyan, 0.06em tracking
  (0.02em in বাংলা mode).
- **Data:** tabular numerals everywhere numbers are compared side by side.

## Layout

A **fixed-max-width grid** (1240px, 32px gutters, 20–28px vertical section
rhythm) on a 4px/8px spacing scale. Landing sections stack full-width; the
hero is a 1.35:0.9 two-column grid that collapses to one column on mobile.
Cards use "containment": related metrics live inside a glass card with 24px
internal padding. Section anchors account for the fixed 64–80px header
(scroll-margin-top: 5rem).

## Elevation & Depth

Depth is **tonal and atmospheric**, not shadow-heavy: the page background is a
star field (CSS radial gradients) over deep navy, with a glowing cyan/lime
"earth horizon" gradient rising from the bottom of the hero. Cards are flat
`#0B1626` surfaces with a 1px `rgb(255 255 255 / 0.1)` border; the hero card
adds a soft inset highlight. Hover states lift via a 2px translate, not shadow
growth.

## Shapes

**Softly rounded, consistently applied:** cards 1.5rem, tiles 1rem, buttons
and inputs 0.75rem, chips/pills and the language toggle fully rounded (9999px).
Season accent bars on cards are 4px tall, full-width, top-aligned. Map markers
are 18px lime circles with a 3px navy ring; secondary district dots are 8px
cyan with a ping animation.

## Components

- **Buttons:** Primary = solid lime, navy text, 700 weight, hover brightens to
  #C7FF5C. Ghost = surface fill, 1px white/14 border, white text. Both are
  pill-rounded rectangles with inline-flex icon + label (icon always trailing on
  CTAs).
- **Chips:** small pill labels with a status dot (lime pulsing = live data,
  cyan = snapshot, slate = guidance).
- **Cards (glass):** surface fill, hairline border, 1.5rem radius; a top accent
  bar variant exists for season cards.
- **Tiles:** recessed `#050B14` squares for metric values inside glass cards.
- **Delta bars:** diverging around a center line — amber right (warmer), sky
  left (cooler).
- **MapLibre chrome:** attribution and zoom controls restyled to the dark theme
  (navy controls, cyan links, inverted icons).
- **Motion:** rise-in on load, 7s float on the hero card, pulsing live dot.
  All animation respects `prefers-reduced-motion`.

## Do's and Don'ts

- Do keep exactly one lime primary CTA per screen; everything else is ghost.
- Do pair every cyan "data" number with its source label (NASA POWER, SMAP,
  MODIS, Open-Meteo, BARI).
- Do use season colors consistently across charts, cards, and legends.
- Do test both English and বাংলа (Bangla digits, looser line-height).
- Don't use lime or cyan for alerts — amber for heat, danger red for floods.
- Don't add drop shadows to cards; elevation is tonal only.
- Don't mix rounded and sharp corners in the same view.
- Don't animate anything that carries critical advisory text.
