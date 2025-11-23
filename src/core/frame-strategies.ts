import { ProfileType } from '@/core/types';
import { PROFILES } from '@/config/profiles';

export interface FramePart {
    id: string;
    type: 'pillar' | 'width-beam' | 'depth-beam';
    length: number;
    position: [number, number, number];
    rotation: [number, number, number];
}

// Simple unique ID generator
function uid(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateCabinetFrame(
    width: number,
    height: number,
    depth: number,
    profileType: ProfileType
): FramePart[] {
    const profile = PROFILES[profileType];
    const s = profile.size;
    const offset = s / 2;

    // 长度计算
    const hLength = height;
    const wLength = width - (s * 2);
    const dLength = depth - (s * 2);

    const parts: FramePart[] = [];

    // 1. 立柱 (Pillars) - 4根
    // 左前 (-x, +z)
    parts.push({
        id: uid(), type: 'pillar', length: hLength,
        position: [-width / 2 + offset, -height / 2, depth / 2 - offset],
        rotation: [-Math.PI / 2, 0, 0]
    });
    // 右前 (+x, +z)
    parts.push({
        id: uid(), type: 'pillar', length: hLength,
        position: [width / 2 - offset, -height / 2, depth / 2 - offset],
        rotation: [-Math.PI / 2, 0, 0]
    });
    // 左后 (-x, -z)
    parts.push({
        id: uid(), type: 'pillar', length: hLength,
        position: [-width / 2 + offset, -height / 2, -depth / 2 + offset],
        rotation: [-Math.PI / 2, 0, 0]
    });
    // 右后 (+x, -z)
    parts.push({
        id: uid(), type: 'pillar', length: hLength,
        position: [width / 2 - offset, -height / 2, -depth / 2 + offset],
        rotation: [-Math.PI / 2, 0, 0]
    });

    // 2. 横梁 (Width Beams) - 4根
    const wPositions: [number, number, number][] = [
        [-wLength / 2, height / 2 - offset, depth / 2 - offset], // 顶前
        [-wLength / 2, -height / 2 + offset, depth / 2 - offset], // 底前
        [-wLength / 2, height / 2 - offset, -depth / 2 + offset], // 顶后
        [-wLength / 2, -height / 2 + offset, -depth / 2 + offset] // 底后
    ];
    wPositions.forEach(pos => {
        parts.push({
            id: uid(), type: 'width-beam', length: wLength,
            position: pos,
            rotation: [0, Math.PI / 2, 0]
        });
    });

    // 3. 深梁 (Depth Beams) - 4根
    const dPositions: [number, number, number][] = [
        [-width / 2 + offset, height / 2 - offset, -dLength / 2], // 左顶
        [-width / 2 + offset, -height / 2 + offset, -dLength / 2], // 左底
        [width / 2 - offset, height / 2 - offset, -dLength / 2], // 右顶
        [width / 2 - offset, -height / 2 + offset, -dLength / 2]  // 右底
    ];
    dPositions.forEach(pos => {
        parts.push({
            id: uid(), type: 'depth-beam', length: dLength,
            position: pos,
            rotation: [0, 0, 0]
        });
    });

    return parts;
}
