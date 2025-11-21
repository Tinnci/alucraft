'use client';

import React, { useRef } from 'react';
import {
  Settings2,
  Download,
  Upload,
  Undo2,
  Redo2,
  SunMedium,
  PanelRightOpen,
  PanelRightClose,
  Eye,
  EyeOff,
  Video,
} from 'lucide-react';
import { useStore } from 'zustand';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { MaterialType } from '@/core/types';
import useUIStore from '@/store/useUIStore';
import { DxfGenerator } from '@/utils/DxfGenerator';
import { ProfileType } from '@/core/types';

/**
 * TopBar - 全局设置和操作的顶部导航栏
 * 包含：预设、主题切换、撤销/重做、视图控制、导入/导出
 */
export function TopBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store State
  const profileType = useDesignStore((state: DesignState) => state.profileType);
  const material = useDesignStore((state: DesignState) => state.material);
  const showDimensions = useDesignStore((state: DesignState) => state.showDimensions);
  const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);
  const layout = useDesignStore((state: DesignState) => state.layout);

  // Temporal State (for undo/redo)
  const { undo, redo, pastStates, futureStates } = useStore(useDesignStore.temporal);

  // Setters
  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setMaterial = useDesignStore((state: DesignState) => state.setMaterial);
  const toggleTheme = useDesignStore((state: DesignState) => state.toggleTheme);
  const setShowDimensions = useDesignStore((state: DesignState) => state.setShowDimensions);
  const setShowWireframe = useDesignStore((state: DesignState) => state.setShowWireframe);
  const triggerCameraReset = useDesignStore((state: DesignState) => state.triggerCameraReset);

  // UI Store
  const isTopBarExpanded = useUIStore((state) => state.isTopBarExpanded);
  const setTopBarExpanded = useUIStore((state) => state.setTopBarExpanded);
  const setBOMPanelOpen = useUIStore((state) => state.setBOMPanelOpen);
  const isPropertyPanelOpen = useUIStore((state) => state.isPropertyPanelOpen);
  const setPropertyPanelOpen = useUIStore((state) => state.setPropertyPanelOpen);

  // Export/Import handlers
  const downloadDesign = () => {
    const state = useDesignStore.getState();
    const { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, connectorType, result, layout } = state;
    const designData = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, connectorType, result, layout };
    const blob = new Blob([JSON.stringify(designData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-design.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDxf = () => {
    const state = useDesignStore.getState();
    const generator = new DxfGenerator(state);
    const dxfContent = generator.generate();
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-design.dxf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadDesign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const state = useDesignStore.getState();
        if (parsed.width) state.setWidth(parsed.width);
        if (parsed.height) state.setHeight(parsed.height);
        if (parsed.depth) state.setDepth(parsed.depth);
        if (parsed.profileType) state.setProfileType(parsed.profileType);
        if (parsed.overlay !== undefined) state.setOverlay(parsed.overlay);
        if (parsed.hasLeftWall !== undefined) state.setHasLeftWall(parsed.hasLeftWall);
        if (parsed.hasRightWall !== undefined) state.setHasRightWall(parsed.hasRightWall);
        if (parsed.connectorType !== undefined) state.setConnectorType(parsed.connectorType);
        if (parsed.result) state.setResult(parsed.result);
      } catch {
        alert('Invalid design file');
      }
    };
    reader.readAsText(file);
  };

  const applyPreset = (preset: string) => {
    const state = useDesignStore.getState();
    const primaryBay = layout.find(n => n.type === 'bay');
    switch (preset) {
      case 'standard':
        state.setWidth(600);
        state.setHeight(800);
        state.setDepth(400);
        if (primaryBay) state.setBayDoorConfig(primaryBay.id, { enabled: true, type: 'single', hingeSide: 'left' });
        break;
      case 'wall':
        state.setWidth(400);
        state.setHeight(600);
        state.setDepth(350);
        if (primaryBay) state.setBayDoorConfig(primaryBay.id, { enabled: true, type: 'single', hingeSide: 'right' });
        break;
      case 'pantry':
        state.setWidth(800);
        state.setHeight(2000);
        state.setDepth(500);
        if (primaryBay) state.setBayDoorConfig(primaryBay.id, { enabled: true, type: 'double' });
        break;
    }
  };

  return (
    <div
      className={`
        w-full
        bg-slate-900/50 backdrop-blur-md glass-shine
        border-b border-white/10 shadow-lg
        transition-all duration-300
        ${isTopBarExpanded ? 'h-auto' : 'h-12'}
      `}
    >
      <div className="px-4 py-3 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
              ALUCRAFT
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTopBarExpanded(!isTopBarExpanded)}
              className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              {isTopBarExpanded ? '−' : '+'}
            </button>
            <button
              onClick={() => setPropertyPanelOpen(!isPropertyPanelOpen)}
              className={`p-2 rounded-md transition-colors ${isPropertyPanelOpen ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}
              title={isPropertyPanelOpen ? "Hide Inspector" : "Show Inspector"}
            >
              {isPropertyPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </button>
          </div>
        </div>

        {/* Content (shown when expanded) */}
        {isTopBarExpanded && (
          <div className="space-y-3 pt-2 border-t border-border">
            {/* Profile & Material */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Profile</label>
                <div className="flex bg-muted p-1 rounded gap-1">
                  {['2020', '3030', '4040'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setProfileType(type as ProfileType)}
                      className={`flex-1 py-1 rounded text-xs transition-colors ${
                        profileType === type
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Material</label>
                <div className="flex bg-muted p-1 rounded gap-1">
                  {['silver', 'dark_metal', 'wood'].map((mat) => (
                    <button
                      key={mat}
                      onClick={() => setMaterial(mat as MaterialType)}
                      className={`flex-1 py-1 rounded text-xs transition-colors ${
                        material === mat
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mat === 'dark_metal' ? 'Dark' : mat.charAt(0).toUpperCase() + mat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Presets</label>
                <select
                  className="w-full bg-muted text-muted-foreground text-xs rounded px-2 py-1.5 border border-transparent focus:border-blue-500 focus:outline-none cursor-pointer hover:text-foreground"
                  onChange={(e) => applyPreset(e.target.value)}
                  value=""
                >
                  <option value="" disabled>
                    Load Preset
                  </option>
                  <option value="standard">Standard Base</option>
                  <option value="wall">Wall Unit</option>
                  <option value="pantry">Pantry</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {/* Undo/Redo */}
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1 border border-border">
                <button
                  onClick={() => undo()}
                  disabled={pastStates.length === 0}
                  className={`p-1.5 rounded hover:bg-background transition-colors ${
                    pastStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'
                  }`}
                  title="Undo"
                >
                  <Undo2 size={14} />
                </button>
                <div className="w-px h-3 bg-border"></div>
                <button
                  onClick={() => redo()}
                  disabled={futureStates.length === 0}
                  className={`p-1.5 rounded hover:bg-background transition-colors ${
                    futureStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'
                  }`}
                  title="Redo"
                >
                  <Redo2 size={14} />
                </button>
              </div>

              {/* View Controls */}
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`p-1.5 rounded border transition-colors ${
                  showWireframe
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title="Wireframe Mode"
              >
                <Settings2 size={14} />
              </button>

              <button
                onClick={() => setShowDimensions(!showDimensions)}
                className={`p-1.5 rounded border transition-colors ${
                  showDimensions
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
                title="Toggle Dimensions"
              >
                {showDimensions ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>

              <button
                onClick={() => triggerCameraReset()}
                className="p-1.5 rounded border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Reset Camera"
              >
                <Video size={14} />
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => toggleTheme()}
                className="p-1.5 rounded border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Toggle Theme"
              >
                <SunMedium size={14} />
              </button>

              {/* Export Buttons */}
              <button
                onClick={downloadDesign}
                className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-xs transition-colors"
                title="Download Design"
              >
                <Download size={12} /> Save
              </button>

              <button
                onClick={exportDxf}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 rounded text-xs transition-colors"
                title="Export to DXF"
              >
                <Download size={12} /> DXF
              </button>

              <label className="flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-xs transition-colors cursor-pointer">
                <Upload size={12} /> Load
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={loadDesign}
                  className="hidden"
                />
              </label>

              {/* BOM Panel Toggle */}
              <button
                onClick={() => setBOMPanelOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded text-xs transition-colors"
              >
                BOM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
