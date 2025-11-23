import React from 'react';
import { Html } from '@react-three/drei';
import {
    SplitSquareHorizontal,
    SplitSquareVertical,
    Layers,
    Box,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContextToolbarProps {
    position: [number, number, number];
    onSplitHorizontal: () => void;
    onSplitVertical: () => void;
    onAddShelf: () => void;
    onAddDrawer: () => void;
    onDelete: () => void;
}

export function ContextToolbar({
    position,
    onSplitHorizontal,
    onSplitVertical,
    onAddShelf,
    onAddDrawer,
    onDelete
}: ContextToolbarProps) {
    return (
        <Html position={position} center zIndexRange={[100, 0]}>
            <div
                className="flex items-center gap-1 p-1 bg-popover/90 backdrop-blur-md border border-border rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 select-none text-popover-foreground"
                onPointerDown={(e) => e.stopPropagation()} // Prevent click-through to scene
                onClick={(e) => e.stopPropagation()}
            >
                <ToolbarButton icon={SplitSquareHorizontal} onClick={onSplitHorizontal} tooltip="Split Horizontal" />
                <ToolbarButton icon={SplitSquareVertical} onClick={onSplitVertical} tooltip="Split Vertical" />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <ToolbarButton icon={Layers} onClick={onAddShelf} tooltip="Add Shelf" />
                <ToolbarButton icon={Box} onClick={onAddDrawer} tooltip="Add Drawer" />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton icon={Trash2} onClick={onDelete} tooltip="Delete Bay" variant="destructive" />
            </div>
        </Html>
    );
}

function ToolbarButton({ icon: Icon, onClick, tooltip, variant = 'default' }: { icon: React.ComponentType<any>, onClick: () => void, tooltip: string, variant?: 'default' | 'destructive' }) {
    const isDestructive = variant === 'destructive';
    return (
        <Button
            variant={isDestructive ? "destructive" : "ghost"}
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={!isDestructive ? "text-muted-foreground hover:text-foreground" : ""}
            title={tooltip}
        >
            <Icon size={16} />
        </Button>
    );
}
