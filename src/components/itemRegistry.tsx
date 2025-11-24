import React from 'react';
import { ItemNode } from '@/core/types';
import dynamic from 'next/dynamic';
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

// Loading Placeholder
const LoadingPlaceholder = () => (
  <Html center><div className="text-xs text-muted-foreground">Loading...</div></Html>
);

// Dynamic Imports
const Bay = dynamic(() => import('./Bay').then((mod) => mod.Bay), {
  loading: LoadingPlaceholder,
  ssr: false,
});

const BedRenderer = dynamic(() => import('./BedRenderer').then(mod => mod.BedRenderer), {
  loading: LoadingPlaceholder,
  ssr: false
});

const DeskRenderer = dynamic(() => import('./DeskRenderer').then(mod => mod.DeskRenderer), {
  loading: LoadingPlaceholder,
  ssr: false
});

const registry: Record<string, React.ComponentType<ItemRendererProps>> = {
  'generic_bay': Bay as unknown as React.ComponentType<ItemRendererProps>,
  'bed_frame': BedRenderer,
  'desk_unit': DeskRenderer,
  'wardrobe_section': Bay as unknown as React.ComponentType<ItemRendererProps>,
  'empty': ({ dims, position }) => (
    <group position={position}>
      <mesh>
        <boxGeometry args={dims} />
        <meshBasicMaterial wireframe color="gray" />
      </mesh>
    </group>
  )
};

export function getItemRenderer(type: string): React.ComponentType<ItemRendererProps> {
  return registry[type] || ErrorRenderer;
}

export function registerItemRenderer(type: string, renderer: React.ComponentType<ItemRendererProps>) {
  registry[type] = renderer;
}

export function unregisterItemRenderer(type: string) {
  delete registry[type];
}
