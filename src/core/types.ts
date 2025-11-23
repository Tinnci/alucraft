export type ProfileType = '2020' | '3030' | '4040';

export interface Profile {
    type: ProfileType;
    size: number; // 20, 30, 40
    margin: number; // Distance from center to edge (e.g., 10 for 2020)
    slotWidth: number;
    slotDepth: number;
}

// PROFILES and CONNECTORS constants moved to src/config/

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
    partId?: string; // Identifier for 3D highlighting linkage
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

export type Orientation = 'horizontal' | 'vertical';

export interface LayoutNodeBase {
    id: string;
    type: 'container' | 'item' | 'divider';
    size?: number | 'auto'; // mm or 'auto' to fill the remaining space
}

export interface ContainerNode extends LayoutNodeBase {
    type: 'container';
    orientation: Orientation;
    children: LayoutNode[];
}

// -------------------------
// Expanded ItemNode Variants
// -------------------------
export interface BayConfig {
    width?: number | 'auto';
    shelves?: Shelf[];
    drawers?: Drawer[];
    door?: BayDoorConfig;
}

export interface BedConfig {
    mattressSize: 'single' | 'double' | 'queen' | 'king';
    slatsEnabled?: boolean;
    headboardHeight?: number;
}

export interface CupboardConfig {
    cornerType?: 'L-shape' | 'blind' | 'corner';
    lazySusan?: boolean;
}

export interface EmptyNode extends LayoutNodeBase {
    type: 'item';
    contentType: 'empty';
    config?: Record<string, never>;
}

export interface WardrobeNode extends LayoutNodeBase {
    type: 'item';
    contentType: 'wardrobe_section';
    config: BayConfig;
}

export interface BayNode extends LayoutNodeBase {
    type: 'item';
    contentType: 'generic_bay';
    config: BayConfig;
}

export interface BedNode extends LayoutNodeBase {
    type: 'item';
    contentType: 'bed_frame';
    config: BedConfig;
}

export interface CupboardNode extends LayoutNodeBase {
    type: 'item';
    contentType: 'corner_cupboard';
    config: CupboardConfig;
}

export type ItemNode = BayNode | BedNode | CupboardNode | EmptyNode | WardrobeNode;

export interface DividerNode extends LayoutNodeBase {
    type: 'divider';
    thickness: number; // mm
}

export type LayoutNode = ContainerNode | ItemNode | DividerNode;

// Backwards compatibility aliases (temporary) for existing code
export type LayoutBay = BayNode;
export type LayoutDivider = DividerNode;

export function isBayNode(node: LayoutNode | undefined): node is LayoutBay {
    return !!node && node.type === 'item' && (node as ItemNode).contentType === 'generic_bay';
}

export function isBedNode(node: LayoutNode | undefined): node is BedNode {
    return !!node && node.type === 'item' && (node as ItemNode).contentType === 'bed_frame';
}

export function isCupboardNode(node: LayoutNode | undefined): node is CupboardNode {
    return !!node && node.type === 'item' && (node as ItemNode).contentType === 'corner_cupboard';
}

export function findBays(nodes: LayoutNode[]): LayoutBay[] {
    const result: LayoutBay[] = [];
    for (const n of nodes) {
        if (n.type === 'item' && (n as ItemNode).contentType === 'generic_bay') {
            result.push(n as LayoutBay);
        } else if (n.type === 'container') {
            result.push(...findBays(n.children));
        }
    }
    return result;
}

export type MaterialType = 'silver' | 'dark_metal' | 'wood';
