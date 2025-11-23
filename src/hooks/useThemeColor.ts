import { useMemo } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

export interface ThemeColors {
    background: string;
    gridCenter: string;
    gridLine: string;
    highlight: string;
    collision: string;
    success: string;
}

export function useThemeColor(): ThemeColors {
    const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);

    return useMemo<ThemeColors>(() => {
        // Try reading colors from CSS variables to keep CSS/3D colors in sync
        if (typeof window !== 'undefined' && typeof getComputedStyle === 'function') {
            const style = getComputedStyle(document.documentElement);
            const str = (v?: string) => (v ? v.trim() : undefined);
            const background = str(style.getPropertyValue('--background')) || (isDarkMode ? '#0f172a' : '#ffffff');
            const gridCenter = str(style.getPropertyValue('--grid-center')) || (isDarkMode ? '#94a3b8' : '#64748b');
            const gridLine = str(style.getPropertyValue('--grid-line')) || (isDarkMode ? '#1e293b' : '#e2e8f0');
            const highlight = str(style.getPropertyValue('--highlight')) || (isDarkMode ? '#38bdf8' : '#0284c7');
            const collision = str(style.getPropertyValue('--destructive')) || str(style.getPropertyValue('--collision')) || (isDarkMode ? '#ff4d4d' : '#ef4444');
            const success = str(style.getPropertyValue('--success')) || '#22c55e';

            return { background: background!, gridCenter: gridCenter!, gridLine: gridLine!, highlight: highlight!, collision: collision!, success };
        }

        // Fallbacks in environments where window is not available
        return isDarkMode ? {
            background: '#0f172a', // slate-900
            gridCenter: '#94a3b8', // slate-400
            gridLine: '#1e293b',   // slate-800
            highlight: '#38bdf8',  // sky-400
            collision: '#ff4d4d',   // red-500
            success: '#22c55e'
        } : {
            background: '#ffffff', // white
            gridCenter: '#64748b', // slate-500
            gridLine: '#e2e8f0',   // slate-200
            highlight: '#0284c7',  // sky-600
            collision: '#ef4444',   // red-500
            success: '#22c55e'
        };
    }, [isDarkMode]);
}
