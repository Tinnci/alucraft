'use client';

import { create } from 'zustand';
import { temporal } from 'zundo';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import { createLayoutSlice, LayoutSlice } from './slices/layoutSlice';
import { createSceneSlice, SceneSlice } from './slices/sceneSlice';
import { BOMItem, Drawer, isBayNode, LayoutBay, BayConfig } from '@/core/types';
import { getItemProps } from '@/core/item-utils';
import { PROFILES } from '@/config/profiles';
import { calculateBOM } from '@/core/bom-calculator';
import { createDefaultDoorConfig, getDoorSides, getDoorStateKey } from '@/core/utils';

// Re-export helpers for backward compatibility
export { createDefaultDoorConfig, getDoorSides, getDoorStateKey };

export type DesignState = SettingsSlice & LayoutSlice & SceneSlice & {
  getDerived: () => { innerWidth: number; doorWidth: number };
  getCollisions: () => { left: boolean; right: boolean };
  checkDrawerCollision: (bayId: string, drawer: Drawer) => boolean;
  getBOM: () => BOMItem[];
};

import { persist } from 'zustand/middleware';

export const useDesignStore = create<DesignState>()(
  temporal(
    persist(
      (set, get, api) => ({
        ...createSettingsSlice(set, get, api),
        ...createLayoutSlice(set, get, api),
        ...createSceneSlice(set, get, api),

        getDerived: () => {
          const { width, profileType, overlay } = get();
          const s = PROFILES[profileType].size;
          const innerWidth = width - (s * 2);
          const doorWidth = innerWidth + (overlay * 2);
          return { innerWidth, doorWidth };
        },

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
          const bay = layout.find(n => n.id === bayId && isBayNode(n)) as LayoutBay | undefined;
          if (!bay) return false;

          const drawerBottom = drawer.y;
          const drawerTop = drawer.y + drawer.height;

          const bayProps = getItemProps<BayConfig>(bay);
          for (const shelf of (bayProps.shelves ?? [])) {
            const shelfY = shelf.y;
            if (shelfY > drawerBottom && shelfY < drawerTop) return true;
          }
          return false;
        },

        getBOM: () => {
          return calculateBOM(get());
        }
      }),
      {
        name: 'alucraft-design',
        version: 1, // Bump version to purge old incompatible state (where computedPositions might be a plain object)
        partialize: (state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { cameraResetTrigger, computedPositions, ...rest } = state;
          return rest;
        },
      }
    )
  )
);

export default useDesignStore;
