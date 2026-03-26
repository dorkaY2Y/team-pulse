// WorldSkills Official Brand Design System
export const theme = {
  colors: {
    // Primary WorldSkills colors
    primary: '#E4002B',       // WorldSkills Red
    primaryDark: '#B8001F',   // Darker red for pressed states
    primaryLight: '#FF1A45',  // Lighter red for highlights

    // Neutrals
    black: '#1A1A1A',
    darkGray: '#333333',
    gray: '#666666',
    mediumGray: '#999999',
    lightGray: '#E5E5E5',
    background: '#F5F5F5',
    white: '#FFFFFF',

    // Functional
    success: '#00A651',
    warning: '#FFB81C',
    error: '#E4002B',
    info: '#0077C8',

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
