'use client';

import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { Canvas } from '@react-three/fiber';
import { TopBar } from '@/components/TopBar';
import { PropertyInspector } from '@/components/PropertyInspector';
import { BottomBar } from '@/components/BottomBar';
import { LeftSidebar } from '@/components/Sidebar/LeftSidebar';
import { DesignToaster } from '@/components/DesignToaster';
import { ContextToolbar } from '@/components/ContextToolbar';
import { BOMPanel } from '@/components/BOMPanel';
import { Workspace } from '@/components/Scene/Workspace';
import { useAppState } from '@/hooks/useAppState';
import { useCallback } from 'react';

export default function Home() {
  // 挂载全局副作用（数据加载、保存、主题切换）
  useAppState();

  // 获取用于渲染 Canvas 背景的状态
  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);
  const height = useDesignStore((state: DesignState) => state.height);
  const splitItem = useDesignStore((state: DesignState) => state.splitItem);
  const addShelf = useDesignStore((state: DesignState) => state.addShelf);
  const addDrawer = useDesignStore((state: DesignState) => state.addDrawer);
  const removeBay = useDesignStore((state: DesignState) => state.removeBay);

  // const result = useDesignStore((state: DesignState) => state.result); // No longer needed here
  const isPropertyPanelOpen = useUIStore((s) => s.isPropertyPanelOpen);
  const setPropertyPanelOpen = useUIStore((s) => s.setPropertyPanelOpen);
  const selectedBayId = useUIStore((s) => s.selectedBayId);
  const setSelectedBayId = useUIStore((s) => s.setSelectedBayId);
  // 确保这里的颜色与 globals.css 中的 --background 保持一致
  // Light: #ffffff, Dark: #0f172a (Slate 900)
  const bgColor = isDarkMode ? '#0f172a' : '#ffffff';

  // 获取清除选中状态的方法
  const clearSelection = useUIStore((state) => state.clearSelection);

  const handleSplit = useCallback(
    (orientation: 'horizontal' | 'vertical') => {
      if (!selectedBayId) return;
      splitItem(selectedBayId, orientation);
    },
    [selectedBayId, splitItem]
  );

  const handleAddShelf = useCallback(() => {
    if (!selectedBayId) return;
    addShelf(selectedBayId, height / 2);
  }, [addShelf, height, selectedBayId]);

  const handleAddDrawer = useCallback(() => {
    if (!selectedBayId) return;
    addDrawer(selectedBayId, 200, 200);
  }, [addDrawer, selectedBayId]);

  const handleDeleteBay = useCallback(() => {
    if (!selectedBayId) return;
    removeBay(selectedBayId);
    setSelectedBayId(null);
  }, [removeBay, selectedBayId, setSelectedBayId]);

  // 使用 onPointerMissed 处理点击空白处的交互
  // R3F 自动检测"点击了 Canvas 但没点中任何 3D 物体"的情况
  const handlePointerMissed = (e: MouseEvent) => {
    // 仅在主要点击（click）时触发，避免拖拽旋转结束时误触
    if (e.type === 'click') {
      clearSelection();
    }
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      <DesignToaster />
      {/* Top */}
      <div className="shrink-0 z-50 relative">
        <TopBar />
      </div>

      {/* Middle: Left Sidebar, Canvas, Right Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Hierarchy & Library */}
        <LeftSidebar />

        {/* Center: Canvas (adaptive) */}
        <div className="flex-1 relative bg-slate-900/20 min-w-0 flex flex-col">
          <div className="absolute inset-x-0 top-0 pointer-events-none p-4 z-40 flex justify-center">
            <div className="pointer-events-auto">
              <ContextToolbar
                selectedBayId={selectedBayId}
                onSplit={handleSplit}
                onAddShelf={handleAddShelf}
                onAddDrawer={handleAddDrawer}
                onDelete={handleDeleteBay}
              />
            </div>
          </div>
          <div className="flex-1 relative">
            <Canvas
              shadows
              camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 20000 }}
              onPointerMissed={handlePointerMissed}
            >
              <color attach="background" args={[bgColor]} />
              <fog attach="fog" args={[bgColor, 2000, 5000]} />
              <Workspace />
            </Canvas>

            {/* Toast Notification Removed */}
          </div>

          {/* Bottom: Status Bar */}
          <div className="shrink-0 z-30 pointer-events-auto">
            <BottomBar />
          </div>
        </div>

        {/* Mobile Backdrop (only visible on small screens when panel open) */}
        <div
          className={`md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity ${isPropertyPanelOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setPropertyPanelOpen(false)}
        />

        {/* Right: Property Inspector (Docked with smooth width transition on desktop; overlay on mobile) */}
        <div
          className={`fixed md:relative top-0 right-0 bottom-0 z-40 flex flex-col h-full transition-transform duration-300 ease-in-out overflow-hidden bg-background/95 backdrop-blur-md ${isPropertyPanelOpen ? 'translate-x-0 md:w-80 w-80 opacity-100 pointer-events-auto' : 'translate-x-full md:w-0 w-0 opacity-0 pointer-events-none md:border-l-0'}`}
        >
          <div className="w-80 h-full md:h-full md:w-80">
            <PropertyInspector />
          </div>
        </div>
      </div>

      {/* Modals / panels */}
      <BOMPanel />
    </main>
  );
}

