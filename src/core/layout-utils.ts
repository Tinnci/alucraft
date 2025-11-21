import { LayoutNode, ContainerNode, DividerNode, ItemNode } from './types';

export type Orientation = 'horizontal' | 'vertical';

/**
 * Compute numeric layout sizes for each node along the container's main axis.
 * Returns a Map of nodeId -> computedSize (number) where for divider nodes size is thickness.
 */
export function computeLayoutSizes(
  nodes: LayoutNode[],
  availableSpace: number,
  orientation: Orientation = 'horizontal',
  results: Map<string, number> = new Map()
): Map<string, number> {
  // keep orientation param referenced to avoid lint warnings; orientation used by recursion
  void orientation;
  if (!nodes || nodes.length === 0) return results;

  // Sum divider thickness
  const totalDividerWidth = nodes.reduce((acc, n) => acc + (n.type === 'divider' ? ((n as DividerNode).thickness ?? 0) : 0), 0);

  // Sum fixed sizes and count auto nodes for distribution
  let fixedSum = 0;
  let autoCount = 0;
  for (const n of nodes) {
    if (n.type === 'divider') continue;
    if (n.type === 'item') {
      const wconf = (n as ItemNode).config?.width;
      if (typeof wconf === 'number') fixedSum += wconf;
      else autoCount += 1;
    } else if (n.type === 'container') {
      const sizeConf = (n as ContainerNode).size;
      if (typeof sizeConf === 'number') fixedSum += sizeConf;
      else autoCount += 1;
    }
  }

  const remaining = Math.max(0, availableSpace - totalDividerWidth - fixedSum);
  const perAuto = autoCount > 0 ? Math.floor(remaining / autoCount) : 0;

  // Assign sizes and recurse
  for (const n of nodes) {
    if (n.type === 'divider') {
      const thickness = (n as DividerNode).thickness ?? 0;
      results.set(n.id, thickness);
      continue;
    }

    let computed = 0;
    if (n.type === 'item') {
      const wconf = (n as ItemNode).config?.width;
      computed = (typeof wconf === 'number') ? wconf as number : perAuto;
      results.set(n.id, computed);
    } else if (n.type === 'container') {
      const cn = n as ContainerNode;
      const sizeConf = cn.size;
      const assigned = (typeof sizeConf === 'number') ? (sizeConf as number) : perAuto;
      results.set(n.id, assigned);
      // Recurse into children; use container orientation as the axis for children
      computeLayoutSizes(cn.children, assigned, cn.orientation, results);
    }
  }

  return results;
}

export default computeLayoutSizes;
