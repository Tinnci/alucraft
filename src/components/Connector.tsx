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
    const connectorMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({ color: '#b0b0b0', roughness: 0.6, metalness: 0.6, wireframe: showWireframe });
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            console.debug('Connector: creating connectorMaterial', { uuid: mat.uuid, showWireframe });
        }
        return mat;
    }, [showWireframe]);
    const boltMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({ color: '#333', wireframe: showWireframe });
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            console.debug('Connector: creating boltMaterial', { uuid: mat.uuid, showWireframe });
        }
        return mat;
    }, [showWireframe]);

    // Ensure materials are disposed when unmounted to free GPU resources
    React.useEffect(() => {
        return () => {
            try {
                if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
                    console.debug('Connector: disposing materials', {
                        connectorMaterialId: connectorMaterial.uuid,
                        boltMaterialId: boltMaterial.uuid
                    });
                }
                connectorMaterial.dispose();
                boltMaterial.dispose();
            } catch {
                // ignore
            }
        };
    }, [connectorMaterial, boltMaterial]);

    return (
        <group position={position} rotation={rotation}>
            {/* Offset to align corner with origin */}
            <mesh position={[0, 0, -(size - 2) / 2]} geometry={geometry} material={connectorMaterial}>
            </mesh>

            {/* Bolts (Visual only) */}
            <mesh position={[size / 2, 2, 0]} rotation={[Math.PI / 2, 0, 0]} material={boltMaterial}>
                <cylinderGeometry args={[3, 3, 1, 16]} />
            </mesh>
            <mesh position={[2, size / 2, 0]} rotation={[0, 0, Math.PI / 2]} material={boltMaterial}>
                <cylinderGeometry args={[3, 3, 1, 16]} />
            </mesh>
        </group>
    );
}
