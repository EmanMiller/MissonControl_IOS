import { DarkTheme } from '@react-navigation/native';

export const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#007AFF', // iOS Blue
    background: '#000000', // True black for OLED
    card: '#1C1C1E', // iOS dark card background
    text: '#FFFFFF', // White text
    border: '#38383A', // iOS dark border
    notification: '#FF453A', // iOS red for notifications
    surface: '#2C2C2E', // Slightly lighter surface
    accent: '#30D158', // iOS green
    warning: '#FF9F0A', // iOS orange
  },
};

export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceLight: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  shadow: 'rgba(0, 0, 0, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  large: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption1: 12,
  caption2: 11,
};

export const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
};