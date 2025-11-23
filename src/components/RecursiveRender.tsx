'use client';

import React, { useMemo } from 'react';
import { ContainerNode, ItemNode, LayoutNode } from '@/core/types';
import { PROFILES } from '@/config/profiles';
import { NodePosition } from '@/core/layout-utils';
import { useDesignContext } from '@/context/DesignContext';
import { getItemRenderer } from './itemRegistry';
import { getItemComponentId, getItemProps } from '@/core/item-utils';
import { DividerVisual } from './DividerVisual';

interface RecursiveRenderProps {
  node: LayoutNode;
  origin: [number, number, number]; // center point of the node
  dims: [number, number, number]; // width, height, depth
  // profileType, height, depth and isShiftDown are pulled from DesignContext
  parentOrientation?: 'horizontal' | 'vertical';
  prevWidth?: number;
  nextWidth?: number;
  recursionDepth?: number;
  // Optional precomputed positions map (nodeId -> center/dims)
  positions?: Map<string, NodePosition>;
}

export const RecursiveRender = React.memo(function RecursiveRender({
  node,
  origin,
  dims,
  parentOrientation,
  prevWidth = 0,
  nextWidth = 0,
  recursionDepth = 0,
  positions,
  ...groupProps
}: RecursiveRenderProps) {
  const { profileType, height } = useDesignContext();
  // Defensive check: Limit recursion depth to prevent stack overflow
  if (recursionDepth > 25) {
    console.warn(`Max recursion depth exceeded in RecursiveRender (depth: ${recursionDepth}). Stopping recursion.`);
    return null;
  }
  const [, ,] = dims;
  const [x, y, z] = origin;

  // Render divider node - render as vertical profile pair like in CabinetFrame
  if (node.type === 'divider') {
    // require positions map for divider rendering; fallback to origin if missing
    if (!positions) {
      console.warn('RecursiveRender: positions map is required to render layout. Divider will not render.');
      return null;
    }
    const s = PROFILES[profileType].size;
    const offset = s / 2;
    const vertLength = height - (s * 2);
    // Render two vertical pillars at center of this divider
    return <DividerVisual key={node.id} id={node.id} position={[x, y, z]} vertLength={vertLength} offset={offset} isVertical={parentOrientation === 'vertical'} prevWidth={prevWidth} nextWidth={nextWidth} />;
  }

  // Render item node (bay)
  if (node.type === 'item') {
    // If positions map is available, use it to get precise location/dims
    if (!positions) {
      console.warn('RecursiveRender: positions map is required to render item nodes. Skipping node:', node.id);
      return null;
    }
    const info = positions.get(node.id);
    if (!info) return null;
    const nodeCenter = info.center;
    const nodeDims = info.dims;

    // Use registry to get renderer (now guaranteed to return at least ErrorRenderer)
    const compId = getItemComponentId(node as ItemNode);
    const ItemRenderer = getItemRenderer(compId);

    // Use React.createElement to avoid "creating components during render" error
    return React.createElement(ItemRenderer, {
      node: node as ItemNode,
      position: nodeCenter,
      dims: nodeDims
    });
  }

  // Render container node: split children horizontally or vertically
  if (node.type === 'container') {
    return (
      <ContainerVisual
        node={node as ContainerNode}
        origin={origin}
        dims={dims}
        recursionDepth={recursionDepth}
        positions={positions}
        {...groupProps}
      />
    );
  }

  return null;
}, (prev, next) => {
  // Custom comparison for React.memo
  // 1. Check simple props
  if (prev.node.id !== next.node.id) return false;

  // 2. Check layout changes via positions map
  // If map ref changed, check if THIS node's position changed
  if (prev.positions !== next.positions) {
    const prevPos = prev.positions?.get(prev.node.id);
    const nextPos = next.positions?.get(next.node.id);

    // If one is missing and other isn't -> changed
    if (!prevPos !== !nextPos) return false;

    // If both exist, compare values
    if (prevPos && nextPos) {
      if (prevPos.center[0] !== nextPos.center[0] ||
        prevPos.center[1] !== nextPos.center[1] ||
        prevPos.center[2] !== nextPos.center[2]) return false;
      if (prevPos.dims[0] !== nextPos.dims[0] ||
        prevPos.dims[1] !== nextPos.dims[1] ||
        prevPos.dims[2] !== nextPos.dims[2]) return false;
    }
  }

  // 3. Check node config changes (deep compare config if needed, or ref check)
  // For now, we assume immutable updates to store mean ref change on node = change
  if (prev.node !== next.node) return false;

  return true;
});

interface ContainerVisualProps {
  node: ContainerNode;
  origin: [number, number, number];
  dims: [number, number, number];
  recursionDepth: number;
  positions?: Map<string, NodePosition>;
}

function ContainerVisual({ node, origin, recursionDepth, positions, ...groupProps }: ContainerVisualProps) {
  const [x, y, z] = origin;
  const container = node;

  // Defensive check: Ensure children is an array - memoize to avoid fluctuating references
  const children = useMemo(() => Array.isArray(container.children) ? container.children : [], [container.children]);
  // availableSpace is no longer needed; positions map supplies child sizes.

  // IMPORTANT: We require `positions` to be passed in by the parent (CabinetFrame)
  // The positions map should already contain center/dims for every child in this container.
  if (!positions) {
    console.warn('ContainerVisual: missing positions map. Cannot render container children without externally-computed positions.');
    return null;
  }
  const childInfos: { center: [number, number, number]; dims: [number, number, number] }[] = children.map((child) => {
    const p = positions.get(child.id);
    if (!p) return { center: origin, dims: [0, 0, 0] };
    return { center: p.center, dims: p.dims };
  });

  return (
    <group position={[x, y, z]} {...groupProps}>
      {children.map((child, idx) => {
        const info = childInfos[idx];
        // Prefer supplied positions map (from props) over fallback
        const childOrigin = info.center;
        const childDims = info.dims;
        // prev/next width computation using positions map (dimensions along main axis)
        let prevWidth = 0;
        let nextWidth = 0;
        if (child.type === 'divider') {
          const prevId = children[idx - 1]?.id;
          const nextId = children[idx + 1]?.id;
          // Use positions map to compute adjacent widths along container axis
          const prevPos = prevId ? positions.get(prevId) : undefined;
          const nextPos = nextId ? positions.get(nextId) : undefined;
          prevWidth = prevPos ? (container.orientation === 'vertical' ? prevPos.dims[1] : prevPos.dims[0]) : 0;
          nextWidth = nextPos ? (container.orientation === 'vertical' ? nextPos.dims[1] : nextPos.dims[0]) : 0;
        }

        return (
          <RecursiveRender
            key={child.id}
            node={child}
            origin={childOrigin}
            dims={childDims}
            parentOrientation={container.orientation}
            prevWidth={prevWidth}
            nextWidth={nextWidth}
            recursionDepth={recursionDepth + 1}
            positions={positions}
          />
        );
      })}
    </group>
  );
}

export default RecursiveRender;
