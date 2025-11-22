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
            // Note: In the actual implementation, divider thickness comes from the node.
            // We need to ensure the test node matches the type expected.
            // Casting for test simplicity if needed, but better to match type.
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
            // bay-1 should become 450. bay-2 should become 350.
            // Total width irrelevant for this specific logic as it uses deltas on existing widths,
            // but we pass a dummy totalWidth.
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
            // Logic: newPrevWidth = Math.max(minWidth, prevWidth + delta)
            // 100 + (-80) = 20. Max(40, 20) = 40.
            // So delta effectively becomes -60.

            const result = moveDividerInLayout(layout, 'div-1', -80, 20, 1000);

            const newRoot = result.layout[0] as any;
            const newBay1 = newRoot.children[0];

            expect(newBay1.config.width).toBe(40);
        });
    });
});
