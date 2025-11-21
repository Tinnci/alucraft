'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import { ProfileType, PROFILES, SimulationResult } from '@/core/types';

export interface BOMItem {
  name: string;
  lengthMm?: number; // mm for profiles
  qty: number;
  note?: string;
  category?: 'profile' | 'panel' | 'hardware';
}

export interface Shelf {
  id: string;
  y: number; // Height from bottom in mm
}

export interface Drawer {
  id: string;
  y: number; // Height from bottom in mm
  height: number; // Height of the drawer
}

export type DoorType = 'single' | 'double';
export type HingeSide = 'left' | 'right';

export interface BayDoorConfig {
  enabled: boolean;
  type: DoorType;
  hingeSide: HingeSide; // Used when type === 'single'
}

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

export interface LayoutBay {
  type: 'bay';
  id: string;
  width: number;
  shelves: Shelf[];
  drawers: Drawer[];
  door?: BayDoorConfig;
}

export interface LayoutDivider {
  type: 'divider';
  id: string;
  width: number;
}

export type LayoutNode = LayoutBay | LayoutDivider;

export type MaterialType = 'silver' | 'dark_metal' | 'wood';

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
  connectorType: 'angle' | 'internal';
  showDimensions: boolean;
  showWireframe: boolean;
  cameraResetTrigger: number;
  isDarkMode: boolean;
  material: MaterialType;
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
  setConnectorType: (v: 'angle' | 'internal') => void;
  setShowDimensions: (v: boolean) => void;
  setShowWireframe: (v: boolean) => void;
  triggerCameraReset: () => void;
  toggleTheme: () => void;
  setMaterial: (material: MaterialType) => void;
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
  connectorType: 'angle',
  showDimensions: true,
  showWireframe: false,
  cameraResetTrigger: 0,
  isDarkMode: true,
  material: 'silver',
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
  setConnectorType: (v: 'angle' | 'internal') => set({ connectorType: v }),
  setShowDimensions: (v: boolean) => set({ showDimensions: v }),
  setShowWireframe: (v: boolean) => set({ showWireframe: v }),
  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setMaterial: (material) => set({ material }),
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
      id: Math.random().toString(36).substr(2, 9),
      width: newBayWidth,
      shelves: [],
      drawers: [],
      door: createDefaultDoorConfig()
    };
    const newDivider: LayoutDivider = {
      type: 'divider',
      id: Math.random().toString(36).substr(2, 9),
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
        return { ...node, shelves: [...node.shelves, { id: Math.random().toString(36).substr(2, 9), y }] };
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
          return { ...node, shelves: [...node.shelves, { id: Math.random().toString(36).substr(2, 9), y: shelf.y + 50 }] };
        }
        return node;
      })
    };
  }),
  addDrawer: (bayId: string, y: number, height: number) => set((state) => ({
    layout: state.layout.map(node => {
      if (node.id === bayId && node.type === 'bay') {
        return { ...node, drawers: [...node.drawers, { id: Math.random().toString(36).substr(2, 9), y, height }] };
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
      id: Math.random().toString(36).substr(2, 9),
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
  const { width, height, depth, profileType, result, connectorType, hasLeftPanel, hasRightPanel, hasBackPanel, hasTopPanel, hasBottomPanel, layout, overlay } = state;
    const profile = PROFILES[profileType];
    const s = profile.size;
    const slotDepth = profile.slotDepth || 6;
    const innerWidth = width - (s * 2);
    const hLength = Math.round(height);
    const wLength = Math.round(innerWidth);
    const dLength = Math.round(depth - (s * 2));

    const profileItems: BOMItem[] = [];
    // 4 vertical pillars (Outer frame)
    profileItems.push({ name: `${profileType} Vertical (Pillar)`, lengthMm: hLength, qty: 4, category: 'profile' });
    // 4 horizontal width beams (Outer frame)
    profileItems.push({ name: `${profileType} Width Beam`, lengthMm: wLength, qty: 4, category: 'profile' });
    // 4 depth beams (Outer frame)
    profileItems.push({ name: `${profileType} Depth Beam`, lengthMm: dLength, qty: 4, category: 'profile' });

    // Dividers
    const dividers = layout.filter(n => n.type === 'divider') as LayoutDivider[];
    dividers.forEach(() => {
      profileItems.push({ name: `${profileType} Vertical (Divider)`, lengthMm: hLength - (s * 2), qty: 1, category: 'profile' });
    });

    // Panels (Enclosure)
    const panelItems: BOMItem[] = [];
    const tolerance = 1; // 1mm tolerance

    // Side Panels (Left/Right)
    const sidePanelWidth = Math.round((depth - (s * 2)) + (slotDepth * 2) - tolerance);
    const sidePanelHeight = Math.round((height - (s * 2)) + (slotDepth * 2) - tolerance);

    if (hasLeftPanel) {
      panelItems.push({ name: 'Side Panel (Left)', qty: 1, note: `${sidePanelWidth} x ${sidePanelHeight} mm`, category: 'panel' });
    }
    if (hasRightPanel) {
      panelItems.push({ name: 'Side Panel (Right)', qty: 1, note: `${sidePanelWidth} x ${sidePanelHeight} mm`, category: 'panel' });
    }

    // Back Panel
    if (hasBackPanel) {
      const backPanelWidth = Math.round((width - (s * 2)) + (slotDepth * 2) - tolerance);
      const backPanelHeight = Math.round((height - (s * 2)) + (slotDepth * 2) - tolerance);
      panelItems.push({ name: 'Back Panel', qty: 1, note: `${backPanelWidth} x ${backPanelHeight} mm`, category: 'panel' });
    }

    // Top/Bottom Panels
    const tbPanelWidth = Math.round((width - (s * 2)) + (slotDepth * 2) - tolerance);
    const tbPanelDepth = Math.round((depth - (s * 2)) + (slotDepth * 2) - tolerance);

    if (hasTopPanel) {
      panelItems.push({ name: 'Top Panel', qty: 1, note: `${tbPanelWidth} x ${tbPanelDepth} mm`, category: 'panel' });
    }
    if (hasBottomPanel) {
      panelItems.push({ name: 'Bottom Panel', qty: 1, note: `${tbPanelWidth} x ${tbPanelDepth} mm`, category: 'panel' });
    }

    // Door panels (per bay)
    const doorItems: BOMItem[] = [];
    const bays = layout.filter(n => n.type === 'bay') as LayoutBay[];

    const doorLeafCount = bays.reduce((acc, bay) => {
      const doorConfig = bay.door ?? createDefaultDoorConfig();
      if (!doorConfig.enabled) return acc;
      return acc + (doorConfig.type === 'double' ? 2 : 1);
    }, 0);

    bays.forEach((bay) => {
      const doorConfig = bay.door ?? createDefaultDoorConfig();
      if (!doorConfig.enabled) return;

      const bayLabel = `Bay ${bays.length > 1 ? bays.findIndex(b => b.id === bay.id) + 1 : ''}`.trim();
      if (doorConfig.type === 'single') {
        const singleWidth = Math.round(bay.width + overlay * 2);
        doorItems.push({
          name: `${bayLabel} Door Panel (Single)`,
          qty: 1,
          note: `${singleWidth} x ${height} mm`,
          category: 'panel'
        });
      } else {
        const leafWidth = Math.round(bay.width / 2 + overlay);
        doorItems.push({
          name: `${bayLabel} Door Panel (Pair)`,
          qty: 2,
          note: `${leafWidth} x ${height} mm each`,
          category: 'panel'
        });
      }
    });

    let totalShelves = 0;

    bays.forEach(bay => {
      const bayWLength = Math.round(bay.width);

      // Shelves
      if (bay.shelves.length > 0) {
        profileItems.push({ name: `${profileType} Shelf Width Beam (Bay ${bayWLength}mm)`, lengthMm: bayWLength, qty: bay.shelves.length * 2, category: 'profile' });
        profileItems.push({ name: `${profileType} Shelf Depth Beam`, lengthMm: dLength, qty: bay.shelves.length * 2, category: 'profile' });
        totalShelves += bay.shelves.length;
      }

      // Drawers
      if (bay.drawers.length > 0) {
        const slideLength = Math.floor((depth - 50) / 50) * 50;
        panelItems.push({
          name: `Drawer Slides (${slideLength}mm)`,
          qty: bay.drawers.length,
          note: 'Pair (L+R)',
          category: 'hardware'
        });

        bay.drawers.forEach((d) => {
          const faceWidth = Math.round(bay.width + (s * 2) + (get().overlay * 2)); // Approx
          panelItems.push({
            name: `Drawer Face`,
            qty: 1,
            note: `${faceWidth} x ${Math.round(d.height)} mm`,
            category: 'panel'
          });
          panelItems.push({
            name: `Drawer Box/Body`,
            qty: 1,
            note: `Fits inside ${Math.round(bay.width)}mm width`,
            category: 'hardware'
          });
          panelItems.push({ name: 'Handle', qty: 1, category: 'hardware' });
        });
      }
    });

    // Hinges
    const hinges: BOMItem[] = [];
    if (result && result.success && doorLeafCount > 0) {
      const hingeName = result.recommendedHinge?.name || 'Hinge';
      const hingeQty = 2 * doorLeafCount; // default to 2 per door leaf
      hinges.push({ name: hingeName, qty: hingeQty, category: 'hardware' });
    }

    // Connectors
    const baseConnectors = connectorType === 'angle' ? 16 : 16;
    const shelfConnectors = totalShelves * 8;
    const totalConnectors = baseConnectors + shelfConnectors;

    if (connectorType === 'angle') {
      profileItems.push({ name: 'Angle bracket (L)', qty: totalConnectors, category: 'hardware' });
    } else if (connectorType === 'internal') {
      profileItems.push({ name: 'Internal Lock', qty: totalConnectors, category: 'hardware' });
    }

    return [...profileItems, ...panelItems, ...doorItems, ...hinges];
  }
}), {
  partialize: (state) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cameraResetTrigger, ...rest } = state;
    return rest;
  },
}));

export default useDesignStore;
