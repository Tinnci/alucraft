import { nanoid } from 'nanoid';
import { BayDoorConfig, HingeSide } from './types';

export const uid = (len = 8) => nanoid(len);

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
