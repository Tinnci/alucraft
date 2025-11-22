import { describe, it, expect } from 'vitest';
import { computeLayoutSizes, moveDividerInLayout } from './layout-utils';
import { LayoutNode } from './types';

describe('Layout Utils', () => {
    describe('computeLayoutSizes', () => {
        it('should distribute space equally for auto nodes', () => {
            const nodes: LayoutNode[] = [
                { id: '1', type: 'item', contentType: 'generic_bay', config: { width: 'auto', shelves: [], drawers: [] } },
                { id: 'div-1', type: 'divider', thickness: 8 },
                { id: '2', type: 'item', contentType: 'generic_bay', config: { width: 'auto', shelves: [], drawers: [] } }
            ];
            // Total space 1008. Divider 8. Remaining 1000. Each 500.
            const results = computeLayoutSizes(nodes as any, 1008);

            expect(results.get('1')).toBe(500);
            expect(results.get('2')).toBe(500);
        });

        it('should respect fixed widths', () => {
            const nodes: LayoutNode[] = [
                { id: '1', type: 'item', contentType: 'generic_bay', config: { width: 300, shelves: [], drawers: [] } },
                { id: '2', type: 'item', contentType: 'generic_bay', config: { width: 'auto', shelves: [], drawers: [] } }
            ];
            // Total 1000. Fixed 300. Remaining 700.
            const results = computeLayoutSizes(nodes, 1000);

            expect(results.get('1')).toBe(300);
            expect(results.get('2')).toBe(700);
        });
    });

    it('should handle insufficient space gracefully (negative widths)', () => {
        const nodes: LayoutNode[] = [
            { id: '1', type: 'item', contentType: 'generic_bay', config: { width: 600, shelves: [], drawers: [] } },
            { id: '2', type: 'item', contentType: 'generic_bay', config: { width: 600, shelves: [], drawers: [] } }
        ];
        // Total 1000. Fixed 1200.
        const results = computeLayoutSizes(nodes, 1000);
        expect(results.get('1')).toBe(600);
        expect(results.get('2')).toBe(600);
    });

    describe('moveDividerInLayout', () => {
        it('should resize adjacent bays correctly', () => {
            const layout: LayoutNode[] = [
                {
                    id: 'root',
                    type: 'container',
                    orientation: 'horizontal',
                    children: [
                        { id: 'bay-1', type: 'item', contentType: 'generic_bay', config: { width: 400, shelves: [], drawers: [] } },
                        { id: 'div-1', type: 'divider', thickness: 8 },
                        { id: 'bay-2', type: 'item', contentType: 'generic_bay', config: { width: 400, shelves: [], drawers: [] } }
                    ]
                }
            ];

            // Move divider right by 50mm.
            const result = moveDividerInLayout(layout, 'div-1', 50, 20, 1000);

            expect(result.success).toBe(true);
            const newRoot = result.layout[0] as any;
            const newBay1 = newRoot.children[0];
            const newBay2 = newRoot.children[2];

            expect(newBay1.config.width).toBe(450);
            expect(newBay2.config.width).toBe(350);
        });

        it('should prevent resizing below minWidth', () => {
            const layout: LayoutNode[] = [
                {
                    id: 'root',
                    type: 'container',
                    orientation: 'horizontal',
                    children: [
                        { id: 'bay-1', type: 'item', contentType: 'generic_bay', config: { width: 100, shelves: [], drawers: [] } },
                        { id: 'div-1', type: 'divider', thickness: 8 },
                        { id: 'bay-2', type: 'item', contentType: 'generic_bay', config: { width: 400, shelves: [], drawers: [] } }
                    ]
                }
            ];

            // Try to move left by 80mm. Bay-1 would be 20mm. Min is 40mm.
            const result = moveDividerInLayout(layout, 'div-1', -80, 40, 1000);

            const newRoot = result.layout[0] as any;
            const newBay1 = newRoot.children[0];

            expect(newBay1.config.width).toBe(40);
        });

        it('should convert auto width to fixed when resizing', () => {
            const layout: LayoutNode[] = [
                {
                    id: 'root',
                    type: 'container',
                    orientation: 'horizontal',
                    children: [
                        { id: 'bay-1', type: 'item', contentType: 'generic_bay', config: { width: 'auto', shelves: [], drawers: [] } },
                        { id: 'div-1', type: 'divider', thickness: 8 },
                        { id: 'bay-2', type: 'item', contentType: 'generic_bay', config: { width: 'auto', shelves: [], drawers: [] } }
                    ]
                }
            ];

            // Total width 1008. Profile size 20. Inner width = 1008 - 40 = 968.
            // Divider 8. Remaining 960.
            // Initial: 480 each.
            // Move right by 100.
            // bay-1 -> 580. bay-2 -> 380.

            const result = moveDividerInLayout(layout, 'div-1', 100, 20, 1008);

            const newRoot = result.layout[0] as any;
            const newBay1 = newRoot.children[0];
            const newBay2 = newRoot.children[2];

            expect(newBay1.config.width).toBe(580);
            expect(newBay2.config.width).toBe(380);
        });
    });
});
