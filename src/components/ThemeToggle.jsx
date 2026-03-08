import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      onClick={toggleTheme} 
      className="theme-toggle-btn"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <MdDarkMode size={24} /> : <MdLightMode size={24} />}
    </button>
  );
};

export default ThemeToggle;
