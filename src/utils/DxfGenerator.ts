import DxfWriter from 'dxf-writer';
import { DesignState } from '@/store/useDesignStore';
import { PROFILES } from '@/core/types';

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
        this.writer.addLayer('DIMENSIONS', DxfWriter.ACI.WHITE, 'CONTINUOUS');
    }

    public generate(): string {
        const { width, height, profileType, layout } = this.state;
        const profile = PROFILES[profileType];
        const s = profile.size;

        // Draw Outer Frame (Front View)
        // Left Pillar
        this.drawRect(-width / 2, -height / 2, s, height, 'FRAME');
        // Right Pillar
        this.drawRect(width / 2 - s, -height / 2, s, height, 'FRAME');
        // Top Beam
        this.drawRect(-width / 2 + s, height / 2 - s, width - 2 * s, s, 'FRAME');
        // Bottom Beam
        this.drawRect(-width / 2 + s, -height / 2, width - 2 * s, s, 'FRAME');

        // Draw Layout (Bays & Dividers)
        let currentX = -width / 2 + s;

        layout.forEach(node => {
            if (node.type === 'bay') {
                const bayWidth = node.width;

                // Draw Shelves in this Bay
                node.shelves.forEach(shelf => {
                    // Shelf Y is from center, convert to local from bottom left relative to bay start
                    // Shelf Y in store is relative to center 0
                    // Visual Y = shelf.y
                    // Rect Bottom Left Y = shelf.y - s/2
                    this.drawRect(currentX, shelf.y - s / 2, bayWidth, s, 'SHELF');
                });

                // Draw Drawers in this Bay (Simplified as Box)
                node.drawers.forEach(drawer => {
                    // Drawer Y is center of drawer front?
                    // In store: y is center position relative to cabinet center
                    // Drawer height is total height
                    const drawerBottomY = drawer.y - drawer.height / 2;
                    this.drawRect(currentX + 2, drawerBottomY, bayWidth - 4, drawer.height, 'DRAWER');
                });

                currentX += bayWidth;
            } else if (node.type === 'divider') {
                const divWidth = node.width; // Usually same as profile size? Or defined width
                // Divider is a vertical profile
                this.drawRect(currentX, -height / 2 + s, divWidth, height - 2 * s, 'FRAME');
                currentX += divWidth;
            }
        });

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
