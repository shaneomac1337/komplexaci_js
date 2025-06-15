'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PerformanceContextType {
  lowPerformanceMode: boolean;
  togglePerformanceMode: () => void;
  isInitialized: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProviderProps {
  children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [lowPerformanceMode, setLowPerformanceMode] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lowPerformanceMode');
    const initialValue = stored === 'true';
    setLowPerformanceMode(initialValue);
    setIsInitialized(true);

    // Apply initial CSS class
    if (initialValue) {
      document.body.classList.add('low-performance-mode');
    }
  }, []);

  // Toggle function that updates state, localStorage, and CSS
  const togglePerformanceMode = () => {
    setLowPerformanceMode(prev => {
      const newValue = !prev;
      
      // Update localStorage
      localStorage.setItem('lowPerformanceMode', String(newValue));
      
      // Update CSS classes
      if (newValue) {
        document.body.classList.add('low-performance-mode');
      } else {
        document.body.classList.remove('low-performance-mode');
      }
      
      return newValue;
    });
  };

  const value: PerformanceContextType = {
    lowPerformanceMode,
    togglePerformanceMode,
    isInitialized
  };

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
}

// Custom hook to use the performance context
export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}
