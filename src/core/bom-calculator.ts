import { nanoid } from 'nanoid';
import {
    ProfileType,
    PROFILES,
    BOMItem,
    ProfileBOMItem,
    PanelBOMItem,
    HardwareBOMItem,
    ConnectorType,
    CONNECTORS,
    LayoutNode
} from './types';
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

    // 计算实际的下料长度（应用连接件扣减）
    // 横梁长度 = 内宽 - (连接件扣减 * 2)
    const frameBeamDeductedLength = Math.round(innerWidth - (connectorDeduction * 2));

    const profileItems: ProfileBOMItem[] = [];
    const panelItems: PanelBOMItem[] = [];
    const hardwareItems: HardwareBOMItem[] = [];

    // --- 1. Frame Profiles ---
    profileItems.push({ id: uid(), name: `${profileType} Vertical (Pillar)`, lengthMm: hLength, qty: 4, category: 'profile' });
    profileItems.push({ id: uid(), name: `${profileType} Width Beam (Deducted)`, lengthMm: frameBeamDeductedLength, qty: 4, category: 'profile', note: `Connector deduction: ${connectorDeduction}mm x 2` });
    profileItems.push({ id: uid(), name: `${profileType} Depth Beam`, lengthMm: dLength, qty: 4, category: 'profile' });

    // --- 2. Layout Dividers ---
    layout.forEach(node => {
        if (node.type === 'divider') {
            profileItems.push({ id: uid(), name: `${profileType} Vertical (Divider)`, lengthMm: hLength - (s * 2), qty: 1, category: 'profile' });
        }
    });

    // --- 3. Panels (Sides, Back, Top, Bottom) ---
    if (hasLeftPanel) {
        const sidePanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        const sidePanelWidth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Side Panel (Left)', qty: 1, widthMm: sidePanelWidth, heightMm: sidePanelHeight, thicknessMm: panelThickness, category: 'panel' });
    }
    if (hasRightPanel) {
        const sidePanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        const sidePanelWidth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Side Panel (Right)', qty: 1, widthMm: sidePanelWidth, heightMm: sidePanelHeight, thicknessMm: panelThickness, category: 'panel' });
    }
    if (hasBackPanel) {
        const backPanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        const backPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Back Panel', qty: 1, widthMm: backPanelWidth, heightMm: backPanelHeight, thicknessMm: panelThickness, category: 'panel' });
    }
    if (hasTopPanel) {
        const tbPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
        const tbPanelDepth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Top Panel', qty: 1, widthMm: tbPanelWidth, heightMm: tbPanelDepth, thicknessMm: panelThickness, category: 'panel' });
    }
    if (hasBottomPanel) {
        const tbPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
        const tbPanelDepth = Math.round(depth - s * 2 + (slotDepth * 2) - tolerance);
        panelItems.push({ id: uid(), name: 'Bottom Panel', qty: 1, widthMm: tbPanelWidth, heightMm: tbPanelDepth, thicknessMm: panelThickness, category: 'panel' });
    }

    // --- 4. Bay Components (Doors, Shelves, Drawers) ---
    layout.forEach((bay, bayIndex) => {
        if (bay.type !== 'bay') return;

        const bayLabel = `Bay #${bayIndex + 1}`;

        // Doors
        if (bay.door?.enabled) {
            if (bay.door.type === 'single') {
                const singleWidth = bay.width - 4; // 2mm gap on each side
                panelItems.push({
                    id: uid(),
                    name: `${bayLabel} Door Panel (Single)`,
                    qty: 1,
                    widthMm: singleWidth,
                    heightMm: height,
                    thicknessMm: panelThickness,
                    category: 'panel'
                });
            } else { // Double
                const leafWidth = (bay.width / 2) - 3; // 2mm outer gap, 2mm inner gap
                panelItems.push({
                    id: uid(),
                    name: `${bayLabel} Door Panel (Pair)`,
                    qty: 2,
                    widthMm: leafWidth,
                    heightMm: height,
                    thicknessMm: panelThickness,
                    category: 'panel'
                });
            }
        }

        // Shelves
        if (bay.shelves.length > 0) {
            const bayInnerWidth = bay.width - (s * 2);
            const bayBeamDeductedLength = Math.round(bayInnerWidth - (connectorDeduction * 2));
            profileItems.push({ id: uid(), name: `${profileType} Shelf Width Beam (Bay ${bayBeamDeductedLength}mm)`, lengthMm: bayBeamDeductedLength, qty: bay.shelves.length * 2, category: 'profile', note: `Connector deduction: ${connectorDeduction}mm x 2` });
            profileItems.push({ id: uid(), name: `${profileType} Shelf Depth Beam`, lengthMm: dLength, qty: bay.shelves.length * 2, category: 'profile' });
        }

        // Drawers
        if (bay.drawers.length > 0) {
            const slideLength = depth - 50; // Simplified
            hardwareItems.push({
                id: uid(),
                name: `Drawer Slides (${slideLength}mm)`,
                qty: bay.drawers.length,
                unit: 'pair',
                category: 'hardware'
            });

            bay.drawers.forEach(d => {
                // Drawer face width: default to inset unless drawerStyle is 'overlay'
                const faceWidth = drawerStyle === 'overlay' ? Math.round(bay.width + overlay * 2) : Math.round(bay.width - 10); // mm
                panelItems.push({
                    id: uid(),
                    name: `Drawer Face`,
                    qty: 1,
                    widthMm: faceWidth,
                    heightMm: Math.round(d.height),
                    thicknessMm: panelThickness,
                    category: 'panel'
                });
                hardwareItems.push({
                    id: uid(),
                    name: `Drawer Box/Body`,
                    qty: 1,
                    unit: 'set',
                    note: `Fits inside ${Math.round(bay.width)}mm width`,
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
        const hingeQty = layout.reduce((acc, bay) => {
            if (bay.type === 'bay' && bay.door?.enabled) {
                const numDoors = bay.door.type === 'double' ? 2 : 1;
                return acc + (numDoors * 2); // Assuming 2 hinges per door
            }
            return acc;
        }, 0);
        if (hingeQty > 0) {
            hardwareItems.push({ id: uid(), name: hingeName, qty: hingeQty, category: 'hardware', unit: 'piece' });
        }
    }

    // --- Connectors (angle brackets or internal locks) ---
    const totalShelves = layout.reduce((acc, n) => n.type === 'bay' ? acc + (n.shelves?.length || 0) : acc, 0);
    const numDividers = layout.reduce((acc, n) => n.type === 'divider' ? acc + 1 : acc, 0);
    const baseConnectors = 16; // 8 corners * 2 connections (simplified estimation)
    const shelfConnectors = totalShelves * 8; // 4 beams * 2 ends per shelf
    const dividerConnectors = numDividers * 4; // simplified estimate
    const totalConnectors = baseConnectors + shelfConnectors + dividerConnectors;

    if (totalConnectors > 0) {
        hardwareItems.push({ id: uid(), name: connectorSpec.name, qty: totalConnectors, category: 'hardware', unit: 'piece', note: connectorSpec.description });
    }

    return [...profileItems, ...panelItems, ...hardwareItems];
};
