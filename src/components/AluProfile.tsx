'use client';

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Extrude } from '@react-three/drei';

interface AluProfileProps {
    type: '2020' | '3030' | '4040';
    length: number;
    position?: [number, number, number];
    rotation?: [number, number, number];
}

// 2020型材的截面路径 (单位: mm, 中心点为 0,0)
// 这是一个简化的十字带槽形状，足够视觉展示使用
const profileShape2020 = new THREE.Shape();
const s = 10; // 半宽 10mm
const c = 3;  // 槽口宽的一半 (6mm槽 -> 3mm)
const d = 3;  // 槽深 
// const i = 1.5; // 内部小倒角 (unused)

profileShape2020.moveTo(-s, -s); // 左下
profileShape2020.lineTo(-c, -s); // 底部槽口左
profileShape2020.lineTo(-c, -s + d); // 槽内
profileShape2020.lineTo(c, -s + d);  // 槽内
profileShape2020.lineTo(c, -s);    // 底部槽口右
profileShape2020.lineTo(s, -s);  // 右下

profileShape2020.lineTo(s, -c);  // 右侧槽口下
profileShape2020.lineTo(s - d, -c);
profileShape2020.lineTo(s - d, c);
profileShape2020.lineTo(s, c);   // 右侧槽口上
profileShape2020.lineTo(s, s);   // 右上

profileShape2020.lineTo(c, s);
profileShape2020.lineTo(c, s - d);
profileShape2020.lineTo(-c, s - d);
profileShape2020.lineTo(-c, s);
profileShape2020.lineTo(-s, s);  // 左上

profileShape2020.lineTo(-s, c);
profileShape2020.lineTo(-s + d, c);
profileShape2020.lineTo(-s + d, -c);
profileShape2020.lineTo(-s, -c);
profileShape2020.lineTo(-s, -s); // 回到原点

export function AluProfile({ type: _type, length, position = [0, 0, 0], rotation = [0, 0, 0] }: AluProfileProps) {

    const shape = useMemo(() => {
        // TODO: support other profile shapes (3030/4040) - currently reusing 2020.
        return profileShape2020;
    }, []);

    // _type is only used for future profile types, reference it to avoid linting noise
    void _type;

    const extrudeSettings = useMemo(() => ({
        depth: length,
        bevelEnabled: false, // 工业型材通常不需要各种倒角计算，节省性能
        steps: 1,
    }), [length]);

    const [hovered, setHovered] = useState(false);

    return (
        <group position={position} rotation={rotation} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }} onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}>
            <Extrude args={[shape, extrudeSettings]} castShadow receiveShadow>
                {/* 铝材材质：金属质感，银灰色 */}
                <meshStandardMaterial
                    color={hovered ? '#cde9ff' : '#e0e0e0'}
                    roughness={0.3}
                    metalness={0.8}
                />
            </Extrude>

            {/* 黑色线条勾勒轮廓，增加CAD图纸感 (可选) */}
            <lineSegments>
                <edgesGeometry args={[new THREE.ExtrudeGeometry(shape, extrudeSettings)]} />
                <lineBasicMaterial color="#333" opacity={0.2} transparent />
            </lineSegments>
        </group>
    );
}
