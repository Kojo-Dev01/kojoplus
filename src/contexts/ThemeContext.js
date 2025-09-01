"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Dark mode as default
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('kojoforex-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
    setIsLoaded(true);
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('kojoforex-theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, isLoaded]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    isLoaded
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
