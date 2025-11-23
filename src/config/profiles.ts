import { Profile, ProfileType } from '@/core/types';

export const PROFILES: Record<ProfileType, Profile> = {
    '2020': { type: '2020', size: 20, margin: 10, slotWidth: 6, slotDepth: 6 },
    '3030': { type: '3030', size: 30, margin: 15, slotWidth: 8, slotDepth: 8 },
    '4040': { type: '4040', size: 40, margin: 20, slotWidth: 8, slotDepth: 8 }, // Assuming 4040 has 20 margin
};
