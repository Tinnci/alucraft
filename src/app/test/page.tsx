'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Workspace } from '@/components/Scene/Workspace';
import HeavySpawner from '@/components/Scene/HeavySpawner';
import { useSearchParams } from 'next/navigation';

export default function TestPage() {
  const search = useSearchParams();
  const heavy = search?.get('heavy') === '1' || false;
  const numBoxes = Number(search?.get('boxes') ?? 400);
  const textureSize = Number(search?.get('tex') ?? 2048);
  const bgColor = '#ffffff';

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas shadows camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 20000 }}>
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 2000, 5000]} />
        <Workspace />
        <HeavySpawner enabled={heavy} boxes={Math.max(0, Math.min(2000, numBoxes))} textureSize={Math.max(64, Math.min(2048, textureSize))} />
      </Canvas>
    </div>
  );
}
