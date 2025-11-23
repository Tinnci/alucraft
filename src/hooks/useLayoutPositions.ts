import { useMemo } from 'react';
import { computeLayoutPositions } from '@/core/layout-utils';
import { LayoutNode } from '@/core/types';

export function useLayoutPositions(
  layout: LayoutNode[],
  origin: [number, number, number],
  dims: [number, number, number],
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  // 解构用于比较数值变化
  const [ox, oy, oz] = origin;
  const [dx, dy, dz] = dims;

  return useMemo(() => {
    // 在回调内部重新组装数组，确保传递给函数的是最新值
    return computeLayoutPositions(layout, [ox, oy, oz], [dx, dy, dz], orientation);
  }, [layout, ox, oy, oz, dx, dy, dz, orientation]);
}

export default useLayoutPositions;
