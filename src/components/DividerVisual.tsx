'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { TransformControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PROFILES, ProfileType } from '@/core/types';
import useDesignStore from '@/store/useDesignStore';
import { ProfileInstance } from './AluProfile';

export interface DividerVisualProps {
    id: string;
    position: [number, number, number];
    profileType: ProfileType;
    height: number;
    depth: number;
    vertLength: number;
    offset: number;
    isVertical: boolean;
    prevWidth: number;
    nextWidth: number;
}

export function DividerVisual({ id, position, profileType, height, depth, vertLength, offset, isVertical, prevWidth, nextWidth }: DividerVisualProps) {
    type TransformControlRef = { addEventListener?: (t: string, h: (e: { value: boolean }) => void) => void; removeEventListener?: (t: string, h: (e: { value: boolean }) => void) => void };
    const transformRef = useRef<TransformControlRef | null>(null);
    const groupRef = useRef<THREE.Group | null>(null);
    const { controls } = useThree();
    const moveDivider = useDesignStore((s) => s.moveDivider);
    const startRef = useRef<number>(0);
    const axis: 'x' | 'y' = isVertical ? 'y' : 'x';

    // State for the floating label
    const [displayValues, setDisplayValues] = useState<{ left: number; right: number } | null>(null);

    useEffect(() => {
        const tc = transformRef.current;
        if (!tc) return;

        // Listen to 'change' event for smooth updates during drag
        const changeHandler = () => {
            if (groupRef.current) {
                // Calculate delta based on visual position (not store position)
                const currentPos = axis === 'x' ? groupRef.current.position.x : groupRef.current.position.y;
                let delta = currentPos - startRef.current;

                // Visual Clamping
                const MIN_WIDTH = 40;
                // Check left/top limit
                if (prevWidth + delta < MIN_WIDTH) {
                    delta = MIN_WIDTH - prevWidth;
                }
                // Check right/bottom limit
                if (nextWidth - delta < MIN_WIDTH) {
                    delta = nextWidth - MIN_WIDTH;
                }

                // Apply clamped position back to the object
                if (axis === 'x') {
                    groupRef.current.position.x = startRef.current + delta;
                } else {
                    groupRef.current.position.y = startRef.current + delta;
                }

                // Calculate predicted widths
                // Logic: Moving Right/Down (+) increases Prev, decreases Next
                const p = Math.round(prevWidth + delta);
                const n = Math.round(nextWidth - delta);

                setDisplayValues({ left: p, right: n });
            }
        };

        const draggingChangedHandler = (e: { value: boolean }) => {
            const dragging = !!e.value;
            if (dragging) {
                // Start Drag: Disable Orbit, Init Start Pos, Show Label
                if (controls) (controls as unknown as { enabled?: boolean }).enabled = false;
                if (groupRef.current) {
                    startRef.current = axis === 'x' ? groupRef.current.position.x : groupRef.current.position.y;
                }
                setDisplayValues({ left: prevWidth, right: nextWidth }); // Init label
            } else {
                // End Drag: Enable Orbit, Hide Label
                if (controls) (controls as unknown as { enabled?: boolean }).enabled = true;
                setDisplayValues(null);

                // On drag end, compute delta relative to start
                if (groupRef.current) {
                    const newPos = axis === 'x' ? (groupRef.current.position.x) : (groupRef.current.position.y);
                    const delta = newPos - startRef.current;
                    if (Math.abs(delta) >= 1) {
                        moveDivider(id, delta);
                    }
                    // reset visual position - store will re-render
                    if (axis === 'x') groupRef.current.position.x = 0; else groupRef.current.position.y = 0;
                }
            }
        };


        tc.addEventListener?.('change', changeHandler);
        tc.addEventListener?.('dragging-changed', draggingChangedHandler);

        return () => {

            tc.removeEventListener?.('change', changeHandler);
            tc.removeEventListener?.('dragging-changed', draggingChangedHandler);
        };
    }, [controls, moveDivider, id, axis, prevWidth, nextWidth]);

    return (
        <group position={position} ref={groupRef}>
            {/* Only render TransformControls if we have a valid group ref (though drei handles this, it adds safety) */}
            <TransformControls ref={(node) => { transformRef.current = node as unknown as TransformControlRef; }} object={groupRef as unknown as React.MutableRefObject<THREE.Object3D>} mode="translate" size={0.8} showY={isVertical} showZ={false} showX={!isVertical}>
                <group>
                    <ProfileInstance length={vertLength} position={[0, -height / 2 + (profileType ? (PROFILES[profileType].size) : 0), depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
                    <ProfileInstance length={vertLength} position={[0, -height / 2 + (profileType ? (PROFILES[profileType].size) : 0), -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />

                    {/* Tooltip */}
                    {displayValues && (
                        <Html position={[0, isVertical ? 0 : height / 2 + 50, 0]} center zIndexRange={[100, 0]}>
                            <div className="flex gap-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-md whitespace-nowrap pointer-events-none select-none shadow-xl border border-white/20">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-400">Prev</span>
                                    <span className="font-mono font-bold text-blue-400">{displayValues.left}</span>
                                </div>
                                <div className="w-px bg-white/20 mx-1"></div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-400">Next</span>
                                    <span className="font-mono font-bold text-emerald-400">{displayValues.right}</span>
                                </div>
                            </div>
                        </Html>
                    )}
                </group>
            </TransformControls>
        </group>
    );
}
