export type ProfileType = '2020' | '3030' | '4040';

export interface Profile {
    type: ProfileType;
    size: number; // 20, 30, 40
    margin: number; // Distance from center to edge (e.g., 10 for 2020)
    slotWidth: number;
    slotDepth: number;
}

export const PROFILES: Record<ProfileType, Profile> = {
    '2020': { type: '2020', size: 20, margin: 10, slotWidth: 6, slotDepth: 6 },
    '3030': { type: '3030', size: 30, margin: 15, slotWidth: 8, slotDepth: 8 },
    '4040': { type: '4040', size: 40, margin: 20, slotWidth: 8, slotDepth: 8 }, // Assuming 4040 has 20 margin
};

export type HingeSeries = 'C80' | 'Cover25'; // C80 (Small), Cover25 (Large)
export type HingeArm = 'Straight' | 'MediumBend' | 'BigBend'; // 直臂, 中弯, 大弯

export interface Hinge {
    id: string;
    series: HingeSeries;
    arm: HingeArm;
    name: string;
    kRange: [number, number]; // [Min, Max]
    adjustmentRange: [number, number]; // [Min, Max] e.g. [-7, 0]
    // Base overlay table could be complex, we might handle it in the rule engine or here.
    // Let's keep it simple here.
}

export interface Panel {
    material: 'Glass' | 'AluminumHoneycomb';
    thickness: number;
}

export interface SimulationResult {
    success: boolean;
    recommendedHinge?: Hinge;
    kValue?: number;
    adjustment?: number;
    actualOverlay?: number;
    message: string;
    details?: string;
}

export interface Drawer {
    id: string;
    y: number; // Vertical position (from bottom)
    height: number; // Face height
}
