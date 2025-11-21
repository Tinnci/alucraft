'use client';

import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { Canvas } from '@react-three/fiber';
import { TopBar } from '@/components/TopBar';
import { PropertyInspector } from '@/components/PropertyInspector';
import { BottomBar } from '@/components/BottomBar';
import { Toolbar } from '@/components/Toolbar';
import { Toast } from '@/components/Toast';
import { BOMPanel } from '@/components/BOMPanel';
import { Workspace } from '@/components/Scene/Workspace';
import { useAppState } from '@/hooks/useAppState';

export default function Home() {
  // 挂载全局副作用（数据加载、保存、主题切换）
  useAppState();

  // 获取用于渲染 Canvas 背景的状态
  const isDarkMode = useDesignStore((state: DesignState) => state.isDarkMode);
  const result = useDesignStore((state: DesignState) => state.result);
  const isPropertyPanelOpen = useUIStore((s) => s.isPropertyPanelOpen);
  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';

  // 获取清除选中状态的方法
  const clearSelection = useUIStore((state) => state.clearSelection);

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
      {/* Top */}
      <div className="shrink-0 z-50 relative">
        <TopBar />
      </div>

      {/* Middle: left toolbar, canvas, right property inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Toolbar */}
        <div className="w-16 border-r border-white/10 bg-slate-900/20 z-40 flex flex-col items-center py-4 pointer-events-auto">
          <Toolbar />
        </div>

        {/* Center: Canvas (adaptive) */}
        <div className="flex-1 relative bg-slate-900/20 min-w-0">
          <Canvas 
            shadows 
            camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 20000 }}
            onPointerMissed={handlePointerMissed}
          >
            <color attach="background" args={[bgColor]} />
            <fog attach="fog" args={[bgColor, 2000, 5000]} />
            <Workspace />
          </Canvas>

          {/* Bottom: Toast + BottomBar centered over Canvas */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-[90%] z-30 pointer-events-auto">
            {result && <Toast result={result} />}
            <BottomBar />
          </div>
        </div>

        {/* Right: Property Inspector (Docked; collapses if closed) */}
        {isPropertyPanelOpen && (
          <div className="w-80 border-l border-white/10 bg-slate-900/80 backdrop-blur-md z-40 flex flex-col shrink-0 h-full pointer-events-auto">
            <PropertyInspector />
          </div>
        )}
      </div>

      {/* Modals / panels */}
      <BOMPanel />
    </main>
  );
}

