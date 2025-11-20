'use client';

import React from 'react';
import { Line, Html } from '@react-three/drei';

interface DimensionLinesProps {
  width: number;
  height: number;
  depth: number;
  offset?: number; // distance from the object to place the labels
}

export function DimensionLines({ width, height, depth, offset = 60 }: DimensionLinesProps) {
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

  return (
    <group>
      {/* Width */}
      <Line points={[widthStart, widthEnd]} color="#444" lineWidth={1} dashed={false} />
      <Html position={[0, halfH + offset + 10, -halfD]} center>
        <div style={{ background: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, border: '1px solid #ddd' }}>{width} mm</div>
      </Html>

      {/* Height */}
      <Line points={[heightStart, heightEnd]} color="#444" lineWidth={1} dashed={false} />
      <Html position={[-halfW - offset - 20, 0, -halfD]} center>
        <div style={{ background: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, border: '1px solid #ddd' }}>{height} mm</div>
      </Html>

      {/* Depth */}
      <Line points={[depthStart, depthEnd]} color="#444" lineWidth={1} dashed={false} />
      <Html position={[halfW + offset + 10, halfH - 10, 0]} center>
        <div style={{ background: 'white', padding: '4px 8px', borderRadius: 4, fontSize: 12, border: '1px solid #ddd' }}>{depth} mm</div>
      </Html>
    </group>
  );
}

export default DimensionLines;
