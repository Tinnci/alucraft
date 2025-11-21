
"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Line, TransformControls, Html } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { ProfileInstances, ProfileInstance } from './AluProfile';
import { Connector } from './Connector';
import { DrawerUnit } from './DrawerUnit';
import { PROFILES, ProfileType, LayoutBay, Shelf, isBayNode } from '@/core/types';

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

    // Panel Material
    const panelMaterial = new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        wireframe: showWireframe
    });

    // Calculate positions for layout nodes
    const nodePositions = useMemo(() => {
        const positions: { id: string, type: 'item' | 'divider', x: number, width: number }[] = [];
        let currentX = -width / 2 + s;
        for (const node of layout) {
            const nodeWidth = node.type === 'item' ? (node.config?.width ?? 0) : (node.type === 'divider' ? node.thickness : 0);
            const centerX = currentX + nodeWidth / 2;
            positions.push({ id: node.id, type: node.type as 'item' | 'divider', x: centerX, width: nodeWidth });
            currentX += nodeWidth;
        }
        return positions;
    }, [layout, width, s]);

    // Global keyboard tracking for Shift key to disable snapping during TransformControls drag
    const [isShiftDown, setIsShiftDown] = useState(false);
    useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftDown(true); };
        const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftDown(false); };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    return (
        <group>
            <ProfileInstances type={profileType} material={material}>
                {/* --- Outer Frame --- */}
                {/* Verticals (4 Pillars) */}
                <ProfileInstance length={hLength} position={[-width / 2 + offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
                <ProfileInstance length={hLength} position={[width / 2 - offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
                <ProfileInstance length={hLength} position={[-width / 2 + offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />
                <ProfileInstance length={hLength} position={[width / 2 - offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />

                {/* Width Beams (Top/Bottom, Front/Back) */}
                <ProfileInstance length={wLength} position={[-wLength / 2, height / 2 - offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
                <ProfileInstance length={wLength} position={[-wLength / 2, -height / 2 + offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
                <ProfileInstance length={wLength} position={[-wLength / 2, height / 2 - offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />
                <ProfileInstance length={wLength} position={[-wLength / 2, -height / 2 + offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />

                {/* Depth Beams (Left/Right, Top/Bottom) */}
                <ProfileInstance length={dLength} position={[-width / 2 + offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} />
                <ProfileInstance length={dLength} position={[-width / 2 + offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} />
                <ProfileInstance length={dLength} position={[width / 2 - offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} />
                <ProfileInstance length={dLength} position={[width / 2 - offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} />

                {/* --- Layout Nodes (Bays & Dividers) --- */}
                {nodePositions.map((nodeInfo) => {
                    const node = layout.find(n => n.id === nodeInfo.id);
                    if (!node) return null;

                    if (isBayNode(node)) {
                            return (
                                <Bay
                                    key={node.id}
                                    bay={node as LayoutBay}
                                    position={[nodeInfo.x, 0, 0]}
                                    height={height}
                                    depth={depth}
                                    profileType={profileType}
                                    isShiftDown={isShiftDown}
                                />
                            );
                    } else if (node.type === 'divider') {
                        // Render Divider (Vertical Profile)
                        return (
                            <group key={node.id} position={[nodeInfo.x, 0, 0]}>
                                <ProfileInstance length={hLength - (s * 2)} position={[0, -height / 2 + s, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
                                <ProfileInstance length={hLength - (s * 2)} position={[0, -height / 2 + s, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />
                            </group>
                        );
                    }
                    return null;
                })}
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

interface BayProps {
    bay: LayoutBay;
    position: [number, number, number];
    height: number;
    depth: number;
    profileType: ProfileType;
    isShiftDown?: boolean;
}

    function Bay({ bay, position, height, depth, profileType, isShiftDown }: BayProps) {
    const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
    const checkDrawerCollision = useDesignStore((state: DesignState) => state.checkDrawerCollision);

    const profile = PROFILES[profileType];
    const s = profile.size;
    const offset = s / 2;

    const bayWidth = bay.config.width ?? 0;

    const wLength = bayWidth;
    const dLength = depth - (s * 2);

    return (
        <group position={position}>
            {/* Shelves */}
            {(bay.config.shelves ?? []).map((shelf) => (
                <DraggableShelf
                    key={shelf.id}
                    bayId={bay.id}
                    shelf={shelf}
                    width={bayWidth} // This is the width of the shelf itself
                    height={height}
                    depth={depth}
                    profileType={profileType}
                    wLength={wLength}
                    dLength={dLength}
                    offset={offset}
                    updateShelf={updateShelf}
                    isShiftDown={isShiftDown}
                />
            ))}

            {/* Drawers */}
            {(bay.config.drawers ?? []).map(drawer => {
                const isColliding = checkDrawerCollision(bay.id, drawer);
                return (
                    <DrawerUnit
                        key={drawer.id}
                        width={bayWidth - 2} // Clearance
                        height={drawer.height}
                        depth={depth - (s * 2)}
                        position={[0, -height / 2 + drawer.y + drawer.height / 2 + s, 0]}
                        isColliding={isColliding}
                    />
                );
            })}
        </group>
    );
}

interface DraggableShelfProps {
    bayId: string;
    shelf: Shelf;
    width: number;
    height: number;
    depth: number;
    profileType: ProfileType;
    wLength: number;
    dLength: number;
    offset: number;
    updateShelf: (bayId: string, id: string, y: number) => void;
    isShiftDown?: boolean;
}

function SnappingGuides({ height, width, depth }: { height: number, width: number, depth: number }) {
    const lines: React.ReactNode[] = [];
    const step = 32;
    const startY = -height / 2;
    const endY = height / 2;

    for (let y = startY; y <= endY; y += step) {
        // Skip lines too close to ends
        if (Math.abs(y - startY) < 1 || Math.abs(y - endY) < 1) continue;

        lines.push(
            <Line
                key={y}
                points={[[-width / 2, y, depth / 2 + 1], [width / 2, y, depth / 2 + 1]]}
                color="#ef4444"
                transparent
                opacity={0.3}
                lineWidth={1}
            />
        );
    }

    return <group>{lines}</group>;
}

// SnapLine: Shows a focused snapping guide (across the full cabinet width)
function SnapLine({ y, depth, totalWidth, type, labelValue }: { y: number; depth: number; totalWidth: number; type: 'smart' | 'grid'; labelValue: number }) {
    const color = type === 'smart' ? '#ec4899' : '#3b82f6';
    const dashed = type === 'grid';
    const targetOpacity = type === 'smart' ? 0.9 : 0.55;
    const props = useSpring<{ opacity: number; scale: number }>({ opacity: targetOpacity, scale: 1, from: { opacity: 0, scale: 0.8 }, config: { tension: 300, friction: 18 } });
    return (
    <animated.group position={[0, y, depth / 2 + 1]} scale={props.scale as unknown as number}>
            <Line
                points={[[-totalWidth / 2 - 50, 0, 0], [totalWidth / 2 + 50, 0, 0]]}
                color={color}
                lineWidth={2}
                transparent
                opacity={props.opacity as unknown as number}
                depthTest={false}
                dashed={dashed}
                dashScale={dashed ? 10 : undefined}
                gapSize={dashed ? 5 : undefined}
            />
            {/* Label */}
            <Html position={[totalWidth / 2 + 60, 0, 0]} center zIndexRange={[100, 0]}>
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-sm ${type === 'smart' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                    {Math.round(labelValue)} mm
                </div>
            </Html>
        </animated.group>
    );
}

function DraggableShelf({ bayId, shelf, width, height, depth, profileType, wLength, dLength, offset, updateShelf, isShiftDown }: DraggableShelfProps) {
    const [hovered, setHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const wasSnappedRef = useRef<boolean>(false);
    const { controls } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformRef = useRef<any>(null);
    const currentYRef = useRef(shelf.y);
    const totalWidth = useDesignStore((state: DesignState) => state.width);
    const layout = useDesignStore((state: DesignState) => state.layout);
    const [activeSnap, setActiveSnap] = useState<{ y: number; type: 'smart' | 'grid' } | null>(null);

    const selectShelf = useUIStore(state => state.selectShelf);
    const selectedShelfId = useUIStore(state => state.selectedShelfId);
    const isSelected = selectedShelfId === shelf.id;

    const profile = PROFILES[profileType];
    const s = profile.size;
    const showSnapGuides = useDesignStore((state: DesignState) => state.showSnapGuides);

    // Sync ref with prop when not dragging
    useEffect(() => {
        if (!isDragging && groupRef.current) {
            currentYRef.current = shelf.y;
            groupRef.current.position.y = shelf.y - height / 2;
        }
    }, [shelf.y, height, isDragging]);

    // When using TransformControls we disable orbit controls on drag and
    // use TransformControls's onObjectChange to update shelf position and snapping.
    // Listen for dragging-changed events from TransformControls and manage orbit controls
    useEffect(() => {
        const tc = transformRef.current as unknown as { addEventListener?: (type: string, handler: (e: { value: boolean }) => void) => void; removeEventListener?: (type: string, handler: (e: { value: boolean }) => void) => void } | null;
        if (!tc) return;
        const handler = (e: { value: boolean }) => {
            const isNowDragging = !!e.value;
            setIsDragging(isNowDragging);
            const orbit = controls as unknown as { enabled?: boolean } | undefined;
            if (orbit) orbit.enabled = !isNowDragging;
            if (!isNowDragging) {
                setActiveSnap(null);
                updateShelf(bayId, shelf.id, currentYRef.current);
            }
        };
        tc.addEventListener?.('dragging-changed', handler);
        return () => tc.removeEventListener?.('dragging-changed', handler);
    }, [controls, updateShelf, bayId, shelf.id]);

        const computeSnap = (rawY: number, bypass = false): { value: number; type: 'smart' | 'grid' | null } => {
            if (bypass) return { value: rawY, type: null };
            const SNAP_THRESHOLD = 15; // mm
            let bestY = rawY;
            let snapType: 'smart' | 'grid' | null = null;

            // Smart snap to other shelves
            let minDiff = Infinity;
            for (const node of layout) {
                if (isBayNode(node)) {
                    for (const s of (node.config.shelves ?? [])) {
                        if (node.id === bayId && s.id === shelf.id) continue;
                        const diff = Math.abs(rawY - s.y);
                        if (diff < SNAP_THRESHOLD && diff < minDiff) {
                            minDiff = diff;
                            bestY = s.y;
                            snapType = 'smart';
                        }
                    }
                }
            }

            // Grid snap to 32mm if no smart snap
            if (snapType === null) {
                const GRID_SIZE = 32;
                const snappedGrid = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
                if (Math.abs(rawY - snappedGrid) < 10) {
                    bestY = snappedGrid;
                    snapType = 'grid';
                }
            }

            // Clamp range
            const limit = 40;
            bestY = Math.max(limit, Math.min(height - limit, bestY));

            return { value: bestY, type: snapType };
        };

        // no pointer-based dragging in this transform control implementation

    return (
        <>
            {isSelected && (
                <TransformControls
                    ref={(node) => { transformRef.current = node; }}
                    object={groupRef as unknown as React.MutableRefObject<THREE.Object3D>}
                    mode="translate"
                    showX={false}
                    showZ={false}
                    size={0.8}
                    // onDragStart/onDragEnd are handled via the dragging-changed event listener on the ref
                    onObjectChange={() => {
                        if (groupRef.current) {
                            const newY = groupRef.current.position.y + height / 2;
                            const snapResult = computeSnap(newY, !!isShiftDown);
                            const snappedValue = snapResult.value;
                            const snappedType = snapResult.type;

                            // Update visual position
                            groupRef.current.position.y = snappedValue - height / 2;
                            currentYRef.current = snappedValue;
                            setActiveSnap(snappedType ? { y: snappedValue, type: snappedType } : null);
                            // Haptic feedback on first edge enter
                            const isSnappedNow = !!snappedType;
                            const shouldHaptics = useDesignStore.getState().enableHaptics;
                            if (isSnappedNow && !wasSnappedRef.current && shouldHaptics) {
                                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                                    try { navigator.vibrate(5); } catch {}
                                }
                            }
                            wasSnappedRef.current = isSnappedNow;
                        }
                    }}
                />
            )}
            <group
                ref={groupRef}
                position={[0, shelf.y - height / 2, 0]}
                onClick={(e) => { e.stopPropagation(); selectShelf(bayId, shelf.id); }}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
                onPointerDown={(e) => { e.stopPropagation(); selectShelf(bayId, shelf.id); }}
            >
                {/* Hit Box for easier selection */}
                <mesh visible={false}>
                    <boxGeometry args={[width, 40, depth]} />
                </mesh>

                {/* Visual Highlight */}
                {hovered && (
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[width + 10, 10, depth + 10]} />
                        <meshBasicMaterial color="#3b82f6" opacity={0.3} transparent depthTest={false} />
                    </mesh>
                )}

                {/* Snapping Guides (Static relative to Bay) */}
                {(isDragging || isSelected) && (
                    <group position={[0, -(shelf.y - height / 2), 0]}>
                        {showSnapGuides && <SnappingGuides height={height} width={width} depth={depth} />}
                        {showSnapGuides && activeSnap !== null && (
                            <SnapLine
                                y={activeSnap.y - height / 2}
                                depth={depth}
                                totalWidth={totalWidth}
                                type={activeSnap.type}
                                labelValue={activeSnap.y}
                            />
                        )}
                    </group>
                )}

                {/* Shelf Beams */}
                <ProfileInstance length={wLength} position={[-wLength / 2, 0, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
                <ProfileInstance length={wLength} position={[-wLength / 2, 0, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />
                <ProfileInstance length={dLength} position={[-width / 2 + offset, 0, -dLength / 2]} rotation={[0, 0, 0]} />
                <ProfileInstance length={dLength} position={[width / 2 - offset, 0, -dLength / 2]} rotation={[0, 0, 0]} />

                {/* Connectors (Below the shelf beams) */}
                <group>
                    {/* Width Beam Connectors (4) */}
                    <Connector size={s} position={[-width / 2 + s, -s / 2, depth / 2 - s / 2]} rotation={[0, 0, -Math.PI / 2]} />
                    <Connector size={s} position={[width / 2 - s, -s / 2, depth / 2 - s / 2]} rotation={[0, 0, Math.PI]} />
                    <Connector size={s} position={[-width / 2 + s, -s / 2, -depth / 2 + s / 2]} rotation={[0, 0, -Math.PI / 2]} />
                    <Connector size={s} position={[width / 2 - s, -s / 2, -depth / 2 + s / 2]} rotation={[0, 0, Math.PI]} />

                    {/* Depth Beam Connectors (4) */}
                    <Connector size={s} position={[-width / 2 + s / 2, -s / 2, depth / 2 - s]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <Connector size={s} position={[-width / 2 + s / 2, -s / 2, -depth / 2 + s]} rotation={[Math.PI, -Math.PI / 2, 0]} />
                    <Connector size={s} position={[width / 2 - s / 2, -s / 2, depth / 2 - s]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <Connector size={s} position={[width / 2 - s / 2, -s / 2, -depth / 2 + s]} rotation={[Math.PI, -Math.PI / 2, 0]} />
                </group>
            </group>
        </>
    );
}
