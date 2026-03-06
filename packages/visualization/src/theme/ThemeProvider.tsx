import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('kg-theme') as Theme | null;
      return saved ?? defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('kg-theme', t);
    } catch {}
    document.documentElement.setAttribute('data-theme', t);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── Design Tokens ───────────────────────────────────────────────────────────

export const lightTheme = {
  bg: '#F8FAFC',
  bgPanel: '#FFFFFF',
  bgSecondary: '#F1F5F9',
  border: '#E2E8F0',
  text: '#1E293B',
  textMuted: '#64748B',
  accent: '#2563EB',
  accentHover: '#1D4ED8',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  sidebar: '#FFFFFF',
  sidebarBorder: '#E2E8F0',
};

export const darkTheme = {
  bg: '#0F172A',
  bgPanel: '#1E293B',
  bgSecondary: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#64748B',
  accent: '#3B82F6',
  accentHover: '#60A5FA',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  sidebar: '#0F172A',
  sidebarBorder: '#1E293B',
};
