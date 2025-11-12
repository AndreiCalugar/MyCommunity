// Enhanced Design System for Beautiful UI
import { Platform } from 'react-native';

export const DesignSystem = {
  // Spacing Scale (8px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  // Border Radius
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xlarge: 20,
    xxlarge: 24,
    round: 999,
  },

  // Enhanced Colors
  colors: {
    // Primary
    primary: '#5865F2',
    primaryLight: '#7289DA',
    primaryDark: '#4752C4',
    primaryGradientStart: '#5865F2',
    primaryGradientEnd: '#7289DA',

    // Accent Colors
    accent: '#57F287', // Green for success
    warning: '#FEE75C', // Yellow for warnings
    danger: '#ED4245', // Red for errors
    info: '#00B0FF', // Blue for info

    // Background Colors (Light Mode)
    light: {
      background: '#FFFFFF',
      surface: '#F2F3F5',
      surfaceSecondary: '#E3E5E8',
      card: '#FFFFFF',
      border: '#E0E0E0',
      text: '#060607',
      textSecondary: '#4E5058',
      textTertiary: '#B5BAC1',
    },

    // Background Colors (Dark Mode)
    dark: {
      background: '#1E1F22',
      surface: '#2B2D31',
      surfaceSecondary: '#313338',
      card: '#2B2D31',
      border: '#4E5058',
      text: '#FFFFFF',
      textSecondary: '#B5BAC1',
      textTertiary: '#949BA4',
    },

    // Gradients
    gradients: {
      primary: ['#667eea', '#764ba2'],
      success: ['#56CCF2', '#2F80ED'],
      warm: ['#F2994A', '#F2C94C'],
      cool: ['#667eea', '#764ba2'],
      sunset: ['#FF6B6B', '#FFE66D'],
      ocean: ['#00D4FF', '#0099CC'],
    },
  },

  // Typography
  typography: {
    // Font Sizes
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 28,
      huge: 32,
    },

    // Font Weights
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },

    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },

    // Letter Spacing
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  },

  // Shadow Presets
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    xlarge: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },

  // Animation Durations
  animation: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },

  // Common Styles
  common: {
    // Card Style
    card: (isDark: boolean) => ({
      backgroundColor: isDark ? '#2B2D31' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    }),

    // Input Style
    input: (isDark: boolean) => ({
      backgroundColor: isDark ? '#1E1F22' : '#F2F3F5',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: isDark ? '#FFFFFF' : '#060607',
    }),

    // Button Style
    button: {
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  },
};

// Helper function to get colors based on theme
export const getColors = (isDark: boolean) => {
  return isDark ? DesignSystem.colors.dark : DesignSystem.colors.light;
};

// Helper function to create gradient
export const createGradient = (gradientName: keyof typeof DesignSystem.colors.gradients) => {
  return DesignSystem.colors.gradients[gradientName];
};

