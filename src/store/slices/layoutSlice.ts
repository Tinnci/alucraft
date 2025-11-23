import { StateCreator } from 'zustand';
import { DesignState } from '../useDesignStore';
import {
    LayoutNode,
    LayoutBay,
    LayoutDivider,
    Shelf,
    Drawer,
    BayDoorConfig,
    ContainerNode,
    isBayNode,
    PROFILES
} from '@/core/types';
import { uid, createDefaultDoorConfig, getDoorSides, getDoorStateKey } from '@/core/utils';
import computeLayoutSizes, { moveDividerInLayout } from '@/core/layout-utils';

export interface LayoutSlice {
    layout: LayoutNode[];

    addBay: () => void;
    removeBay: (id: string) => void;
    resizeBay: (id: string, width: number | 'auto') => void;
    splitItem: (itemId: string, orientation: 'horizontal' | 'vertical') => void;
    moveDivider: (dividerId: string, delta: number) => void;

    // Content Actions
    setBayDoorConfig: (bayId: string, config: Partial<BayDoorConfig>) => void;
    addShelf: (bayId: string, y: number) => void;
    removeShelf: (bayId: string, id: string) => void;
    updateShelf: (bayId: string, id: string, y: number) => void;
    duplicateShelf: (bayId: string, id: string) => void;
    addDrawer: (bayId: string, y: number, height: number) => void;
    removeDrawer: (bayId: string, id: string) => void;
    updateDrawer: (bayId: string, id: string, y: number, height: number) => void;
    duplicateDrawer: (bayId: string, id: string) => void;
}

