'use client';

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Extrude, Edges } from '@react-three/drei';
import useDesignStore, { DesignState } from '@/store/useDesignStore';

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

import { Instances, Instance } from '@react-three/drei';

// ... (createProfileShape function remains the same)

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
    children: React.ReactNode;
}

export function ProfileInstances({ type, children }: ProfileInstancesProps) {
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);
    const geometry = useMemo(() => getProfileGeometry(type), [type]);

    return (
        <Instances range={100} geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
                color="#e2e8f0"
                roughness={0.5}
                metalness={0.6}
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
}

export function ProfileInstance({ length, position = [0, 0, 0], rotation = [0, 0, 0] }: ProfileInstanceProps) {
    const [hovered, setHovered] = useState(false);
    // const [selected, setSelected] = useState(false); // Selection on instances can be tricky with color updates

    return (
        <Instance
            position={position}
            rotation={rotation}
            scale={[1, 1, length]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
            color={hovered ? '#cbd5e1' : '#e2e8f0'}
        />
    );
}

// Legacy component for backward compatibility if needed (optional)
export function AluProfile(props: AluProfileProps) {
    // This is a fallback that renders a single Instance inside its own Instances group
    // Not efficient but keeps API compatible if we wanted to.
    // But for this refactor, we will update CabinetFrame to use ProfileInstances directly.
    return (
        <ProfileInstances type={props.type}>
            <ProfileInstance {...props} />
        </ProfileInstances>
    );
}
