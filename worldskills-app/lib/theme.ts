// WorldSkills Official Brand Design System
// Based on https://worldskills.org/ live site analysis
// Primary CTA: Magenta, Secondary: Purple, Brand: Navy
export const theme = {
  colors: {
    // Primary WorldSkills colors
    primary: '#D51067',       // Magenta - primary CTA (buttons, links)
    primaryDark: '#b10d56',   // Hover state
    secondary: '#4A0D66',     // Purple - secondary, active states
    navy: '#003764',          // Dark Blue - brand, headers, backgrounds

    // WorldSkills brand palette
    yellow: '#FEE300',
    magenta: '#D51067',
    cyan: '#72D0EB',
    orange: '#FF6C0C',
    purple: '#4A0D66',
    teal: '#0084AD',
    mint: '#8AE2D1',

    // Accent
    accent: '#D51067',

    // Neutrals (from worldskills.org CSS)
    black: '#2d2d2d',
    darkGray: '#434343',
    gray: '#5a5a5a',
    mediumGray: '#acacac',
    lightGray: '#e8e8e8',
    background: '#f7f7f7',
    white: '#FFFFFF',

    // Functional
    success: '#0084AD',
    warning: '#FEE300',
    error: '#D51067',
    info: '#72D0EB',

    // Card & surface
    card: '#FFFFFF',
    cardBorder: '#d7d7d7',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  fonts: {
    regular: 'System',
    bold: 'System',
  },

  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    hero: 36,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 2,         // WorldSkills: near-sharp edges
    md: 4,
    lg: 6,
    xl: 8,
    full: 999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;
