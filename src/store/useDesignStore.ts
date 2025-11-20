'use client';

import { create } from 'zustand';
import { ProfileType, PROFILES, SimulationResult } from '@/core/types';

export interface BOMItem {
  name: string;
  lengthMm?: number; // mm for profiles
  qty: number;
  note?: string;
}

export interface Shelf {
  id: string;
  y: number; // Height from bottom in mm
}

export interface DesignState {
  profileType: ProfileType;
  overlay: number;
  result: SimulationResult | null;
  width: number;
  height: number;
  depth: number;
  hasLeftWall: boolean;
  hasRightWall: boolean;
  isDoorOpen: boolean;
  doorCount: number;
  connectorType: 'angle' | 'internal';
  shelves: Shelf[];
  setProfileType: (p: ProfileType) => void;
  setOverlay: (v: number) => void;
  setResult: (r: SimulationResult | null) => void;
  setWidth: (v: number) => void;
  setHeight: (v: number) => void;
  setDepth: (v: number) => void;
  setHasLeftWall: (v: boolean) => void;
  setHasRightWall: (v: boolean) => void;
  setIsDoorOpen: (v: boolean) => void;
  setDoorCount: (v: number) => void;
  setConnectorType: (v: 'angle' | 'internal') => void;
  addShelf: (y: number) => void;
  removeShelf: (id: string) => void;
  updateShelf: (id: string, y: number) => void;
  getDerived: () => { innerWidth: number; doorWidth: number };
  getBOM: () => BOMItem[];
}

export const useDesignStore = create<DesignState>((set, get) => ({
  profileType: '2020',
  overlay: 14,
  result: null,
  width: 600,
  height: 800,
  depth: 400,
  hasLeftWall: false,
  hasRightWall: false,
  isDoorOpen: false,
  doorCount: 1,
  connectorType: 'angle',
  shelves: [],
  setProfileType: (p: ProfileType) => set({ profileType: p }),
  setOverlay: (v: number) => set({ overlay: v }),
  setResult: (r: SimulationResult | null) => set({ result: r }),
  setWidth: (v: number) => set({ width: v }),
  setHeight: (v: number) => set({ height: v }),
  setDepth: (v: number) => set({ depth: v }),
  setHasLeftWall: (v: boolean) => set({ hasLeftWall: v }),
  setHasRightWall: (v: boolean) => set({ hasRightWall: v }),
  setIsDoorOpen: (v: boolean) => set({ isDoorOpen: v }),
  setDoorCount: (v: number) => set({ doorCount: v }),
  setConnectorType: (v: 'angle' | 'internal') => set({ connectorType: v }),
  addShelf: (y: number) => set((state) => ({
    shelves: [...state.shelves, { id: Math.random().toString(36).substr(2, 9), y }]
  })),
  removeShelf: (id: string) => set((state) => ({
    shelves: state.shelves.filter(s => s.id !== id)
  })),
  updateShelf: (id: string, y: number) => set((state) => ({
    shelves: state.shelves.map(s => s.id === id ? { ...s, y } : s)
  })),
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
    const { width, height, depth, profileType, result, connectorType, doorCount } = state;
    const s = PROFILES[profileType].size;
    const innerWidth = width - (s * 2);
    const doorWidth = innerWidth + (get().overlay * 2);

    const hLength = Math.round(height);
    const wLength = Math.round(innerWidth);
    const dLength = Math.round(depth - (s * 2));

    const profileItems: BOMItem[] = [];
    // 4 vertical pillars
    profileItems.push({ name: `${profileType} Vertical (Pillar)`, lengthMm: hLength, qty: 4 });
    // 4 horizontal width beams
    profileItems.push({ name: `${profileType} Width Beam`, lengthMm: wLength, qty: 4 });
    // 4 depth beams
    profileItems.push({ name: `${profileType} Depth Beam`, lengthMm: dLength, qty: 4 });

    // Door panels
    const doorItems: BOMItem[] = [];
    if (doorCount === 1) {
      doorItems.push({ name: 'Door Panel', qty: 1, note: `${doorWidth} x ${height} mm` });
    } else {
      const eachWidth = Math.round(innerWidth / doorCount + get().overlay);
      doorItems.push({ name: 'Door Panel', qty: doorCount, note: `${eachWidth} x ${height} mm each` });
    }

    // Shelves
    const shelves = state.shelves || [];
    if (shelves.length > 0) {
      profileItems.push({ name: `${profileType} Shelf Width Beam`, lengthMm: wLength, qty: shelves.length * 2 });
      profileItems.push({ name: `${profileType} Shelf Depth Beam`, lengthMm: dLength, qty: shelves.length * 2 });
    }

    // Hinges
    const hinges: BOMItem[] = [];
    if (result && result.success) {
      const hingeName = result.recommendedHinge?.name || 'Hinge';
      const hingeQty = 2 * doorCount; // default to 2 per door
      hinges.push({ name: hingeName, qty: hingeQty });
    }

    // Connectors (angle brackets or internal locks)
    // Base frame connectors (simplified estimation)
    const baseConnectors = connectorType === 'angle' ? 16 : 16; // 8 corners * 2 connections
    // Shelf connectors: 4 beams * 2 ends = 8 connections per shelf
    const shelfConnectors = shelves.length * 8;
    
    const totalConnectors = baseConnectors + shelfConnectors;

    if (connectorType === 'angle') {
      profileItems.push({ name: 'Angle bracket (L)', qty: totalConnectors });
    } else if (connectorType === 'internal') {
      profileItems.push({ name: 'Internal Lock', qty: totalConnectors });
    }

    return [...profileItems, ...doorItems, ...hinges];
  }
}));

export default useDesignStore;
