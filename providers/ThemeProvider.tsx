// providers/ThemeProvider.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('light');

  const applyTheme = useCallback((selectedTheme: Theme) => {
    const root = document.documentElement; // Target html element
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
      // Optional: Add to body too if needed by specific selectors, but html is usually sufficient
      // document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      // document.body.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    let initialTheme: Theme;
    try {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    } catch (error) {
      console.warn("Could not access localStorage for theme preference.");
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      initialTheme = prefersDark ? 'dark' : 'light';
    }
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('theme', newTheme);
      } catch (error) {
        console.warn("Could not save theme preference to localStorage.");
      }
      applyTheme(newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};