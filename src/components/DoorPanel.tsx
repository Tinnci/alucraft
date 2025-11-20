'use client';

import React from 'react';
// Hinge hole visualizer moved out to top-level to avoid creating components during render
interface HingeHoleVisualizerProps {
    holeX: number;
    yPosition: number;
    thickness: number;
    cupRadius: number;
    screwY_Offset: number;
}

export function HingeHoleVisualizer({ holeX, yPosition, thickness, cupRadius, screwY_Offset }: HingeHoleVisualizerProps) {
    return (
        <group position={[holeX, yPosition, thickness / 2 + 0.1]}> {/* Z轴微调，浮在表面 */}
            {/* 35mm 杯孔 */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[cupRadius, cupRadius, 1, 32]} />
                <meshBasicMaterial color="#222" /> {/* 深灰色模拟空洞 */}
            </mesh>

            {/* 两个螺丝孔 (模拟) */}
            <mesh position={[0, screwY_Offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2, 2, 1, 16]} /> {/* 4mm 螺丝孔 */}
                <meshBasicMaterial color="#444" />
            </mesh>
            <mesh position={[0, -screwY_Offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[2, 2, 1, 16]} />
                <meshBasicMaterial color="#444" />
            </mesh>
        </group>
    );
}
import { useSpring, animated } from '@react-spring/three';

interface DoorPanelProps {
    width: number;
    height: number;
    thickness?: number;
    material?: 'Glass' | 'AluminumHoneycomb';
    position: [number, number, number];
    hingeSide?: 'left' | 'right';
    isOpen: boolean;
    onToggle?: () => void; // 点击门板切换开关状态的回调
    highlightError?: boolean; // 可视化碰撞/错误高亮
    overlay?: number;        // 当前遮盖量 (mm)，用于画内轮廓辅助
    // [NEW] Phase 3: 钻孔数据
    showHoles?: boolean; // 是否显示孔位
    kValue?: number;     // 比如 3, 4, 5, 6...
    hingeSeries?: 'C80' | 'Cover25'; // 决定螺丝孔距
}

export function DoorPanel({
    width,
    height,
    thickness = 20,
    material = 'AluminumHoneycomb',
    position,
    hingeSide = 'left',
    isOpen,
    onToggle,
    highlightError = false,
    overlay = 0,
    showHoles = true, // 默认开启
    kValue = 4,       // 默认给个值防止报错
    hingeSeries = 'C80'
}: DoorPanelProps) {
    
    highlightError = Boolean(highlightError);

    const [hovered, setHovered] = React.useState(false);

    // 动画逻辑
    const { rotationY, emissiveIntensity } = useSpring({
        rotationY: isOpen ? (hingeSide === 'left' ? -Math.PI / 2 : Math.PI / 2) : 0,
        emissiveIntensity: highlightError ? 0.8 : 0,
        config: { mass: 1, tension: 170, friction: 26 }
    });

    const meshOffsetX = hingeSide === 'left' ? width / 2 : -width / 2;

    const innerWidth = Math.max(0, width - (overlay * 2));

    // --- 钻孔位置计算逻辑 ---
    // 1. 铰链通常安装在离上下边缘 100mm - 150mm 的位置
    const hingeOffsetY = 120;

    // 2. 杯孔中心 X 坐标 (相对于门板边缘)
    // 门板边缘在 meshOffsetX 那个方向的 0 点 (局部坐标系中，门板左边缘是 -width/2, 右边缘是 width/2)
    // 如果 hingeSide='left', 铰链在左边 (-width/2)。
    // 孔中心 X = -width/2 + (K + 17.5)
    const cupRadius = 17.5; // 35mm / 2
    const cupCenterDist = kValue + cupRadius;

    // 局部坐标系修正：
    // 我们的 Mesh 是居中的 (BoxGeometry)，所以左边缘是 -width/2。
    const holeX_Local = hingeSide === 'left'
        ? -width / 2 + cupCenterDist
        : width / 2 - cupCenterDist;

    // 3. 螺丝孔模式 (基于图11)
    // C80: 48mm 间距; Cover25: 45mm 间距
    const screwSpacing = hingeSeries === 'Cover25' ? 45 : 48;
    // 简化展示：假设螺丝孔就在杯孔两侧 (Y轴方向分布？不，通常是垂直于杯孔连线的)
    // 查图11：螺丝孔是在杯孔的“耳朵”上。
    // 简单可视化：我们在杯孔中心的两侧（上下方向，即 Y 轴）画两个小点代表螺丝孔。
    const screwY_Offset = screwSpacing / 2;

    // (HingeHoleVisualizer is defined at file scope)

    return (
        <group position={position}>
            <animated.group rotation-y={rotationY}>

                {/* 门板实体 */}
                <mesh
                    position={[meshOffsetX, 0, thickness / 2]}
                    castShadow
                    receiveShadow
                    // pointer events
                    onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
                    onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
                    onClick={(e) => { e.stopPropagation(); if (typeof onToggle === 'function') onToggle(); }}
                >
                    <boxGeometry args={[width, height, thickness]} />
                    <animated.meshStandardMaterial
                        color={hovered ? '#fef08a' : (highlightError ? '#ffe6e6' : (material === 'Glass' ? '#aaddff' : '#ffffff'))}
                        transparent={material === 'Glass'}
                        opacity={material === 'Glass' ? 0.6 : 1}
                        roughness={0.2}
                        metalness={0.1}
                        emissive="#ff4d4d"
                        emissiveIntensity={emissiveIntensity}
                    />
                </mesh>

                {/* 把手 */}
                <mesh position={[hingeSide === 'left' ? width - 30 : 30 - width, 0, thickness + 10]}>
                    <boxGeometry args={[10, 100, 10]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Overlay inner width ghost */}
                <mesh position={[meshOffsetX, 0, thickness / 2 + 0.01]}> {/* 放在门板表面之上 */}
                    <boxGeometry args={[innerWidth, height, 1]} />
                    <meshBasicMaterial color="#444" opacity={0.08} transparent />
                </mesh>

                {/* [NEW] 铰链孔位可视化 */}
                {showHoles && (
                    <>
                        {/* 上铰链 */}
                        <HingeHoleVisualizer holeX={holeX_Local} yPosition={height / 2 - hingeOffsetY} thickness={thickness} cupRadius={cupRadius} screwY_Offset={screwY_Offset} />
                        {/* 下铰链 */}
                        <HingeHoleVisualizer holeX={holeX_Local} yPosition={-height / 2 + hingeOffsetY} thickness={thickness} cupRadius={cupRadius} screwY_Offset={screwY_Offset} />
                    </>
                )}

            </animated.group>
        </group>
    );
}