'use client';

import React from 'react';
import { AluProfile } from './AluProfile';
import { PROFILES, ProfileType } from '@/core/types';
import { Shelf } from '@/store/useDesignStore';

interface CabinetFrameProps {
    width: number;
    height: number;
    depth: number;
    profileType: ProfileType;
    shelves?: Shelf[];
}

export function CabinetFrame({ width, height, depth, profileType, shelves = [] }: CabinetFrameProps) {
    const profile = PROFILES[profileType];
    const s = profile.size; // 例如 20 或 30

    // --- 1. 自动切割计算 (Auto-cutting Logic) ---
    // 规则：立柱落地 (贯通)，横梁和深梁让位
    const hLength = height;
    const wLength = width - (s * 2); // 减去两根立柱的宽度
    const dLength = depth - (s * 2); // 减去两根立柱的深度

    // 坐标偏移量 (Offset) - 用于定位横梁中心
    const offset = s / 2;

    return (
        <group>
            {/* --- 4根 立柱 (Verticals) --- */}
            {/* 左前 */}
            <AluProfile type={profileType} length={hLength} position={[-width / 2 + offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
            {/* 右前 */}
            <AluProfile type={profileType} length={hLength} position={[width / 2 - offset, -height / 2, depth / 2 - offset]} rotation={[-Math.PI / 2, 0, 0]} />
            {/* 左后 */}
            <AluProfile type={profileType} length={hLength} position={[-width / 2 + offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />
            {/* 右后 */}
            <AluProfile type={profileType} length={hLength} position={[width / 2 - offset, -height / 2, -depth / 2 + offset]} rotation={[-Math.PI / 2, 0, 0]} />

            {/* --- 4根 横梁 (Width Beams) - 连接左右 --- */}
            {/* 上前 */}
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, height / 2 - offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
            {/* 下前 */}
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, -height / 2 + offset, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
            {/* 上后 */}
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, height / 2 - offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />
            {/* 下后 */}
            <AluProfile type={profileType} length={wLength} position={[-wLength / 2, -height / 2 + offset, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />

            {/* --- 4根 深梁 (Depth Beams) - 连接前后 --- */}
            {/* 左上 */}
            <AluProfile type={profileType} length={dLength} position={[-width / 2 + offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} />
            {/* 左下 */}
            <AluProfile type={profileType} length={dLength} position={[-width / 2 + offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} />
            {/* 右上 */}
            <AluProfile type={profileType} length={dLength} position={[width / 2 - offset, height / 2 - offset, -dLength / 2]} rotation={[0, 0, 0]} />
            {/* 右下 */}
            <AluProfile type={profileType} length={dLength} position={[width / 2 - offset, -height / 2 + offset, -dLength / 2]} rotation={[0, 0, 0]} />

            {/* --- Shelves --- */}
            {shelves.map((shelf) => {
                // shelf.y is from bottom (0) to height
                // World Y = shelf.y - height / 2
                const y = shelf.y - height / 2;
                return (
                    <group key={shelf.id}>
                        {/* Front Width Beam */}
                        <AluProfile type={profileType} length={wLength} position={[-wLength / 2, y, depth / 2 - offset]} rotation={[0, Math.PI / 2, 0]} />
                        {/* Back Width Beam */}
                        <AluProfile type={profileType} length={wLength} position={[-wLength / 2, y, -depth / 2 + offset]} rotation={[0, Math.PI / 2, 0]} />
                        {/* Left Depth Beam */}
                        <AluProfile type={profileType} length={dLength} position={[-width / 2 + offset, y, -dLength / 2]} rotation={[0, 0, 0]} />
                        {/* Right Depth Beam */}
                        <AluProfile type={profileType} length={dLength} position={[width / 2 - offset, y, -dLength / 2]} rotation={[0, 0, 0]} />
                    </group>
                );
            })}
        </group>
    );
}
