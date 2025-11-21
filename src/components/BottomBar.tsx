'use client';

import React, { useMemo } from 'react';
import { Plus, LayoutGrid, Box } from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { LayoutBay } from '@/core/types';
import useUIStore from '@/store/useUIStore';

/**
 * BottomBar - 底部操作栏
 * 用于常用操作：添加隔间、显示内部结构等
 */
export function BottomBar() {
  const layout = useDesignStore((state: DesignState) => state.layout);
  const height = useDesignStore((state: DesignState) => state.height);
  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);

  // Setters
  const addBay = useDesignStore((state: DesignState) => state.addBay);
  const addShelf = useDesignStore((state: DesignState) => state.addShelf);
  const addDrawer = useDesignStore((state: DesignState) => state.addDrawer);

  // UI Store
  const selectedBayId = useUIStore((state) => state.selectedBayId);
  const setSelectedBayId = useUIStore((state) => state.setSelectedBayId);
  const setPropertyPanelOpen = useUIStore((state) => state.setPropertyPanelOpen);
  const isBOMPanelOpen = useUIStore((state) => state.isBOMPanelOpen);
  const setBOMPanelOpen = useUIStore((state) => state.setBOMPanelOpen);

  // Derived State
  const bays = useMemo(() => layout.filter((n) => n.type === 'bay') as LayoutBay[], [layout]);
  const activeBayId = useMemo(() => {
    if (selectedBayId && bays.some((b) => b.id === selectedBayId)) {
      return selectedBayId;
    }
    return bays[0]?.id ?? null;
  }, [selectedBayId, bays]);

  return (
    <div
      className={`
        w-full
        bg-slate-900/50 backdrop-blur-md glass-shine
        border-t border-white/10 shadow-lg
        transition-all duration-300
        ${isDarkMode ? 'dark' : ''}
      `}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Layout Management */}
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Layout</span>

          <div className="flex gap-1 overflow-x-auto max-w-xs">
            {bays.map((bay, index) => (
              <button
                key={bay.id}
                onClick={() => {
                  setSelectedBayId(bay.id);
                  setPropertyPanelOpen(true);
                }}
                className={`flex-shrink-0 px-2 py-1 rounded border text-xs font-medium transition-all whitespace-nowrap ${activeBayId === bay.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-muted/80'
                  }`}
              >
                Bay {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => addBay()}
            className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 rounded text-xs transition-colors"
            title="Add Bay"
          >
            <Plus size={12} /> Bay
          </button>
        </div>

        {/* Internal Structure Management */}
        <div className="flex items-center gap-2">
          <Box size={16} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add To Bay</span>

          <button
            onClick={() => {
              if (activeBayId) {
                addShelf(activeBayId, height / 2);
              }
            }}
            disabled={!activeBayId}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${activeBayId
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                : 'bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed'
              }`}
            title="Add Shelf"
          >
            <Plus size={12} /> Shelf
          </button>

          <button
            onClick={() => {
              if (activeBayId) {
                addDrawer(activeBayId, height / 3, 200);
              }
            }}
            disabled={!activeBayId}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${activeBayId
                ? 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border border-purple-500/20'
                : 'bg-muted text-muted-foreground border-transparent opacity-50 cursor-not-allowed'
              }`}
            title="Add Drawer"
          >
            <Plus size={12} /> Drawer
          </button>
        </div>

        {/* BOM Panel Toggle */}
        <button
          onClick={() => setBOMPanelOpen(!isBOMPanelOpen)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isBOMPanelOpen
              ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-transparent'
            }`}
        >
          📋 BOM
        </button>
      </div>
    </div>
  );
}
