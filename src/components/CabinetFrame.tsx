'use client';

import React, { useEffect, useState } from 'react';
import * as THREE from 'three';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { ProfileInstances, ProfileInstance } from './AluProfile';
import useLayoutPositions from '@/hooks/useLayoutPositions';
import { RecursiveRender } from './RecursiveRender';
import { Connector } from './Connector';
import { ProfileType, ContainerNode } from '@/core/types';
import { PROFILES } from '@/config/profiles';
import { validateLayout } from '@/core/layout-utils';
import { Html } from '@react-three/drei';

interface CabinetFrameProps {
    width: number;
    height: number;
    depth: number;
    profileType: ProfileType;
}

// ==========================================
// 内置锁可视组件 (Internal Lock)
// 模拟在型材表面打的工艺孔（黑色圆点）
// ==========================================
interface InternalLockProps {
    size: number;
    position: [number, number, number];
    rotation: [number, number, number];
    axis: 'x' | 'z'; // 用于判断孔的方向
}

function InternalLock({ size, position, rotation, axis }: InternalLockProps) {
    // 计算孔的偏移位置（从角落向型材中心移动）
    const offset = size;
    const adjustedPos = [...position] as [number, number, number];

    if (axis === 'x') {
        // 横梁（X轴）孔位向中心收缩
        adjustedPos[0] += position[0] < 0 ? offset : -offset;
    } else {
        // 深梁（Z轴）孔位向中心收缩
        adjustedPos[2] += position[2] < 0 ? offset : -offset;
    }

    return (
        <group position={adjustedPos} rotation={rotation}>
            {/* 打孔点：黑色圆柱浮出表面 */}
            <mesh position={[0, size / 2, 0]}>
                <cylinderGeometry args={[3, 3, 2, 16]} />
                <meshStandardMaterial color="#1a1a1a" roughness={1} />
            </mesh>
            {/* 锁扣金属头 */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[4, 4, 1, 16]} />
                <meshStandardMaterial color="#888" />
            </mesh>
        </group>
    );
}

// ==========================================
// 三维角码可视组件 (3-Way Corner)
// 渲染在8个角位置的黑色立方体
// ==========================================
interface ThreeWayCornerProps {
    size: number;
    position: [number, number, number];
}

function ThreeWayCorner({ size, position }: ThreeWayCornerProps) {
    return (
        <mesh position={position}>
            {/* 黑色塑料角码立方体 */}
            <boxGeometry args={[size, size, size]} />
            <meshStandardMaterial color="#222" roughness={0.5} metalness={0.2} />

            {/* 装饰线条，增加视觉细节 */}
            <mesh position={[size / 2 + 0.1, 0, 0]}>
                <planeGeometry args={[0.1, size * 0.6]} />
                <meshBasicMaterial color="#444" />
            </mesh>
        </mesh>
    );
}

