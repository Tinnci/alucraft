'use client';

import { useEffect } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { validateDesignJSON } from '@/utils/validation';

/**
 * useAppState - 应用级副作用管理 Hook
 * 
 * 负责以下职责：
 * 1. 从 localStorage 加载设计数据（初始化）
 * 2. 将设计数据持久化到 localStorage（监听变化）
 * 3. 同步深色模式状态到 HTML class（实现 Tailwind dark 模式）
 * 
 * 这个 Hook 将所有与应用状态相关的副作用集中管理，
 * 使得 page.tsx 可以专注于纯粹的布局组件拼装。
 */
export function useAppState() {
  // ===== 状态 Setters =====
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);
  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setOverlay = useDesignStore((state: DesignState) => state.setOverlay);
  const setHasLeftWall = useDesignStore((state: DesignState) => state.setHasLeftWall);
  const setHasRightWall = useDesignStore((state: DesignState) => state.setHasRightWall);
  const setIsDoorOpen = useDesignStore((state: DesignState) => state.setIsDoorOpen);
  const setResult = useDesignStore((state: DesignState) => state.setResult);
  const setShowSnapGuides = useDesignStore((state: DesignState) => state.setShowSnapGuides);
  const setEnableHaptics = useDesignStore((state: DesignState) => state.setEnableHaptics);

  // ===== 状态 Getters =====
  const width = useDesignStore((state: DesignState) => state.width);
  const height = useDesignStore((state: DesignState) => state.height);
  const depth = useDesignStore((state: DesignState) => state.depth);
  const profileType = useDesignStore((state: DesignState) => state.profileType);
  const overlay = useDesignStore((state: DesignState) => state.overlay);
  const hasLeftWall = useDesignStore((state: DesignState) => state.hasLeftWall);
  const hasRightWall = useDesignStore((state: DesignState) => state.hasRightWall);
  const isDoorOpen = useDesignStore((state: DesignState) => state.isDoorOpen);
  const result = useDesignStore((state: DesignState) => state.result);
  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);
  const showSnapGuides = useDesignStore((state: DesignState) => state.showSnapGuides);
  const enableHaptics = useDesignStore((state: DesignState) => state.enableHaptics);

  // ===== 效果 1: 初始化 - 从 localStorage 读取数据 =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('alucraft-design');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      
      // 恢复所有设计参数
      if (parsed.width) setWidth(parsed.width);
      if (parsed.height) setHeight(parsed.height);
      if (parsed.depth) setDepth(parsed.depth);
      if (parsed.profileType) setProfileType(parsed.profileType);
      if (parsed.overlay !== undefined) setOverlay(parsed.overlay);
      if (parsed.hasLeftWall !== undefined) setHasLeftWall(parsed.hasLeftWall);
      if (parsed.hasRightWall !== undefined) setHasRightWall(parsed.hasRightWall);
      if (parsed.isDoorOpen !== undefined) setIsDoorOpen(parsed.isDoorOpen);
      if (parsed.result) setResult(parsed.result);
      // If a layout is present, validate and set it
      if (parsed.layout) {
        const validation = validateDesignJSON(parsed.layout);
        if (validation.success) {
          // Ensure we call store method to load layout, if available
          const setLayout = useDesignStore.getState().setLayout;
          if (setLayout) setLayout(parsed.layout as any);
        } else {
          console.warn('Saved layout failed validation:', validation.error);
        }
      }
  if (parsed.showSnapGuides !== undefined) setShowSnapGuides(parsed.showSnapGuides);
  if (parsed.enableHaptics !== undefined) setEnableHaptics(parsed.enableHaptics);
    } catch (err) {
      console.warn('Failed to load saved design from localStorage', err);
    }
  }, [setWidth, setHeight, setDepth, setProfileType, setOverlay, setHasLeftWall, setHasRightWall, setIsDoorOpen, setResult, setShowSnapGuides, setEnableHaptics]);

  // ===== 效果 2: 持久化 - 数据变化时保存到 localStorage =====
  useEffect(() => {
    if (typeof window === 'undefined') return;
  const state = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result, showSnapGuides, enableHaptics };
    try {
      localStorage.setItem('alucraft-design', JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save design to localStorage', err);
    }
  }, [width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, isDoorOpen, result, showSnapGuides, enableHaptics]);

  // ===== 效果 3: 主题同步 - 将 isDarkMode 状态同步到 HTML class =====
  // 这样 Tailwind 的 dark: 伪类选择器才能生效
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
}
