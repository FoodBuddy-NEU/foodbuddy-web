'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';

  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) return savedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyThemeToDOM = (newTheme: Theme) => {
  if (typeof document === 'undefined') return;

  const htmlElement = document.documentElement;

  if (newTheme === 'dark') {
    htmlElement.classList.add('dark');
    htmlElement.style.colorScheme = 'dark';
  } else {
    htmlElement.classList.remove('dark');
    htmlElement.style.colorScheme = 'light';
  }

  localStorage.setItem('theme', newTheme);
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage on first render
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    return getInitialTheme();
  });

  // Apply theme to DOM when theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      applyThemeToDOM(newTheme);
      return newTheme;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
