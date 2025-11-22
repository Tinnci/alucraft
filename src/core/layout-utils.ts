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


export interface MoveDividerResult {
  layout: LayoutNode[];
  success: boolean;
}

export function moveDividerInLayout(
  layout: LayoutNode[],
  dividerId: string,
  delta: number,
  profileSize: number,
  totalWidth: number,
  minWidth: number = 40
): MoveDividerResult {
  // Find container holding this divider
  let found = null as null | { container: LayoutNode; parent?: LayoutNode };
  const find = (nodes: LayoutNode[], parent?: LayoutNode) => {
    for (const n of nodes) {
      if (n.type === 'container') {
        const cn = n as ContainerNode;
        if (cn.children.findIndex(c => c.id === dividerId) !== -1) {
          found = { container: cn, parent };
          return true;
        }
        if (find(cn.children, cn)) return true;
      }
    }
    return false;
  };
  find(layout);
  if (!found) return { layout, success: false };

  const container = found.container as ContainerNode;
  const idx = container.children.findIndex(c => c.id === dividerId);
  if (idx === -1 || idx === 0 || idx === container.children.length - 1) return { layout, success: false };

  const prev = container.children[idx - 1];
  const next = container.children[idx + 1];

  const s = profileSize;
  const inner = Math.max(0, totalWidth - (s * 2));
  const sizes = computeLayoutSizes(layout, inner, 'horizontal', new Map<string, number>());

  const newLayout = JSON.parse(JSON.stringify(layout)) as LayoutNode[];
  // helper to apply change to the same node in newLayout
  const replaceIn = (nodes: LayoutNode[]): LayoutNode[] => nodes.map((n: LayoutNode) => {
    if (n.type === 'container') {
      if ((n as ContainerNode).children.findIndex(c => c.id === dividerId) !== -1) {
        const cn = n as ContainerNode;
        const newChildren = cn.children.map((c: LayoutNode) => {
          if (c.id === prev.id) {
            // get current numeric prev width
            const prevWidthRaw = sizes.get(prev.id) ?? (prev.type === 'item' ? ((prev as ItemNode).config?.width ?? 0) : ((prev as ContainerNode).size ?? 0));
            const prevWidth = typeof prevWidthRaw === 'number' ? prevWidthRaw : Number(prevWidthRaw);
            const newPrevWidth = Math.max(minWidth, prevWidth + delta);
            if (c.type === 'item') {
              return { ...(c as ItemNode), config: { ...(c as ItemNode).config, width: newPrevWidth } } as LayoutNode;
            }
            if (c.type === 'container') {
              return { ...(c as ContainerNode), size: newPrevWidth } as LayoutNode;
            }
          }
          if (c.id === next.id) {
            // if next is fixed OR auto, shrink by delta to keep container size consistent
            // We convert auto to fixed here because dragging implies a specific size
            if (c.type === 'item') {
              const nextWidthRaw = sizes.get(next.id) ?? ((c as ItemNode).config?.width ?? 0);
              const nextWidth = typeof nextWidthRaw === 'number' ? nextWidthRaw : Number(nextWidthRaw);
              const newNextWidth = Math.max(minWidth, nextWidth - delta);
              return { ...(c as ItemNode), config: { ...(c as ItemNode).config, width: newNextWidth } } as LayoutNode;
            }
            if (c.type === 'container') {
              const nextWRaw = sizes.get(next.id) ?? (c as ContainerNode).size ?? 0;
              const nextW = typeof nextWRaw === 'number' ? nextWRaw : Number(nextWRaw);
              const newNextW = Math.max(minWidth, nextW - delta);
              return { ...(c as ContainerNode), size: newNextW } as LayoutNode;
            }
          }
          if (c.type === 'container') {
            return { ...c, children: replaceIn((c as ContainerNode).children) } as LayoutNode;
          }
          return c;
        });
        return { ...(cn as ContainerNode), children: newChildren } as LayoutNode;
      } else {
        return { ...(n as ContainerNode), children: replaceIn((n as ContainerNode).children) } as LayoutNode;
      }
    }
    return n;
  });

  const updatedLayout = replaceIn(newLayout);
  return { layout: updatedLayout, success: true };
}

export default computeLayoutSizes;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateLayout(nodes: LayoutNode[], visited = new Set<string>(), depth = 0): ValidationResult {
  if (depth > 50) {
    return { valid: false, error: 'Max layout depth exceeded (possible infinite recursion)' };
  }

  for (const node of nodes) {
    if (visited.has(node.id)) {
      return { valid: false, error: `Circular reference detected: Node ${node.id} is referenced multiple times in the tree.` };
    }
    visited.add(node.id);

    if (node.type === 'container') {
      const result = validateLayout((node as ContainerNode).children, new Set(visited), depth + 1);
      if (!result.valid) return result;
    }
  }

  return { valid: true };
}
