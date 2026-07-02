import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        // 2026-07-02 shared-palette re-skin: Newsreader / Public Sans, matching
        // the schooltrustlands.net redesign (5484652) and the schooltrusts.net
        // re-skin (a231cbd). Prior faces kept as stack fallbacks.
        serif: ['Newsreader', '"Cormorant Garamond"', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['"Public Sans"', 'Inter', '"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // OASTL palette — 2026-07-02 shared-palette re-skin. Values aligned
        // with the schooltrustlands.net navy/gold/cream redesign tokens;
        // token NAMES preserved so existing class usage keeps working.
        // Former Oregon-forest values noted inline.
        'oastl-forest': '#1b3252',      // was #14532D — trust-blue (primary)
        'oastl-canopy': '#14243c',      // was #1B4332 — deep-navy (alternate dark)
        'oastl-moss':   '#4f668c',      // was #2D5A3F — softer navy accent
        'oastl-gold':   '#a87f2c',      // was #C89B2E — old-gold (campus-shared accent)
        'oastl-action': '#33496e',      // was #2563A6 — action navy (CTAs)
        'oastl-clay':   '#B65A3C',      // alert / breach (semantic — kept)
        'oastl-cream':  '#f5f1e8',      // was #EFE6D2 — archive-paper (cards)
        'oastl-bone':   '#fffdf7',      // was #FAF8F1 — linen (page background)
        'oastl-ink':    '#1a1a2e',      // was #151A18 — shared ink
        // Campus-shared neutrals (for cross-bridge surfaces)
        'oastl-blueprint': '#5f6c80',   // was #536879 — warm slate from the shared ramp
        // Stock-utility remap: a handful of files use bg-white directly.
        white: '#fffdf7',
      },
    },
  },
  plugins: [typography],
};
