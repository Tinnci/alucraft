'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { Line, TransformControls, Html, Edges } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { ProfileInstance, ProfileInstances } from './AluProfile';
import { Connector } from './Connector';
import { DrawerUnit } from './DrawerUnit';
import { PROFILES, ProfileType, LayoutBay } from '@/core/types';

interface BayProps {
    bay: LayoutBay;
    position: [number, number, number];
    height: number;
    depth: number;
    profileType: ProfileType;
    isShiftDown?: boolean;
    computedWidth?: number;
}



export function Bay({ bay, position, height, depth, profileType, isShiftDown, computedWidth }: BayProps) {
    // Actions
    const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
    const addShelf = useDesignStore((state: DesignState) => state.addShelf);
    const addDrawer = useDesignStore((state: DesignState) => state.addDrawer);
    const checkDrawerCollision = useDesignStore((state: DesignState) => state.checkDrawerCollision);
    const splitItem = useDesignStore((state: DesignState) => state.splitItem);
    const removeBay = useDesignStore((state: DesignState) => state.removeBay);

    // Drag State
    const draggedComponent = useUIStore((state) => state.draggedComponent);
    const setDraggedComponent = useUIStore((state) => state.setDraggedComponent);
    const selectedBayId = useUIStore((state) => state.selectedBayId);
    const isSelected = selectedBayId === bay.id;

    // Local State for Ghost
    const [hoverY, setHoverY] = useState<number | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const bayGroupRef = useRef<THREE.Group>(null);

    const profile = PROFILES[profileType];
    const s = profile.size;
    const offset = s / 2;

    // Use computed width if available, fallback to config
    const bayWidth = typeof computedWidth === 'number' ? computedWidth : (typeof bay.config.width === 'number' ? bay.config.width : 0);
    const wLength = bayWidth;
    const dLength = depth - (s * 2);

    // Handlers for Drag & Drop
    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
        if (!draggedComponent || !bayGroupRef.current) return;
        e.stopPropagation();

        const worldPoint = e.point;
        const localPoint = bayGroupRef.current.worldToLocal(worldPoint.clone());

        const yFromBottom = localPoint.y + height / 2;
        const clampedY = Math.max(s, Math.min(height - s, yFromBottom));
        const snappedY = Math.round(clampedY / 10) * 10;

        setHoverY(snappedY);
    };

    const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
        if (!draggedComponent || hoverY === null) return;
        e.stopPropagation();

        if (draggedComponent === 'shelf') {
            addShelf(bay.id, hoverY);
        } else if (draggedComponent === 'drawer') {
            addDrawer(bay.id, hoverY, 200); // Default height 200
        }

        setDraggedComponent(null);
        setHoverY(null);
    };

    const handlePointerOut = () => {
        setHoverY(null);
        setIsHovered(false);
    };

    const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
        if (draggedComponent) {
            e.stopPropagation();
            setIsHovered(true);
        }
    };

    const showGuide = isHovered && !!draggedComponent;

    return (
        <group
            ref={bayGroupRef}
            position={position}
            onPointerMove={draggedComponent ? handlePointerMove : undefined}
            onPointerUp={draggedComponent ? handlePointerUp : undefined}
            onPointerOut={draggedComponent ? handlePointerOut : undefined}
            onPointerOver={handlePointerOver}
        >
            {/* Hit Plane & Visual Feedback */}
            <mesh visible={true}>
                <boxGeometry args={[bayWidth, height, depth]} />
                <meshBasicMaterial
                    color={showGuide ? "#3b82f6" : "transparent"}
                    opacity={showGuide ? 0.1 : 0}
                    transparent
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
                {showGuide && (
                    <Edges
                        scale={1}
                        threshold={15} // Display edges only when the angle between faces exceeds this value (degrees)
                        color="#3b82f6"
                    />
                )}
            </mesh>



            {/* Ghost Preview */}
            {draggedComponent && hoverY !== null && (
                <group position={[0, hoverY - height / 2, 0]}>
                    {draggedComponent === 'shelf' && (
                        <mesh>
                            <boxGeometry args={[bayWidth, s, depth]} />
                            <meshStandardMaterial color="#10b981" transparent opacity={0.5} emissive="#10b981" emissiveIntensity={0.5} />
                        </mesh>
                    )}
                    {draggedComponent === 'drawer' && (
                        <group position={[0, 200 / 2, 0]}> {/* Preview offset for drawer center */}
                            <mesh>
                                <boxGeometry args={[bayWidth - 4, 200, depth - s * 2]} />
                                <meshStandardMaterial color="#8b5cf6" transparent opacity={0.5} emissive="#8b5cf6" emissiveIntensity={0.5} />
                            </mesh>
                        </group>
                    )}
                    {/* Height Label */}
                    <Html position={[0, 0, depth / 2 + 20]} center>
                        <div className="bg-black/80 text-white text-xs px-2 py-1 rounded font-mono pointer-events-none">
                            Y: {Math.round(hoverY)}
                        </div>
                    </Html>
                </group>
            )}

            {/* Existing Shelves */}
            {(bay.config.shelves ?? []).map((shelf) => (
                <DraggableShelf
                    key={shelf.id}
                    bayId={bay.id}
                    shelf={shelf}
                    width={bayWidth}
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

            {/* Existing Drawers */}
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

function SnappingGuides({ height, width, depth }: { height: number, width: number, depth: number }) {
    const lines: React.ReactNode[] = [];
    const step = 32;
    const startY = -height / 2;
    const endY = height / 2;

    for (let y = startY; y <= endY; y += step) {
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
            <Html position={[totalWidth / 2 + 60, 0, 0]} center zIndexRange={[100, 0]}>
                <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap shadow-sm ${type === 'smart' ? 'bg-pink-500' : 'bg-blue-500'}`}>
                    {Math.round(labelValue)} mm
                </div>
            </Html>
        </animated.group>
    );
}

interface DraggableShelfProps {
    bayId: string;
    shelf: { id: string; y: number };
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
    const [activeSnap, setActiveSnap] = useState<{ y: number; type: 'smart' | 'grid' } | null>(null);

    const selectShelf = useUIStore(state => state.selectShelf);
    const selectedShelfId = useUIStore(state => state.selectedShelfId);
    const isSelected = selectedShelfId === shelf.id;

    const showSnapGuides = useDesignStore((state: DesignState) => state.showSnapGuides);

    // Sync ref with prop when not dragging
    useEffect(() => {
        if (!isDragging && groupRef.current) {
            currentYRef.current = shelf.y;
            groupRef.current.position.y = shelf.y - height / 2;
        }
    }, [shelf.y, height, isDragging]);

    // Listen for dragging-changed events
    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tc = transformRef.current as any;
        if (!tc) return;
        const handler = (e: { value: boolean }) => {
            const isNowDragging = !!e.value;
            setIsDragging(isNowDragging);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const orbit = controls as any;
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
        let bestY = rawY;
        let snapType: 'smart' | 'grid' | null = null;

        // Grid snap fallback
        if (snapType === null) {
            const GRID_SIZE = 32;
            const snappedGrid = Math.round(rawY / GRID_SIZE) * GRID_SIZE;
            if (Math.abs(rawY - snappedGrid) < 10) {
                bestY = snappedGrid;
                snapType = 'grid';
            }
        }

        const limit = 40;
        bestY = Math.max(limit, Math.min(height - limit, bestY));
        return { value: bestY, type: snapType };
    };

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
                    onObjectChange={() => {
                        if (groupRef.current) {
                            const newY = groupRef.current.position.y + height / 2;
                            const snapResult = computeSnap(newY, !!isShiftDown);
                            const snappedValue = snapResult.value;
                            const snappedType = snapResult.type;

                            groupRef.current.position.y = snappedValue - height / 2;
                            currentYRef.current = snappedValue;
                            setActiveSnap(snappedType ? { y: snappedValue, type: snappedType } : null);

                            const isSnappedNow = !!snappedType;
                            const shouldHaptics = useDesignStore.getState().enableHaptics;
                            if (isSnappedNow && !wasSnappedRef.current && shouldHaptics) {
                                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                                    try { navigator.vibrate(5); } catch { }
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
                {/* Hit Box */}
                <mesh visible={false}>
                    <boxGeometry args={[width, 40, depth]} />
                </mesh>

                {/* Highlight */}
                {hovered && (
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[width + 10, 10, depth + 10]} />
                        <meshBasicMaterial color="#3b82f6" opacity={0.3} transparent depthTest={false} />
                    </mesh>
                )}

                {/* Guides */}
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

                {/* Connectors */}
                <group>
                    <Connector size={offset * 2} position={[-width / 2 + offset * 2, -offset, depth / 2 - offset]} rotation={[0, 0, -Math.PI / 2]} />
                    <Connector size={offset * 2} position={[width / 2 - offset * 2, -offset, depth / 2 - offset]} rotation={[0, 0, Math.PI]} />
                    <Connector size={offset * 2} position={[-width / 2 + offset * 2, -offset, -depth / 2 + offset]} rotation={[0, 0, -Math.PI / 2]} />
                    <Connector size={offset * 2} position={[width / 2 - offset * 2, -offset, -depth / 2 + offset]} rotation={[0, 0, Math.PI]} />
                    <Connector size={offset * 2} position={[-width / 2 + offset, -offset, depth / 2 - offset * 2]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <Connector size={offset * 2} position={[-width / 2 + offset, -offset, -depth / 2 + offset * 2]} rotation={[Math.PI, -Math.PI / 2, 0]} />
                    <Connector size={offset * 2} position={[width / 2 - offset, -offset, depth / 2 - offset * 2]} rotation={[Math.PI, Math.PI / 2, 0]} />
                    <Connector size={offset * 2} position={[width / 2 - offset, -offset, -depth / 2 + offset * 2]} rotation={[Math.PI, -Math.PI / 2, 0]} />
                </group>
            </group>
        </>
    );
}
