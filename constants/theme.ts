// Kakebo App — Design System Tokens

export const Colors = {
  // Backgrounds
  bg: '#0D0D0D',
  surface: '#1A1A1A',
  card: '#222222',
  cardBorder: '#2E2E2E',

  // Accent — Kakebo gold
  accent: '#D4A853',
  accentLight: '#E8C47A',
  accentMuted: 'rgba(212, 168, 83, 0.15)',

  // Semantic
  danger: '#E05C5C',
  dangerMuted: 'rgba(224, 92, 92, 0.15)',
  success: '#5CB85C',
  successMuted: 'rgba(92, 184, 92, 0.15)',
  warning: '#E09A3C',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#9A9A9A',
  textMuted: '#555555',
  textOnAccent: '#0D0D0D',

  // Categories
  needs: '#5B9BD5',
  needsMuted: 'rgba(91, 155, 213, 0.15)',
  wants: '#D4A853',
  wantsMuted: 'rgba(212, 168, 83, 0.15)',
  culture: '#7EB77F',
  cultureMuted: 'rgba(126, 183, 127, 0.15)',
  unexpected: '#E05C5C',
  unexpectedMuted: 'rgba(224, 92, 92, 0.15)',

  // Tab bar
  tabActive: '#D4A853',
  tabInactive: '#555555',
  tabBar: '#111111',
  tabBarBorder: '#2A2A2A',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  xxxl: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export type Category = 'Needs' | 'Wants' | 'Culture' | 'Unexpected';

export const CATEGORIES: Category[] = ['Needs', 'Wants', 'Culture', 'Unexpected'];

export const CategoryMeta: Record<Category, { color: string; muted: string; icon: string; description: string }> = {
  Needs: {
    color: Colors.needs,
    muted: Colors.needsMuted,
    icon: '🏠',
    description: 'Rent, food, transport, utilities',
  },
  Wants: {
    color: Colors.wants,
    muted: Colors.wantsMuted,
    icon: '✨',
    description: 'Dining out, clothes, entertainment',
  },
  Culture: {
    color: Colors.culture,
    muted: Colors.cultureMuted,
    icon: '📚',
    description: 'Books, courses, events, hobbies',
  },
  Unexpected: {
    color: Colors.unexpected,
    muted: Colors.unexpectedMuted,
    icon: '⚡',
    description: 'Repairs, medical, emergencies',
  },
};
