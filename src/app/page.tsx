'use client';

import { useRef, useEffect, JSX } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stage, Box, TransformControls } from '@react-three/drei';
import { ProfileType, PROFILES } from '@/core/types';
import { CabinetFrame } from '@/components/CabinetFrame';
import { DoorPanel } from '@/components/DoorPanel';
import { BOMPanel } from '@/components/BOMPanel';
import { Toolbar } from '@/components/Toolbar';
import { FloatingControls } from '@/components/FloatingControls';
import DimensionLines from '@/components/DimensionLines';

export default function Home() {
  // Extract global design state and setters from the store
  const profileType = useDesignStore((state: DesignState) => state.profileType);
  const overlay = useDesignStore((state: DesignState) => state.overlay);
  const result = useDesignStore((state: DesignState) => state.result);
  const width = useDesignStore((state: DesignState) => state.width);
  const height = useDesignStore((state: DesignState) => state.height);
  const depth = useDesignStore((state: DesignState) => state.depth);
  const hasLeftWall = useDesignStore((state: DesignState) => state.hasLeftWall);
  const hasRightWall = useDesignStore((state: DesignState) => state.hasRightWall);
  const isDoorOpen = useDesignStore((state: DesignState) => state.isDoorOpen);
  const doorCount = useDesignStore((state: DesignState) => state.doorCount);
  const shelves = useDesignStore((state: DesignState) => state.shelves);

  const frameRef = useRef<THREE.Group | null>(null);
  // setters
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);
  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setOverlay = useDesignStore((state: DesignState) => state.setOverlay);
  const setResult = useDesignStore((state: DesignState) => state.setResult);
  const setHasLeftWall = useDesignStore((state: DesignState) => state.setHasLeftWall);
  const setHasRightWall = useDesignStore((state: DesignState) => state.setHasRightWall);
  const setIsDoorOpen = useDesignStore((state: DesignState) => state.setIsDoorOpen);

  // Calculate door dimensions
  const profile = PROFILES[profileType as ProfileType];
  const s = profile.size;
  const innerWidth = width - (s * 2);
  const doorWidth = innerWidth + (overlay * 2);
  const doorHeight = height;

  const hingePosition: [number, number, number] = [
    -doorWidth / 2,
    0,
    depth / 2 + 2
  ];

  const collisionLeft = Boolean(hasLeftWall && result && !result.success);
  const collisionRight = Boolean(hasRightWall && result && !result.success);

  let doorElements: JSX.Element | null = null;
  if (doorCount === 1) {
    doorElements = (
      <>
        <DoorPanel
          width={doorWidth}
          height={doorHeight}
          thickness={20}
          position={hingePosition}
          hingeSide="left"
          isOpen={isDoorOpen}
          material="AluminumHoneycomb"
          showHoles={result?.success === true}
          kValue={result?.kValue || 4}
          hingeSeries={result?.recommendedHinge?.series || 'C80'}
          onToggle={() => setIsDoorOpen(!isDoorOpen)}
          highlightError={collisionLeft}
          overlay={overlay}
        />
        <mesh position={[hingePosition[0], -height / 2 + 1, hingePosition[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, Math.max(width, depth) * 1.2, 32, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color={collisionLeft ? '#ff4d4d' : '#60a5fa'} opacity={0.12} transparent />
        </mesh>
      </>
    );
  } else {
    const eachInner = innerWidth / 2;
    const doorEachWidth = eachInner + overlay;
    const hingeLeftPos: [number, number, number] = [-doorEachWidth / 2, 0, depth / 2 + 2];
    const hingeRightPos: [number, number, number] = [doorEachWidth / 2, 0, depth / 2 + 2];
    doorElements = (
      <>
        <DoorPanel
          width={doorEachWidth}
          height={doorHeight}
          thickness={20}
          position={hingeLeftPos}
          hingeSide="left"
          isOpen={isDoorOpen}
          material="AluminumHoneycomb"
          showHoles={result?.success === true}
          kValue={result?.kValue || 4}
          hingeSeries={result?.recommendedHinge?.series || 'C80'}
          onToggle={() => setIsDoorOpen(!isDoorOpen)}
          highlightError={collisionLeft}
          overlay={overlay}
        />
        <mesh position={[hingeLeftPos[0], -height / 2 + 1, hingeLeftPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, Math.max(width, depth) * 1.1, 32, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color={collisionLeft ? '#ff4d4d' : '#60a5fa'} opacity={0.08} transparent />
        </mesh>

        <DoorPanel
          width={doorEachWidth}
          height={doorHeight}
          thickness={20}
          position={hingeRightPos}
          hingeSide="right"
          isOpen={isDoorOpen}
          material="AluminumHoneycomb"
          showHoles={result?.success === true}
          kValue={result?.kValue || 4}
          hingeSeries={result?.recommendedHinge?.series || 'C80'}
          onToggle={() => setIsDoorOpen(!isDoorOpen)}
          highlightError={collisionRight}
          overlay={overlay}
        />
        <mesh position={[hingeRightPos[0], -height / 2 + 1, hingeRightPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, Math.max(width, depth) * 1.1, 32, 1, 0, Math.PI / 2]} />
          <meshStandardMaterial color={collisionRight ? '#ff4d4d' : '#60a5fa'} opacity={0.08} transparent />
        </mesh>
      </>
    );
  }

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('alucraft-design');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.width) setWidth(parsed.width);
      if (parsed.height) setHeight(parsed.height);
      if (parsed.depth) setDepth(parsed.depth);
      if (parsed.profileType) setProfileType(parsed.profileType);
      if (parsed.overlay !== undefined) setOverlay(parsed.overlay);
      if (parsed.hasLeftWall !== undefined) setHasLeftWall(parsed.hasLeftWall);
      if (parsed.hasRightWall !== undefined) setHasRightWall(parsed.hasRightWall);
      if (parsed.isDoorOpen !== undefined) setIsDoorOpen(parsed.isDoorOpen);
      if (parsed.result) setResult(parsed.result);
    } catch (err) {
      console.warn('Failed to load saved design', err);
    }
  }, [setWidth, setHeight, setDepth, setProfileType, setOverlay, setHasLeftWall, setHasRightWall, setIsDoorOpen, setResult]);

  // Persist to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const state = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result };
    try {
      localStorage.setItem('alucraft-design', JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save design to localStorage', err);
    }
  }, [width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result]);

  return (
    <main className="w-screen h-screen bg-slate-900 relative overflow-hidden">
      <FloatingControls />
      <Toolbar />
      <BOMPanel />
      
      {/* Result Notification Overlay */}
      {result && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl backdrop-blur-md border shadow-lg z-50 transition-all ${result.success ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' : 'bg-red-500/20 border-red-500/30 text-red-100'}`}>
          <div className="font-semibold text-sm">{result.success ? '✅ Configuration Valid' : '❌ Configuration Issue'}</div>
          <div className="text-xs opacity-80 mt-1">{result.message}</div>
          {result.success && result.recommendedHinge && (
              <div className="text-xs mt-1 font-mono bg-black/20 px-2 py-1 rounded">
                Hinge: {result.recommendedHinge.name} | K={result.kValue}
              </div>
          )}
        </div>
      )}

      <div className="w-full h-full">
        <Canvas shadows camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 20000 }}>
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 2000, 5000]} />
        
        <Stage environment="city" intensity={0.6} adjustCamera={false}>
          <TransformControls
            mode="scale"
            onChange={() => {
              const group = frameRef.current;
              if (!group) return;
              const sx = group.scale.x;
              const sy = group.scale.y;
              const sz = group.scale.z;
              if (sx !== 1 || sy !== 1 || sz !== 1) {
                setWidth(Math.max(200, Math.round(width * sx)));
                setHeight(Math.max(200, Math.round(height * sy)));
                setDepth(Math.max(200, Math.round(depth * sz)));
                group.scale.set(1, 1, 1);
              }
            }}
          >
            <group ref={frameRef}>
              <CabinetFrame
                width={width}
                height={height}
                depth={depth}
                profileType={profileType}
                shelves={shelves}
              />
            </group>
          </TransformControls>

          {doorElements}

          <DimensionLines width={width} height={height} depth={depth} offset={80} />

          {hasLeftWall && (
            <Box args={[10, height, depth]} position={[-width / 2 - 5 - 2, 0, 0]}>
              <meshStandardMaterial color={collisionLeft ? '#ff4d4d' : '#94a3b8'} opacity={0.3} transparent />
            </Box>
          )}
          {hasRightWall && (
            <Box args={[10, height, depth]} position={[width / 2 + 5 + 2, 0, 0]}>
              <meshStandardMaterial color={collisionRight ? '#ff4d4d' : '#94a3b8'} opacity={0.3} transparent />
            </Box>
          )}

        </Stage>
        <OrbitControls makeDefault maxDistance={10000} />
        <gridHelper args={[3000, 60, '#1e293b', '#1e293b']} />
      </Canvas>
    </div>
    </main>
  );
}