export const createLayoutSlice: StateCreator<DesignState, [], [], LayoutSlice> = (set, _get) => {
    void _get; // `_get` is deliberately unused here but kept for signature compatibility
    return ({
    layout: [
        // Initial State
        { type: 'item', contentType: 'generic_bay', id: 'bay-initial', config: { width: 560, shelves: [], drawers: [], door: createDefaultDoorConfig() } } as LayoutBay
    ],

    addBay: () => set((state) => {
        const profileSize = PROFILES[state.profileType].size;
        const newBayWidth = 400; // Default new bay width
        const dividerWidth = profileSize;

        const newBay: LayoutBay = {
            type: 'item',
            id: uid(),
            contentType: 'generic_bay',
            config: { width: newBayWidth, shelves: [], drawers: [], door: createDefaultDoorConfig() }
        } as LayoutBay;
        const newDivider: LayoutDivider = {
            type: 'divider',
            id: uid(),
            thickness: dividerWidth
        } as LayoutDivider;

        const newDoorStates = { ...state.doorStates };
        if (newBay.config.door) {
            getDoorSides(newBay.config.door).map((side) => getDoorStateKey(newBay.id, side)).forEach((key: string) => {
                newDoorStates[key] = state.isDoorOpen;
            });
        }

        return {
            layout: [...state.layout, newDivider, newBay],
            width: state.width + dividerWidth + newBayWidth,
            doorStates: newDoorStates
        };
    }),

    removeBay: (id: string) => set((state) => {
        const index = state.layout.findIndex(n => n.id === id);
        if (index === -1) return {};

        const bayCount = state.layout.filter(n => isBayNode(n)).length;
        if (bayCount <= 1) return {};

        const newLayout = [...state.layout];
        let widthReduction = 0;

        const node = newLayout[index] as LayoutBay;
        const nodeWidth = node.config?.width;
        widthReduction += (typeof nodeWidth === 'number' ? nodeWidth : 0);

        if (index > 0 && newLayout[index - 1].type === 'divider') {
            widthReduction += (newLayout[index - 1] as LayoutDivider).thickness;
            newLayout.splice(index - 1, 2);
        } else if (index < newLayout.length - 1 && newLayout[index + 1].type === 'divider') {
            widthReduction += (newLayout[index + 1] as LayoutDivider).thickness;
            newLayout.splice(index, 2);
        } else {
            newLayout.splice(index, 1);
        }

        const doorPrefix = `${id}:`;
        const newDoorStatesEntries = Object.entries(state.doorStates).filter(([key]) => !key.startsWith(doorPrefix));

        return {
            layout: newLayout,
            width: state.width - widthReduction,
            doorStates: Object.fromEntries(newDoorStatesEntries)
        };
    }),

    resizeBay: (id: string, width: number | 'auto') => set((state) => {
        const newLayout = state.layout.map(node => {
            if (node.id === id && isBayNode(node)) {
                const newConfig = { ...node.config, width };
                return { ...node, config: newConfig } as LayoutBay;
            }
            return node;
        });
        const newTotalWidth = newLayout.reduce((acc, node) => {
            if (node.type === 'item') return acc + (typeof node.config?.width === 'number' ? (node.config?.width ?? 0) : 0);
            if (node.type === 'divider') return acc + (node.thickness ?? 0);
            return acc;
        }, 0) + (PROFILES[state.profileType].size * 2);
        return { layout: newLayout, width: newTotalWidth };
    }),

    splitItem: (itemId: string, orientation: 'horizontal' | 'vertical') => set((state) => {
        let newBayId: string | null = null;
        // Helper to recursively find and replace the target node
        // compute sizes once for the current layout (top-level inner width)
        const s = PROFILES[state.profileType].size;
        const inner = Math.max(0, state.width - (s * 2));
        const topSizes = computeLayoutSizes(state.layout, inner, 'horizontal', new Map<string, number>());

        const replaceNode = (nodes: LayoutNode[]): LayoutNode[] => {
            return nodes.map((n) => {
                if (n.id === itemId && n.type === 'item') {
                    const orig = n as LayoutBay;
                    const dividerThickness = PROFILES[state.profileType].size;
                    let origWidth = topSizes.get(orig.id) ?? (typeof orig.config?.width === 'number' ? orig.config.width : 0);
                    if (typeof origWidth !== 'number') origWidth = 0;
                    const firstWidth = Math.floor((origWidth - dividerThickness) / 2);
                    const secondWidth = origWidth - dividerThickness - firstWidth;

                    const firstBay: LayoutBay = { ...orig, id: orig.id, config: { ...orig.config, width: firstWidth } } as LayoutBay;
                    const secondId = uid();
                    newBayId = secondId;
                    const secondBay: LayoutBay = { ...orig, id: secondId, config: { ...orig.config, width: secondWidth } } as LayoutBay;
                    const newDivider: LayoutDivider = { type: 'divider', id: uid(), thickness: dividerThickness };

                    const containerNode = {
                        type: 'container',
                        id: uid(),
                        orientation: orientation === 'horizontal' ? 'horizontal' : 'vertical',
                        children: [firstBay, newDivider, secondBay]
                    } as ContainerNode;
                    return containerNode;
                }
                if (n.type === 'container') {
                    return { ...n, children: replaceNode(n.children) } as ContainerNode;
                }
                return n;
            });
        };

        const newLayout = replaceNode(state.layout);

        const newDoorStates = { ...state.doorStates };
        // Add door state for the new second bay if applicable (first bay keeps original id/state)
        if (newBayId) {
            // Find the newly inserted second bay within the new layout
            const newBay = (function find(nodes: LayoutNode[]): LayoutBay | undefined {
                for (const n of nodes) {
                    if (n.type === 'item' && n.id === newBayId) return n as LayoutBay;
                    if (n.type === 'container') {
                        const found = find(n.children);
                        if (found) return found;
                    }
                }
                return undefined;
            })(newLayout);

            if (newBay && newBay.config?.door) {
                getDoorSides(newBay.config.door).forEach((side) => {
                    newDoorStates[getDoorStateKey(newBay.id, side)] = state.isDoorOpen;
                });
            }
        }

        return { layout: newLayout, doorStates: newDoorStates };
    }),

    moveDivider: (dividerId: string, delta: number) => set((state) => {
        const s = PROFILES[state.profileType].size;
        const result = moveDividerInLayout(state.layout, dividerId, delta, s, state.width);
        if (!result.success) return {};

        const updatedLayout = result.layout;
        // compute new total width
        const newTotalWidth = updatedLayout.reduce((acc: number, node: LayoutNode) => {
            if (node.type === 'item') return acc + (typeof (node as LayoutBay).config?.width === 'number' ? (node as LayoutBay).config?.width as number : 0);
            if (node.type === 'divider') return acc + ((node as LayoutDivider).thickness ?? 0);
            if (node.type === 'container') return acc + (typeof (node as ContainerNode).size === 'number' ? (node as ContainerNode).size as number : 0);
            return acc;
        }, 0) + (PROFILES[state.profileType].size * 2);

        return { layout: updatedLayout, width: newTotalWidth };
    }),

    setBayDoorConfig: (bayId, config) => set((state) => {
        let targetDoor: BayDoorConfig | undefined;
        const newLayout = state.layout.map((node) => {
            if (isBayNode(node) && node.id === bayId) {
                const base = node.config?.door ?? createDefaultDoorConfig();
                const newDoorConfig = { ...base, ...config };
                targetDoor = newDoorConfig;
                return { ...node, config: { ...node.config, door: newDoorConfig } } as LayoutBay;
            }
            return node;
        });

        if (!targetDoor) {
            return {};
        }

        const newDoorStates = { ...state.doorStates };
        const allowedKeys = getDoorSides(targetDoor).map((side) => getDoorStateKey(bayId, side));
        Object.keys(newDoorStates).forEach((key) => {
            if (key.startsWith(`${bayId}:`) && !allowedKeys.includes(key)) {
                delete newDoorStates[key];
            }
        });
        allowedKeys.forEach((key) => {
            if (!(key in newDoorStates)) {
                newDoorStates[key] = state.isDoorOpen;
            }
        });

        return { layout: newLayout, doorStates: newDoorStates };
    }),

    addShelf: (bayId: string, y: number) => set((state) => ({
        layout: state.layout.map(node => {
            if (node.id === bayId && isBayNode(node)) {
                const shelves = [...(node.config.shelves ?? [] as Shelf[]), { id: uid(), y }];
                return { ...node, config: { ...node.config, shelves } } as LayoutBay;
            }
            return node;
        })
    })),

    removeShelf: (bayId: string, id: string) => set((state) => ({
        layout: state.layout.map(node => {
            if (node.id === bayId && isBayNode(node)) {
                const shelves = (node.config.shelves ?? []).filter((s: Shelf) => s.id !== id);
                return { ...node, config: { ...node.config, shelves } } as LayoutBay;
            }
            return node;
        })
    })),

    updateShelf: (bayId: string, id: string, y: number) => set((state) => ({
        layout: state.layout.map(node => {
            if (node.id === bayId && isBayNode(node)) {
                const shelves = (node.config.shelves ?? []).map((s: Shelf) => s.id === id ? { ...s, y } : s);
                return { ...node, config: { ...node.config, shelves } } as LayoutBay;
            }
            return node;
        })
    })),

    duplicateShelf: (bayId: string, id: string) => set((state) => {
        const bay = state.layout.find(n => n.id === bayId && isBayNode(n)) as LayoutBay | undefined;
        if (!bay) return {};
        const shelf = (bay.config.shelves ?? []).find((s: Shelf) => s.id === id);
        if (!shelf) return {};

        return {
            layout: state.layout.map(node => {
                if (node.id === bayId && isBayNode(node)) {
                    const shelves = [...(node.config.shelves ?? [] as Shelf[]), { id: uid(), y: shelf.y + 50 }];
                    return { ...node, config: { ...node.config, shelves } } as LayoutBay;
                }
                return node;
            })
        };
    }),

    addDrawer: (bayId: string, y: number, height: number) => set((state) => ({
        layout: state.layout.map(node => {
            if (node.id === bayId && isBayNode(node)) {
                const drawers = [...(node.config.drawers ?? []), { id: uid(), y, height }];
                return { ...node, config: { ...node.config, drawers } } as LayoutBay;
            }
            return node;
        })
    })),

    removeDrawer: (bayId: string, id: string) => set((state) => ({
        layout: state.layout.map(node => {
            if (node.id === bayId && isBayNode(node)) {
                const drawers = (node.config.drawers ?? []).filter((d: Drawer) => d.id !== id);
                return { ...node, config: { ...node.config, drawers } } as LayoutBay;
            }
            return node;
        })
    })),

    updateDrawer: (bayId: string, id: string, y: number, height: number) => set((state) => ({
        layout: state.layout.map(node => {
            if (node.id === bayId && isBayNode(node)) {
                const drawers = (node.config.drawers ?? []).map((d: Drawer) => d.id === id ? { ...d, y, height } : d);
                return { ...node, config: { ...node.config, drawers } } as LayoutBay;
            }
            return node;
        })
    })),

    duplicateDrawer: (bayId: string, id: string) => set((state) => {
        const bay = state.layout.find(n => n.id === bayId && isBayNode(n)) as LayoutBay | undefined;
        if (!bay) return {};
        const drawer = (bay.config.drawers ?? []).find((d: Drawer) => d.id === id);
        if (!drawer) return {};

        const newDrawer: Drawer = {
            id: uid(),
            y: drawer.y + drawer.height + 10, // Place new drawer above with a 10mm gap
            height: drawer.height
        };

        // Prevent new drawer from going out of bounds
        if (newDrawer.y + newDrawer.height > state.height) {
            newDrawer.y = drawer.y - drawer.height - 10;
        }

        return {
            layout: state.layout.map(node => {
                if (node.id === bayId && isBayNode(node)) {
                    const drawers = [...(node.config.drawers ?? []), newDrawer];
                    return { ...node, config: { ...node.config, drawers } } as LayoutBay;
                }
                return node;
            })
        };
    }),
    });
