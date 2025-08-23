import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum THEMES {
  light = 'light',
  dark = 'dark',
  system = 'system'
}

export const defaultThemeColors = {
  light: {
    ...DefaultTheme,
    colors: {
      primary: 'hsl(215 100% 45%)',
      background: 'hsl(216 20% 95%)',
      card: 'hsl(0 0% 100%)',
      text: 'hsl(0 0% 2%)',
      muted: 'hsl(0 0% 50%)',
      border: 'hsl(0 0% 88%)',
      notification: 'hsl(0 0% 100%)'
    }
  },
  dark: {
    ...DarkTheme,
    colors: {
      primary: 'hsl(209 100% 58%)',
      background: 'hsl(0 0% 12%)',
      card: 'hsl(0 0% 21%)',
      text: 'hsl(0 0% 96%)',
      muted: 'hsl(0 0% 69%)',
      border: 'hsl(0 0% 31%)',
      notification: 'hsl(0 0% 21%)'
    }
  }
};
