import { describe, it, expect } from 'vitest';
import { computeLayoutSizes, moveDividerInLayout } from './layout-utils';
import { LayoutNode, ContainerNode, ItemNode, DividerNode } from './types';

describe('computeLayoutSizes', () => {
    it('should handle 1 fixed item + 1 auto item', () => {
        const nodes: LayoutNode[] = [
            { type: 'item', id: '1', config: { width: 100 } } as ItemNode,
            { type: 'item', id: '2', config: { width: 'auto' } } as ItemNode,
        ];
        const availableSpace = 300;
        const results = computeLayoutSizes(nodes, availableSpace);
        expect(results.get('1')).toBe(100);
        expect(results.get('2')).toBe(200);
    });

    it('should distribute space equally between 2 auto items', () => {
        const nodes: LayoutNode[] = [
            { type: 'item', id: '1', config: { width: 'auto' } } as ItemNode,
            { type: 'item', id: '2', config: { width: 'auto' } } as ItemNode,
        ];
        const availableSpace = 300;
        const results = computeLayoutSizes(nodes, availableSpace);
        expect(results.get('1')).toBe(150);
        expect(results.get('2')).toBe(150);
    });

    it('should handle nested containers', () => {
        const nodes: LayoutNode[] = [
            {
                type: 'container',
                id: 'c1',
                size: 'auto',
                orientation: 'horizontal',
                children: [
                    { type: 'item', id: 'c1-1', config: { width: 'auto' } } as ItemNode,
                    { type: 'item', id: 'c1-2', config: { width: 'auto' } } as ItemNode,
                ],
            } as ContainerNode,
            { type: 'item', id: '2', config: { width: 100 } } as ItemNode,
        ];
        const availableSpace = 300;
        const results = computeLayoutSizes(nodes, availableSpace);

        // Container gets 200 (300 - 100)
        expect(results.get('c1')).toBe(200);
        expect(results.get('2')).toBe(100);

        // Children of container get 100 each (200 / 2)
        expect(results.get('c1-1')).toBe(100);
        expect(results.get('c1-2')).toBe(100);
    });
});

describe('moveDividerInLayout', () => {
    const profileSize = 20;
    const totalWidth = 500; // 500 total, 20 padding on each side = 460 inner

    it('should resize two fixed items when dragging divider', () => {
        const layout: LayoutNode[] = [
            {
                type: 'container',
                id: 'root',
                children: [
                    { type: 'item', id: 'left', config: { width: 200 } } as ItemNode,
                    { type: 'divider', id: 'div1', thickness: 20 } as DividerNode,
                    { type: 'item', id: 'right', config: { width: 240 } } as ItemNode,
                ],
            } as ContainerNode,
        ];

        // Move divider 10px to the right
        const result = moveDividerInLayout(layout, 'div1', 10, profileSize, totalWidth);

        expect(result.success).toBe(true);
        const container = result.layout[0] as ContainerNode;
        const left = container.children[0] as ItemNode;
        const right = container.children[2] as ItemNode;

        expect(left.config?.width).toBe(210);
        expect(right.config?.width).toBe(230);
    });

    it('should convert auto to fixed when dragging', () => {
        const layout: LayoutNode[] = [
            {
                type: 'container',
                id: 'root',
                children: [
                    { type: 'item', id: 'left', config: { width: 'auto' } } as ItemNode,
                    { type: 'divider', id: 'div1', thickness: 20 } as DividerNode,
                    { type: 'item', id: 'right', config: { width: 'auto' } } as ItemNode,
                ],
            } as ContainerNode,
        ];

        // Inner width = 500 - 2*20 (outer padding) = 460
        // Divider = 20
        // Remaining = 440
        // Auto items = 220 each initially

        // Move divider 10px to the right
        const result = moveDividerInLayout(layout, 'div1', 10, profileSize, totalWidth);

        expect(result.success).toBe(true);
        const container = result.layout[0] as ContainerNode;
        const left = container.children[0] as ItemNode;
        const right = container.children[2] as ItemNode;

        // Should be converted to fixed numbers
        expect(left.config?.width).toBe(230); // 220 + 10
        expect(right.config?.width).toBe(210); // 220 - 10
    });

    it('should respect minWidth boundary', () => {
        const layout: LayoutNode[] = [
            {
                type: 'container',
                id: 'root',
                children: [
                    { type: 'item', id: 'left', config: { width: 50 } } as ItemNode,
                    { type: 'divider', id: 'div1', thickness: 20 } as DividerNode,
                    { type: 'item', id: 'right', config: { width: 390 } } as ItemNode,
                ],
            } as ContainerNode,
        ];

        // Try to move left by -20 (resulting in 30, which is < 40 minWidth)
        const result = moveDividerInLayout(layout, 'div1', -20, profileSize, totalWidth);

        expect(result.success).toBe(true);
        const container = result.layout[0] as ContainerNode;
        const left = container.children[0] as ItemNode;

        expect(left.config?.width).toBe(40); // Should be capped at minWidth
    });
});
