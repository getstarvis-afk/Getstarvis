/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Original Starvis brand accent (kept for backward compat) ──────────
        primary: {
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
          light: '#38bdf8',
        },
        // ── The true brand: the logo's sky → violet gradient on deep navy ─────
        azure: {
          DEFAULT: '#1EA7FF',
          light: '#5cc2ff',
          dark: '#0284c7',
        },
        iris: {
          DEFAULT: '#7B4DFF',
          light: '#a78bfa',
          dark: '#6d28d9',
        },
        // ── Deep navy surface scale (the dark-premium base) ───────────────────
        navy: {
          950: '#05070f',
          900: '#081120', // canonical Starvis navy
          850: '#0a1322',
          800: '#0B1020',
          750: '#111a2e',
          700: '#16213c',
          600: '#1e2b4a',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-sky': '0 0 40px -6px rgba(30,167,255,0.55)',
        'glow-iris': '0 0 40px -6px rgba(123,77,255,0.5)',
        'glow-brand': '0 18px 50px -12px rgba(30,167,255,0.45), 0 8px 30px -10px rgba(123,77,255,0.4)',
        'card-dark': '0 24px 60px -24px rgba(5,7,15,0.8), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        'card-soft': '0 12px 32px -16px rgba(15,23,42,0.18)',
        'inset-hairline': 'inset 0 1px 0 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(120deg, #1EA7FF 0%, #4f7dff 45%, #7B4DFF 100%)',
        'brand-soft': 'linear-gradient(135deg, rgba(30,167,255,0.18) 0%, rgba(123,77,255,0.18) 100%)',
        'grid-faint': 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        floatSlow: {
          '0%,100%': { transform: 'translateY(0) translateX(0)' },
          '33%': { transform: 'translateY(-10px) translateX(6px)' },
          '66%': { transform: 'translateY(8px) translateX(-6px)' },
        },
        aurora: {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.55' },
          '50%': { transform: 'translate3d(4%,-4%,0) scale(1.15)', opacity: '0.8' },
        },
        twinkle: {
          '0%,100%': { opacity: '0.15', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        gridPan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '44px 44px' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(30,167,255,0.45)' },
          '70%': { boxShadow: '0 0 0 12px rgba(30,167,255,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        riseIn: {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        'float-slow': 'floatSlow 14s ease-in-out infinite',
        aurora: 'aurora 16s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        marquee: 'marquee 38s linear infinite',
        'grid-pan': 'gridPan 6s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-out infinite',
        shimmer: 'shimmer 1.5s ease infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'rise-in': 'riseIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
}
