'use client';

import React from 'react';
import { Line, Html } from '@react-three/drei';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

interface DimensionLinesProps {
  width: number;
  height: number;
  depth: number;
  offset?: number; // distance from the object to place the labels
}

export function DimensionLines({ width, height, depth, offset = 60 }: DimensionLinesProps) {
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);

  const halfW = width / 2;
  const halfH = height / 2;
  const halfD = depth / 2;

  // Top width line
  const widthStart: [number, number, number] = [-halfW, halfH + offset, -halfD];
  const widthEnd: [number, number, number] = [halfW, halfH + offset, -halfD];

  // Height line (left side)
  const heightStart: [number, number, number] = [-halfW - offset, -halfH, -halfD];
  const heightEnd: [number, number, number] = [-halfW - offset, halfH, -halfD];

  // Depth line (front to back, displayed on top-right corner)
  const depthStart: [number, number, number] = [halfW + offset, halfH, -halfD];
  const depthEnd: [number, number, number] = [halfW + offset, halfH, halfD];

  const labelStyle = "bg-black/60 text-white backdrop-blur-sm px-2 py-1 rounded-full text-xs font-mono border border-white/20 cursor-pointer hover:bg-blue-500 transition-colors select-none";

  const handleEdit = (current: number, setter: (v: number) => void) => {
    const val = prompt('Enter new dimension (mm):', current.toString());
    if (val) {
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) setter(num);
    }
  };

  return (
    <group>
      {/* Width */}
      <Line points={[widthStart, widthEnd]} color="#94a3b8" lineWidth={1} dashed={false} opacity={0.5} transparent />
      <Html position={[0, halfH + offset + 10, -halfD]} center>
        <div className={labelStyle} onClick={() => handleEdit(width, setWidth)}>{width} mm</div>
      </Html>

      {/* Height */}
      <Line points={[heightStart, heightEnd]} color="#94a3b8" lineWidth={1} dashed={false} opacity={0.5} transparent />
      <Html position={[-halfW - offset - 20, 0, -halfD]} center>
        <div className={labelStyle} onClick={() => handleEdit(height, setHeight)}>{height} mm</div>
      </Html>

      {/* Depth */}
      <Line points={[depthStart, depthEnd]} color="#94a3b8" lineWidth={1} dashed={false} opacity={0.5} transparent />
      <Html position={[halfW + offset + 10, halfH - 10, 0]} center>
        <div className={labelStyle} onClick={() => handleEdit(depth, setDepth)}>{depth} mm</div>
      </Html>
    </group>
  );
}

export default DimensionLines;