export function CabinetFrame({ width, height, depth, profileType }: CabinetFrameProps) {
    const profile = PROFILES[profileType];
    const s = profile.size;
    const slotDepth = profile.slotDepth || 6;

    const hLength = height;
    const wLength = width - (s * 2);
    const dLength = depth - (s * 2);
    const offset = s / 2;

    // Store access
    const layout = useDesignStore((state: DesignState) => state.layout);
    const hasLeftPanel = useDesignStore((state: DesignState) => state.hasLeftPanel);
    const hasRightPanel = useDesignStore((state: DesignState) => state.hasRightPanel);
    const hasBackPanel = useDesignStore((state: DesignState) => state.hasBackPanel);
    const hasTopPanel = useDesignStore((state: DesignState) => state.hasTopPanel);
    const hasBottomPanel = useDesignStore((state: DesignState) => state.hasBottomPanel);
    const connectorType = useDesignStore((state: DesignState) => state.connectorType);
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);
    const material = useDesignStore((state: DesignState) => state.material);

    // Panel Material - memoized so we don't recreate material on every render
    const panelMaterial = React.useMemo(() => {
        const m = new THREE.MeshStandardMaterial({
            color: '#f1f5f9',
            roughness: 0.2,
            metalness: 0.1,
            side: THREE.DoubleSide,
            wireframe: showWireframe
        });
        // Debug
        try { if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.debug('CabinetFrame: panelMaterial created', { id: (m as any).id }); } catch { }
        return m;
    }, [showWireframe]);

    // Dispose the material on unmount to avoid leaking GPU resources
    React.useEffect(() => {
        return () => {
            try {
                if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') console.debug('CabinetFrame: disposing panelMaterial', { id: (panelMaterial as any).id });
                panelMaterial.dispose();
            } catch {
                // ignore
            }
        };
    }, [panelMaterial]);

    // Global keyboard tracking for Shift key to disable snapping during TransformControls drag
    const [isShiftDown, setIsShiftDown] = useState(false);
    useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftDown(true); };
        const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftDown(false); };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    const validation = validateLayout(layout);
    if (!validation.valid) {
        return (
            <group>
                <Html position={[0, 0, 0]}>
                    <div className="bg-red-500 text-white p-4 rounded shadow-lg">
                        <h3 className="font-bold">Layout Error</h3>
                        <p>{validation.error}</p>
                    </div>
                </Html>
            </group>
        );
    }

    const positions = useLayoutPositions(layout, [0, 0, 0], [width, height, depth]);

    return (
        <group>
            {/* Pre-calc positions for all internal layout nodes to avoid repeated computations
                and to support flat rendering or registry-based rendering strategies. */}
            <ProfileInstances type={profileType} material={material}>
                {/* --- Outer Frame --- */}
                {/* Verticals (4 Pillars) */}
                <ProfileInstance length={hLength} position={[-width / 2 + offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} partId="frame-pillar" />
                <ProfileInstance length={hLength} position={[width / 2 - offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} partId="frame-pillar" />
                <ProfileInstance length={hLength} position={[-width / 2 + offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} partId="frame-pillar" />
                <ProfileInstance length={hLength} position={[width / 2 - offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} partId="frame-pillar" />

                {/* Width Beams (Top/Bottom, Front/Back) */}
                <ProfileInstance length={wLength} position={[-wLength / 2, height / 2 - offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} partId="frame-width-beam" />
                <ProfileInstance length={wLength} position={[-wLength / 2, -height / 2 + offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} partId="frame-width-beam" />
                <ProfileInstance length={wLength} position={[-wLength / 2, height / 2 - offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} partId="frame-width-beam" />
                <ProfileInstance length={wLength} position={[-wLength / 2, -height / 2 + offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} partId="frame-width-beam" />

                {/* Depth Beams (Left/Right, Top/Bottom) */}
                <ProfileInstance length={dLength} position={[-width / 2 + offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} partId="frame-depth-beam" />
                <ProfileInstance length={dLength} position={[-width / 2 + offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} partId="frame-depth-beam" />
                <ProfileInstance length={dLength} position={[width / 2 - offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} partId="frame-depth-beam" />
                <ProfileInstance length={dLength} position={[width / 2 - offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} partId="frame-depth-beam" />
                {/* --- Layout Nodes (Bays & Dividers) --- */}
                {/* use RecursiveRender to draw the layout tree */}
                <RecursiveRender
                    node={{ id: 'root', type: 'container', orientation: 'horizontal', children: layout } as ContainerNode}
                    origin={[0, 0, 0]}
                    dims={[width, height, depth]}
                    profileType={profileType}
                    height={height}
                    depth={depth}
                    isShiftDown={isShiftDown}
                    parentOrientation={'horizontal'}
                    positions={positions}
                />
            </ProfileInstances>

            {/* --- Connectors (Outer Frame) --- */}
            {/* 仅在使用 angle_bracket 时渲染外部连接件 */}
            {connectorType === 'angle_bracket' && (
                <group>
                    {/* Simplified: Just corners for now. Internal bay connectors handled by Bay? */}
                    {/* Width Beam Connectors (8) */}
                    <Connector size={s} position={[-width / 2 + s, -height / 2 + s, depth / 2 - s / 2]} rotation={[0, 0, 0]} />
                    <Connector size={s} position={[width / 2 - s, -height / 2 + s, depth / 2 - s / 2]} rotation={[0, 0, Math.PI / 2]} />
                    <Connector size={s} position={[-width / 2 + s, height / 2 - s, depth / 2 - s / 2]} rotation={[0, 0, -Math.PI / 2]} />
                    <Connector size={s} position={[width / 2 - s, height / 2 - s, depth / 2 - s / 2]} rotation={[0, 0, Math.PI]} />

                    <Connector size={s} position={[-width / 2 + s, -height / 2 + s, -depth / 2 + s / 2]} rotation={[0, 0, 0]} />
                    <Connector size={s} position={[width / 2 - s, -height / 2 + s, -depth / 2 + s / 2]} rotation={[0, 0, Math.PI / 2]} />
                    <Connector size={s} position={[-width / 2 + s, height / 2 - s, -depth / 2 + s / 2]} rotation={[0, 0, -Math.PI / 2]} />
                    <Connector size={s} position={[width / 2 - s, height / 2 - s, -depth / 2 + s / 2]} rotation={[0, 0, Math.PI]} />

                    {/* Depth Beam Connectors (8) */}
                    <Connector size={s} position={[-width / 2 + s / 2, -height / 2 + s, depth / 2 - s]} rotation={[0, Math.PI / 2, 0]} />
                    <Connector size={s} position={[-width / 2 + s / 2, -height / 2 + s, -depth / 2 + s]} rotation={[0, -Math.PI / 2, 0]} />
                    <Connector size={s} position={[-width / 2 + s / 2, height / 2 - s, depth / 2 - s]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <Connector size={s} position={[-width / 2 + s / 2, height / 2 - s, -depth / 2 + s]} rotation={[Math.PI, -Math.PI / 2, 0]} />

                    <Connector size={s} position={[width / 2 - s / 2, -height / 2 + s, depth / 2 - s]} rotation={[0, Math.PI / 2, 0]} />
                    <Connector size={s} position={[width / 2 - s / 2, -height / 2 + s, -depth / 2 + s]} rotation={[0, -Math.PI / 2, 0]} />
                    <Connector size={s} position={[width / 2 - s / 2, height / 2 - s, depth / 2 - s]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <Connector size={s} position={[width / 2 - s / 2, height / 2 - s, -depth / 2 + s]} rotation={[Math.PI, -Math.PI / 2, 0]} />
                </group>
            )}

            {/* internal_lock: 渲染打孔点而不是物理角码 */}
            {connectorType === 'internal_lock' && (
                <group>
                    {/* Width Beams (X-axis) - 8个角的横梁孔 */}
                    <InternalLock axis="x" size={s} position={[-width / 2 + s, -height / 2 + s, depth / 2 - s / 2]} rotation={[0, 0, 0]} />
                    <InternalLock axis="x" size={s} position={[width / 2 - s, -height / 2 + s, depth / 2 - s / 2]} rotation={[0, 0, 0]} />
                    <InternalLock axis="x" size={s} position={[-width / 2 + s, height / 2 - s, depth / 2 - s / 2]} rotation={[0, 0, Math.PI]} />
                    <InternalLock axis="x" size={s} position={[width / 2 - s, height / 2 - s, depth / 2 - s / 2]} rotation={[0, 0, Math.PI]} />

                    <InternalLock axis="x" size={s} position={[-width / 2 + s, -height / 2 + s, -depth / 2 + s / 2]} rotation={[0, 0, 0]} />
                    <InternalLock axis="x" size={s} position={[width / 2 - s, -height / 2 + s, -depth / 2 + s / 2]} rotation={[0, 0, 0]} />
                    <InternalLock axis="x" size={s} position={[-width / 2 + s, height / 2 - s, -depth / 2 + s / 2]} rotation={[0, 0, Math.PI]} />
                    <InternalLock axis="x" size={s} position={[width / 2 - s, height / 2 - s, -depth / 2 + s / 2]} rotation={[0, 0, Math.PI]} />

                    {/* Depth Beams (Z-axis) - 深梁的孔 */}
                    <InternalLock axis="z" size={s} position={[-width / 2 + s / 2, -height / 2 + s, depth / 2 - s]} rotation={[0, Math.PI / 2, 0]} />
                    <InternalLock axis="z" size={s} position={[-width / 2 + s / 2, -height / 2 + s, -depth / 2 + s]} rotation={[0, -Math.PI / 2, 0]} />
                    <InternalLock axis="z" size={s} position={[-width / 2 + s / 2, height / 2 - s, depth / 2 - s]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <InternalLock axis="z" size={s} position={[-width / 2 + s / 2, height / 2 - s, -depth / 2 + s]} rotation={[Math.PI, -Math.PI / 2, 0]} />

                    <InternalLock axis="z" size={s} position={[width / 2 - s / 2, -height / 2 + s, depth / 2 - s]} rotation={[0, Math.PI / 2, 0]} />
                    <InternalLock axis="z" size={s} position={[width / 2 - s / 2, -height / 2 + s, -depth / 2 + s]} rotation={[0, -Math.PI / 2, 0]} />
                    <InternalLock axis="z" size={s} position={[width / 2 - s / 2, height / 2 - s, depth / 2 - s]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <InternalLock axis="z" size={s} position={[width / 2 - s / 2, height / 2 - s, -depth / 2 + s]} rotation={[Math.PI, -Math.PI / 2, 0]} />
                </group>
            )}

            {/* 3way_corner: 渲染8个角位置的黑色立方体 */}
            {connectorType === '3way_corner' && (
                <group>
                    {/* Top 4 Corners (上方4个角) */}
                    <ThreeWayCorner size={s} position={[-width / 2 + s / 2, height / 2 - s / 2, depth / 2 - s / 2]} />
                    <ThreeWayCorner size={s} position={[width / 2 - s / 2, height / 2 - s / 2, depth / 2 - s / 2]} />
                    <ThreeWayCorner size={s} position={[-width / 2 + s / 2, height / 2 - s / 2, -depth / 2 + s / 2]} />
                    <ThreeWayCorner size={s} position={[width / 2 - s / 2, height / 2 - s / 2, -depth / 2 + s / 2]} />

                    {/* Bottom 4 Corners (下方4个角) */}
                    <ThreeWayCorner size={s} position={[-width / 2 + s / 2, -height / 2 + s / 2, depth / 2 - s / 2]} />
                    <ThreeWayCorner size={s} position={[width / 2 - s / 2, -height / 2 + s / 2, depth / 2 - s / 2]} />
                    <ThreeWayCorner size={s} position={[-width / 2 + s / 2, -height / 2 + s / 2, -depth / 2 + s / 2]} />
                    <ThreeWayCorner size={s} position={[width / 2 - s / 2, -height / 2 + s / 2, -depth / 2 + s / 2]} />
                </group>
            )}

            {/* --- Panels --- */}
            {hasLeftPanel && (
                <mesh position={[-width / 2 + offset, 0, 0]} rotation={[0, Math.PI / 2, 0]} material={panelMaterial}>
                    <planeGeometry args={[depth - (s * 2) + (slotDepth * 2), height - (s * 2) + (slotDepth * 2)]} />
                </mesh>
            )}
            {hasRightPanel && (
                <mesh position={[width / 2 - offset, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={panelMaterial}>
                    <planeGeometry args={[depth - (s * 2) + (slotDepth * 2), height - (s * 2) + (slotDepth * 2)]} />
                </mesh>
            )}
            {hasBackPanel && (
                <mesh position={[0, 0, -depth / 2 + offset]} rotation={[0, 0, 0]} material={panelMaterial}>
                    <planeGeometry args={[width - (s * 2) + (slotDepth * 2), height - (s * 2) + (slotDepth * 2)]} />
                </mesh>
            )}
            {hasTopPanel && (
                <mesh position={[0, height / 2 - offset, 0]} rotation={[-Math.PI / 2, 0, 0]} material={panelMaterial}>
                    <planeGeometry args={[width - (s * 2) + (slotDepth * 2), depth - (s * 2) + (slotDepth * 2)]} />
                </mesh>
            )}
            {hasBottomPanel && (
                <mesh position={[0, -height / 2 + offset, 0]} rotation={[Math.PI / 2, 0, 0]} material={panelMaterial}>
                    <planeGeometry args={[width - (s * 2) + (slotDepth * 2), depth - (s * 2) + (slotDepth * 2)]} />
                </mesh>
            )}
        </group>
    );
}
