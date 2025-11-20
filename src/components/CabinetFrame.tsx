'use client';

import React, { useRef, useState } from 'react';
import { useThree, ThreeEvent } from '@react-three/fiber';
import { AluProfile } from './AluProfile';
import { Connector } from './Connector';
import { DrawerUnit } from './DrawerUnit';
import { PROFILES, ProfileType } from '@/core/types';
import { Shelf, Drawer, useDesignStore, DesignState } from '@/store/useDesignStore';
import * as THREE from 'three';

interface CabinetFrameProps {
    width: number;
    height: number;
    depth: number;
    profileType: ProfileType;
    shelves?: Shelf[];
    drawers?: Drawer[];
}

export function CabinetFrame({ width, height, depth, profileType, shelves = [], drawers = [] }: CabinetFrameProps) {
    const profile = PROFILES[profileType];
    const s = profile.size;
    const slotDepth = profile.slotDepth || 6;

    const hLength = height;
    const wLength = width - (s * 2);
    const dLength = depth - (s * 2);
    const offset = s / 2;

    // Store access for panels
    const hasLeftPanel = useDesignStore((state: DesignState) => state.hasLeftPanel);
    const hasRightPanel = useDesignStore((state: DesignState) => state.hasRightPanel);
    const hasBackPanel = useDesignStore((state: DesignState) => state.hasBackPanel);
    const hasTopPanel = useDesignStore((state: DesignState) => state.hasTopPanel);
    const hasBottomPanel = useDesignStore((state: DesignState) => state.hasBottomPanel);
    const connectorType = useDesignStore((state: DesignState) => state.connectorType);
    const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);

    // Panel Material (PBR-ish)
    const panelMaterial = new THREE.MeshStandardMaterial({
        color: '#f1f5f9',
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        wireframe: showWireframe
    });

    return (
        <group>
            {/* --- Frame --- */}
            {/* Verticals */}
            <AluProfile type={profileType} length={hLength} position={[-width / 2 + offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
            <AluProfile type={profileType} length={hLength} position={[width / 2 - offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
            <AluProfile type={profileType} length={hLength} position={[-width / 2 + offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />
            <AluProfile type={profileType} length={hLength} position={[width / 2 - offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />

            {/* Width Beams */}
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, height / 2 - offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, -height / 2 + offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, height / 2 - offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, -height / 2 + offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />

            {/* Depth Beams */}
            <AluProfile type={profileType} length={dLength} position={[-width / 2 + offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} />
            <AluProfile type={profileType} length={dLength} position={[-width / 2 + offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} />
            <AluProfile type={profileType} length={dLength} position={[width / 2 - offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} />
            <AluProfile type={profileType} length={dLength} position={[width / 2 - offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} />

            {/* --- Connectors --- */}
            {connectorType === 'angle' && (
                <group>
                    {/* Width Beam Connectors (8) */}
                    <Connector size={s} position={[-width/2 + s, -height/2 + s, depth/2 - s/2]} rotation={[0, 0, 0]} />
                    <Connector size={s} position={[width/2 - s, -height/2 + s, depth/2 - s/2]} rotation={[0, 0, Math.PI/2]} />
                    <Connector size={s} position={[-width/2 + s, height/2 - s, depth/2 - s/2]} rotation={[0, 0, -Math.PI/2]} />
                    <Connector size={s} position={[width/2 - s, height/2 - s, depth/2 - s/2]} rotation={[0, 0, Math.PI]} />
                    
                    <Connector size={s} position={[-width/2 + s, -height/2 + s, -depth/2 + s/2]} rotation={[0, 0, 0]} />
                    <Connector size={s} position={[width/2 - s, -height/2 + s, -depth/2 + s/2]} rotation={[0, 0, Math.PI/2]} />
                    <Connector size={s} position={[-width/2 + s, height/2 - s, -depth/2 + s/2]} rotation={[0, 0, -Math.PI/2]} />
                    <Connector size={s} position={[width/2 - s, height/2 - s, -depth/2 + s/2]} rotation={[0, 0, Math.PI]} />

                    {/* Depth Beam Connectors (8) */}
                    <Connector size={s} position={[-width/2 + s/2, -height/2 + s, depth/2 - s]} rotation={[0, Math.PI/2, 0]} />
                    <Connector size={s} position={[-width/2 + s/2, -height/2 + s, -depth/2 + s]} rotation={[0, -Math.PI/2, 0]} />
                    <Connector size={s} position={[-width/2 + s/2, height/2 - s, depth/2 - s]} rotation={[Math.PI, Math.PI/2, 0]} />
                    <Connector size={s} position={[-width/2 + s/2, height/2 - s, -depth/2 + s]} rotation={[Math.PI, -Math.PI/2, 0]} />

                    <Connector size={s} position={[width/2 - s/2, -height/2 + s, depth/2 - s]} rotation={[0, Math.PI/2, 0]} />
                    <Connector size={s} position={[width/2 - s/2, -height/2 + s, -depth/2 + s]} rotation={[0, -Math.PI/2, 0]} />
                    <Connector size={s} position={[width/2 - s/2, height/2 - s, depth/2 - s]} rotation={[Math.PI, Math.PI/2, 0]} />
                    <Connector size={s} position={[width/2 - s/2, height/2 - s, -depth/2 + s]} rotation={[Math.PI, -Math.PI/2, 0]} />
                </group>
            )}

            {/* --- Drawers --- */}
            {drawers.map(drawer => (
                <DrawerUnit
                    key={drawer.id}
                    width={width - (s * 2) - 2} // Internal width minus clearance
                    height={drawer.height}
                    depth={depth - (s * 2)} // Internal depth
                    position={[0, -height / 2 + drawer.y + drawer.height / 2 + s, 0]}
                />
            ))}

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

            {/* --- Shelves --- */}
            {shelves.map((shelf) => (
                <DraggableShelf 
                    key={shelf.id} 
                    shelf={shelf} 
                    width={width} 
                    height={height} 
                    depth={depth} 
                    profileType={profileType}
                    wLength={wLength}
                    dLength={dLength}
                    offset={offset}
                    updateShelf={updateShelf}
                />
            ))}
        </group>
    );
}

interface DraggableShelfProps {
    shelf: Shelf;
    width: number;
    height: number;
    depth: number;
    profileType: ProfileType;
    wLength: number;
    dLength: number;
    offset: number;
    updateShelf: (id: string, y: number) => void;
}

function DraggableShelf({ shelf, width, height, depth, profileType, wLength, dLength, offset, updateShelf }: DraggableShelfProps) {
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
        
        // Snap
        const snap = 50;
        if (Math.abs(newShelfY % snap) < 15) {
            newShelfY = Math.round(newShelfY / snap) * snap;
        }
        
        updateShelf(shelf.id, newShelfY);
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
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, 0, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, 0, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />
            <AluProfile type={profileType} length={dLength} position={[-width / 2 + offset, 0, -dLength / 2]} rotation={[0, 0, 0]} />
            <AluProfile type={profileType} length={dLength} position={[width / 2 - offset, 0, -dLength / 2]} rotation={[0, 0, 0]} />

            {/* Connectors (Below the shelf beams) */}
            <group>
                {/* Width Beam Connectors (4) */}
                <Connector size={s} position={[-width/2 + s, -s/2, depth/2 - s/2]} rotation={[0, 0, -Math.PI/2]} />
                <Connector size={s} position={[width/2 - s, -s/2, depth/2 - s/2]} rotation={[0, 0, Math.PI]} />
                <Connector size={s} position={[-width/2 + s, -s/2, -depth/2 + s/2]} rotation={[0, 0, -Math.PI/2]} />
                <Connector size={s} position={[width/2 - s, -s/2, -depth/2 + s/2]} rotation={[0, 0, Math.PI]} />

                {/* Depth Beam Connectors (4) */}
                <Connector size={s} position={[-width/2 + s/2, -s/2, depth/2 - s]} rotation={[Math.PI, Math.PI/2, 0]} />
                <Connector size={s} position={[-width/2 + s/2, -s/2, -depth/2 + s]} rotation={[Math.PI, -Math.PI/2, 0]} />
                <Connector size={s} position={[width/2 - s/2, -s/2, depth/2 - s]} rotation={[Math.PI, Math.PI/2, 0]} />
                <Connector size={s} position={[width/2 - s/2, -s/2, -depth/2 + s]} rotation={[Math.PI, -Math.PI/2, 0]} />
            </group>
        </group>
    );
}
