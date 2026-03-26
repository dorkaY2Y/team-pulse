// WorldSkills Official Brand Design System
// Colors from: https://worldskills.org/brand/visual-identity/
export const theme = {
  colors: {
    // Primary WorldSkills colors
    primary: '#003764',       // WorldSkills Dark Blue (Navy) - logo color
    primaryDark: '#002647',   // Darker navy for pressed states
    primaryLight: '#0077C8',  // Lighter blue for highlights

    // WorldSkills brand palette
    yellow: '#FEE300',        // Pantone 102C
    magenta: '#D51067',       // Pantone 214C
    cyan: '#72D0EB',          // Pantone 0821C
    orange: '#FF6C0C',        // Pantone 1585C
    purple: '#4A0D66',        // Pantone 2617C
    teal: '#0084AD',          // Pantone 7704C
    mint: '#8AE2D1',          // Pantone 332C

    // Accent - magenta used for CTAs and highlights
    accent: '#D51067',

    // Neutrals
    black: '#1A1A1A',
    darkGray: '#333333',
    gray: '#666666',
    mediumGray: '#999999',
    lightGray: '#E5E5E5',
    background: '#F5F5F5',
    white: '#FFFFFF',

    // Functional
    success: '#0084AD',
    warning: '#FEE300',
    error: '#D51067',
    info: '#72D0EB',

    // Card & surface
    card: '#FFFFFF',
    cardBorder: '#E0E0E0',
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
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
} as const;
