'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { LayoutNode, ContainerNode, DividerNode, ItemNode } from '@/core/types';
import { PROFILES } from '@/config/profiles';
import computeLayoutSizes, { NodePosition } from '@/core/layout-utils';
import { getItemRenderer } from './itemRegistry';
import { Bay } from './Bay';
import useDesignStore from '@/store/useDesignStore';
import { ProfileInstance } from './AluProfile';
import { ProfileType } from '@/core/types';
import { DividerVisual } from './DividerVisual';

interface RecursiveRenderProps {
  node: LayoutNode;
  origin: [number, number, number]; // center point of the node
  dims: [number, number, number]; // width, height, depth
  profileType: ProfileType;
  height: number; // cabinet total height, passed for context
  depth: number; // cabinet total depth
  isShiftDown?: boolean;
  parentOrientation?: 'horizontal' | 'vertical';
  prevWidth?: number;
  nextWidth?: number;
  recursionDepth?: number;
  // Optional precomputed positions map (nodeId -> center/dims)
  positions?: Map<string, NodePosition>;
}

export const RecursiveRender = React.memo(function RecursiveRender({ node, origin, dims, profileType, height, depth: cabDepth, isShiftDown, parentOrientation, prevWidth = 0, nextWidth = 0, recursionDepth = 0, positions, ...groupProps }: RecursiveRenderProps) {
  // Defensive check: Limit recursion depth to prevent stack overflow
  if (recursionDepth > 25) {
    console.warn(`Max recursion depth exceeded in RecursiveRender (depth: ${recursionDepth}). Stopping recursion.`);
    return null;
  }
  const [w] = dims;
  const [x, y, z] = origin;

  // Render divider node - render as vertical profile pair like in CabinetFrame
  if (node.type === 'divider') {
    const s = PROFILES[profileType].size;
    const offset = s / 2;
    const vertLength = height - (s * 2);
    // Render two vertical pillars at center of this divider
    return <DividerVisual key={node.id} id={node.id} position={[x, y, z]} profileType={profileType} height={height} depth={cabDepth} vertLength={vertLength} offset={offset} isVertical={parentOrientation === 'vertical'} prevWidth={prevWidth} nextWidth={nextWidth} />;
  }

  // Render item node (bay)
  if (node.type === 'item') {
    // If positions map is available, use it to get precise location/dims
    const pos = positions as Map<string, NodePosition> | undefined;
    const info = pos?.get(node.id);
    const nodeCenter = info?.center ?? origin;
    const nodeDims = info?.dims ?? dims;

    // Use registry to get renderer (now guaranteed to return at least ErrorRenderer)
    const contentType = (node as ItemNode).contentType ?? 'generic_bay';
    const ItemRenderer = getItemRenderer(contentType);

    return <ItemRenderer node={node as ItemNode} position={nodeCenter} dims={nodeDims} height={height} depth={cabDepth} profileType={profileType} isShiftDown={isShiftDown} />;
  }

  // Render container node: split children horizontally or vertically
  if (node.type === 'container') {
    return (
      <ContainerVisual
        node={node as ContainerNode}
        origin={origin}
        dims={dims}
        profileType={profileType}
        height={height}
        depth={cabDepth}
        isShiftDown={isShiftDown}
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
  if (prev.profileType !== next.profileType) return false;
  if (prev.height !== next.height) return false;
  if (prev.depth !== next.depth) return false;
  if (prev.isShiftDown !== next.isShiftDown) return false;

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
  profileType: ProfileType;
  height: number;
  depth: number;
  isShiftDown?: boolean;
  recursionDepth: number;
  positions?: Map<string, NodePosition>;
}

function ContainerVisual({ node, origin, dims, profileType, height, depth: cabDepth, isShiftDown, recursionDepth, positions, ...groupProps }: ContainerVisualProps) {
  const [w, h, d] = dims;
  const [x, y, z] = origin;
  const container = node;
  const isVert = container.orientation === 'vertical';

  // Defensive check: Ensure children is an array - memoize to avoid fluctuating references
  const children = useMemo(() => Array.isArray(container.children) ? container.children : [], [container.children]);
  const availableSpace = (isVert ? h : w);

  // OPTIMIZATION: Memoize layout calc to prevent thrashing on every frame
  // If positions map is provided, we don't need to compute layout sizes locally
  const sizes = useMemo(() => {
    if (positions) return new Map<string, number>();
    return computeLayoutSizes(children, availableSpace, isVert ? 'vertical' : 'horizontal', new Map<string, number>());
  }, [children, availableSpace, isVert, positions]);

  const start = isVert ? y - h / 2 : x - w / 2;
  const childSizes = children.map((child) => (sizes.get(child.id) ?? (child.type === 'divider' ? ((child as DividerNode).thickness ?? 0) : 0)));

  const childInfos: { center: [number, number, number]; dims: [number, number, number] }[] = [];
  let cur = start;
  for (let i = 0; i < childSizes.length; i++) {
    const size = childSizes[i];
    const center = isVert ? [x, cur + size / 2, z] as [number, number, number] : [cur + size / 2, y, z] as [number, number, number];
    const dimsChild: [number, number, number] = isVert ? [w, size, d] : [size, h, d];
    childInfos.push({ center, dims: dimsChild });
    cur += size;
  }

  return (
    <group position={[x, y, z]} {...groupProps}>
      {children.map((child, idx) => {
        const info = childInfos[idx];
        // Prefer supplied positions map (from props) over fallback
        const posMap = positions as Map<string, NodePosition> | undefined;
        const pref = posMap?.get(child.id);
        const childOrigin = pref?.center ?? info.center;
        const childDims = pref?.dims ?? info.dims;
        // prev/next width computation using positions map (dimensions along main axis)
        let prevWidth = 0;
        let nextWidth = 0;
        if (child.type === 'divider') {
          const prevId = children[idx - 1]?.id;
          const nextId = children[idx + 1]?.id;
          if (pref) {
            // if posMap supplied, derive axis size from child dims using the current container orientation
            const axisPrev = container.orientation === 'vertical' ? (posMap?.get(prevId as string)?.dims[1] ?? 0) : (posMap?.get(prevId as string)?.dims[0] ?? 0);
            const axisNext = container.orientation === 'vertical' ? (posMap?.get(nextId as string)?.dims[1] ?? 0) : (posMap?.get(nextId as string)?.dims[0] ?? 0);
            prevWidth = axisPrev;
            nextWidth = axisNext;
          } else {
            prevWidth = prevId ? (sizes.get(prevId) ?? 0) : 0;
            nextWidth = nextId ? (sizes.get(nextId) ?? 0) : 0;
          }
        }

        return (
          <RecursiveRender
            key={child.id}
            node={child}
            origin={childOrigin}
            dims={childDims}
            profileType={profileType}
            height={height}
            depth={cabDepth}
            isShiftDown={isShiftDown}
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
