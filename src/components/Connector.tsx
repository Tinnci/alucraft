'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

interface ConnectorProps {
    size: number; // 20, 30, 40
    position?: [number, number, number];
    rotation?: [number, number, number];
}

// Global geometry cache
const geometryCache: Record<number, THREE.ExtrudeGeometry> = {};

function getConnectorGeometry(size: number) {
    if (!geometryCache[size]) {
        const s = new THREE.Shape();
        const t = 4; // Thickness of the L arms
        const L = size; // Length of the arm

        // Draw L profile
        s.moveTo(0, 0);
        s.lineTo(L, 0);
        s.lineTo(L, t);
        s.lineTo(t, t); // Inner corner
        s.lineTo(t, L);
        s.lineTo(0, L);
        s.lineTo(0, 0);

        const extrudeSettings = {
            depth: size - 2,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.5,
            bevelSegments: 2
        };

        geometryCache[size] = new THREE.ExtrudeGeometry(s, extrudeSettings);
    }
    return geometryCache[size];
}

export function Connector({ size, position = [0, 0, 0], rotation = [0, 0, 0] }: ConnectorProps) {
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);
    const geometry = useMemo(() => getConnectorGeometry(size), [size]);

    return (
        <group position={position} rotation={rotation}>
            {/* Offset to align corner with origin */}
            <mesh position={[0, 0, -(size - 2) / 2]} geometry={geometry}>
                <meshStandardMaterial color="#b0b0b0" roughness={0.6} metalness={0.6} wireframe={showWireframe} />
            </mesh>

            {/* Bolts (Visual only) */}
            <mesh position={[size / 2, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[3, 3, 1, 16]} />
                <meshStandardMaterial color="#333" wireframe={showWireframe} />
            </mesh>
            <mesh position={[2, size / 2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[3, 3, 1, 16]} />
                <meshStandardMaterial color="#333" wireframe={showWireframe} />
            </mesh>
        </group>
    );
}
