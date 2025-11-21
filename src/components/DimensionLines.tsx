'use client';

import React, { useState } from 'react';
import { Line, Html } from '@react-three/drei';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

interface DimensionLinesProps {
  width: number;
  height: number;
  depth: number;
  offset?: number; // distance from the object to place the labels
}

interface EditableLabelProps {
  value: number;
  onChange: (val: number) => void;
}

function EditableLabel({ value, onChange }: EditableLabelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSubmit = () => {
    const num = parseInt(tempValue);
    if (!isNaN(num) && num > 0) {
      onChange(num);
    } else {
      setTempValue(value.toString());
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSubmit}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-20 px-2 py-1 text-xs font-mono text-black bg-white rounded shadow-lg outline-none border-2 border-blue-500"
      />
    );
  }

  return (
    <div
      className="bg-black/60 text-white backdrop-blur-sm px-2 py-1 rounded-full text-xs font-mono border border-white/20 cursor-pointer hover:bg-blue-500 transition-colors select-none"
      onClick={() => {
        setTempValue(value.toString());
        setIsEditing(true);
      }}
    >
      {value} mm
    </div>
  );
}

export function DimensionLines({ width, height, depth, offset = 60 }: DimensionLinesProps) {
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);
  const showDimensions = useDesignStore((state: DesignState) => state.showDimensions);

  if (!showDimensions) return null;

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
      <Line points={[widthStart, widthEnd]} color="#94a3b8" lineWidth={1} dashed={false} opacity={0.5} transparent />
      <Html position={[0, halfH + offset + 10, -halfD]} center zIndexRange={[100, 0]}>
        <EditableLabel value={width} onChange={setWidth} />
      </Html>

      {/* Height */}
      <Line points={[heightStart, heightEnd]} color="#94a3b8" lineWidth={1} dashed={false} opacity={0.5} transparent />
      <Html position={[-halfW - offset - 20, 0, -halfD]} center zIndexRange={[100, 0]}>
        <EditableLabel value={height} onChange={setHeight} />
      </Html>

      {/* Depth */}
      <Line points={[depthStart, depthEnd]} color="#94a3b8" lineWidth={1} dashed={false} opacity={0.5} transparent />
      <Html position={[halfW + offset + 10, halfH - 10, 0]} center zIndexRange={[100, 0]}>
        <EditableLabel value={depth} onChange={setDepth} />
      </Html>
    </group>
  );
}

export default DimensionLines;
