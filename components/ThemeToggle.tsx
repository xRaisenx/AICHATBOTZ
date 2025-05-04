// components/ThemeToggle.tsx
'use client';
import { useTheme } from '@/providers/ThemeProvider';
import { FaSun, FaMoon } from 'react-icons/fa'; // Using react-icons

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="icon-button theme-toggle" // Applied via @layer components in globals.css
      aria-label="Toggle dark mode"
    >
      {/* Render appropriate icon based on theme */}
      {theme === 'dark' ? <FaSun size={16} /> : <FaMoon size={16} />}
    </button>
  );
}