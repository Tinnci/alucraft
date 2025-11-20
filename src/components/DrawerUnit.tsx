'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useDesignStore, DesignState } from '@/store/useDesignStore';

interface DrawerUnitProps {
    width: number;
    height: number; // Face height
    depth: number;
    position: [number, number, number];
}

export function DrawerUnit({ width, height, depth, position }: DrawerUnitProps) {
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);

    // Drawer Box Dimensions (Internal box is smaller than the face)
    const faceThickness = 18;
    const boxThickness = 12;
    const slideClearance = 13; // 13mm clearance per side for slides
    const boxWidth = width - (slideClearance * 2);
    const boxDepth = depth - 20; // Slightly shorter than cabinet depth
    const boxHeight = height - 30; // Shorter than face

    // Materials
    const faceMaterial = new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.2,
        metalness: 0.1,
        wireframe: showWireframe
    });

    const boxMaterial = new THREE.MeshStandardMaterial({
        color: '#cbd5e1',
        roughness: 0.5,
        metalness: 0.0,
        wireframe: showWireframe
    });

    const handleMaterial = new THREE.MeshStandardMaterial({
        color: '#334155',
        roughness: 0.3,
        metalness: 0.8,
        wireframe: showWireframe
    });

    return (
        <group position={position}>
            {/* Drawer Face */}
            <mesh position={[0, 0, depth / 2 + faceThickness / 2]}>
                <boxGeometry args={[width - 4, height - 4, faceThickness]} />
                <primitive object={faceMaterial} />
            </mesh>

            {/* Handle */}
            <mesh position={[0, 0, depth / 2 + faceThickness + 10]}>
                <boxGeometry args={[100, 8, 20]} />
                <primitive object={handleMaterial} />
            </mesh>

            {/* Drawer Box (Simplified as one block for now) */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[boxWidth, boxHeight, boxDepth]} />
                <primitive object={boxMaterial} />
            </mesh>

            {/* Slides (Visual representation) */}
            <mesh position={[-width / 2 + slideClearance / 2, 0, 0]}>
                <boxGeometry args={[10, 40, depth]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} wireframe={showWireframe} />
            </mesh>
            <mesh position={[width / 2 - slideClearance / 2, 0, 0]}>
                <boxGeometry args={[10, 40, depth]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} wireframe={showWireframe} />
            </mesh>
        </group>
    );
}
