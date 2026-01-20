export const colors = {
  // Design-token aligned palette (based on the HSL tokens you shared)
  // Primary (roughly: hsl(222.2, 47.4%, 11.2%))
  primary: '#0F172A',
  onPrimary: '#FFFFFF',

  // Secondary (used sparingly for alternate emphasis)
  secondary: '#2563EB',
  onSecondary: '#FFFFFF',

  // Semantic colors
  success: '#22C55E',
  onSuccess: '#FFFFFF',

  error: '#EF4444',
  onError: '#FFFFFF',

  warning: '#F59E0B',
  onWarning: '#111827',

  // Surface roles
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  onSurface: '#0F172A',
  onSurfaceVariant: '#475569',

  // Background roles
  background: '#FFFFFF',
  onBackground: '#0F172A',

  // Borders & outlines (roughly: hsl(214.3, 31.8%, 91.4%))
  outline: '#E2E8F0',
  outlineVariant: '#E2E8F0',

  // Utility
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  // A simple scale that maps cleanly to the spacing tokens you provided
  // 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
};

export const typography = {
  // Typography aligned to the provided scale
  h1: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
  },
  h2: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
  },
  h3: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle1: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  subtitle2: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
};

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
};