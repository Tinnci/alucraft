'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  ProfileType,
  PROFILES,
  SimulationResult,
  BOMItem,
  ConnectorType,
  Drawer,
  HingeSide,
  BayDoorConfig,
  LayoutBay,
  LayoutDivider,
  LayoutNode,
  MaterialType
} from '@/core/types';
import { calculateBOM } from '@/core/bom-calculator';
import { nanoid } from 'nanoid';

// Helper function to generate unique IDs
const uid = (len = 8) => nanoid(len);

export const createDefaultDoorConfig = (): BayDoorConfig => ({
  enabled: true,
  type: 'single',
  hingeSide: 'left'
});

export const getDoorStateKey = (bayId: string, side: HingeSide) => `${bayId}:${side}`;

export const getDoorSides = (door?: BayDoorConfig): HingeSide[] => {
  if (!door || !door.enabled) return [];
  return door.type === 'double' ? ['left', 'right'] : [door.hingeSide];
};
export interface DesignState {
  profileType: ProfileType;
  overlay: number;
  result: SimulationResult | null;
  width: number; // Total width (calculated or fixed)
  height: number;
  depth: number;
  layout: LayoutNode[]; // New layout structure
  hasLeftWall: boolean;
  hasRightWall: boolean;
  hasLeftPanel: boolean;
  hasRightPanel: boolean;
  hasBackPanel: boolean;
  hasTopPanel: boolean;
  hasBottomPanel: boolean;
  isDoorOpen: boolean;
  connectorType: ConnectorType;
  showDimensions: boolean;
  showWireframe: boolean;
  showSnapGuides: boolean;
  cameraResetTrigger: number;
  isDarkMode: boolean;
  material: MaterialType;
  panelThickness: number;
  tolerance: number;
  drawerStyle: 'inset' | 'overlay';
  doorStates: Record<string, boolean>;

  setProfileType: (p: ProfileType) => void;
  setOverlay: (v: number) => void;
  setResult: (r: SimulationResult | null) => void;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setDepth: (v: number) => void;
  setHasLeftWall: (v: boolean) => void;
  setHasRightWall: (v: boolean) => void;
  setHasLeftPanel: (v: boolean) => void;
  setHasRightPanel: (v: boolean) => void;
  setHasBackPanel: (v: boolean) => void;
  setHasTopPanel: (v: boolean) => void;
  setHasBottomPanel: (v: boolean) => void;
  setIsDoorOpen: (v: boolean) => void;
  setConnectorType: (v: ConnectorType) => void;
  setShowDimensions: (v: boolean) => void;
  setShowWireframe: (v: boolean) => void;
  setShowSnapGuides: (v: boolean) => void;
  triggerCameraReset: () => void;
  toggleTheme: () => void;
  setMaterial: (material: MaterialType) => void;
  setPanelThickness: (mm: number) => void;
  setTolerance: (mm: number) => void;
  setDrawerStyle: (style: 'inset' | 'overlay') => void;
  setDoorState: (doorId: string, isOpen: boolean) => void;
  toggleDoorState: (doorId: string) => void;
  setBayDoorConfig: (bayId: string, config: Partial<BayDoorConfig>) => void;

  // Layout Actions
  addBay: () => void;
  removeBay: (id: string) => void;
  resizeBay: (id: string, width: number) => void;

  // Shelf/Drawer Actions (Updated to require bayId)
  addShelf: (bayId: string, y: number) => void;
  removeShelf: (bayId: string, id: string) => void;
  updateShelf: (bayId: string, id: string, y: number) => void;
  duplicateShelf: (bayId: string, id: string) => void;
  addDrawer: (bayId: string, y: number, height: number) => void;
  removeDrawer: (bayId: string, id: string) => void;
  updateDrawer: (bayId: string, id: string, y: number, height: number) => void;
  duplicateDrawer: (bayId: string, id: string) => void;

  getDerived: () => { innerWidth: number; doorWidth: number };
  getCollisions: () => { left: boolean; right: boolean };
  checkDrawerCollision: (bayId: string, drawer: Drawer) => boolean;
  getBOM: () => BOMItem[];
}

