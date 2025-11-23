import { useMemo } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

export function useThemeColor() {
    const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);

    return useMemo(() => {
        // Return theme-aware colors for Three.js scene
        // These values should match the CSS variables in globals.css
        return isDarkMode ? {
            background: '#0f172a', // slate-900
            gridCenter: '#94a3b8', // slate-400
            gridLine: '#1e293b',   // slate-800
            highlight: '#38bdf8',  // sky-400
            collision: '#ff4d4d'   // red-500
        } : {
            background: '#ffffff', // white
            gridCenter: '#64748b', // slate-500
            gridLine: '#e2e8f0',   // slate-200
            highlight: '#0284c7',  // sky-600
            collision: '#ef4444'   // red-500
        };
    }, [isDarkMode]);
}
