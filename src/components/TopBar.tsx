'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  Magnet,
} from 'lucide-react';
import { useStore } from 'zustand';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { MaterialType, findBays } from '@/core/types';
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
  const showSnapGuides = useDesignStore((state: DesignState) => state.showSnapGuides);
  const layout = useDesignStore((state: DesignState) => state.layout);

  // Temporal State (for undo/redo)
  const { undo, redo, pastStates, futureStates } = useStore(useDesignStore.temporal);

  // Setters
  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setMaterial = useDesignStore((state: DesignState) => state.setMaterial);
  const toggleTheme = useDesignStore((state: DesignState) => state.toggleTheme);
  const setShowDimensions = useDesignStore((state: DesignState) => state.setShowDimensions);
  const setShowWireframe = useDesignStore((state: DesignState) => state.setShowWireframe);
  const setShowSnapGuides = useDesignStore((state: DesignState) => state.setShowSnapGuides);
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
    const primaryBay = findBays(layout)[0];
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
        glass-panel glass-shine
        transition-all duration-300
        ${isTopBarExpanded ? 'h-auto' : 'h-14'}
        z-50 relative
      `}
    >
      <div className="px-4 py-3 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
              ALUCRAFT
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setTopBarExpanded(!isTopBarExpanded)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isTopBarExpanded ? '−' : '+'}
            </Button>
            <Button
              variant={isPropertyPanelOpen ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setPropertyPanelOpen(!isPropertyPanelOpen)}
              title={isPropertyPanelOpen ? "Hide Inspector" : "Show Inspector"}
              className={!isPropertyPanelOpen ? "text-muted-foreground" : ""}
            >
              {isPropertyPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </Button>
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
                    <Button
                      key={type}
                      variant={profileType === type ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setProfileType(type as ProfileType)}
                      className="flex-1 h-7 text-xs"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Material</label>
                <div className="flex bg-muted p-1 rounded gap-1">
                  {['silver', 'dark_metal', 'wood'].map((mat) => (
                    <Button
                      key={mat}
                      variant={material === mat ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setMaterial(mat as MaterialType)}
                      className="flex-1 h-7 text-xs"
                    >
                      {mat === 'dark_metal' ? 'Dark' : mat.charAt(0).toUpperCase() + mat.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Presets</label>
                <Select onValueChange={(value) => applyPreset(value)}>
                  <SelectTrigger className="w-full h-8 text-xs bg-muted border-transparent focus:ring-offset-0 focus:ring-1 focus:ring-primary">
                    <SelectValue placeholder="Load Preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Base</SelectItem>
                    <SelectItem value="wall">Wall Unit</SelectItem>
                    <SelectItem value="pantry">Pantry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {/* Undo/Redo */}
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-1 border border-border">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => undo()}
                  disabled={pastStates.length === 0}
                  className="h-7 w-7 text-primary hover:text-primary/80"
                  title="Undo"
                >
                  <Undo2 size={14} />
                </Button>
                <div className="w-px h-3 bg-border"></div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => redo()}
                  disabled={futureStates.length === 0}
                  className="h-7 w-7 text-primary hover:text-primary/80"
                  title="Redo"
                >
                  <Redo2 size={14} />
                </Button>
              </div>

              {/* View Controls */}
              <Button
                variant={showWireframe ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setShowWireframe(!showWireframe)}
                className={showWireframe ? "text-primary bg-primary/10" : "text-muted-foreground"}
                title="Wireframe Mode"
              >
                <Settings2 size={14} />
              </Button>

              <Button
                variant={showDimensions ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setShowDimensions(!showDimensions)}
                className={showDimensions ? "text-primary bg-primary/10" : "text-muted-foreground"}
                title="Toggle Dimensions"
              >
                {showDimensions ? <Eye size={14} /> : <EyeOff size={14} />}
              </Button>

              <Button
                variant={showSnapGuides ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setShowSnapGuides(!showSnapGuides)}
                className={showSnapGuides ? "text-primary bg-primary/10" : "text-muted-foreground"}
                title={showSnapGuides ? "Disable Snapping Guides" : "Enable Snapping Guides"}
              >
                <Magnet size={14} />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => triggerCameraReset()}
                className="text-muted-foreground hover:text-foreground"
                title="Reset Camera"
              >
                <Video size={14} />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => toggleTheme()}
                className="text-muted-foreground hover:text-foreground"
                title="Toggle Theme"
              >
                <SunMedium size={14} />
              </Button>

              {/* Export Buttons */}
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadDesign}
                className="h-7 text-xs gap-1"
                title="Download Design"
              >
                <Download size={12} /> Save
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportDxf}
                className="h-7 text-xs gap-1 text-primary border-primary/20 bg-primary/10 hover:bg-primary/20"
                title="Export to DXF"
              >
                <Download size={12} /> DXF
              </Button>

              <label className="flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md text-xs transition-colors cursor-pointer h-7">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBOMPanelOpen(true)}
                className="h-7 text-xs gap-1 text-primary border-primary/20 bg-primary/10 hover:bg-primary/20"
              >
                BOM
              </Button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
