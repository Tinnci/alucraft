import React from 'react';
import { ItemNode } from '@/core/types';
import { Bay } from './Bay';
import { Html } from '@react-three/drei';

export interface ItemRendererProps {
  node: ItemNode;
  position: [number, number, number];
  dims: [number, number, number];
  // layout and design context values (height, depth, profileType, isShiftDown) are provided via DesignContext, not props
}

// Placeholder Error Renderer
const ErrorRenderer: React.FC<ItemRendererProps> = ({ node }) => {
  return (
    <Html position={[0, 0, 0]} center>
      <div className="bg-red-500 text-white p-2 rounded text-xs">
        Unknown Type: {node.contentType}
      </div>
    </Html>
  );
};

// Placeholder Bed Renderer
const BedRenderer: React.FC<ItemRendererProps> = ({ dims, position }) => {
  const [w, h, d] = dims;
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="orange" opacity={0.5} transparent />
      </mesh>
      <Html center>
        <div className="bg-orange-500 text-white p-1 rounded text-xs">Bed Frame</div>
      </Html>
    </group>
  );
};

// Placeholder Desk Renderer
const DeskRenderer: React.FC<ItemRendererProps> = ({ dims, position }) => {
  const [w, h, d] = dims;
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color="blue" opacity={0.5} transparent />
      </mesh>
      <Html center>
        <div className="bg-blue-500 text-white p-1 rounded text-xs">Desk Unit</div>
      </Html>
    </group>
  );
};

const registry: Record<string, React.FC<ItemRendererProps>> = {
  'generic_bay': Bay as unknown as React.FC<ItemRendererProps>,
  'bed_frame': BedRenderer,
  'desk_unit': DeskRenderer,
  'wardrobe_section': Bay as unknown as React.FC<ItemRendererProps>,
  'empty': ({ dims, position }) => (
    <group position={position}>
      <mesh>
        <boxGeometry args={dims} />
        <meshBasicMaterial wireframe color="gray" />
      </mesh>
    </group>
  )
};

export function getItemRenderer(type: string): React.FC<ItemRendererProps> {
  return registry[type] || ErrorRenderer;
}

export function registerItemRenderer(type: string, renderer: React.FC<ItemRendererProps>) {
  registry[type] = renderer;
}

export function unregisterItemRenderer(type: string) {
  delete registry[type];
}
