import { create } from 'zustand';

// Theme definitions with Tailwind classes
const themes = {
  default: {
    // Node colors
    nodeText: 'text-gray-800',
    nodeTextSecondary: 'text-gray-600',
    nodeBorder: 'border-gray-300',
    nodeBackground: 'bg-white',
    nodeBackgroundGradient: 'bg-gradient-to-br from-white to-gray-50',
    
    // Menu colors
    menuBackground: 'bg-white',
    menuBorder: 'border-gray-200',
    menuShadow: 'shadow-lg',
    
    // Button colors
    buttonPrimary: 'bg-blue-600 hover:bg-blue-700',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300',
    
    // Text colors
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    
    // Background colors
    background: 'bg-gray-50',
    backgroundSecondary: 'bg-white',
    
    // Note colors
    noteBackground: 'bg-yellow-50',
    noteText: 'text-gray-600',
  },
  white: {
    // Node colors
    nodeText: 'text-white',
    nodeTextSecondary: 'text-white/80',
    nodeBorder: 'border-white/30',
    nodeBackground: 'bg-transparent',
    nodeBackgroundGradient: 'bg-gradient-to-br from-white/10 to-white/5',
    
    // Menu colors
    menuBackground: 'bg-gray-800',
    menuBorder: 'border-gray-700',
    menuShadow: 'shadow-xl',
    
    // Button colors
    buttonPrimary: 'bg-white/20 hover:bg-white/30',
    buttonSecondary: 'bg-gray-700 hover:bg-gray-600',
    
    // Text colors
    textPrimary: 'text-white',
    textSecondary: 'text-white/80',
    textMuted: 'text-white/60',
    
    // Background colors
    background: 'bg-gray-900',
    backgroundSecondary: 'bg-gray-800',
    
    // Note colors
    noteBackground: 'bg-green-500',
    noteText: 'text-white/90',
  }
};

// Helper function to update body classes
const updateBodyClasses = (themeName) => {
  console.log('🎨 Updating body classes for theme:', themeName);
  // Remove all theme classes
  document.body.classList.remove('theme-default', 'theme-white');
  
  // Add current theme class
  if (themeName !== 'default') {
    document.body.classList.add(`theme-${themeName}`);
  }
};

export const useThemeStore = create((set, get) => ({
  // Current theme
  currentTheme: 'default',
  
  // Available themes
  themes: Object.keys(themes),
  
  // Get current theme object
  getCurrentTheme: () => {
    const currentTheme = get().currentTheme;
    console.log('🎨 Getting current theme:', currentTheme);
    return themes[currentTheme];
  },
  
  // Get specific theme property
  getThemeProperty: (property) => {
    const currentTheme = get().getCurrentTheme();
    const value = currentTheme[property] || '';
    console.log(`🎨 Getting theme property "${property}":`, value);
    return value;
  },
  
  // Switch theme
  setTheme: (themeName) => {
    console.log('🎨 Setting theme to:', themeName);
    if (themes[themeName]) {
      set({ currentTheme: themeName });
      updateBodyClasses(themeName);
      // Optionally save to localStorage for persistence
      localStorage.setItem('selectedTheme', themeName);
      console.log('🎨 Theme set successfully');
    } else {
      console.error('🎨 Invalid theme name:', themeName);
    }
  },
  
  // Initialize theme from localStorage
  initializeTheme: () => {
    const savedTheme = localStorage.getItem('selectedTheme');
    console.log('🎨 Initializing theme, saved theme:', savedTheme);
    if (savedTheme && themes[savedTheme]) {
      set({ currentTheme: savedTheme });
      updateBodyClasses(savedTheme);
    } else {
      updateBodyClasses('default');
    }
  },
})); 