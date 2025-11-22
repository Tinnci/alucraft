'use client';

import React, { useMemo } from 'react';
import { Plus, Box, Layers, LayoutGrid } from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { findBays } from '@/core/types';

export function ComponentLibrary() {
    const layout = useDesignStore((state: DesignState) => state.layout);
    const height = useDesignStore((state: DesignState) => state.height);

    // Actions
    const addBay = useDesignStore((state: DesignState) => state.addBay);
    const addShelf = useDesignStore((state: DesignState) => state.addShelf);
    const addDrawer = useDesignStore((state: DesignState) => state.addDrawer);

    // UI State
    const selectedBayId = useUIStore((state) => state.selectedBayId);

    // Derived
    const bays = useMemo(() => findBays(layout), [layout]);
    const activeBayId = useMemo(() => {
        if (selectedBayId && bays.some((b) => b.id === selectedBayId)) {
            return selectedBayId;
        }
        return bays[0]?.id ?? null;
    }, [selectedBayId, bays]);

    return (
        <div className="flex flex-col border-t border-white/10 bg-black/20">
            <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10">
                Library
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
                <button
                    onClick={() => addBay()}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all group"
                >
                    <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-all">
                        <LayoutGrid size={18} />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">Add Bay</span>
                </button>

                <button
                    onClick={() => activeBayId && addShelf(activeBayId, height / 2)}
                    disabled={!activeBayId}
                    className={`
            flex flex-col items-center justify-center gap-2 p-3 border rounded-lg transition-all group
            ${activeBayId
                            ? 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20 cursor-pointer'
                            : 'bg-white/0 border-transparent opacity-30 cursor-not-allowed'}
          `}
                >
                    <div className="p-2 bg-emerald-500/20 rounded-full text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all">
                        <Layers size={18} />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">Add Shelf</span>
                </button>

                <button
                    onClick={() => activeBayId && addDrawer(activeBayId, height / 3, 200)}
                    disabled={!activeBayId}
                    className={`
            flex flex-col items-center justify-center gap-2 p-3 border rounded-lg transition-all group
            ${activeBayId
                            ? 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20 cursor-pointer'
                            : 'bg-white/0 border-transparent opacity-30 cursor-not-allowed'}
          `}
                >
                    <div className="p-2 bg-purple-500/20 rounded-full text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-all">
                        <Box size={18} />
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">Add Drawer</span>
                </button>
            </div>
            {!activeBayId && (
                <div className="px-3 pb-3 text-[10px] text-muted-foreground text-center">
                    Select a Bay to add internal components
                </div>
            )}
        </div>
    );
}
