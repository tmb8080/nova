import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Logo = ({ className = "h-20 w-auto", alt = "NovaStaking Logo" }) => {
  const { isDarkMode } = useTheme();
  
  return (
    <img 
      src={isDarkMode ? "/navalogowhite.png" : "/novalogo.png"} 
      alt={alt} 
      className={className}
    />
  );
};

export default Logo;
