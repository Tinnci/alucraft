'use client';

import React from 'react';
import { ChevronRight, ChevronDown, Box, Layers, LayoutGrid, Component } from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { LayoutNode, ContainerNode, ItemNode, DividerNode } from '@/core/types';

const TreeNode = ({ node, depth = 0 }: { node: LayoutNode; depth?: number }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const selectedBayId = useUIStore((state) => state.selectedBayId);
    const setSelectedBayId = useUIStore((state) => state.setSelectedBayId);
    const setPropertyPanelOpen = useUIStore((state) => state.setPropertyPanelOpen);

    const isSelected = node.type === 'item' && node.id === selectedBayId;

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'item') {
            setSelectedBayId(node.id);
            setPropertyPanelOpen(true);
        }
    };

    const getIcon = () => {
        switch (node.type) {
            case 'container': return <LayoutGrid size={14} className="text-blue-400" />;
            case 'item': return <Box size={14} className="text-emerald-400" />;
            case 'divider': return <Component size={14} className="text-gray-400" />;
            default: return <Layers size={14} />;
        }
    };

    const getLabel = () => {
        switch (node.type) {
            case 'item': return `Bay (${Math.round(Number(node.config.width) || 0)}mm)`;
            case 'container': return `Container (${node.orientation})`;
            case 'divider': return 'Divider';
            default: return (node as LayoutNode).id;
        }
    };

    return (
        <div className="select-none">
            <div
                className={`
          flex items-center gap-2 py-1 px-2 cursor-pointer transition-colors rounded
          ${isSelected ? 'bg-blue-600/30 text-blue-100' : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'}
        `}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleSelect}
            >
                {node.type === 'container' && (node as ContainerNode).children.length > 0 ? (
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="p-0.5 hover:bg-white/10 rounded"
                    >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                {getIcon()}
                <span className="text-xs truncate">{getLabel()}</span>
            </div>

            {isOpen && node.type === 'container' && (
                <div>
                    {(node as ContainerNode).children.map((child: LayoutNode) => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}

            {/* Show Shelves/Drawers for Items */}
            {isOpen && node.type === 'item' && (
                <div className="border-l border-white/10 ml-4">
                    {/* We could list shelves here, but keeping it simple for now */}
                </div>
            )}
        </div>
    );
};

export function HierarchyTree() {
    const layout = useDesignStore((state: DesignState) => state.layout);

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-white/10">
                Hierarchy
            </div>
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                {layout.map((node) => (
                    <TreeNode key={node.id} node={node} />
                ))}
            </div>
        </div>
    );
}
