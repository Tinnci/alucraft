import { nanoid } from 'nanoid';
import {
    ProfileType,
    BOMItem,
    ProfileBOMItem,
    PanelBOMItem,
    HardwareBOMItem,
    ConnectorType,
    LayoutNode,
    ContainerNode,
    isBayNode
} from './types';
import { PROFILES } from '@/config/profiles';
import { CONNECTORS } from '@/config/connectors';
import computeLayoutSizes from './layout-utils';
import { calculateHinge } from './hinge-rules';

const uid = (len = 8) => nanoid(len);

export interface BOMCalculationInput {
    width: number;
    height: number;
    depth: number;
    profileType: ProfileType;
    connectorType: ConnectorType;
    hasLeftPanel: boolean;
    hasRightPanel: boolean;
    hasBackPanel: boolean;
    hasTopPanel: boolean;
    hasBottomPanel: boolean;
    layout: LayoutNode[];
    overlay: number;
    panelThickness: number;
    tolerance: number;
    drawerStyle: 'inset' | 'overlay';
}

export const calculateBOM = (input: BOMCalculationInput): BOMItem[] => {
    const {
        width,
        height,
        depth,
        profileType,
        connectorType,
        hasLeftPanel,
        hasRightPanel,
        hasBackPanel,
        hasTopPanel,
        hasBottomPanel,
        layout,
        overlay,
        panelThickness,
        tolerance,
        drawerStyle
    } = input;

    const profile = PROFILES[profileType];
    const s = profile.size;
    const slotDepth = profile.slotDepth || 6;
    const innerWidth = width - (s * 2);
    const hLength = Math.round(height);
    const dLength = Math.round(depth - (s * 2));

    // 获取连接件扣减量
    const connectorSpec = CONNECTORS[connectorType];
    const connectorDeduction = connectorSpec.deduction;
    const frameBeamDeductedLength = Math.round(innerWidth - (connectorDeduction * 2));

    const profileItems: ProfileBOMItem[] = [];
    const panelItems: PanelBOMItem[] = [];
    const hardwareItems: HardwareBOMItem[] = [];

    // --- 1. Frame Profiles ---
    profileItems.push({
        id: uid(),
        name: `${profileType} Vertical (Pillar)`,
        lengthMm: hLength,
        qty: 4,
        category: 'profile',
        partId: 'frame-pillar'
    });
    profileItems.push({
        id: uid(),
        name: `${profileType} Width Beam (Deducted)`,
        lengthMm: frameBeamDeductedLength,
        qty: 4,
        category: 'profile',
        note: `Connector deduction: ${connectorDeduction}mm x 2`,
        partId: 'frame-width-beam'
    });
    profileItems.push({
        id: uid(),
        name: `${profileType} Depth Beam`,
        lengthMm: dLength,
        qty: 4,
        category: 'profile',
        partId: 'frame-depth-beam'
    });

    // simple traverse helper for tree iteration
    const traverse = (nodes: LayoutNode[] | undefined, cb: (node: LayoutNode) => void) => {
        if (!nodes) return;
        for (const n of nodes) {
            cb(n);
            if (n.type === 'container') {
                traverse((n as ContainerNode).children, cb);
            }
        }
    };
    // --- 2. Layout Dividers ---
    traverse(layout, (node) => {
        if (node.type === 'divider') {
            profileItems.push({
                id: uid(),
                name: `${profileType} Vertical (Divider)`,
                lengthMm: hLength - (s * 2),
                qty: 1,
                category: 'profile',
                partId: `divider-${node.id}`
            });
        }
    });

    // --- 3. Panels (Sides, Back, Top, Bottom) ---
    if (hasLeftPanel) {
        const sidePanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        const sidePanelWidth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Side Panel (Left)', qty: 1, widthMm: sidePanelWidth, heightMm: sidePanelHeight, thicknessMm: panelThickness, category: 'panel', partId: 'panel-left' });
    }
    if (hasRightPanel) {
        const sidePanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        const sidePanelWidth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Side Panel (Right)', qty: 1, widthMm: sidePanelWidth, heightMm: sidePanelHeight, thicknessMm: panelThickness, category: 'panel', partId: 'panel-right' });
    }
    if (hasBackPanel) {
        const backPanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        const backPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Back Panel', qty: 1, widthMm: backPanelWidth, heightMm: backPanelHeight, thicknessMm: panelThickness, category: 'panel', partId: 'panel-back' });
    }
    if (hasTopPanel) {
        const tbPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
        const tbPanelDepth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Top Panel', qty: 1, widthMm: tbPanelWidth, heightMm: tbPanelDepth, thicknessMm: panelThickness, category: 'panel', partId: 'panel-top' });
    }
    if (hasBottomPanel) {
        const tbPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
        const tbPanelDepth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Bottom Panel', qty: 1, widthMm: tbPanelWidth, heightMm: tbPanelDepth, thicknessMm: panelThickness, category: 'panel', partId: 'panel-bottom' });
    }

    // --- 4. Bay Components (Doors, Shelves, Drawers) ---
    // Precompute layout sizes using top-level innerWidth as the container axis
    const widths = computeLayoutSizes(layout, innerWidth, 'horizontal', new Map<string, number>());

    // Build per-bay panel/profile/hardware entries using computed widths
    let bayCounter = 0;
    traverse(layout, (node) => {
        if (!isBayNode(node)) return;
        const bay = node;
        const cw = widths.get(bay.id) ?? (typeof bay.config.width === 'number' ? bay.config.width! : 0);
        const bayLabel = `Bay #${++bayCounter}`;

        // Doors
        if (bay.config?.door?.enabled) {
            const numDoors = bay.config.door.type === 'double' ? 2 : 1;

            if (bay.config.door.type === 'single') {
                const singleWidth = Math.round(cw - 4); // 2mm gap on each side
                panelItems.push({
                    id: uid(),
                    name: `${bayLabel} Door Panel (Single)`,
                    qty: 1,
                    widthMm: singleWidth,
                    heightMm: Math.round(height),
                    thicknessMm: panelThickness,
                    category: 'panel',
                    partId: `door-${bay.id}`
                });
            } else { // Double
                const leafWidth = Math.round((cw / 2) - 3); // 2mm outer gap, 2mm inner gap
                panelItems.push({
                    id: uid(),
                    name: `${bayLabel} Door Panel (Pair)`,
                    qty: 2,
                    widthMm: leafWidth,
                    heightMm: Math.round(height),
                    thicknessMm: panelThickness,
                    category: 'panel',
                    partId: `door-${bay.id}`
                });
            }

            // Add Handles for Doors
            hardwareItems.push({
                id: uid(),
                name: 'Handle',
                qty: numDoors,
                category: 'hardware',
                unit: 'piece'
            });
        }

        // Shelves
        if ((bay.config.shelves ?? []).length > 0) {
            const bayInnerWidth = Math.round(cw - (s * 2));
            const bayBeamDeductedLength = Math.round(bayInnerWidth - (connectorDeduction * 2));
            profileItems.push({
                id: uid(),
                name: `${profileType} Shelf Width Beam (Bay ${bayBeamDeductedLength}mm)`,
                lengthMm: bayBeamDeductedLength,
                qty: (bay.config.shelves ?? []).length * 2,
                category: 'profile',
                note: `Connector deduction: ${connectorDeduction}mm x 2`,
                partId: `shelf-${bay.id}-beams`
            });
            profileItems.push({
                id: uid(),
                name: `${profileType} Shelf Depth Beam`,
                lengthMm: dLength,
                qty: (bay.config.shelves ?? []).length * 2,
                category: 'profile',
                partId: `shelf-${bay.id}-beams`
            });
        }

        // Drawers
        if ((bay.config.drawers ?? []).length > 0) {
            const slideLength = Math.round(depth - 50); // Simplified
            hardwareItems.push({
                id: uid(),
                name: `Drawer Slides (${slideLength}mm)`,
                qty: (bay.config.drawers ?? []).length,
                unit: 'pair',
                category: 'hardware'
            });

            (bay.config.drawers ?? []).forEach(d => {
                // Drawer face width: default to inset unless drawerStyle is 'overlay'
                const faceWidth = drawerStyle === 'overlay' ? Math.round(cw + overlay * 2) : Math.round(cw - 10); // mm
                panelItems.push({
                    id: uid(),
                    name: `Drawer Face`,
                    qty: 1,
                    widthMm: faceWidth,
                    heightMm: Math.round(d.height),
                    thicknessMm: panelThickness,
                    category: 'panel',
                    partId: `drawer-${bay.id}-faces`
                });
                hardwareItems.push({
                    id: uid(),
                    name: `Drawer Box/Body`,
                    qty: 1,
                    unit: 'set',
                    note: `Fits inside ${Math.round(cw)}mm width`,
                    category: 'hardware'
                });
                hardwareItems.push({ id: uid(), name: 'Handle', qty: 1, category: 'hardware', unit: 'piece' });
            });
        }
    });

    // --- 5. Hardware (Hinges, Connectors) ---
    const hingeResult = calculateHinge(profileType, overlay);
    if (hingeResult.success && hingeResult.recommendedHinge) {
        const hingeName = hingeResult.recommendedHinge.name;
        const hingeQty = (() => {
            let qty = 0;
            traverse(layout, (node) => {
                if (isBayNode(node) && node.config?.door?.enabled) {
                    const numDoors = node.config.door.type === 'double' ? 2 : 1;
                    qty += (numDoors * 2); // 2 hinges per door
                }
            });
            return qty;
        })();
        if (hingeQty > 0) {
            hardwareItems.push({ id: uid(), name: hingeName, qty: hingeQty, category: 'hardware', unit: 'piece' });
        }
    }

    // --- Connectors (angle brackets or internal locks) ---
    let totalShelves = 0;
    let numDividers = 0;
    traverse(layout, (n) => {
        if (isBayNode(n)) totalShelves += (n.config.shelves ?? []).length || 0;
        if (n.type === 'divider') numDividers += 1;
    });
    const baseConnectors = 16; // 8 corners * 2 connections (simplified estimation)
    const shelfConnectors = totalShelves * 8; // 4 beams * 2 ends per shelf
    const dividerConnectors = numDividers * 4; // simplified estimate
    const totalConnectors = baseConnectors + shelfConnectors + dividerConnectors;

    if (totalConnectors > 0) {
        hardwareItems.push({ id: uid(), name: connectorSpec.name, qty: totalConnectors, category: 'hardware', unit: 'piece', note: connectorSpec.description });
    }

    return [...profileItems, ...panelItems, ...hardwareItems];
};
