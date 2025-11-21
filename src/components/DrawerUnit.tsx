'use client';

import React, { useState } from 'react';
import { useSpring, animated } from '@react-spring/three';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { Html } from '@react-three/drei';
import { AlertTriangle } from 'lucide-react';

interface DrawerUnitProps {
    width: number;  // Space width (inner cabinet width - clearance)
    height: number; // Drawer face height
    depth: number;  // Drawer depth
    position: [number, number, number];
    isColliding?: boolean; // New prop
}

export function DrawerUnit({ width, height, depth, position, isColliding = false }: DrawerUnitProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hovered, setHovered] = useState(false);
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);

    // Animation for opening/closing
    const { z } = useSpring({
        z: isOpen ? depth * 0.6 : 0, // Pull out 60%
        config: { mass: 1, tension: 170, friction: 26 }
    });

    // Drawer Box Dimensions (simplified)
    const boxHeight = Math.max(50, height - 40); // Box is shorter than face

    // Material props
    const materialColor = isColliding ? '#ff4d4d' : '#f1f5f9';
    const emissiveColor = isColliding ? '#ff0000' : (hovered ? '#3b82f6' : '#000000');
    const emissiveIntensity = isColliding ? 0.5 : (hovered ? 0.1 : 0);

    return (
        <group position={position}>
            <animated.group position-z={z}>
                {/* Drawer Face */}
                <mesh 
                    position={[0, 0, depth/2 + 10]} // 10mm thick face, pos relative to center
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
                >
                    <boxGeometry args={[width + 4, height - 4, 18]} /> {/* Face is slightly wider than box, 2mm gap vertical */}
                    <meshStandardMaterial 
                        color={materialColor}
                        roughness={0.2}
                        metalness={0.1}
                        emissive={emissiveColor}
                        emissiveIntensity={emissiveIntensity}
                        wireframe={showWireframe}
                    />
                </mesh>

                {/* Handle */}
                <mesh position={[0, 0, depth/2 + 19 + 10]}>
                    <boxGeometry args={[120, 8, 20]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Drawer Box Body (Visual representation) */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[width, boxHeight, depth]} />
                    <meshStandardMaterial 
                        color="#e2e8f0" 
                        wireframe={showWireframe}
                        transparent={!showWireframe}
                        opacity={showWireframe ? 1 : 0.5} // Semi-transparent body to see inside
                    />
                </mesh>

                {/* Collision Warning Label */}
                {isColliding && (
                    <Html position={[0, height/2 + 20, depth/2]} center>
                        <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm whitespace-nowrap">
                            <AlertTriangle size={12} /> Collision!
                        </div>
                    </Html>
                )}
            </animated.group>

            {/* Slides (Static on cabinet) */}
            <group>
                <mesh position={[width/2 + 6, 0, 0]}>
                    <boxGeometry args={[10, 40, depth]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-width/2 - 6, 0, 0]}>
                    <boxGeometry args={[10, 40, depth]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
            </group>
        </group>
    );
}
