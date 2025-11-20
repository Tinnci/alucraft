'use client';

import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { useStore } from 'zustand';
import { 
  ChevronDown, 
  ChevronUp, 
  Settings2, 
  Ruler, 
  Box, 
  DoorOpen, 
  Download, 
  Upload, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  LucideIcon,
  SunMedium,
  Copy,
  Eye,
  EyeOff,
  Video
} from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { calculateHinge } from '@/core/hinge-rules';
import { ProfileType } from '@/core/types';

// Helper Component for Leva-style Slider
const LevaSlider = ({ label, value, min, max, step, onChange, unit = '' }: { 
  label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, unit?: string 
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync local value when prop changes
  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    let num = parseFloat(localValue);
    if (isNaN(num)) {
      setLocalValue(value.toString());
      return;
    }
    // Clamp
    num = Math.max(min, Math.min(max, num));
    onChange(num);
    setLocalValue(num.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex items-center gap-3 h-7 group">
      <label className="w-20 text-muted-foreground truncate text-[10px] font-medium">{label}</label>
      <div className="flex-1 relative h-full flex items-center">
        <input 
          type="range" min={min} max={max} step={step}
          value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-ew-resize z-10"
        />
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-75" 
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
      </div>
      <div className="w-12 flex items-center bg-muted rounded px-1 py-0.5 focus-within:ring-1 ring-blue-500">
        <input
            type="number"
            value={localValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-right text-[10px] font-mono focus:outline-none text-blue-500 appearance-none p-0 border-none"
            style={{ MozAppearance: 'textfield' }}
        />
        {unit && <span className="text-[10px] text-muted-foreground ml-0.5">{unit}</span>}
      </div>
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true, action }: { title: string, icon: LucideIcon, children: React.ReactNode, defaultOpen?: boolean, action?: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-t border-border pt-2 mt-2 first:border-0 first:pt-0 first:mt-0">
            <div 
                className="flex items-center justify-between cursor-pointer py-2 hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] group-hover:text-foreground transition-colors">
                    <Icon size={12} /> {title}
                </div>
                <div className="flex items-center gap-2">
                    {action}
                    {isOpen ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                </div>
            </div>
            {isOpen && <div className="space-y-3 pt-1">{children}</div>}
        </div>
    );
};

export function FloatingControls() {
  const [isExpanded, setIsExpanded] = useState(true);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // Store State
  const profileType = useDesignStore((state: DesignState) => state.profileType);
  const overlay = useDesignStore((state: DesignState) => state.overlay);
  const width = useDesignStore((state: DesignState) => state.width);
  const height = useDesignStore((state: DesignState) => state.height);
  const depth = useDesignStore((state: DesignState) => state.depth);
  const hasLeftWall = useDesignStore((state: DesignState) => state.hasLeftWall);
  const hasRightWall = useDesignStore((state: DesignState) => state.hasRightWall);
  const hasLeftPanel = useDesignStore((state: DesignState) => state.hasLeftPanel);
  const hasRightPanel = useDesignStore((state: DesignState) => state.hasRightPanel);
  const hasBackPanel = useDesignStore((state: DesignState) => state.hasBackPanel);
  const hasTopPanel = useDesignStore((state: DesignState) => state.hasTopPanel);
  const hasBottomPanel = useDesignStore((state: DesignState) => state.hasBottomPanel);
  const doorCount = useDesignStore((state: DesignState) => state.doorCount);
  const connectorType = useDesignStore((state: DesignState) => state.connectorType);
  const shelves = useDesignStore((state: DesignState) => state.shelves);
  const result = useDesignStore((state: DesignState) => state.result);
  const showDimensions = useDesignStore((state: DesignState) => state.showDimensions);
  const showWireframe = useDesignStore((state: DesignState) => state.showWireframe);

  // Temporal State
  const { undo, redo, pastStates, futureStates } = useStore(useDesignStore.temporal);

  // Setters
  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setOverlay = useDesignStore((state: DesignState) => state.setOverlay);
  const setResult = useDesignStore((state: DesignState) => state.setResult);
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);
  const setHasLeftWall = useDesignStore((state: DesignState) => state.setHasLeftWall);
  const setHasRightWall = useDesignStore((state: DesignState) => state.setHasRightWall);
  const setHasLeftPanel = useDesignStore((state: DesignState) => state.setHasLeftPanel);
  const setHasRightPanel = useDesignStore((state: DesignState) => state.setHasRightPanel);
  const setHasBackPanel = useDesignStore((state: DesignState) => state.setHasBackPanel);
  const setHasTopPanel = useDesignStore((state: DesignState) => state.setHasTopPanel);
  const setHasBottomPanel = useDesignStore((state: DesignState) => state.setHasBottomPanel);
  const setDoorCount = useDesignStore((state: DesignState) => state.setDoorCount);
  const setConnectorType = useDesignStore((state: DesignState) => state.setConnectorType);
  const setShowDimensions = useDesignStore((state: DesignState) => state.setShowDimensions);
  const setShowWireframe = useDesignStore((state: DesignState) => state.setShowWireframe);
  const addShelf = useDesignStore((state: DesignState) => state.addShelf);
  const removeShelf = useDesignStore((state: DesignState) => state.removeShelf);
  const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
  const duplicateShelf = useDesignStore((state: DesignState) => state.duplicateShelf);

  const handleCalculate = () => {
    let currentOverlay = overlay;
    let autoAdjusted = false;
    const warningMessages: string[] = [];

    if (hasLeftWall) {
      if (currentOverlay > 3) {
        currentOverlay = 2;
        autoAdjusted = true;
        warningMessages.push("Left wall detected: Overlay adjusted to 2mm.");
      }
    }

    const res = calculateHinge(profileType, currentOverlay);

    if (autoAdjusted) {
      setOverlay(currentOverlay);
      res.message = `[Auto-Adjusted] ${res.message}`;
      res.details = (res.details || "") + ` | ⚠️ ${warningMessages.join(' ')}`;
    } else if (res.success && hasLeftWall && currentOverlay > 2) {
      res.message += " (Warning: Tight clearance)";
    }

    setResult(res);
  };

  const downloadDesign = () => {
    const state = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, doorCount, connectorType, result, shelves };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-design.json';
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
        if (parsed.width) setWidth(parsed.width);
        if (parsed.height) setHeight(parsed.height);
        if (parsed.depth) setDepth(parsed.depth);
        if (parsed.profileType) setProfileType(parsed.profileType);
        if (parsed.overlay !== undefined) setOverlay(parsed.overlay);
        if (parsed.hasLeftWall !== undefined) setHasLeftWall(parsed.hasLeftWall);
        if (parsed.hasRightWall !== undefined) setHasRightWall(parsed.hasRightWall);
        if (parsed.doorCount !== undefined) setDoorCount(parsed.doorCount);
        if (parsed.connectorType !== undefined) setConnectorType(parsed.connectorType);
        if (parsed.result) setResult(parsed.result);
        // Shelves loading logic would go here if we had a setShelves, but for now we can't easily bulk set them without adding a store method.
        // Assuming user might manually add them back or we add setShelves later.
      } catch {
        // Keep user experience simple while still logging error details for debugging
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  const applyPreset = (preset: string) => {
    switch (preset) {
        case 'standard':
            setWidth(600); setHeight(800); setDepth(400); setDoorCount(1);
            break;
        case 'wall':
            setWidth(400); setHeight(600); setDepth(350); setDoorCount(1);
            break;
        case 'pantry':
            setWidth(800); setHeight(2000); setDepth(500); setDoorCount(2);
            break;
    }
  };

  return (
    <Draggable handle=".drag-handle" nodeRef={nodeRef as unknown as React.RefObject<HTMLElement>}>
      <div ref={nodeRef} className={`
        fixed top-4 right-4 z-50
        w-80
        bg-card/90
        backdrop-blur-md
        border border-border
        rounded-xl shadow-2xl
        transition-all duration-300 ease-in-out
        font-sans
        text-xs
        ${isExpanded ? 'max-h-[85vh]' : 'max-h-12'}
        overflow-hidden
        flex flex-col
      `}>
        
        {/* Header */}
        <div 
          className="drag-handle flex items-center justify-between p-3 cursor-move hover:bg-muted/50 select-none border-b border-border shrink-0"
        >
          <div className="flex items-center gap-2 text-foreground font-bold">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            ALUCRAFT <span className="text-muted-foreground font-normal">CONTROLS</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Presets Dropdown */}
            <select 
                className="bg-muted text-muted-foreground text-[10px] rounded px-1 py-0.5 border-none focus:ring-0 cursor-pointer hover:text-foreground"
                onChange={(e) => applyPreset(e.target.value)}
                defaultValue=""
            >
                <option value="" disabled>Presets</option>
                <option value="standard">Standard Base</option>
                <option value="wall">Wall Unit</option>
                <option value="pantry">Pantry</option>
            </select>

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => document.documentElement.classList.toggle('dark')}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Toggle Dark Mode"
            >
              <SunMedium size={14} />
            </button>

            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 border border-border" onPointerDown={(e) => e.stopPropagation()}>
              <button 
                onClick={() => undo()} 
                disabled={pastStates.length === 0}
                className={`p-1 rounded hover:bg-background transition-colors ${pastStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                title="Undo"
              >
                <Undo2 size={14} />
              </button>
              <div className="w-px h-3 bg-border"></div>
              <button 
                onClick={() => redo()} 
                disabled={futureStates.length === 0}
                className={`p-1 rounded hover:bg-background transition-colors ${futureStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
                title="Redo"
              >
                <Redo2 size={14} />
              </button>
            </div>

            <div 
              className="cursor-pointer p-1 hover:bg-muted rounded"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-1 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Dimensions */}
          <CollapsibleSection title="Dimensions" icon={Ruler}>
            <LevaSlider label="Width" value={width} min={200} max={2000} step={10} onChange={setWidth} />
            <LevaSlider label="Height" value={height} min={200} max={3000} step={10} onChange={setHeight} />
            <LevaSlider label="Depth" value={depth} min={200} max={1000} step={10} onChange={setDepth} />
          </CollapsibleSection>

          {/* Configuration */}
          <CollapsibleSection title="Configuration" icon={Settings2}>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Profile</label>
                <div className="flex bg-muted p-1 rounded gap-1">
                  {['2020', '3030', '4040'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setProfileType(type as ProfileType)}
                      className={`flex-1 py-1 rounded text-[10px] transition-colors ${profileType === type ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Doors</label>
                <div className="flex bg-muted p-1 rounded gap-1">
                  <button 
                    onClick={() => setDoorCount(1)}
                    className={`flex-1 py-1 rounded text-[10px] transition-colors ${doorCount === 1 ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    1
                  </button>
                  <button 
                    onClick={() => setDoorCount(2)}
                    className={`flex-1 py-1 rounded text-[10px] transition-colors ${doorCount === 2 ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    2
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Connector</label>
              <select 
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value as 'angle' | 'internal')}
                className="w-full bg-muted border border-transparent text-foreground text-[10px] rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="angle">Angle Bracket (L-Bracket)</option>
                <option value="internal">Internal Lock</option>
              </select>
            </div>
          </CollapsibleSection>

          {/* Internal Structure */}
          <CollapsibleSection 
            title="Shelves" 
            icon={Box} 
            action={
                <button onClick={(e) => { e.stopPropagation(); addShelf(height / 2); }} className="hover:text-blue-400 transition-colors p-1 hover:bg-muted rounded">
                    <Plus size={14} />
                </button>
            }
          >
            <div className="space-y-2">
              {shelves.length === 0 && <div className="text-[10px] text-muted-foreground italic text-center py-2">No shelves added</div>}
              {shelves.map(shelf => (
                <div key={shelf.id} className="flex items-center gap-2 bg-muted/50 p-2 rounded border border-border">
                  <div className="flex-1">
                    <LevaSlider 
                      label="Y-Pos" 
                      value={Math.round(shelf.y)} 
                      min={0} max={height} step={10} 
                      onChange={(v) => updateShelf(shelf.id, v)} 
                    />
                  </div>
                  <button onClick={() => duplicateShelf(shelf.id)} className="text-muted-foreground hover:text-blue-400 transition-colors" title="Duplicate">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => removeShelf(shelf.id)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Remove">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Hinge Logic */}
          <CollapsibleSection title="Hinge Logic" icon={DoorOpen}>
            <LevaSlider label="Overlay" value={overlay} min={-5} max={30} step={0.5} onChange={setOverlay} unit="mm" />
            
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasLeftWall} onChange={(e) => setHasLeftWall(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Left Wall (Obstacle)
              </label>
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasRightWall} onChange={(e) => setHasRightWall(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Right Wall (Obstacle)
              </label>
              <div className="w-full h-px bg-border my-1"></div>
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasLeftPanel} onChange={(e) => setHasLeftPanel(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Left Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasRightPanel} onChange={(e) => setHasRightPanel(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Right Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasBackPanel} onChange={(e) => setHasBackPanel(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Back Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasTopPanel} onChange={(e) => setHasTopPanel(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Top Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                <input type="checkbox" checked={hasBottomPanel} onChange={(e) => setHasBottomPanel(e.target.checked)} className="rounded bg-muted border-border text-blue-500 focus:ring-0" />
                Bottom Panel
              </label>
            </div>

            <button 
              onClick={handleCalculate}
              className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-600/20 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <Calculator size={12} /> Calculate Hinge
            </button>

            {result && (
              <div className={`p-2 rounded border text-[10px] ${result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {result.success ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {result.success ? 'Valid' : 'Issue'}
                </div>
                <div className="opacity-90 leading-relaxed">{result.message}</div>
                {result.success && result.recommendedHinge && (
                  <div className="mt-1 font-mono bg-background/50 p-1 rounded border border-border/50">
                    {result.recommendedHinge.name} (K={result.kValue})
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>

          {/* Footer Actions */}
          <div className="flex justify-between items-center px-1 py-2 border-t border-border mt-2">
            <div className="text-[10px] text-muted-foreground font-semibold uppercase">View</div>
            <div className="flex gap-1">
                <button 
                    className={`p-1.5 rounded hover:bg-muted transition-colors ${showWireframe ? 'text-blue-500 bg-blue-500/10' : 'text-muted-foreground'}`} 
                    title="Wireframe Mode"
                    onClick={() => setShowWireframe(!showWireframe)}
                >
                    <Box size={14} className={showWireframe ? "" : "opacity-50"} /> 
                </button>
                <button 
                    className={`p-1.5 rounded hover:bg-muted transition-colors ${showDimensions ? 'text-blue-500 bg-blue-500/10' : 'text-muted-foreground'}`} 
                    title="Toggle Dimensions"
                    onClick={() => setShowDimensions(!showDimensions)}
                >
                    {showDimensions ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Reset Camera (Coming Soon)">
                    <Video size={14} /> 
                </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
            <button onClick={downloadDesign} className="flex items-center justify-center gap-2 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-[10px] transition-colors">
              <Download size={12} /> Save
            </button>
            <label className="flex items-center justify-center gap-2 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-[10px] transition-colors cursor-pointer">
              <Upload size={12} /> Load
              <input type="file" accept="application/json" onChange={loadDesign} className="hidden" />
            </label>
          </div>

        </div>
      </div>
    </Draggable>
  );
}
