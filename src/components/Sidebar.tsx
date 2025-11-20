'use client';

import React from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { calculateHinge } from '@/core/hinge-rules';
import { ProfileType } from '@/core/types';
import { 
  Settings2, 
  Ruler, 
  DoorOpen, 
  Box, 
  Download, 
  Upload, 
  Calculator,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';

export function Sidebar() {
  const profileType = useDesignStore((state: DesignState) => state.profileType);
  const overlay = useDesignStore((state: DesignState) => state.overlay);
  const width = useDesignStore((state: DesignState) => state.width);
  const height = useDesignStore((state: DesignState) => state.height);
  const depth = useDesignStore((state: DesignState) => state.depth);
  const hasLeftWall = useDesignStore((state: DesignState) => state.hasLeftWall);
  const hasRightWall = useDesignStore((state: DesignState) => state.hasRightWall);
  const doorCount = useDesignStore((state: DesignState) => state.doorCount);
  const connectorType = useDesignStore((state: DesignState) => state.connectorType);
  const shelves = useDesignStore((state: DesignState) => state.shelves);
  const result = useDesignStore((state: DesignState) => state.result);

  const setProfileType = useDesignStore((state: DesignState) => state.setProfileType);
  const setOverlay = useDesignStore((state: DesignState) => state.setOverlay);
  const setResult = useDesignStore((state: DesignState) => state.setResult);
  const setWidth = useDesignStore((state: DesignState) => state.setWidth);
  const setHeight = useDesignStore((state: DesignState) => state.setHeight);
  const setDepth = useDesignStore((state: DesignState) => state.setDepth);
  const setHasLeftWall = useDesignStore((state: DesignState) => state.setHasLeftWall);
  const setHasRightWall = useDesignStore((state: DesignState) => state.setHasRightWall);
  const setDoorCount = useDesignStore((state: DesignState) => state.setDoorCount);
  const setConnectorType = useDesignStore((state: DesignState) => state.setConnectorType);
  const addShelf = useDesignStore((state: DesignState) => state.addShelf);
  const removeShelf = useDesignStore((state: DesignState) => state.removeShelf);
  const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
  const setIsDoorOpen = useDesignStore((state: DesignState) => state.setIsDoorOpen);

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
    const state = { width, height, depth, profileType, overlay, hasLeftWall, hasRightWall, doorCount, connectorType, result };
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
      } catch (err) {
        alert('Invalid file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed left-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-md border-r border-white/10 p-6 overflow-y-auto z-40 shadow-2xl text-slate-200 flex flex-col gap-8">
      
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Box className="text-white" size={20} />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">AluCraft</h1>
      </div>

      {/* Dimensions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-medium text-sm uppercase tracking-wider">
          <Ruler size={16} />
          <span>Dimensions</span>
        </div>
        
        <div className="space-y-4 pl-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Width</label>
              <span>{width} mm</span>
            </div>
            <input 
              type="range" min="200" max="2000" step="10" 
              value={width} onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Height</label>
              <span>{height} mm</span>
            </div>
            <input 
              type="range" min="200" max="3000" step="10" 
              value={height} onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Depth</label>
              <span>{depth} mm</span>
            </div>
            <input 
              type="range" min="200" max="1000" step="10" 
              value={depth} onChange={(e) => setDepth(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-medium text-sm uppercase tracking-wider">
          <Settings2 size={16} />
          <span>Configuration</span>
        </div>

        <div className="space-y-4 pl-2">
          {/* Profile Type Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Profile Type</label>
            <div className="grid grid-cols-3 gap-2">
              {['2020', '3030', '4040'].map((type) => (
                <button
                  key={type}
                  onClick={() => setProfileType(type as ProfileType)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all border ${
                    profileType === type 
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Door Count */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Doors</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDoorCount(1)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  doorCount === 1
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <div className="w-3 h-4 border border-current rounded-sm" />
                Single
              </button>
              <button
                onClick={() => setDoorCount(2)}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                  doorCount === 2
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <div className="flex gap-0.5">
                  <div className="w-3 h-4 border border-current rounded-sm" />
                  <div className="w-3 h-4 border border-current rounded-sm" />
                </div>
                Double
              </button>
            </div>
          </div>

          {/* Connector Type */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Connector</label>
            <select 
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value as 'angle' | 'internal')}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="angle">Angle Bracket (L-Bracket)</option>
              <option value="internal">Internal Lock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Internal Structure Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-medium text-sm uppercase tracking-wider">
          <Box size={16} />
          <span>Internal Structure</span>
        </div>

        <div className="space-y-4 pl-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400">Shelves</label>
            <button
              onClick={() => addShelf(height / 2)}
              className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md transition-colors"
              title="Add Shelf"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {shelves.length === 0 && (
              <div className="text-xs text-slate-500 italic text-center py-2">
                No shelves added
              </div>
            )}
            {shelves.map((shelf) => (
              <div key={shelf.id} className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Height (mm)</span>
                    <span>{Math.round(shelf.y)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={height}
                    value={shelf.y}
                    onChange={(e) => updateShelf(shelf.id, Number(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                <button
                  onClick={() => removeShelf(shelf.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hinge Logic Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400 font-medium text-sm uppercase tracking-wider">
          <DoorOpen size={16} />
          <span>Hinge Logic</span>
        </div>

        <div className="space-y-4 pl-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <label>Overlay (mm)</label>
              <span>{overlay} mm</span>
            </div>
            <input 
              type="range" min="-5" max="30" step="0.5" 
              value={overlay} onChange={(e) => setOverlay(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={hasLeftWall} 
                onChange={(e) => setHasLeftWall(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-offset-slate-900"
              />
              Left Wall
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={hasRightWall} 
                onChange={(e) => setHasRightWall(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-offset-slate-900"
              />
              Right Wall
            </label>
          </div>

          <button 
            onClick={handleCalculate}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Calculator size={18} />
            Calculate Hinge
          </button>

          {/* Result Display */}
          {result && (
            <div className={`p-3 rounded-lg border ${result.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-start gap-2">
                {result.success ? <CheckCircle2 size={16} className="text-emerald-400 mt-0.5" /> : <AlertTriangle size={16} className="text-red-400 mt-0.5" />}
                <div>
                  <div className={`text-sm font-medium ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
                    {result.success ? 'Valid Configuration' : 'Configuration Issue'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {result.message}
                  </div>
                  {result.success && result.recommendedHinge && (
                    <div className="mt-2 text-xs font-mono bg-black/20 p-2 rounded text-slate-300">
                      Hinge: {result.recommendedHinge.name}
                      <br/>
                      K-Value: {result.kValue}mm
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="mt-auto pt-6 border-t border-white/10 grid grid-cols-2 gap-3">
        <button 
          onClick={downloadDesign}
          className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
        >
          <Download size={14} />
          Save JSON
        </button>
        <label className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 cursor-pointer">
          <Upload size={14} />
          Load JSON
          <input type="file" accept="application/json" onChange={loadDesign} className="hidden" />
        </label>
      </div>

    </div>
  );
}
