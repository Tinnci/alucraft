'use client';

import React from 'react';
import { Layers, Eye, EyeOff, FileText } from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';

/**
 * BottomBar - 底部状态栏
 * 显示全局信息和视图切换
 */
export function BottomBar() {
  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);
  const width = useDesignStore((state: DesignState) => state.width);
  const height = useDesignStore((state: DesignState) => state.height);
  const depth = useDesignStore((state: DesignState) => state.depth);
  const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);
  const setShowWireframe = useDesignStore((state: DesignState) => state.setShowWireframe);

  // UI Store
  const isBOMPanelOpen = useUIStore((state) => state.isBOMPanelOpen);
  const setBOMPanelOpen = useUIStore((state) => state.setBOMPanelOpen);

  return (
    <div
      className={`
        w-full
        bg-slate-900/80 backdrop-blur-md
        border-t border-white/10 shadow-lg
        transition-all duration-300
        ${isDarkMode ? 'dark' : ''}
      `}
    >
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        {/* Left: Global Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers size={14} />
            <span>{width} x {height} x {depth} mm</span>
          </div>
        </div>

        {/* Right: Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWireframe(!showWireframe)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${showWireframe
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            title="Toggle Wireframe"
          >
            {showWireframe ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>Wireframe</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-1" />

          <button
            onClick={() => setBOMPanelOpen(!isBOMPanelOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isBOMPanelOpen
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
          >
            <FileText size={14} />
            <span>BOM</span>
          </button>
        </div>
      </div>
    </div>
  );
}
