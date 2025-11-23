'use client';

import { useEffect } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

/**
 * useAppState - Application Side Effects Hook
 * 
 * Responsibilities:
 * 1. Sync Dark Mode state to HTML class (Tailwind dark mode support)
 * 
 * Note: Persistence is now handled by Zustand's persist middleware.
 */
export function useAppState() {
  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);

  // ===== Theme Sync - Sync isDarkMode to HTML class =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
}
