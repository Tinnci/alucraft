'use client';

import { create } from 'zustand';
import { ProfileType, PROFILES, SimulationResult } from '@/core/types';

export interface BOMItem {
  name: string;
  lengthMm?: number; // mm for profiles
  qty: number;
  note?: string;
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
  setProfileType: (p: ProfileType) => void;
  setOverlay: (v: number) => void;
  setResult: (r: SimulationResult | null) => void;
  setWidth: (v: number) => void;
  setDoorCount: (v: number) => void;
  setConnectorType: (v: 'angle' | 'internal') => void;
  setHeight: (v: number) => void;
  setDepth: (v: number) => void;
  setHasLeftWall: (v: boolean) => void;
  setHasRightWall: (v: boolean) => void;
  setIsDoorOpen: (v: boolean) => void;
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
  setProfileType: (p: ProfileType) => set({ profileType: p }),
  setOverlay: (v: number) => set({ overlay: v }),
  setResult: (r: SimulationResult | null) => set({ result: r }),
  setWidth: (v: number) => set({ width: v }),
  setHeight: (v: number) => set({ height: v }),
  setDepth: (v: number) => set({ depth: v }),
  setDoorCount: (v: number) => set({ doorCount: v }),
  setConnectorType: (v: 'angle' | 'internal') => set({ connectorType: v }),
  setHasLeftWall: (v: boolean) => set({ hasLeftWall: v }),
  setHasRightWall: (v: boolean) => set({ hasRightWall: v }),
  setIsDoorOpen: (v: boolean) => set({ isDoorOpen: v }),
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

    // Hinges
    const hinges: BOMItem[] = [];
    if (result && result.success) {
      const hingeName = result.recommendedHinge?.name || 'Hinge';
      const hingeQty = 2 * doorCount; // default to 2 per door
      hinges.push({ name: hingeName, qty: hingeQty });
    }

    // Connectors (angle brackets or internal locks)
    if (connectorType === 'angle') {
      profileItems.push({ name: 'Angle bracket (L)', qty: 8 });
    } else if (connectorType === 'internal') {
      profileItems.push({ name: 'Internal Lock', qty: 4 });
    }

    return [...profileItems, ...doorItems, ...hinges];
  }
}));

export default useDesignStore;
