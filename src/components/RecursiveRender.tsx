'use client';

import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { LayoutNode, ContainerNode, DividerNode, ItemNode, PROFILES } from '@/core/types';
import computeLayoutSizes from '@/core/layout-utils';
import { Bay } from './CabinetFrame';
import useDesignStore from '@/store/useDesignStore';
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
  parentOrientation?: 'horizontal' | 'vertical';
}

export function RecursiveRender({ node, origin, dims, profileType, height, depth: cabDepth, isShiftDown, parentOrientation, ...groupProps }: RecursiveRenderProps) {
  const [w, h, d] = dims;
  const [x, y, z] = origin;

  // Render divider node - render as vertical profile pair like in CabinetFrame
  if (node.type === 'divider') {
    const s = PROFILES[profileType].size;
    const offset = s / 2;
    const vertLength = height - (s * 2);
    // Render two vertical pillars at center of this divider
  return <DividerVisual key={node.id} id={node.id} position={[x, y, z]} profileType={profileType} height={height} depth={cabDepth} vertLength={vertLength} offset={offset} isVertical={parentOrientation === 'vertical'} />;
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
              parentOrientation={container.orientation}
            />
          );
        })}
      </group>
    );
  }

  return null;
}

interface DividerVisualProps {
  id: string;
  position: [number, number, number];
  profileType: ProfileType;
  height: number;
  depth: number;
  vertLength: number;
  offset: number;
  isVertical: boolean;
}

function DividerVisual({ id, position, profileType, height, depth, vertLength, offset, isVertical }: DividerVisualProps) {
  type TransformControlRef = { addEventListener?: (t: string, h: (e: { value: boolean }) => void) => void; removeEventListener?: (t: string, h: (e: { value: boolean }) => void) => void };
  const transformRef = useRef<TransformControlRef | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const { controls } = useThree();
  const moveDivider = useDesignStore((s) => s.moveDivider);
  const startRef = useRef<number>(0);
  const axis: 'x' | 'y' = isVertical ? 'y' : 'x';

  useEffect(() => {
    const tc = transformRef.current;
    if (!tc) return;
  const handler = (e: { value: boolean }) => {
  const dragging = !!e.value;
  if (!dragging) {
        // On drag end, compute delta relative to start
        if (groupRef.current) {
          const newPos = axis === 'x' ? (groupRef.current.position.x) : (groupRef.current.position.y);
          const delta = newPos - startRef.current;
          if (Math.abs(delta) >= 1) {
            moveDivider(id, delta);
          }
          // reset visual position - store will re-render
          if (axis === 'x') groupRef.current.position.x = 0; else groupRef.current.position.y = 0;
        }
  if (controls) (controls as unknown as { enabled?: boolean }).enabled = true;
  } else {
  if (controls) (controls as unknown as { enabled?: boolean }).enabled = false;
        if (groupRef.current) {
          startRef.current = axis === 'x' ? groupRef.current.position.x : groupRef.current.position.y;
        }
      }
    };
    tc.addEventListener?.('dragging-changed', handler);
    return () => tc.removeEventListener?.('dragging-changed', handler);
  }, [controls, moveDivider, id, axis]);

  return (
    <group position={position} ref={groupRef}>
  <TransformControls ref={(node) => { transformRef.current = node as unknown as TransformControlRef; }} object={groupRef as unknown as React.MutableRefObject<THREE.Object3D>} mode="translate" size={0.8} showY={isVertical} showZ={false} showX={!isVertical}>
        <group>
          <ProfileInstance length={vertLength} position={[0, -height / 2 + (profileType ? (PROFILES[profileType].size) : 0), depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
          <ProfileInstance length={vertLength} position={[0, -height / 2 + (profileType ? (PROFILES[profileType].size) : 0), -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />
        </group>
      </TransformControls>
    </group>
  );
}

export default RecursiveRender;
