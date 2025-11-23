import DxfWriter from 'dxf-writer';
import { DesignState } from '@/store/useDesignStore';
import { isBayNode } from '@/core/types';
import { PROFILES } from '@/config/profiles';
import computeLayoutSizes from '@/core/layout-utils';

export class DxfGenerator {
    private writer: DxfWriter;
    private state: DesignState;

    constructor(state: DesignState) {
        this.writer = new DxfWriter();
        this.state = state;
        this.setupLayers();
    }

    private setupLayers() {
        this.writer.addLayer('FRAME', DxfWriter.ACI.RED, 'CONTINUOUS');
        this.writer.addLayer('SHELF', DxfWriter.ACI.BLUE, 'CONTINUOUS');
        this.writer.addLayer('DRAWER', DxfWriter.ACI.GREEN, 'CONTINUOUS');
        this.writer.addLayer('PANEL', DxfWriter.ACI.CYAN, 'CONTINUOUS');
        this.writer.addLayer('DIMENSIONS', DxfWriter.ACI.WHITE, 'CONTINUOUS');
    }

    public generate(): string {
        const { width, height, profileType, layout } = this.state;
        const profile = PROFILES[profileType];
        const s = profile.size;
        const slotDepth = profile.slotDepth || 6;
        const tolerance = this.state.tolerance || 1;
        // panelThickness not used in 2D front-view DXF, but stored in state for BOM

        // Draw Outer Frame (Front View)
        // Left Pillar
        this.drawRect(-width / 2, -height / 2, s, height, 'FRAME');
        // Right Pillar
        this.drawRect(width / 2 - s, -height / 2, s, height, 'FRAME');
        // Top Beam
        this.drawRect(-width / 2 + s, height / 2 - s, width - 2 * s, s, 'FRAME');
        // Bottom Beam
        this.drawRect(-width / 2 + s, -height / 2, width - 2 * s, s, 'FRAME');

        // Use the shared layout utility to compute widths for each node

        // Draw Layout (Bays & Dividers)
        let currentX = -width / 2 + s;

        const widths = computeLayoutSizes(layout, width - s * 2, 'horizontal', new Map<string, number>());

        layout.forEach(node => {
            if (isBayNode(node)) {
                const bayWidth = widths.get(node.id) ?? (typeof node.config?.width === 'number' ? node.config?.width : 0);

                // Draw Shelves in this Bay
                (node.config?.shelves ?? []).forEach(shelf => {
                    // Shelf Y is from center, convert to local from bottom left relative to bay start
                    // Shelf Y in store is relative to center 0
                    // Visual Y = shelf.y
                    // Rect Bottom Left Y = shelf.y - s/2
                    this.drawRect(currentX, shelf.y - s / 2, bayWidth, s, 'SHELF');
                });

                // Draw Drawers in this Bay (Simplified as Box)
                (node.config?.drawers ?? []).forEach(drawer => {
                    // Drawer Y is center of drawer front?
                    // In store: y is center position relative to cabinet center
                    // Drawer height is total height
                    const drawerBottomY = drawer.y - drawer.height / 2;
                    this.drawRect(currentX + 2, drawerBottomY, bayWidth - 4, drawer.height, 'DRAWER');
                });

                currentX += bayWidth;
            } else if (node.type === 'divider') {
                const divWidth = node.thickness; // Usually same as profile size? Or defined width
                // Divider is a vertical profile
                this.drawRect(currentX, -height / 2 + s, divWidth, height - 2 * s, 'FRAME');
                currentX += divWidth;
            }
        });

        // Draw Panels (simplified, front view for back panel, left/right panels as annotations)
        // Left Panel
        const leftPanelWidth = Math.round(this.state.depth - s * 2 + (slotDepth * 2) - tolerance);
        const leftPanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
        if (this.state.hasLeftPanel) {
            // draw at leftmost position for visualization
            this.writer.setActiveLayer('PANEL');
            this.drawRect(-width / 2 - leftPanelWidth - 10, -height / 2, leftPanelWidth, leftPanelHeight, 'PANEL');
        }
        // Right Panel
        const rightPanelWidth = leftPanelWidth;
        const rightPanelHeight = leftPanelHeight;
        if (this.state.hasRightPanel) {
            this.drawRect(width / 2 + 10, -height / 2, rightPanelWidth, rightPanelHeight, 'PANEL');
        }
        // Back panel (front view)
        if (this.state.hasBackPanel) {
            const backPanelWidth = Math.round(width - s * 2 + (slotDepth * 2) - tolerance);
            const backPanelHeight = Math.round(height - s * 2 + (slotDepth * 2) - tolerance);
            this.drawRect(-backPanelWidth / 2, -height / 2, backPanelWidth, backPanelHeight, 'PANEL');
        }

        return this.writer.toDxfString();
    }

    private drawRect(x: number, y: number, w: number, h: number, layer: string) {
        this.writer.setActiveLayer(layer);
        // DxfWriter draws lines.
        // Rect: (x,y) -> (x+w, y) -> (x+w, y+h) -> (x, y+h) -> (x,y)
        this.writer.drawLine(x, y, x + w, y);
        this.writer.drawLine(x + w, y, x + w, y + h);
        this.writer.drawLine(x + w, y + h, x, y + h);
        this.writer.drawLine(x, y + h, x, y);
    }
}
