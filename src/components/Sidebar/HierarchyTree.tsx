'use client';

import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { useThemeColor } from '@/hooks/useThemeColor';
import { ChevronRight, ChevronDown, Box, Layers, LayoutGrid, Component } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { LayoutNode, ContainerNode, ItemNode, BayConfig, Shelf, Drawer } from '@/core/types';

const TreeNode = ({ node, depth = 0 }: { node: LayoutNode; depth?: number }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    const selectedBayId = useUIStore((state) => state.selectedBayId);
    const setSelectedBayId = useUIStore((state) => state.setSelectedBayId);
    const setPropertyPanelOpen = useUIStore((state) => state.setPropertyPanelOpen);
    const highlightedPartId = useUIStore((state) => state.highlightedPartId);
    const setHighlightedPartId = useUIStore((state) => state.setHighlightedPartId);

    const isSelected = node.type === 'item' && node.id === selectedBayId;

    // Check if this node or any of its children are highlighted
    const isNodeHighlighted = highlightedPartId === node.id; // For future use if bays have partIds

    const colors = useThemeColor();
    // Helper to convert hex (#RRGGBB) to rgba with alpha
    const hexToRgba = (hex: string | undefined, alpha = 1) => {
        if (!hex) return undefined;
        const s = hex.replace('#', '');
        if (s.length === 3) {
            const r = parseInt(s[0] + s[0], 16);
            const g = parseInt(s[1] + s[1], 16);
            const b = parseInt(s[2] + s[2], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        const r = parseInt(s.substring(0, 2), 16);
        const g = parseInt(s.substring(2, 4), 16);
        const b = parseInt(s.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const handleSelect = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (node.type === 'item') {
            setSelectedBayId(node.id);
            setPropertyPanelOpen(true);
        }
    };

    const getIcon = () => {
        switch (node.type) {
            case 'container': return <LayoutGrid size={14} className="text-chart-1" />;
            case 'item': return <Box size={14} className="text-chart-2" />;
            case 'divider': return <Component size={14} className="text-muted-foreground" />;
            default: return <Layers size={14} />;
        }
    };

    const getLabel = () => {
        switch (node.type) {
            case 'item': {
                const itemNode = node as ItemNode;
                const bayConfig = itemNode.config as BayConfig | undefined;
                return `Bay (${Math.round(Number(bayConfig?.width) || 0)}mm)`;
            }
            case 'container': return `Container (${(node as ContainerNode).orientation ?? 'unknown'})`;
            case 'divider': return 'Divider';
            default: return (node as LayoutNode).id;
        }
    };

    return (
        <div className="select-none">
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start h-7 px-2 text-xs font-normal mb-0.5",
                    isSelected ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
                    isNodeHighlighted && "text-highlight"
                )}
                style={{
                    paddingLeft: `${depth * 12 + 8}px`,
                    ...(isNodeHighlighted ? { backgroundColor: hexToRgba(colors.highlight, 0.09), color: colors.highlight } : {})
                }}
                onClick={handleSelect}
            >
                {node.type === 'container' && (node as ContainerNode).children.length > 0 ? (
                    <div
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="p-0.5 hover:bg-muted/50 rounded mr-1 cursor-pointer"
                    >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                ) : (node.type === 'item' ? (
                    <div
                        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                        className="p-0.5 hover:bg-muted/50 rounded mr-1 cursor-pointer"
                    >
                        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </div>
                ) : (
                    <span className="w-4 mr-1" />
                ))}
                {getIcon()}
                <span className="ml-2 truncate">{getLabel()}</span>
            </Button>

            {isOpen && node.type === 'container' && (
                <div>
                    {(node as ContainerNode).children.map((child: LayoutNode) => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} />
                    ))}
                </div>
            )}

            {/* Show Shelves/Drawers/Doors for Items */}
            {isOpen && node.type === 'item' && (
                <div className="flex flex-col">
                    {/* Door */}
                    {((node as ItemNode).config as BayConfig | undefined)?.door?.enabled && (
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start h-6 px-2 text-[10px] font-normal mb-0.5 text-muted-foreground hover:text-foreground",
                                highlightedPartId === `door-${node.id}` && "text-highlight"
                            )}
                            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px`, ...(highlightedPartId === `door-${node.id}` ? { backgroundColor: hexToRgba(colors.highlight, 0.09), color: colors.highlight } : {}) }}
                            onMouseEnter={() => setHighlightedPartId(`door-${node.id}`)}
                            onMouseLeave={() => setHighlightedPartId(null)}
                        >
                            <span className="w-4 mr-1" />
                            <Layers size={12} className="mr-2 opacity-70" />
                            Door
                        </Button>
                    )}

                    {/* Shelves */}
                    {(((node as ItemNode).config as BayConfig | undefined)?.shelves || []).map((shelf: Shelf) => (
                        <Button
                            key={shelf.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start h-6 px-2 text-[10px] font-normal mb-0.5 text-muted-foreground hover:text-foreground",
                                highlightedPartId === `shelf-${node.id}-${shelf.id}` && "text-highlight"
                            )}
                            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px`, ...(highlightedPartId === `shelf-${node.id}-${shelf.id}` ? { backgroundColor: hexToRgba(colors.highlight, 0.09), color: colors.highlight } : {}) }}
                            onMouseEnter={() => setHighlightedPartId(`shelf-${node.id}-${shelf.id}`)}
                            onMouseLeave={() => setHighlightedPartId(null)}
                        >
                            <span className="w-4 mr-1" />
                            <Layers size={12} className="mr-2 opacity-70" />
                            Shelf {Math.round(shelf.y)}mm
                        </Button>
                    ))}

                    {/* Drawers */}
                    {(((node as ItemNode).config as BayConfig | undefined)?.drawers || []).map((drawer: Drawer) => (
                        <Button
                            key={drawer.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start h-6 px-2 text-[10px] font-normal mb-0.5 text-muted-foreground hover:text-foreground",
                                highlightedPartId === `drawer-${node.id}-${drawer.id}` && "text-highlight"
                            )}
                            style={{ paddingLeft: `${(depth + 1) * 12 + 8}px`, ...(highlightedPartId === `drawer-${node.id}-${drawer.id}` ? { backgroundColor: hexToRgba(colors.highlight, 0.09), color: colors.highlight } : {}) }}
                            onMouseEnter={() => setHighlightedPartId(`drawer-${node.id}-${drawer.id}`)}
                            onMouseLeave={() => setHighlightedPartId(null)}
                        >
                            <span className="w-4 mr-1" />
                            <Layers size={12} className="mr-2 opacity-70" />
                            Drawer {Math.round(drawer.y)}mm
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
};

export function HierarchyTree() {
    const layout = useDesignStore((state: DesignState) => state.layout);
    const [parent] = useAutoAnimate<HTMLDivElement>();

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 section-header text-muted-foreground border-b border-border">
                Hierarchy
            </div>
            <ScrollArea className="flex-1 py-2">
                <div ref={parent}>
                    {layout.map((node) => (
                        <TreeNode key={node.id} node={node} />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
