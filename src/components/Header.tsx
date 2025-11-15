'use client';

import { useState } from 'react';
import Weather from './Weather';

interface HeaderProps {
  onToggleAddLink: () => void;
  onToggleTheme: () => void;
  onToggleUnifiedSettings: () => void;
  darkMode: boolean;
}

export default function Header({ onToggleAddLink, onToggleTheme, onToggleUnifiedSettings, darkMode }: HeaderProps) {
  return (
    <header className="bg-transparent text-white w-full py-4 px-6 md:px-12 flex justify-between items-center transition-all duration-300 z-50">
      <div className="flex items-center">
        <Weather />
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleTheme}
          className="p-2 rounded-full hover:bg-white/10 transition-all"
        >
          <i className={`fa ${darkMode ? 'fa-sun-o' : 'fa-moon-o'}`}></i>
        </button>
      </div>
    </header>
  );
}