export const useDesignStore = create<DesignState>()(temporal((set, get) => ({
  profileType: '2020',
  overlay: 14,
  result: null,
  width: 600,
  height: 800,
  depth: 400,
  // Initial Layout: One Bay
  layout: [
    { type: 'bay', id: 'bay-initial', width: 560, shelves: [], drawers: [], door: createDefaultDoorConfig() } // 600 - 40 (20*2)
  ],
  hasLeftWall: false,
  hasRightWall: false,
  hasLeftPanel: false,
  hasRightPanel: false,
  hasBackPanel: false,
  hasTopPanel: false,
  hasBottomPanel: false,
  isDoorOpen: false,
  connectorType: 'angle_bracket' as ConnectorType,
  showDimensions: true,
  showWireframe: false,
  showSnapGuides: true,
  cameraResetTrigger: 0,
  isDarkMode: true,
  material: 'silver',
  panelThickness: 18,
  tolerance: 1,
  drawerStyle: 'inset',
  doorStates: {},

  setProfileType: (p: ProfileType) => set({ profileType: p }),
  setOverlay: (v: number) => set({ overlay: v }),
  setResult: (r: SimulationResult | null) => set({ result: r }),
  setWidth: (v: number) => set((state) => {
    // When total width changes, resize the first bay (simplified logic for now)
    const diff = v - state.width;
    const newLayout = [...state.layout];
    const firstBay = newLayout.find(n => n.type === 'bay') as LayoutBay;
    if (firstBay) {
      firstBay.width += diff;
    }
    return { width: v, layout: newLayout };
  }),
  setHeight: (v: number) => set({ height: v }),
  setDepth: (v: number) => set({ depth: v }),
  setHasLeftWall: (v: boolean) => set({ hasLeftWall: v }),
  setHasRightWall: (v: boolean) => set({ hasRightWall: v }),
  setHasLeftPanel: (v: boolean) => set({ hasLeftPanel: v }),
  setHasRightPanel: (v: boolean) => set({ hasRightPanel: v }),
  setHasBackPanel: (v: boolean) => set({ hasBackPanel: v }),
  setHasTopPanel: (v: boolean) => set({ hasTopPanel: v }),
  setHasBottomPanel: (v: boolean) => set({ hasBottomPanel: v }),
  setIsDoorOpen: (v: boolean) => set((state) => {
    const nextDoorStates = { ...state.doorStates };
    state.layout.forEach((node) => {
      if (node.type !== 'bay') return;
      const doorConfig = node.door ?? createDefaultDoorConfig();
      getDoorSides(doorConfig).forEach((side) => {
        nextDoorStates[getDoorStateKey(node.id, side)] = v;
      });
    });
    return { isDoorOpen: v, doorStates: nextDoorStates };
  }),
  setConnectorType: (v: ConnectorType) => set({ connectorType: v }),
  setShowDimensions: (v: boolean) => set({ showDimensions: v }),
  setShowWireframe: (v: boolean) => set({ showWireframe: v }),
  setShowSnapGuides: (v: boolean) => set({ showSnapGuides: v }),
  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setMaterial: (material) => set({ material }),
  setPanelThickness: (mm) => set({ panelThickness: mm }),
  setTolerance: (mm) => set({ tolerance: mm }),
  setDrawerStyle: (style) => set({ drawerStyle: style }),
  setDoorState: (doorId, isOpen) => set((state) => ({ doorStates: { ...state.doorStates, [doorId]: isOpen } })),
  toggleDoorState: (doorId) => set((state) => ({ doorStates: { ...state.doorStates, [doorId]: !state.doorStates[doorId] } })),
  setBayDoorConfig: (bayId, config) => set((state) => {
    let targetDoor: BayDoorConfig | undefined;
    const newLayout = state.layout.map((node) => {
      if (node.type === 'bay' && node.id === bayId) {
        const base = node.door ?? createDefaultDoorConfig();
        const newDoorConfig = { ...base, ...config };
        targetDoor = newDoorConfig;
        return { ...node, door: newDoorConfig };
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

  // --- Layout Actions ---
  addBay: () => set((state) => {
    const profileSize = PROFILES[state.profileType].size;
    const newBayWidth = 400; // Default new bay width
    const dividerWidth = profileSize;

    const newBay: LayoutBay = {
      type: 'bay',
      id: uid(),
      width: newBayWidth,
      shelves: [],
      drawers: [],
      door: createDefaultDoorConfig()
    };
    const newDivider: LayoutDivider = {
      type: 'divider',
      id: uid(),
      width: dividerWidth
    };

    const newDoorStates = { ...state.doorStates };
    getDoorSides(newBay.door).map((side) => getDoorStateKey(newBay.id, side)).forEach((key: string) => {
      newDoorStates[key] = state.isDoorOpen;
    });

    return {
      layout: [...state.layout, newDivider, newBay],
      width: state.width + dividerWidth + newBayWidth,
      doorStates: newDoorStates
    };
  }),
  removeBay: (id: string) => set((state) => {
    const index = state.layout.findIndex(n => n.id === id);
    if (index === -1) return {};

    const bayCount = state.layout.filter(n => n.type === 'bay').length;
    if (bayCount <= 1) return {};

    const newLayout = [...state.layout];
    let widthReduction = 0;

    const node = newLayout[index] as LayoutBay;
    widthReduction += node.width;

    if (index > 0 && newLayout[index - 1].type === 'divider') {
      widthReduction += (newLayout[index - 1] as LayoutDivider).width;
      newLayout.splice(index - 1, 2);
    } else if (index < newLayout.length - 1 && newLayout[index + 1].type === 'divider') {
      widthReduction += (newLayout[index + 1] as LayoutDivider).width;
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
  resizeBay: (id: string, width: number) => set((state) => {
    const newLayout = state.layout.map(node => {
      if (node.id === id && node.type === 'bay') {
        return { ...node, width };
      }
      return node;
    });
    const newTotalWidth = newLayout.reduce((acc, node) => acc + node.width, 0) + (PROFILES[state.profileType].size * 2);
    return { layout: newLayout, width: newTotalWidth };
  }),

  // --- Shelf/Drawer Actions ---
  addShelf: (bayId: string, y: number) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, shelves: [...node.shelves, { id: uid(), y }] };
      }
      return node;
    })
  })),
  removeShelf: (bayId: string, id: string) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, shelves: node.shelves.filter(s => s.id !== id) };
      }
      return node;
    })
  })),
  updateShelf: (bayId: string, id: string, y: number) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, shelves: node.shelves.map(s => s.id === id ? { ...s, y } : s) };
      }
      return node;
    })
  })),
  duplicateShelf: (bayId: string, id: string) => set((state) => {
    const bay = state.layout.find(n => n.id === bayId && n.type === 'bay') as LayoutBay | undefined;
    if (!bay) return {};
    const shelf = bay.shelves.find(s => s.id === id);
    if (!shelf) return {};

    return {
      layout: state.layout.map(node => {
        if (node.id === bayId && node.type === 'bay') {
          return { ...node, shelves: [...node.shelves, { id: uid(), y: shelf.y + 50 }] };
        }
        return node;
      })
    };
  }),
  addDrawer: (bayId: string, y: number, height: number) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, drawers: [...node.drawers, { id: uid(), y, height }] };
      }
      return node;
    })
  })),
  removeDrawer: (bayId: string, id: string) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, drawers: node.drawers.filter(d => d.id !== id) };
      }
      return node;
    })
  })),
  updateDrawer: (bayId: string, id: string, y: number, height: number) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, drawers: node.drawers.map(d => d.id === id ? { ...d, y, height } : d) };
      }
      return node;
    })
  })),
  duplicateDrawer: (bayId: string, id: string) => set((state) => {
    const bay = state.layout.find(n => n.id === bayId && n.type === 'bay') as LayoutBay | undefined;
    if (!bay) return {};
    const drawer = bay.drawers.find(d => d.id === id);
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
        if (node.id === bayId && node.type === 'bay') {
          return { ...node, drawers: [...node.drawers, newDrawer] };
        }
        return node;
      })
    };
  }),

  getCollisions: () => {
    const { hasLeftWall, hasRightWall, result } = get();
    const isCollision = (result && !result.success) || false;
    return {
      left: hasLeftWall && isCollision,
      right: hasRightWall && isCollision
    };
  },
  checkDrawerCollision: (bayId: string, drawer: Drawer) => {
    const { layout } = get();
    const bay = layout.find(n => n.id === bayId && n.type === 'bay') as LayoutBay | undefined;
    if (!bay) return false;

    const drawerBottom = drawer.y;
    const drawerTop = drawer.y + drawer.height;

    for (const shelf of bay.shelves) {
      const shelfY = shelf.y;
      if (shelfY > drawerBottom && shelfY < drawerTop) return true;
    }
    return false;
  },
  getDerived: () => {
    const state = get() as DesignState;
    const { width, profileType, overlay } = state;
    const s = PROFILES[profileType].size;
    const innerWidth = width - (s * 2);
    const doorWidth = innerWidth + (overlay * 2);
    return { innerWidth, doorWidth };
  },
  getBOM: () => {
    const state = get() as DesignState;
    return calculateBOM(state);
  }
}), {
  partialize: (state: DesignState) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cameraResetTrigger, ...rest } = state;
    return rest;
  },
}));

export default useDesignStore;
