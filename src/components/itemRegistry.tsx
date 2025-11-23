import React from 'react';
import { Bay } from './Bay';
import { ItemNode } from '@/core/types';

export type ItemRendererProps = {
  node: ItemNode;
  position: [number, number, number];
  dims: [number, number, number];
  height: number;
  depth: number;
  profileType: any;
  isShiftDown?: boolean;
};

export type ItemRenderComponent = React.FC<ItemRendererProps>;

const genericRenderer: ItemRenderComponent = ({ node, position, dims, height, depth, profileType, isShiftDown }) => {
  // The Bay component accepts bay config and computed width (dims[0] for horizontal)
  return (
    <group position={position}>
      <Bay
        key={node.id}
        bay={node as any}
        position={[0, 0, 0]}
        height={height}
        depth={depth}
        profileType={profileType}
        isShiftDown={isShiftDown}
        computedWidth={dims[0]}
      />
    </group>
  );
};

import { Html } from '@react-three/drei';

export const ErrorRenderer: ItemRenderComponent = ({ node, position, dims }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={dims} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
      <Html position={[0, 0, 0]} center>
        <div className="bg-red-500 text-white p-2 rounded text-xs whitespace-nowrap">
          Unknown Type: {node.contentType}
        </div>
      </Html>
    </group>
  );
};

const registry: Record<string, ItemRenderComponent> = {
  'generic_bay': genericRenderer,
  'wardrobe_section': genericRenderer,
  'empty': () => null,
};

export function getItemRenderer(type: string): ItemRenderComponent {
  return registry[type] || ErrorRenderer;
}

export default getItemRenderer;
