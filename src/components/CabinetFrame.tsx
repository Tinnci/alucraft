'use client';

import React, { useRef, useState } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { ProfileInstances, ProfileInstance } from './AluProfile';
import { Connector } from './Connector';
import { DrawerUnit } from './DrawerUnit';
import { PROFILES, ProfileType, ConnectorType } from '@/core/types';
import { Shelf, useDesignStore, DesignState, LayoutBay } from '@/store/useDesignStore';
import * as THREE from 'three';

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
    const nodePositions = React.useMemo(() => {
        const positions: { id: string, type: 'bay' | 'divider', x: number, width: number }[] = [];
        let currentX = -width / 2 + s;
        for (const node of layout) {
            const centerX = currentX + node.width / 2;
            positions.push({ id: node.id, type: node.type, x: centerX, width: node.width });
            currentX += node.width;
        }
        return positions;
    }, [layout, width, s]);

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

                    if (node.type === 'bay') {
                        return (
                            <Bay
                                key={node.id}
                                bay={node as LayoutBay}
                                position={[nodeInfo.x, 0, 0]}
                                height={height}
                                depth={depth}
                                profileType={profileType}
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
}

function Bay({ bay, position, height, depth, profileType }: BayProps) {
    const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
    const checkDrawerCollision = useDesignStore((state: DesignState) => state.checkDrawerCollision);

    const profile = PROFILES[profileType];
    const s = profile.size;
    const offset = s / 2;

    const bayWidth = bay.width;

    const wLength = bayWidth;
    const dLength = depth - (s * 2);

    return (
        <group position={position}>
            {/* Shelves */}
            {bay.shelves.map((shelf) => (
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
                />
            ))}

            {/* Drawers */}
            {bay.drawers.map(drawer => {
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
}

function DraggableShelf({ bayId, shelf, width, height, depth, profileType, wLength, dLength, offset, updateShelf }: DraggableShelfProps) {
    const [hovered, setHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const { camera, raycaster } = useThree();
    const planeRef = useRef(new THREE.Plane());
    const intersectPoint = useRef(new THREE.Vector3());

    const profile = PROFILES[profileType];
    const s = profile.size;

    const y = shelf.y - height / 2;

    const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        // Initialize drag plane
        const normal = new THREE.Vector3();
        camera.getWorldDirection(normal);
        normal.y = 0; // Keep it vertical
        normal.normalize();
        if (normal.lengthSq() < 0.1) normal.set(0, 0, 1);

        planeRef.current.setFromNormalAndCoplanarPoint(normal, e.point);
    };

    const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!isDragging) return;
        e.stopPropagation();

        // Raycast against our virtual plane
        raycaster.ray.intersectPlane(planeRef.current, intersectPoint.current);

        const newWorldY = intersectPoint.current.y;
        let newShelfY = newWorldY + height / 2;

        // Clamp
        const limit = 40;
        newShelfY = Math.max(limit, Math.min(height - limit, newShelfY));

        // Snap to 32mm system
        const snap = 32;
        if (Math.abs(newShelfY % snap) < 10) {
            newShelfY = Math.round(newShelfY / snap) * snap;
        }

        updateShelf(bayId, shelf.id, newShelfY);
    };

    return (
        <group
            position={[0, y, 0]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerMove={onPointerMove}
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
    );
}
