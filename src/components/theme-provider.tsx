
"use client";

import { useEffect } from 'react';
import type { Theme } from '@/components/twitch-eye/AppHeader'; // Assuming Theme type is exported from AppHeader

const validThemes: Theme[] = ['light', 'dark', 'dark-red'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const defaultThemeToApply: Theme = 'dark-red'; // Default to dark-red

    if (savedTheme && validThemes.includes(savedTheme)) {
      document.documentElement.className = savedTheme;
    } else {
      // If no theme saved, or invalid, apply default and save it
      document.documentElement.className = defaultThemeToApply;
      localStorage.setItem('theme', defaultThemeToApply);
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // This component doesn't render UI itself, just manages the theme class on <html>
  return <>{children}</>;
}

    