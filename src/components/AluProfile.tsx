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

export function AluProfile({ type, length, position = [0, 0, 0], rotation = [0, 0, 0] }: AluProfileProps) {
    const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);

    // Debug: Simple Square Shape
    const shape = useMemo(() => {
        return createProfileShape(type);
    }, [type]);

    const extrudeSettings = useMemo(() => ({
        depth: length,
        bevelEnabled: false,
        steps: 1,
    }), [length]);

    const [hovered, setHovered] = useState(false);
    const [selected, setSelected] = useState(false);

    return (
        <group
            position={position}
            rotation={rotation}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
            onClick={(e) => { e.stopPropagation(); setSelected(!selected); }}
        >
            <Extrude args={[shape, extrudeSettings]} castShadow receiveShadow>
                {/* 铝材材质：金属质感，银灰色 */}
                <meshStandardMaterial
                    color={selected ? '#60a5fa' : (hovered ? '#cbd5e1' : '#e2e8f0')}
                    roughness={0.5}
                    metalness={0.6}
                    emissive={selected ? '#3b82f6' : (hovered ? '#3b82f6' : '#000000')}
                    emissiveIntensity={selected ? 0.3 : (hovered ? 0.1 : 0)}
                    wireframe={showWireframe}
                />
                <Edges color="#333" threshold={15} />
            </Extrude>
        </group>
    );
}
