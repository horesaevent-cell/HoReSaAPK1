export const Colors = {
  primary: '#166534',
  primaryDark: '#142608',
  primaryLight: '#244211',
  secondary: '#22C55E',
  background: '#142608',
  surface: '#1C330C',
  border: '#2B4D13',
  textPrimary: '#FFFFFF',
  textSecondary: '#D1DEC9',
  textMuted: '#9FB392',
  success: '#16A34A',
  danger: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(20, 38, 8, 0.78)',
} as const;

export type AppColorKey = keyof typeof Colors;