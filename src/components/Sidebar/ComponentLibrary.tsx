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
            className="flex flex-col items-center justify-center gap-2 p-3 bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-border rounded-lg transition-all group cursor-grab active:cursor-grabbing select-none"
        >
            <div className="p-2 bg-muted rounded-full text-muted-foreground group-hover:text-foreground group-hover:scale-110 transition-all">
                <Icon size={14} />
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
        <div className="flex flex-col border-t border-border bg-muted/50">
            <div className="p-2 section-header text-muted-foreground border-b border-border">
                Library (Drag & Drop)
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
                <DraggableItem type="bay_add" label="Add Bay" icon={LayoutGrid} />
                <DraggableItem type="shelf" label="Shelf" icon={Layers} />
                <DraggableItem type="drawer" label="Drawer" icon={Box} />
            </div>

            {draggedComponent && (
                <div className="px-3 pb-3 text-[10px] text-primary text-center animate-pulse">
                    Drag into the 3D view to place...
                </div>
            )}
        </div>
    );
}
