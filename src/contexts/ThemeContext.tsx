import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ThemeMode;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as ThemeMode) || 'auto';
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');

  // Determine actual theme based on preference and system
  useEffect(() => {
    const updateActualTheme = () => {
      if (theme === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setActualTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setActualTheme(theme);
      }
    };

    updateActualTheme();

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateActualTheme);
      return () => mediaQuery.removeEventListener('change', updateActualTheme);
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(actualTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', actualTheme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, [actualTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme configuration object
export const themeConfig = {
  light: {
    // Background gradients
    bgPrimary: 'bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50',
    bgSecondary: 'bg-white',
    bgTertiary: 'bg-gradient-to-r from-blue-50 to-purple-50',
    
    // Text colors
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    textAccent: 'text-blue-600',
    
    // Border colors
    borderPrimary: 'border-slate-200',
    borderSecondary: 'border-slate-100',
    borderAccent: 'border-blue-200',
    
    // Interactive states
    hoverBg: 'hover:bg-slate-50',
    activeBg: 'bg-blue-50',
    
    // Cards and surfaces
    cardBg: 'bg-white',
    cardBorder: 'border-slate-100',
    cardShadow: 'shadow-xl shadow-slate-200/50',
    
    // Gradients
    gradientPrimary: 'from-blue-600 to-purple-600',
    gradientSecondary: 'from-emerald-500 to-cyan-500',
    gradientAccent: 'from-orange-500 to-pink-500',
    
    // Sidebar
    sidebarBg: 'bg-white/95 backdrop-blur-xl',
    sidebarBorder: 'border-slate-200',
    sidebarText: 'text-slate-700',
    
    // Navigation
    navActive: 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700',
    navHover: 'hover:bg-slate-100',
    
    // Input styles
    inputBg: 'bg-white',
    inputBorder: 'border-slate-200',
    inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
    
    // Status colors
    success: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    warning: 'text-orange-600 bg-orange-50 border-orange-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  dark: {
    // Background gradients
    bgPrimary: 'bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950',
    bgSecondary: 'bg-slate-900/90 backdrop-blur-xl',
    bgTertiary: 'bg-gradient-to-r from-slate-800/50 to-blue-900/50',
    
    // Text colors
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textMuted: 'text-slate-500',
    textAccent: 'text-cyan-400',
    
    // Border colors
    borderPrimary: 'border-slate-700/50',
    borderSecondary: 'border-slate-800/50',
    borderAccent: 'border-cyan-500/30',
    
    // Interactive states
    hoverBg: 'hover:bg-white/5',
    activeBg: 'bg-cyan-500/10',
    
    // Cards and surfaces
    cardBg: 'bg-slate-900/40 backdrop-blur-xl',
    cardBorder: 'border-slate-700/30',
    cardShadow: 'shadow-2xl shadow-black/20',
    
    // Gradients
    gradientPrimary: 'from-cyan-600 to-blue-600',
    gradientSecondary: 'from-emerald-600 to-teal-600',
    gradientAccent: 'from-orange-600 to-red-600',
    
    // Sidebar
    sidebarBg: 'bg-slate-900/90 backdrop-blur-xl',
    sidebarBorder: 'border-slate-700/50',
    sidebarText: 'text-slate-300',
    
    // Navigation
    navActive: 'bg-gradient-to-r from-cyan-600 to-blue-600',
    navHover: 'hover:bg-white/5',
    
    // Input styles
    inputBg: 'bg-slate-800/50',
    inputBorder: 'border-slate-600/30',
    inputFocus: 'focus:border-cyan-500 focus:ring-cyan-500/20',
    
    // Status colors
    success: 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30',
    warning: 'text-orange-400 bg-orange-900/20 border-orange-500/30',
    error: 'text-red-400 bg-red-900/20 border-red-500/30',
    info: 'text-cyan-400 bg-cyan-900/20 border-cyan-500/30',
  }
};

// Helper function to get theme classes
export function getThemeClasses(actualTheme: 'light' | 'dark') {
  return themeConfig[actualTheme];
}
