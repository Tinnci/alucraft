import { useMemo } from 'react';
import { computeLayoutPositions } from '@/core/layout-utils';
import { LayoutNode } from '@/core/types';

export function useLayoutPositions(
  layout: LayoutNode[],
  origin: [number, number, number],
  dims: [number, number, number],
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  return useMemo(() => computeLayoutPositions(layout, origin, dims, orientation), [layout, origin[0], origin[1], origin[2], dims[0], dims[1], dims[2], orientation]);
}

export default useLayoutPositions;
