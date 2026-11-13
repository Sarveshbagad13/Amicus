/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-bg-canvas)',
        surface: 'var(--color-bg-surface)',
        subtle: 'var(--color-bg-subtle)',
        elevated: 'var(--color-bg-elevated)',
        
        heading: 'var(--color-text-heading)',
        body: 'var(--color-text-body)',
        muted: 'var(--color-text-muted)',
        'text-subtle': 'var(--color-text-subtle)',
        
        border: 'var(--color-border)',
        'border-hover': 'var(--color-border-hover)',
        'border-strong': 'var(--color-border-strong)',
        'border-accent': 'var(--color-accent-border)',
        
        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          active: 'var(--color-accent-active)',
          soft: 'var(--color-accent-soft)',
          'soft-hover': 'var(--color-accent-soft-hover)',
          border: 'var(--color-accent-border)',
          fg: 'var(--color-accent-foreground)',
        },

        risk: {
          severe: 'var(--color-risk-severe)',
          'severe-soft': 'var(--color-risk-severe-soft)',
          'severe-border': 'var(--color-risk-severe-border)',
          caution: 'var(--color-risk-caution)',
          'caution-soft': 'var(--color-risk-caution-soft)',
          'caution-border': 'var(--color-risk-caution-border)',
          safe: 'var(--color-risk-safe)',
          'safe-soft': 'var(--color-risk-safe-soft)',
          'safe-border': 'var(--color-risk-safe-border)',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        subtle: 'var(--shadow-subtle)',
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        glow: 'var(--shadow-glow)',
      }
    },
  },
  plugins: [],
}
