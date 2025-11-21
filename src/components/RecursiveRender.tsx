'use client';

import React from 'react';
import { LayoutNode, ContainerNode, DividerNode, ItemNode, PROFILES } from '@/core/types';
import computeLayoutSizes from '@/core/layout-utils';
import { Bay } from './CabinetFrame';
import { ProfileInstance } from './AluProfile';
import { ProfileType } from '@/core/types';

interface RecursiveRenderProps {
  node: LayoutNode;
  origin: [number, number, number]; // center point of the node
  dims: [number, number, number]; // width, height, depth
  profileType: ProfileType;
  height: number; // cabinet total height, passed for context
  depth: number; // cabinet total depth
  isShiftDown?: boolean;
}

export function RecursiveRender({ node, origin, dims, profileType, height, depth: cabDepth, isShiftDown, ...groupProps }: RecursiveRenderProps) {
  const [w, h, d] = dims;
  const [x, y, z] = origin;

  // Render divider node - render as vertical profile pair like in CabinetFrame
  if (node.type === 'divider') {
    const s = PROFILES[profileType].size;
    const offset = s / 2;
    const vertLength = height - (s * 2);
    // Render two vertical pillars at center of this divider
    return (
      <group position={[x, y, z]}>
        <ProfileInstance length={vertLength} position={[0, -height / 2 + s, cabDepth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
        <ProfileInstance length={vertLength} position={[0, -height / 2 + s, -cabDepth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
    );
  }

  // Render item node (bay)
  if (node.type === 'item') {
    // The existing `Bay` component expects a `bay` with config width; we can just render it at computed center
    return (
      <group position={[x, y, z]} {...groupProps}>
        <Bay key={node.id} bay={node as ItemNode} position={[0, 0, 0]} height={height} depth={cabDepth} profileType={profileType} isShiftDown={isShiftDown} computedWidth={w} />
      </group>
    );
  }

  // Render container node: split children horizontally or vertically
  if (node.type === 'container') {
    const container = node as ContainerNode;
    const isVert = container.orientation === 'vertical';

    const children = container.children;

    // Count items participating in size distribution

  const availableSpace = (isVert ? h : w);

  // Compute fixed widths vs auto (kept briefly for reference when using the shared utility)
    // children sizing handled by computeLayoutSizes

  // Use computeLayoutSizes for consistent sizing
  const sizes = computeLayoutSizes(children, availableSpace, isVert ? 'vertical' : 'horizontal', new Map<string, number>());

    // cursor starts at left or bottom edge
    const start = isVert ? y - h / 2 : x - w / 2;
  const childSizes = children.map((child) => (sizes.get(child.id) ?? (child.type === 'divider' ? ((child as DividerNode).thickness ?? 0) : 0)));

    // Compute child centers and dims without mutating during render
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
          return (
            <RecursiveRender
              key={child.id}
              node={child}
              origin={info.center}
              dims={info.dims}
              profileType={profileType}
              height={height}
              depth={cabDepth}
              isShiftDown={isShiftDown}
            />
          );
        })}
      </group>
    );
  }

  return null;
}

export default RecursiveRender;
