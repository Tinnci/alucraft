'use client';

import React from 'react';
import {
    SplitSquareHorizontal,
    SplitSquareVertical,
    Layers,
    Box,
    Trash2,
    MousePointerClick
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContextToolbarProps {
    selectedBayId: string | null;
    onSplit: (orientation: 'horizontal' | 'vertical') => void;
    onAddShelf: () => void;
    onAddDrawer: () => void;
    onDelete: () => void;
}

export function ContextToolbar({ selectedBayId, onSplit, onAddShelf, onAddDrawer, onDelete }: ContextToolbarProps) {
    // 没有选中 Bay 时不显示工具栏
    if (!selectedBayId) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 glass-panel rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in duration-200 z-40">
            <div className="px-3 section-header text-muted-foreground flex items-center gap-2 border-r border-border/50 mr-1">
                <MousePointerClick size={14} />
                <span>Selected Bay</span>
            </div>

            <ToolbarButton
                icon={SplitSquareHorizontal}
                label="Split Vert"
                onClick={() => onSplit('horizontal')}
            />
            <ToolbarButton
                icon={SplitSquareVertical}
                label="Split Horiz"
                onClick={() => onSplit('vertical')}
            />

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
                icon={Layers}
                label="Add Shelf"
                onClick={onAddShelf}
            />
            <ToolbarButton
                icon={Box}
                label="Add Drawer"
                onClick={onAddDrawer}
            />

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
                icon={Trash2}
                label="Delete"
                variant="destructive"
                onClick={onDelete}
            />
        </div>
    );
}

interface ToolbarButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}

function ToolbarButton({ icon: Icon, label, onClick, variant = 'default' }: ToolbarButtonProps) {
    const isDestructive = variant === 'destructive';
    return (
        <Button
            variant={isDestructive ? "ghost" : "ghost"}
            size="sm"
            onClick={onClick}
            className={`
                h-8 px-2 text-xs gap-1.5
                ${isDestructive
                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"}
            `}
            title={label}
        >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
        </Button>
    );
}
