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
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';

export function ContextToolbar() {
    // 1. 获取选中状态
    const selectedBayId = useUIStore((state) => state.selectedBayId);
    const height = useDesignStore((s) => s.height);

    // 2. 获取 Actions
    const splitItem = useDesignStore((s) => s.splitItem);
    const addShelf = useDesignStore((s) => s.addShelf);
    const addDrawer = useDesignStore((s) => s.addDrawer);
    const removeBay = useDesignStore((s) => s.removeBay);

    // 3. 查找当前选中的 Bay 对象 (用于判断是否存在)
    // 这里的逻辑简化为：只要有 selectedBayId，我们就显示工具栏
    if (!selectedBayId) return null;

    // 处理点击
    const handleSplit = (orientation: 'horizontal' | 'vertical') => {
        splitItem(selectedBayId, orientation);
    };

    const handleAddShelf = () => {
        // 默认添加在中间位置
        addShelf(selectedBayId, height / 2);
    };

    const handleAddDrawer = () => {
        // 默认位置
        addDrawer(selectedBayId, 200, 200);
    };

    const handleDelete = () => {
        removeBay(selectedBayId);
        useUIStore.getState().setSelectedBayId(null); // 取消选中
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 glass-panel rounded-full shadow-2xl animate-in slide-in-from-top-4 fade-in duration-200 z-40">
            <div className="px-3 section-header text-muted-foreground flex items-center gap-2 border-r border-border/50 mr-1">
                <MousePointerClick size={14} />
                <span>Selected Bay</span>
            </div>

            <ToolbarButton
                icon={SplitSquareHorizontal}
                label="Split Vert"
                onClick={() => handleSplit('horizontal')}
            />
            <ToolbarButton
                icon={SplitSquareVertical}
                label="Split Horiz"
                onClick={() => handleSplit('vertical')}
            />

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
                icon={Layers}
                label="Add Shelf"
                onClick={handleAddShelf}
            />
            <ToolbarButton
                icon={Box}
                label="Add Drawer"
                onClick={handleAddDrawer}
            />

            <div className="w-px h-4 bg-border mx-1" />

            <ToolbarButton
                icon={Trash2}
                label="Delete"
                variant="destructive"
                onClick={handleDelete}
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
