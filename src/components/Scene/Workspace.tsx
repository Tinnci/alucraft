'use client';

import { useRef, Fragment, JSX, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stage, Box, Environment } from '@react-three/drei';
import useDesignStore, { DesignState, LayoutBay, createDefaultDoorConfig, getDoorStateKey } from '@/store/useDesignStore';
import { CabinetFrame } from '@/components/CabinetFrame';
import { DoorPanel } from '@/components/DoorPanel';
import DimensionLines from '@/components/DimensionLines';
import { PROFILES, ProfileType } from '@/core/types';

/**
 * CameraHandler - 处理相机重置触发
 * 嵌入到 Workspace 中使用
 */
function CameraHandler({ targetY }: { targetY: number }) {
  const { camera, controls } = useThree();
  const cameraResetTrigger = useDesignStore((state: DesignState) => state.cameraResetTrigger);

  useEffect(() => {
    if (cameraResetTrigger > 0) {
      camera.position.set(1500, 1500, 1500);
      // @ts-expect-error -- The 'target' property exists on OrbitControls, but the type definition is not precise.
      controls?.target.set(0, targetY, 0);
      // @ts-expect-error -- The 'update' method exists on OrbitControls, but the type definition is not precise.
      controls?.update();
    }
  }, [cameraResetTrigger, camera, controls, targetY]);
  return null;
}

/**
 * Workspace - 3D 场景主组件
 * 负责整个 Three.js 场景的渲染，包括：
 * - 柜体框架
 * - 门板
 * - 尺寸标注
 * - 碰撞检测可视化
 * - 环境光照
 * - 交互控制
 */
export function Workspace() {
  // ===== 从 Store 获取所有必要的状态 =====
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

  // Getters
  const toggleDoorState = useDesignStore((state: DesignState) => state.toggleDoorState);

  // ===== 引用和计算 =====
  const frameRef = useRef<THREE.Group | null>(null);

  const profile = PROFILES[profileType as ProfileType];
  const s = profile.size;
  const doorHeight = height;
  const doorDepthOffset = depth / 2 + 2;

  const leftEdge = -width / 2;
  const rightEdge = width / 2;
  const edgeTolerance = s;

  // 在组件内部计算碰撞检测，避免 Selector 每次返回新对象引用
  const isCollision = (result && !result.success) || false;
  const collisionLeft = hasLeftWall && isCollision;
  const collisionRight = hasRightWall && isCollision;

  // Grid colors: use higher contrast colors depending on theme
  // Center line should be slightly more visible than the regular grid
  const gridCenterColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridLineColor = isDarkMode ? '#475569' : '#cbd5e1';

  // ===== 生成门板元素 =====
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
            {/* Door swing arc (visual aid) */}
            <mesh position={[hingeX, -height / 2 + s / 2 + 1, doorDepthOffset]} rotation={[Math.PI / 2, 0, 0]} raycast={() => { }}>
              {(() => {
                const arcRadius = Math.max(doorWidth, 200);
                const thetaLength = Math.PI / 2;
                let thetaStart = 0;
                if (hingeSide === 'left') {
                  thetaStart = 0;
                } else {
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
        const hingeX =
          doorConfig.hingeSide === 'left'
            ? centerX - (bay.width / 2 + overlay)
            : centerX + (bay.width / 2 + overlay);
        const highlight =
          doorConfig.hingeSide === 'left'
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

  // ===== 渲染 3D 场景 =====
  return (
    <>
      {/* 相机控制 */}
      <CameraHandler targetY={height / 2} />

      {/* 基础环境光和直射光 */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[1000, 1000, 500]} intensity={1} castShadow />

      {/* 主场景内容 (No Stage wrapper to avoid auto-centering) */}

      {/* 将整个家具向上偏移 height/2，使其底部对齐网格（地面） */}
      <group position={[0, height / 2, 0]}>
        {/* 柜体框架 */}
        <group ref={frameRef}>
          <CabinetFrame width={width} height={height} depth={depth} profileType={profileType} />
        </group>

        {/* 门板 */}
        {doorElements}

        {/* 尺寸标注 */}
        <DimensionLines width={width} height={height} depth={depth} offset={80} />

        {/* 碰撞检测可视化 - 左墙 */}
        {hasLeftWall && (
          <Box args={[10, height, depth]} position={[-width / 2 - 5 - 2, 0, 0]}>
            <meshStandardMaterial
              color={collisionLeft ? '#ff4d4d' : '#94a3b8'}
              opacity={0.3}
              transparent
            />
          </Box>
        )}

        {/* 碰撞检测可视化 - 右墙 */}
        {hasRightWall && (
          <Box args={[10, height, depth]} position={[width / 2 + 5 + 2, 0, 0]}>
            <meshStandardMaterial
              color={collisionRight ? '#ff4d4d' : '#94a3b8'}
              opacity={0.3}
              transparent
            />
          </Box>
        )}
      </group>

      {/* 交互控制 */}
      <OrbitControls makeDefault maxDistance={10000} target={[0, height / 2, 0]} />

      {/* 网格帮助线 (center line color, regular grid color) */}
      <gridHelper args={[3000, 60, gridCenterColor, gridLineColor]} />

      {/* 环境预设 - Manually added since Stage is removed */}
      <Environment preset="city" />
    </>
  );
}
