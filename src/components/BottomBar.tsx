'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
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
        bg-background/80 backdrop-blur-md
        border-t border-border shadow-lg
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
          <Button
            variant={showWireframe ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setShowWireframe(!showWireframe)}
            className={`gap-1.5 text-xs font-medium ${showWireframe ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground"}`}
            title="Toggle Wireframe"
          >
            {showWireframe ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>Wireframe</span>
          </Button>

          <div className="w-px h-4 bg-border mx-1" />

          <Button
            variant={isBOMPanelOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setBOMPanelOpen(!isBOMPanelOpen)}
            className={`gap-1.5 text-xs font-medium ${isBOMPanelOpen ? "text-primary bg-primary/10 border-primary/20" : "text-muted-foreground"}`}
          >
            <FileText size={14} />
            <span>BOM</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
