'use client';

import { useRef, useEffect, JSX, Fragment } from 'react';
import useDesignStore, { DesignState, LayoutBay, createDefaultDoorConfig, getDoorStateKey } from '@/store/useDesignStore';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stage, Box, Environment } from '@react-three/drei';
import { ProfileType, PROFILES } from '@/core/types';
import { CabinetFrame } from '@/components/CabinetFrame';
import { DoorPanel } from '@/components/DoorPanel';
import { BOMPanel } from '@/components/BOMPanel';
import { Toolbar } from '@/components/Toolbar';
import { FloatingControls } from '@/components/FloatingControls';
import DimensionLines from '@/components/DimensionLines';

function CameraHandler() {
  const { camera, controls } = useThree();
  const cameraResetTrigger = useDesignStore((state: DesignState) => state.cameraResetTrigger);

  useEffect(() => {
    if (cameraResetTrigger > 0) {
      camera.position.set(1500, 1500, 1500);
      // @ts-expect-error -- The 'target' property exists on OrbitControls, but the type definition is not precise.
      controls?.target.set(0, 0, 0);
      // @ts-expect-error -- The 'update' method exists on OrbitControls, but the type definition is not precise.
      controls?.update();
    }
  }, [cameraResetTrigger, camera, controls]);
  return null;
}

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
  const layout = useDesignStore((state: DesignState) => state.layout);
  const doorStates = useDesignStore((state: DesignState) => state.doorStates);

  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);

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
  const toggleDoorState = useDesignStore((state: DesignState) => state.toggleDoorState);

  const profile = PROFILES[profileType as ProfileType];
  const s = profile.size;
  const doorHeight = height;
  const doorDepthOffset = depth / 2 + 2;
  const collisionLeft = useDesignStore((state: DesignState) => state.getCollisions().left);
  const collisionRight = useDesignStore((state: DesignState) => state.getCollisions().right);

  const leftEdge = -width / 2;
  const rightEdge = width / 2;
  const edgeTolerance = s;

  const doorElements: JSX.Element[] = [];
  let cursor = -width / 2 + s;

  layout.forEach((node) => {
    if (node.type === 'bay') {
      const bay = node as LayoutBay;
      const centerX = cursor + bay.width / 2;
      cursor += bay.width;

      const doorConfig = bay.door ?? createDefaultDoorConfig();
      if (!doorConfig.enabled) {
        return;
      }

  const buildDoor = (hingeSide: 'left' | 'right', doorWidth: number, hingeX: number, highlight: boolean) => {
        const doorId = getDoorStateKey(bay.id, hingeSide);
        const isOpen = doorStates[doorId] ?? isDoorOpen;
        doorElements.push(
          <Fragment key={`${doorId}-panel`}>
            <DoorPanel
              width={doorWidth}
              height={doorHeight}
              thickness={20}
              position={[hingeX, 0, doorDepthOffset]}
              hingeSide={hingeSide}
              isOpen={isOpen}
              material="AluminumHoneycomb"
              showHoles={result?.success === true}
              kValue={result?.kValue || 4}
              hingeSeries={result?.recommendedHinge?.series || 'C80'}
              onToggle={() => toggleDoorState(doorId)}
              highlightError={highlight}
              overlay={overlay}
            />
            {/* Door swing arc (visual aid). Start angle depends on hinge side */}
            <mesh position={[hingeX, -height / 2 + 1, doorDepthOffset]} rotation={[Math.PI / 2, 0, 0]} raycast={null}>
              {/* use doorWidth to set radius */}
              {(() => {
                const arcRadius = Math.max(doorWidth, 200); // ensure some minimum radius
                const thetaLength = Math.PI / 2; // 90 degrees
                let thetaStart = 0;
                if (hingeSide === 'left') {
                  thetaStart = 0;
                } else {
                  // Right hinge: arc from 90deg to 180deg
                  thetaStart = Math.PI / 2;
                }
                return <ringGeometry args={[0, arcRadius, 32, 1, thetaStart, thetaLength]} />;
              })()}
              <meshStandardMaterial color={highlight ? '#ff4d4d' : '#60a5fa'} opacity={0.08} transparent />
            </mesh>
          </Fragment>
        );
      };

      if (doorConfig.type === 'single') {
        const doorWidth = bay.width + overlay * 2;
        const hingeX = doorConfig.hingeSide === 'left'
          ? centerX - (bay.width / 2 + overlay)
          : centerX + (bay.width / 2 + overlay);
        const highlight = doorConfig.hingeSide === 'left'
          ? collisionLeft && Math.abs(hingeX - leftEdge) <= edgeTolerance
          : collisionRight && Math.abs(hingeX - rightEdge) <= edgeTolerance;
        buildDoor(doorConfig.hingeSide, doorWidth, hingeX, highlight);
      } else {
        const leafWidth = bay.width / 2 + overlay;
        const leftHingeX = centerX - (bay.width / 2 + overlay);
        const rightHingeX = centerX + (bay.width / 2 + overlay);
        const leftHighlight = collisionLeft && Math.abs(leftHingeX - leftEdge) <= edgeTolerance;
        const rightHighlight = collisionRight && Math.abs(rightHingeX - rightEdge) <= edgeTolerance;
        buildDoor('left', leafWidth, leftHingeX, leftHighlight);
        buildDoor('right', leafWidth, rightHingeX, rightHighlight);
      }
    } else {
      cursor += node.width;
    }
  });

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

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';
  const gridColor = isDarkMode ? '#1e293b' : '#e2e8f0';

  return (
    <main className="w-screen h-screen bg-background relative overflow-hidden">
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
          <CameraHandler />
          <color attach="background" args={[bgColor]} />
          <fog attach="fog" args={[bgColor, 2000, 5000]} />

          {/* 添加基础环境光和直射光，防止材质全黑 */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[1000, 1000, 500]} intensity={1} castShadow />

          <Stage environment="city" intensity={0.6} adjustCamera={false}>
            <group ref={frameRef}>
              <CabinetFrame
                width={width}
                height={height}
                depth={depth}
                profileType={profileType}

              />
            </group>

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
          <gridHelper args={[3000, 60, gridColor, gridColor]} />
          <Environment preset="warehouse" />
        </Canvas>
      </div>
    </main>
  );
}

