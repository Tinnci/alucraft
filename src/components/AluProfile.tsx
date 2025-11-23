'use client';

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Instances, Instance, useTexture } from '@react-three/drei';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { useThemeColor } from '@/hooks/useThemeColor';
import useUIStore from '@/store/useUIStore';

interface AluProfileProps {
    type: '2020' | '3030' | '4040';
    length: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

// 型材截面形状生成函数 (单位: mm, 中心点为 0,0)
// 简化的十字带槽形状，用于 3D 可视化

function createProfileShape(profileType: '2020' | '3030' | '4040'): THREE.Shape {
    const shape = new THREE.Shape();

    let s: number; // 半宽 (mm)
    let c: number; // 槽口宽的一半 (mm)
    let d: number; // 槽深 (mm)

    if (profileType === '2020') {
        s = 10;  // 20mm / 2
        c = 3;   // 6mm槽 / 2
        d = 3;   // 槽深
    } else if (profileType === '3030') {
        s = 15;  // 30mm / 2
        c = 4;   // 8mm槽 / 2
        d = 4;   // 槽深
    } else {
        // '4040'
        s = 20;  // 40mm / 2
        c = 4;   // 8mm槽 / 2
        d = 4;   // 槽深
    }

    // 绘制十字带槽截面
    shape.moveTo(-s, -s); // 左下
    shape.lineTo(-c, -s); // 底部槽口左
    shape.lineTo(-c, -s + d); // 槽内
    shape.lineTo(c, -s + d);  // 槽内
    shape.lineTo(c, -s);    // 底部槽口右
    shape.lineTo(s, -s);  // 右下

    shape.lineTo(s, -c);  // 右侧槽口下
    shape.lineTo(s - d, -c);
    shape.lineTo(s - d, c);
    shape.lineTo(s, c);   // 右侧槽口上
    shape.lineTo(s, s);   // 右上

    shape.lineTo(c, s);
    shape.lineTo(c, s - d);
    shape.lineTo(-c, s - d);
    shape.lineTo(-c, s);
    shape.lineTo(-s, s);  // 左上

    shape.lineTo(-s, c);
    shape.lineTo(-s + d, c);
    shape.lineTo(-s + d, -c);
    shape.lineTo(-s, -c);
    shape.lineTo(-s, -s); // 回到原点

    return shape;
}

// Unit geometry cache
const geometryCache: Record<string, THREE.ExtrudeGeometry> = {};

function getProfileGeometry(type: '2020' | '3030' | '4040') {
    if (!geometryCache[type]) {
        const shape = createProfileShape(type);
        const extrudeSettings = {
            depth: 1, // Unit length
            bevelEnabled: false,
            steps: 1,
        };
        geometryCache[type] = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }
    return geometryCache[type];
}

interface ProfileInstancesProps {
    type: '2020' | '3030' | '4040';
    material?: 'silver' | 'dark_metal' | 'wood';
    children: React.ReactNode;
}

export function ProfileInstances({ type, material = 'silver', children }: ProfileInstancesProps) {
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);
    const geometry = useMemo(() => getProfileGeometry(type), [type]);

    // Load textures unconditionally (hooks rules). 
    // Note: In a real app, might want to lazy load or handle errors if files missing.
    const textures = useTexture({
        wood: '/textures/wood.png',
        dark_metal: '/textures/dark_metal.png',
    });

    const materialProps = useMemo(() => {
        const woodTexture = textures.wood.clone();
        const darkMetalTexture = textures.dark_metal.clone();
        woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
        darkMetalTexture.wrapS = darkMetalTexture.wrapT = THREE.RepeatWrapping;
        if (material === 'wood') {
            return { map: woodTexture, color: '#ffffff', roughness: 0.8, metalness: 0.1 };
        } else if (material === 'dark_metal') {
            return { map: darkMetalTexture, color: '#ffffff', roughness: 0.4, metalness: 0.8 };
        } else {
            return { map: undefined, color: '#e2e8f0', roughness: 0.5, metalness: 0.6 };
        }
    }, [material, textures]);

    return (
        <Instances range={100} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
                {...materialProps}
                wireframe={showWireframe}
            />
            {children}
        </Instances>
    );
}

interface ProfileInstanceProps {
    length: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
    partId?: string;
}

export function ProfileInstance({ length, position = [0, 0, 0], rotation = [0, 0, 0], partId }: ProfileInstanceProps) {
    const [hovered, setHovered] = useState(false);
    const highlightedPartId = useUIStore((s) => s.highlightedPartId);
    const isHighlighted = partId && highlightedPartId === partId;
    const colors = useThemeColor();

    const defaultColor = '#e2e8f0';
    const hoverColor = colors.gridCenter || '#cbd5e1';
    const col = isHighlighted ? colors.highlight : (hovered ? hoverColor : defaultColor);

    return (
        <Instance
            position={position}
            rotation={rotation}
            scale={[1, 1, length]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
            color={col}
        />
    );
}

// Legacy component for backward compatibility if needed (optional)
export function AluProfile(props: AluProfileProps & { partId?: string }) {
    return (
        <ProfileInstances type={props.type}>
            <ProfileInstance {...props} />
        </ProfileInstances>
    );
}
