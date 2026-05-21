---
version: alpha
name: MedVerifySystem
colors:
  primary: "#00e5cc"
  primaryDim: "#00bfa6"
  primaryContainer: "rgba(0, 229, 204, 0.08)"
  onPrimary: "#003731"
  onPrimaryContainer: "#c8fff6"
  secondary: "#b388ff"
  secondaryDim: "#7c4dff"
  secondaryContainer: "rgba(124, 77, 255, 0.10)"
  onSecondaryContainer: "#ede7ff"
  tertiary: "#ffab40"
  tertiaryDim: "#ff9100"
  tertiaryContainer: "rgba(255, 171, 64, 0.10)"
  error: "#ff6b8a"
  errorContainer: "rgba(255, 107, 138, 0.10)"
  bgDeep: "#07060f"
  bgSurface: "#0e0c1d"
  textHigh: "rgba(255, 255, 255, 0.95)"
  textMedium: "rgba(255, 255, 255, 0.70)"
  textLow: "rgba(255, 255, 255, 0.38)"
  verdictTrue: "#5df5c0"
  verdictFalse: "#ff6b8a"
  verdictMisleading: "#ffcc02"
  verdictUnverified: "#b388ff"
typography:
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
  monoFamily: "JetBrains Mono, monospace"
  h1:
    fontSize: "2.5rem"
    fontWeight: "800"
    letterSpacing: "-0.02em"
  h2:
    fontSize: "1.75rem"
    fontWeight: "700"
    letterSpacing: "-0.01em"
  body:
    fontSize: "0.95rem"
    lineHeight: "1.6"
shapes:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  full: "9999px"
elevation:
  blur: "blur(28px) saturate(180%)"
  border: "rgba(255, 255, 255, 0.10)"
  borderFocus: "rgba(0, 229, 204, 0.35)"
  shadow: "0 8px 32px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)"
  shadowLg: "0 16px 64px rgba(0, 0, 0, 0.45), 0 4px 16px rgba(0, 0, 0, 0.25)"
---

# DESIGN.md — Med-Verify Design System Specification

Welcome to the Med-Verify UI and Design System specification document. This manifest codifies the **Material You Expressive + Liquid Glass** theme, enabling AI coding agents to perfectly align newly generated React and CSS components with Med-Verify's aesthetic styling.

---

## 🌌 Core Rationale & Aesthetics
Med-Verify is an AI-powered medical fact-checking assistant. To look authoritative, clean, and futuristic, the interface incorporates:
*   **Vibrant Color Palette**: Merges deep tech-inspired indigo/violet bases with bright, high-contrast cyan/teal primary highlights.
*   **Ambient Mesh Backgrounds**: A soft, floating, multi-colored background mesh overlaid with an SVG fractal noise pattern for texture.
*   **Liquid Glass Surfaces**: Clean cards built with thick glassmorphism (`backdrop-filter`) and thin, light-refracting highlights on top borders.

---

## 🎨 Design Tokens

### Colors & Semantic Roles
*   **Primary (`{colors.primary}`)**: `#00e5cc` — Used for main accents, positive indicators, and interactive focus states.
*   **Secondary (`{colors.secondary}`)**: `#b388ff` — Soft purple highlight for secondary icons, buttons, and badges.
*   **Tertiary (`{colors.tertiary}`)**: `#ffab40` — Amber accent for neutral actions and informational highlights.
*   **Error (`{colors.error}`)**: `#ff6b8a` — Used exclusively for critical errors, system failures, and hazard warning blocks.
*   **Background Deep (`{colors.bgDeep}`)**: `#07060f` — The main backdrop color of the entire viewport.
*   **Background Surface (`{colors.bgSurface}`)**: `#0e0c1d` — Card containers and inner content backgrounds.

### Fact-Checking Verdict Tones
Use these colors consistently to highlight the clinical fact-check outcome banners:
*   **TRUE**: `{colors.verdictTrue}` (`#5df5c0`) with dynamic translucent glows.
*   **FALSE**: `{colors.verdictFalse}` (`#ff6b8a`) indicating incorrect medical claims.
*   **MISLEADING**: `{colors.verdictMisleading}` (`#ffcc02`) indicating partial truth requiring deep context.
*   **UNVERIFIED**: `{colors.verdictUnverified}` (`#b388ff`) indicating clinical research gaps.

---

## 📐 Spacing, Elevation & Shapes

### Geometry / Corner Radii
Med-Verify strictly enforces Google Material You Expressive geometry scales:
*   **Small Elements (Badges, Pills)**: `xs` (`8px`) or `sm` (`12px`)
*   **Interactive Input Boxes**: `lg` (`24px`)
*   **Main Container Cards**: `xl` (`32px`)
*   **Pills, Tabs, and Round Buttons**: `full` (`9999px`)

### Elevation & Layering
*   **Active States & Normal Glass Cards**:
    *   `background`: `linear-gradient(135deg, rgba(255, 255, 255, 0.055) 0%, rgba(255, 255, 255, 0.025) 50%, rgba(255, 255, 255, 0.04) 100%)`
    *   `backdrop-filter`: `{elevation.blur}`
    *   `border`: `1px solid {elevation.border}`
    *   `box-shadow`: `{elevation.shadow}`
*   **Hover Glow / Focused Elevated Cards**:
    *   `border-color`: `rgba(255, 255, 255, 0.16)`
    *   `box-shadow`: `{elevation.shadowLg}`

---

## ✍️ Typography Guidelines
*   **Primary Typeface**: `Inter` — clean, highly readable geometric sans-serif suitable for scientific data grids.
*   **Monospace Typeface**: `JetBrains Mono` — utilized for JSON structures, raw OCR code, and technical metadata.
*   **Contrast Hierarchy**:
    *   `High`: `rgba(255, 255, 255, 0.95)` (Headings, primary values)
    *   `Medium`: `rgba(255, 255, 255, 0.70)` (Paragraph summaries, subtitles)
    *   `Low`: `rgba(255, 255, 255, 0.38)` (Captions, disclaimers, placeholder texts)

---

## 🛑 Guardrails & System Rules

*   **DO NOT** use sharp $0\text{px}$ borders. Always round surfaces using `{shapes.md}` or higher.
*   **DO NOT** use generic solid backgrounds (e.g. standard `#000` or `#fff`). Always layer surfaces with translucent glass gradients (`{elevation.blur}`).
*   **DO NOT** use high-intensity, unmoderated pure colors (pure red `#ff0000` or pure green `#00ff00`). Utilize the harmonious tones defined in this document.
*   **DO** ensure that any custom UI overlays include top-edge border refraction highlights (`linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.18) 70%, transparent 95%)`) to maintain high-end polish.
