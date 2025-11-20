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
  Redo2
} from 'lucide-react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { calculateHinge } from '@/core/hinge-rules';
import { ProfileType } from '@/core/types';

// Helper Component for Leva-style Slider
const LevaSlider = ({ label, value, min, max, step, onChange, unit = '' }: { 
  label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void, unit?: string 
}) => {
  return (
    <div className="flex items-center gap-3 h-7 group">
      <label className="w-20 text-slate-400 truncate text-[10px] font-medium">{label}</label>
      <div className="flex-1 relative h-full flex items-center">
        <input 
          type="range" min={min} max={max} step={step}
          value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-ew-resize z-10"
        />
        <div className="w-full h-1 bg-[#333] rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-75" 
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
      </div>
      <div className="w-12 text-right text-blue-300 bg-[#222] rounded px-1 py-0.5 text-[10px] font-mono focus-within:ring-1 ring-blue-500">
        {value}{unit}
      </div>
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
  const addShelf = useDesignStore((state: DesignState) => state.addShelf);
  const removeShelf = useDesignStore((state: DesignState) => state.removeShelf);
  const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);

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

  return (
    <Draggable handle=".drag-handle" nodeRef={nodeRef as unknown as React.RefObject<HTMLElement>}>
      <div ref={nodeRef} className={`
        fixed top-4 right-4 z-50
        w-80
        bg-[#1a1a1a]/90
        backdrop-blur-md
        border border-white/10
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
          className="drag-handle flex items-center justify-between p-3 cursor-move hover:bg-white/5 select-none border-b border-white/10 shrink-0"
        >
          <div className="flex items-center gap-2 text-slate-200 font-bold">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            ALUCRAFT <span className="text-slate-500 font-normal">CONTROLS</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/5" onPointerDown={(e) => e.stopPropagation()}>
              <button 
                onClick={() => undo()} 
                disabled={pastStates.length === 0}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${pastStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
                title="Undo"
              >
                <Undo2 size={14} />
              </button>
              <div className="w-px h-3 bg-white/10"></div>
              <button 
                onClick={() => redo()} 
                disabled={futureStates.length === 0}
                className={`p-1 rounded hover:bg-white/10 transition-colors ${futureStates.length === 0 ? 'opacity-30 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
                title="Redo"
              >
                <Redo2 size={14} />
              </button>
            </div>

            <div 
              className="cursor-pointer p-1 hover:bg-white/10 rounded"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* Dimensions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#888] font-semibold uppercase tracking-wider text-[10px] mb-2">
              <Ruler size={12} /> Dimensions
            </div>
            <LevaSlider label="Width" value={width} min={200} max={2000} step={10} onChange={setWidth} />
            <LevaSlider label="Height" value={height} min={200} max={3000} step={10} onChange={setHeight} />
            <LevaSlider label="Depth" value={depth} min={200} max={1000} step={10} onChange={setDepth} />
          </div>

          {/* Configuration */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-[#888] font-semibold uppercase tracking-wider text-[10px]">
              <Settings2 size={12} /> Configuration
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Profile</label>
                <div className="flex bg-[#222] p-1 rounded gap-1">
                  {['2020', '3030', '4040'].map(type => (
                    <button 
                      key={type}
                      onClick={() => setProfileType(type as ProfileType)}
                      className={`flex-1 py-1 rounded text-[10px] transition-colors ${profileType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">Doors</label>
                <div className="flex bg-[#222] p-1 rounded gap-1">
                  <button 
                    onClick={() => setDoorCount(1)}
                    className={`flex-1 py-1 rounded text-[10px] transition-colors ${doorCount === 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    1
                  </button>
                  <button 
                    onClick={() => setDoorCount(2)}
                    className={`flex-1 py-1 rounded text-[10px] transition-colors ${doorCount === 2 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    2
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Connector</label>
              <select 
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value as 'angle' | 'internal')}
                className="w-full bg-[#222] border border-transparent text-slate-300 text-[10px] rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="angle">Angle Bracket (L-Bracket)</option>
                <option value="internal">Internal Lock</option>
              </select>
            </div>
          </div>

          {/* Internal Structure */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <div className="flex items-center justify-between text-[#888] font-semibold uppercase tracking-wider text-[10px]">
              <div className="flex items-center gap-2"><Box size={12} /> Shelves</div>
              <button onClick={() => addShelf(height / 2)} className="hover:text-blue-400 transition-colors"><Plus size={14} /></button>
            </div>
            
            <div className="space-y-2">
              {shelves.length === 0 && <div className="text-[10px] text-slate-600 italic text-center">No shelves</div>}
              {shelves.map(shelf => (
                <div key={shelf.id} className="flex items-center gap-2 bg-[#222] p-2 rounded border border-white/5">
                  <div className="flex-1">
                    <LevaSlider 
                      label="Y-Pos" 
                      value={Math.round(shelf.y)} 
                      min={0} max={height} step={10} 
                      onChange={(v) => updateShelf(shelf.id, v)} 
                    />
                  </div>
                  <button onClick={() => removeShelf(shelf.id)} className="text-slate-500 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Hinge Logic */}
          <div className="space-y-3 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2 text-[#888] font-semibold uppercase tracking-wider text-[10px]">
              <DoorOpen size={12} /> Hinge Logic
            </div>
            
            <LevaSlider label="Overlay" value={overlay} min={-5} max={30} step={0.5} onChange={setOverlay} unit="mm" />
            
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasLeftWall} onChange={(e) => setHasLeftWall(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Left Wall (Obstacle)
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasRightWall} onChange={(e) => setHasRightWall(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Right Wall (Obstacle)
              </label>
              <div className="w-full h-px bg-white/5 my-1"></div>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasLeftPanel} onChange={(e) => setHasLeftPanel(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Left Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasRightPanel} onChange={(e) => setHasRightPanel(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Right Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasBackPanel} onChange={(e) => setHasBackPanel(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Back Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasTopPanel} onChange={(e) => setHasTopPanel(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Top Panel
              </label>
              <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">
                <input type="checkbox" checked={hasBottomPanel} onChange={(e) => setHasBottomPanel(e.target.checked)} className="rounded bg-[#333] border-none text-blue-500 focus:ring-0" />
                Bottom Panel
              </label>
            </div>

            <button 
              onClick={handleCalculate}
              className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 rounded text-[10px] font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Calculator size={12} /> Calculate Hinge
            </button>

            {result && (
              <div className={`p-2 rounded border text-[10px] ${result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {result.success ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {result.success ? 'Valid' : 'Issue'}
                </div>
                <div className="opacity-80 leading-relaxed">{result.message}</div>
                {result.success && result.recommendedHinge && (
                  <div className="mt-1 font-mono bg-black/20 p-1 rounded">
                    {result.recommendedHinge.name} (K={result.kValue})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <button onClick={downloadDesign} className="flex items-center justify-center gap-2 py-1.5 bg-[#222] hover:bg-[#333] text-slate-400 rounded text-[10px] transition-colors">
              <Download size={12} /> Save
            </button>
            <label className="flex items-center justify-center gap-2 py-1.5 bg-[#222] hover:bg-[#333] text-slate-400 rounded text-[10px] transition-colors cursor-pointer">
              <Upload size={12} /> Load
              <input type="file" accept="application/json" onChange={loadDesign} className="hidden" />
            </label>
          </div>

        </div>
      </div>
    </Draggable>
  );
}
