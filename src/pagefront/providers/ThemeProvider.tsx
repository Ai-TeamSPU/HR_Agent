'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'pink-light' | 'pink-dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('pink-light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('hr_theme') as Theme | null;
      if (savedTheme === 'pink-dark' || savedTheme === 'pink-light') {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        // Default to pink-light
        setThemeState('pink-light');
        applyTheme('pink-light');
      }
    } catch {
      applyTheme('pink-light');
    }
  }, []);

  const applyTheme = (targetTheme: Theme) => {
    const root = document.documentElement;
    if (targetTheme === 'pink-dark') {
      root.classList.add('dark', 'theme-pink-dark');
      root.classList.remove('theme-pink-light');
      root.setAttribute('data-theme', 'pink-dark');
    } else {
      root.classList.remove('dark', 'theme-pink-dark');
      root.classList.add('theme-pink-light');
      root.setAttribute('data-theme', 'pink-light');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem('hr_theme', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'pink-light' ? 'pink-dark' : 'pink-light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: mounted ? theme : 'pink-light',
        isDark: mounted && theme === 'pink-dark',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
