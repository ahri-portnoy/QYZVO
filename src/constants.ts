export const PILOT_DESIGN_TOKENS = {
  colors: {
    primary: '#D4AF37', // Gold
    primaryDark: '#B8860B',
    bgDark: '#020617',
    bgLight: '#FFFFFF',
    textDark: '#FAFAFA',
    textLight: '#000000',
    mutedDark: 'rgba(250, 250, 250, 0.3)',
    mutedLight: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(255, 255, 255, 0.02)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
  },
  typography: {
    sans: '"Inter", sans-serif',
    display: '"Outfit", sans-serif',
    mono: '"JetBrains Mono", monospace',
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.25rem',    // 20px
      xl: '1.5rem',     // 24px
      '2xl': '2rem',    // 32px
      '3xl': '3rem',    // 48px
    },
    tracking: {
      tight: '-0.02em',
      wide: '0.05em',
      widest: '0.2em',
    }
  },
  spacing: {
    pill: 'px-4 py-2',
    card: 'p-8',
    section: 'space-y-8',
    container: 'max-w-7xl mx-auto px-6 py-12',
  },
  radii: {
    card: '40px',
    button: '16px',
    pill: '9999px',
  },
  transitions: {
    default: 'transition-all duration-300 ease-in-out',
    slow: 'transition-all duration-700 ease-in-out',
  }
};
