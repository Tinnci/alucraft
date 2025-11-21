'use client';

import useDesignStore, { DesignState } from '@/store/useDesignStore';
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
  const bgColor = isDarkMode ? '#0f172a' : '#f8fafc';

  return (
    <main className="relative w-screen h-screen bg-background overflow-hidden">
      
      {/* ===== Layer 1: 3D Scene (Full-screen background) ===== */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 20000 }}>
          <color attach="background" args={[bgColor]} />
          <fog attach="fog" args={[bgColor, 2000, 5000]} />
          <Workspace />
        </Canvas>
      </div>

      {/* ===== Layer 2: UI Overlay (Floating UI on top) ===== */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between">
        
        {/* Top: Global controls */}
        <div className="pointer-events-auto">
          <TopBar />
        </div>

        {/* Middle: Left toolbar + Right property inspector */}
        <div className="flex-1 flex justify-between items-start px-4 py-4 overflow-hidden">
          <div className="pointer-events-auto">
            <Toolbar />
          </div>
          <div className="pointer-events-auto flex flex-col gap-2 h-full max-h-[calc(100vh-120px)]">
            <PropertyInspector />
          </div>
        </div>

        {/* Bottom: Toast + Toolbar */}
        <div className="pointer-events-auto space-y-2 flex flex-col items-center w-full">
          {result && <Toast result={result} />}
          <div className="w-full">
            <BottomBar />
          </div>
        </div>
      </div>

      {/* ===== Layer 3: Modals & Panels ===== */}
      <BOMPanel />
      
    </main>
  );
}

