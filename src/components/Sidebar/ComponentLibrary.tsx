'use client';

import React, { useEffect } from 'react';
import { Plus, Box, Layers, LayoutGrid } from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore, { DraggableComponentType } from '@/store/useUIStore';

// Helper component for draggable items
const DraggableItem = ({
    type,
    label,
    icon: Icon
}: {
    type: DraggableComponentType | 'bay_add',
    label: string,
    icon: React.ComponentType<any>
}) => {
    const setDraggedComponent = useUIStore((state) => state.setDraggedComponent);
    const addBay = useDesignStore((state: DesignState) => state.addBay);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (type === 'bay_add') {
            addBay();
            return;
        }
        // Start global drag mode
        e.preventDefault(); // Prevent text selection
        setDraggedComponent(type as DraggableComponentType);
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-lg transition-all group cursor-grab active:cursor-grabbing select-none"
        >
            <div className="p-2 bg-slate-700/50 rounded-full text-slate-300 group-hover:text-white group-hover:scale-110 transition-all">
                <Icon size={18} />
            </div>
            <span className="text-xs text-muted-foreground group-hover:text-foreground">{label}</span>
        </div>
    );
};

export function ComponentLibrary() {
    const setDraggedComponent = useUIStore((state) => state.setDraggedComponent);
    const draggedComponent = useUIStore((state) => state.draggedComponent);

    // Global pointer up listener to cancel drag if dropped nowhere
    useEffect(() => {
        const handleGlobalUp = () => {
            if (draggedComponent) {
                setDraggedComponent(null);
            }
        };
        window.addEventListener('pointerup', handleGlobalUp);
        return () => window.removeEventListener('pointerup', handleGlobalUp);
    }, [draggedComponent, setDraggedComponent]);

    return (
        <div className="flex flex-col border-t border-white/10 bg-black/20">
            <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10">
                Library (Drag & Drop)
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
                <DraggableItem type="bay_add" label="Add Bay" icon={LayoutGrid} />
                <DraggableItem type="shelf" label="Shelf" icon={Layers} />
                <DraggableItem type="drawer" label="Drawer" icon={Box} />
            </div>

            {draggedComponent && (
                <div className="px-3 pb-3 text-[10px] text-blue-400 text-center animate-pulse">
                    Drag into the 3D view to place...
                </div>
            )}
        </div>
    );
}
