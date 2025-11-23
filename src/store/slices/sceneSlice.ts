import { StateCreator } from 'zustand';
import { DesignState } from '../useDesignStore';
import { isBayNode } from '@/core/types';
import { getDoorSides, getDoorStateKey } from '@/core/utils';

export interface SceneSlice {
    showDimensions: boolean;
    showWireframe: boolean;
    showSnapGuides: boolean;
    enableHaptics: boolean;
    isDarkMode: boolean;
    cameraResetTrigger: number;

    // Door interaction state
    isDoorOpen: boolean;
    doorStates: Record<string, boolean>;

    setShowDimensions: (v: boolean) => void;
    setShowWireframe: (v: boolean) => void;
    setShowSnapGuides: (v: boolean) => void;
    setEnableHaptics: (v: boolean) => void;
    toggleTheme: () => void;
    triggerCameraReset: () => void;

    setIsDoorOpen: (v: boolean) => void;
    setDoorState: (doorId: string, isOpen: boolean) => void;
    toggleDoorState: (doorId: string) => void;
}

export const createSceneSlice: StateCreator<DesignState, [], [], SceneSlice> = (set, _get) => ({
    showDimensions: true,
    showWireframe: false,
    showSnapGuides: true,
    enableHaptics: true,
    isDarkMode: true,
    cameraResetTrigger: 0,
    isDoorOpen: false,
    doorStates: {},

    setShowDimensions: (v) => set({ showDimensions: v }),
    setShowWireframe: (v) => set({ showWireframe: v }),
    setShowSnapGuides: (v) => set({ showSnapGuides: v }),
    setEnableHaptics: (v) => set({ enableHaptics: v }),
    toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),

    setIsDoorOpen: (v) => set((state) => {
        const nextDoorStates = { ...state.doorStates };
        state.layout.forEach((node) => {
            if (!isBayNode(node)) return;
            const doorConfig = node.config?.door;
            if (!doorConfig || !doorConfig.enabled) return;

            getDoorSides(doorConfig).forEach((side) => {
                nextDoorStates[getDoorStateKey(node.id, side)] = v;
            });
        });
        return { isDoorOpen: v, doorStates: nextDoorStates };
    }),

    setDoorState: (doorId, isOpen) => set((state) => ({
        doorStates: { ...state.doorStates, [doorId]: isOpen }
    })),

    toggleDoorState: (doorId) => set((state) => ({
        doorStates: { ...state.doorStates, [doorId]: !state.doorStates[doorId] }
    })),
});
