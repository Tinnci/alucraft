'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

interface ConnectorProps {
    size: number; // 20, 30, 40
    position?: [number, number, number];
    rotation?: [number, number, number];
}

export function Connector({ size, position = [0, 0, 0], rotation = [0, 0, 0] }: ConnectorProps) {
    // Simple L-bracket shape
    // Approximate dimensions based on standard cast aluminum brackets
    // 2020 bracket: ~20x20mm arms, width 18mm
    
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const t = 4; // Thickness of the L arms
        const L = size; // Length of the arm
        
        // Draw L profile
        s.moveTo(0, 0);
        s.lineTo(L, 0);
        s.lineTo(L, t);
        s.lineTo(t, t); // Inner corner
        // Add a curve for inner corner strength?
        s.lineTo(t, L);
        s.lineTo(0, L);
        s.lineTo(0, 0);
        
        return s;
    }, [size]);

    const extrudeSettings = useMemo(() => ({
        depth: size - 2, // Slightly narrower than profile to fit in slot or align well
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelSegments: 2
    }), [size]);

    return (
        <group position={position} rotation={rotation}>
            {/* Offset to align corner with origin */}
            <mesh position={[0, 0, -(size - 2) / 2]}>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial color="#b0b0b0" roughness={0.6} metalness={0.6} />
            </mesh>
            
            {/* Bolts (Visual only) */}
            <mesh position={[size/2, 2, 0]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[3, 3, 1, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            <mesh position={[2, size/2, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[3, 3, 1, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    );
}
