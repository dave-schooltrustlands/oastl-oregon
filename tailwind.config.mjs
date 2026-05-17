import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', '"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        // OASTL palette — Oregon forest register
        'oastl-forest': '#14532D',      // deep forest green primary (Oregon evergreen)
        'oastl-canopy': '#1B4332',      // alternate forest tone
        'oastl-moss':   '#2D5A3F',      // softer green for accents
        'oastl-gold':   '#C89B2E',      // trust gold (campus-shared accent)
        'oastl-action': '#2563A6',      // action blue (CTAs)
        'oastl-clay':   '#B65A3C',      // alert / breach
        'oastl-cream':  '#EFE6D2',      // ledger cream (card backgrounds)
        'oastl-bone':   '#FAF8F1',      // page background
        'oastl-ink':    '#151A18',      // near-black primary text
        // Campus-shared neutrals (for cross-bridge surfaces)
        'oastl-blueprint': '#536879',
      },
    },
  },
  plugins: [typography],
};
