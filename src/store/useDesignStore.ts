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
  setProfileType: (p: ProfileType) => void;
  setOverlay: (v: number) => void;
  setResult: (r: SimulationResult | null) => void;
  setWidth: (v: number) => void;
  setDoorCount: (v: number) => void;
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
  setProfileType: (p: ProfileType) => set({ profileType: p }),
  setOverlay: (v: number) => set({ overlay: v }),
  setResult: (r: SimulationResult | null) => set({ result: r }),
  setWidth: (v: number) => set({ width: v }),
  setHeight: (v: number) => set({ height: v }),
  setDepth: (v: number) => set({ depth: v }),
  setDoorCount: (v: number) => set({ doorCount: v }),
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
    const { width, height, depth, profileType, result } = state;
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

    // Door
    const doorItems: BOMItem[] = [{ name: 'Door Panel', qty: 1, note: `${doorWidth} x ${height} mm` }];

    // Hinges
    const hinges: BOMItem[] = [];
    if (result && result.success) {
      const hingeName = result.recommendedHinge?.name || 'Hinge';
      const hingeQty = 2; // default to 2 for typical doors
      hinges.push({ name: hingeName, qty: hingeQty });
    }

    return [...profileItems, ...doorItems, ...hinges];
  }
}));

export default useDesignStore;
