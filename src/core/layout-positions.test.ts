import { computeLayoutPositions } from './layout-utils';
import { LayoutNode } from './types';

describe('computeLayoutPositions', () => {
  test('computes basic horizontal positions', () => {
    const layout: LayoutNode[] = [
      { id: 'a', type: 'item', contentType: 'generic_bay', config: { width: 100 } } as any,
      { id: 'd1', type: 'divider', thickness: 20 } as any,
      { id: 'b', type: 'item', contentType: 'generic_bay', config: { width: 80 } } as any,
    ];

    const positions = computeLayoutPositions(layout, [0, 0, 0], [200, 100, 100]);
    expect(positions.size).toBe(3);
    const a = positions.get('a');
    const d1 = positions.get('d1');
    const b = positions.get('b');
    expect(a).toBeDefined();
    expect(d1).toBeDefined();
    expect(b).toBeDefined();
    // widths should match
    expect(a?.dims[0]).toBeCloseTo(100);
    expect(b?.dims[0]).toBeCloseTo(80);
    expect(d1?.dims[0]).toBeCloseTo(20);
  });
});
