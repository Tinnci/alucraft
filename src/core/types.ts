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

/**
 * ConnectorType - 连接件类型定义
 * 用于计算型材的实际切割长度（下料长度）
 */
export type ConnectorType = 'angle_bracket' | 'internal_lock' | '3way_corner';

export interface ConnectorSpec {
    name: string; // 中文名称
    deduction: number; // 扣减量（mm）
    description?: string;
}

export const CONNECTORS: Record<ConnectorType, ConnectorSpec> = {
    'angle_bracket': {
        name: 'L型角码',
        deduction: 0,
        description: '表面安装，不影响型材切割长度'
    },
    'internal_lock': {
        name: '内置锁扣',
        deduction: 0,
        description: '需要打孔，但不影响型材长度'
    },
    '3way_corner': {
        name: '三维角码',
        deduction: 20,
        description: '假设三维角码占据约20mm长（具体值根据型材规格调整）'
    }
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

export type BOMCategory = 'profile' | 'panel' | 'hardware';

export interface BOMItemBase {
    id: string;
    name: string;
    qty: number;
    category: BOMCategory;
    note?: string;
}

export interface ProfileBOMItem extends BOMItemBase {
    category: 'profile';
    lengthMm: number;
    cutAngleStart?: number; // e.g. 90 for straight, 45 for miter
    cutAngleEnd?: number;
}

export interface PanelBOMItem extends BOMItemBase {
    category: 'panel';
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
}

export interface HardwareBOMItem extends BOMItemBase {
    category: 'hardware';
    unit: 'piece' | 'set' | 'pair'; // e.g. 1 piece, 1 set
}

export type BOMItem = ProfileBOMItem | PanelBOMItem | HardwareBOMItem;

export interface Shelf {
    id: string;
    y: number; // Height from bottom in mm
}

export type DoorType = 'single' | 'double';
export type HingeSide = 'left' | 'right';

export interface BayDoorConfig {
    enabled: boolean;
    type: DoorType;
    hingeSide: HingeSide; // Used when type === 'single'
}

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
