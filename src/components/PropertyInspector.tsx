'use client';

import React, { useState, useMemo } from 'react';
import { Trash2, Copy, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import useDesignStore, { DesignState, LayoutBay, createDefaultDoorConfig } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { calculateHinge } from '@/core/hinge-rules';

/**
 * LevaSlider - 范围滑块组件
 */
const LevaSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit = '',
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

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
    <div className="flex items-center gap-3 h-8 group">
      <label className="w-20 text-muted-foreground truncate text-xs font-medium">{label}</label>
      <div className="flex-1 relative h-full flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-ew-resize z-10"
        />
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-75"
            style={{ width: `${((value - min) / (max - min)) * 100}%` }}
          />
        </div>
      </div>
      <div className="w-14 flex items-center bg-muted rounded px-2 py-1 focus-within:ring-1 ring-blue-500">
        <input
          type="number"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-right text-xs font-mono focus:outline-none text-blue-500 appearance-none p-0 border-none"
          style={{ MozAppearance: 'textfield' }}
        />
        {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </div>
    </div>
  );
};

/**
 * PropertyInspector - 上下文相关的属性检视器
 * 根据选中对象的类型显示不同的属性
 */
export function PropertyInspector() {
  const layout = useDesignStore((state: DesignState) => state.layout);
  const height = useDesignStore((state: DesignState) => state.height);
  const overlay = useDesignStore((state: DesignState) => state.overlay);
  const result = useDesignStore((state: DesignState) => state.result);
  const connectorType = useDesignStore((state: DesignState) => state.connectorType);
  const hasLeftWall = useDesignStore((state: DesignState) => state.hasLeftWall);
  const hasRightWall = useDesignStore((state: DesignState) => state.hasRightWall);
  const hasLeftPanel = useDesignStore((state: DesignState) => state.hasLeftPanel);
  const hasRightPanel = useDesignStore((state: DesignState) => state.hasRightPanel);
  const hasBackPanel = useDesignStore((state: DesignState) => state.hasBackPanel);
  const hasTopPanel = useDesignStore((state: DesignState) => state.hasTopPanel);
  const hasBottomPanel = useDesignStore((state: DesignState) => state.hasBottomPanel);
  const panelThickness = useDesignStore((state: DesignState) => state.panelThickness);
  const tolerance = useDesignStore((state: DesignState) => state.tolerance);

  const profileType = useDesignStore((state: DesignState) => state.profileType);

  // UI Store
  const selectedBayId = useUIStore((state) => state.selectedBayId);
  const selectedShelfId = useUIStore((state) => state.selectedShelfId);
  const selectedDrawerId = useUIStore((state) => state.selectedDrawerId);
  const selectedObjectType = useUIStore((state) => state.selectedObjectType);
  const isPropertyPanelOpen = useUIStore((state) => state.isPropertyPanelOpen);
  const setPropertyPanelOpen = useUIStore((state) => state.setPropertyPanelOpen);

  // Setters
  const setOverlay = useDesignStore((state: DesignState) => state.setOverlay);
  const setResult = useDesignStore((state: DesignState) => state.setResult);
  const setHasLeftWall = useDesignStore((state: DesignState) => state.setHasLeftWall);
  const setHasRightWall = useDesignStore((state: DesignState) => state.setHasRightWall);
  const setHasLeftPanel = useDesignStore((state: DesignState) => state.setHasLeftPanel);
  const setHasRightPanel = useDesignStore((state: DesignState) => state.setHasRightPanel);
  const setHasBackPanel = useDesignStore((state: DesignState) => state.setHasBackPanel);
  const setHasTopPanel = useDesignStore((state: DesignState) => state.setHasTopPanel);
  const setHasBottomPanel = useDesignStore((state: DesignState) => state.setHasBottomPanel);
  const setPanelThickness = useDesignStore((state: DesignState) => state.setPanelThickness);
  const setTolerance = useDesignStore((state: DesignState) => state.setTolerance);
  const setConnectorType = useDesignStore((state: DesignState) => state.setConnectorType);
  const setBayDoorConfig = useDesignStore((state: DesignState) => state.setBayDoorConfig);
  const resizeBay = useDesignStore((state: DesignState) => state.resizeBay);
  const removeShelf = useDesignStore((state: DesignState) => state.removeShelf);
  const updateShelf = useDesignStore((state: DesignState) => state.updateShelf);
  const duplicateShelf = useDesignStore((state: DesignState) => state.duplicateShelf);
  const removeDrawer = useDesignStore((state: DesignState) => state.removeDrawer);
  const updateDrawer = useDesignStore((state: DesignState) => state.updateDrawer);
  const duplicateDrawer = useDesignStore((state: DesignState) => state.duplicateDrawer);

  // Derived State
  const bays = useMemo(() => layout.filter((n) => n.type === 'bay') as LayoutBay[], [layout]);
  const selectedBay = useMemo(() => bays.find((b) => b.id === selectedBayId), [bays, selectedBayId]);
  const selectedShelf = useMemo(
    () => selectedBay?.shelves.find((s) => s.id === selectedShelfId),
    [selectedBay, selectedShelfId]
  );
  const selectedDrawer = useMemo(
    () => selectedBay?.drawers.find((d) => d.id === selectedDrawerId),
    [selectedBay, selectedDrawerId]
  );
  const selectedDoor = selectedBay ? selectedBay.door ?? createDefaultDoorConfig() : null;

  const handleCalculate = () => {
    let currentOverlay = overlay;
    let autoAdjusted = false;
    const warningMessages: string[] = [];

    if (hasLeftWall) {
      if (currentOverlay > 3) {
        currentOverlay = 2;
        autoAdjusted = true;
        warningMessages.push('Left wall detected: Overlay adjusted to 2mm.');
      }
    }

    const res = calculateHinge(profileType, currentOverlay);

    if (autoAdjusted) {
      setOverlay(currentOverlay);
      res.message = `[Auto-Adjusted] ${res.message}`;
      res.details = (res.details || '') + ` | ⚠️ ${warningMessages.join(' ')}`;
    } else if (res.success && hasLeftWall && currentOverlay > 2) {
      res.message += ' (Warning: Tight clearance)';
    }

    setResult(res);
  };

  if (!isPropertyPanelOpen) {
    return null;
  }

  return (
    <div
      className={`
        w-96
        bg-slate-900/50 backdrop-blur-md glass-shine
        border border-white/10 rounded-lg shadow-xl
        overflow-hidden flex flex-col
        transition-all duration-300
        max-h-full
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border shrink-0">
        <div className="text-sm font-semibold text-foreground">
          {selectedObjectType === 'bay' && `Bay ${bays.findIndex((b) => b.id === selectedBayId) + 1}`}
          {selectedObjectType === 'shelf' && `Shelf`}
          {selectedObjectType === 'drawer' && `Drawer`}
          {!selectedObjectType && 'Properties'}
        </div>
        <button
          onClick={() => setPropertyPanelOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto custom-scrollbar flex-1 p-4 space-y-4">
        {!selectedObjectType && (
          <div className="text-xs text-muted-foreground italic text-center py-8">
            Select a bay, shelf, or drawer in the 3D view to edit its properties
          </div>
        )}

        {/* Bay Properties */}
        {selectedObjectType === 'bay' && selectedBay && (
          <div className="space-y-4">
            {/* Bay Width */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Width</label>
              <LevaSlider
                label="Width"
                value={Math.round(selectedBay.width)}
                min={100}
                max={2000}
                step={10}
                onChange={(v) => resizeBay(selectedBay.id, v)}
                unit="mm"
              />
            </div>

            {/* Door Configuration */}
            {selectedDoor && (
              <div className="space-y-2 bg-muted/30 p-3 rounded border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Door Config</span>
                  <button
                    onClick={() => setBayDoorConfig(selectedBay.id, { enabled: !selectedDoor.enabled })}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      selectedDoor.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {selectedDoor.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                {selectedDoor.enabled && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Door Type</label>
                      <div className="flex bg-muted p-1 rounded gap-1">
                        {(['single', 'double'] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setBayDoorConfig(selectedBay.id, { type })}
                            className={`flex-1 py-1 rounded text-xs transition-colors ${
                              selectedDoor.type === type
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {type === 'single' ? 'Single' : 'Double'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedDoor.type === 'single' && (
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Hinge Side</label>
                        <div className="flex bg-muted p-1 rounded gap-1">
                          {(['left', 'right'] as const).map((side) => (
                            <button
                              key={side}
                              onClick={() => setBayDoorConfig(selectedBay.id, { hingeSide: side })}
                              className={`flex-1 py-1 rounded text-xs transition-colors ${
                                selectedDoor.hingeSide === side
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {side === 'left' ? 'Left' : 'Right'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Shelf Properties */}
        {selectedObjectType === 'shelf' && selectedShelf && selectedBay && (
          <div className="space-y-4">
            <LevaSlider
              label="Y-Position"
              value={Math.round(selectedShelf.y)}
              min={0}
              max={height}
              step={10}
              onChange={(v) => updateShelf(selectedBay.id, selectedShelf.id, v)}
              unit="mm"
            />

            <div className="flex gap-2">
              <button
                onClick={() => duplicateShelf(selectedBay.id, selectedShelf.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-xs transition-colors"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                onClick={() => removeShelf(selectedBay.id, selectedShelf.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-xs transition-colors"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        )}

        {/* Drawer Properties */}
        {selectedObjectType === 'drawer' && selectedDrawer && selectedBay && (
          <div className="space-y-4">
            <LevaSlider
              label="Y-Position"
              value={Math.round(selectedDrawer.y)}
              min={0}
              max={height}
              step={10}
              onChange={(v) => updateDrawer(selectedBay.id, selectedDrawer.id, v, selectedDrawer.height)}
              unit="mm"
            />

            <LevaSlider
              label="Height"
              value={Math.round(selectedDrawer.height)}
              min={100}
              max={500}
              step={10}
              onChange={(v) => updateDrawer(selectedBay.id, selectedDrawer.id, selectedDrawer.y, v)}
              unit="mm"
            />

            <div className="flex gap-2">
              <button
                onClick={() => duplicateDrawer(selectedBay.id, selectedDrawer.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded text-xs transition-colors"
              >
                <Copy size={12} /> Duplicate
              </button>
              <button
                onClick={() => removeDrawer(selectedBay.id, selectedDrawer.id)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded text-xs transition-colors"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          </div>
        )}

        {/* Global Settings (shown when nothing is selected) */}
        {!selectedObjectType && (
          <div className="space-y-4">
            {/* Hinge Logic */}
            <div className="space-y-3 bg-muted/30 p-3 rounded border border-border/50">
              <div className="text-xs font-semibold text-foreground">Hinge Logic</div>

              <LevaSlider
                label="Overlay"
                value={overlay}
                min={-5}
                max={30}
                step={0.5}
                onChange={setOverlay}
                unit="mm"
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasLeftWall}
                    onChange={(e) => setHasLeftWall(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Left Wall
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasRightWall}
                    onChange={(e) => setHasRightWall(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Right Wall
                </label>
              </div>

              <button
                onClick={handleCalculate}
                className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-600/20 rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Calculator size={12} /> Calculate Hinge
              </button>

              {result && (
                <div
                  className={`p-2 rounded border text-xs ${
                    result.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {result.success ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                    {result.success ? 'Valid' : 'Issue'}
                  </div>
                  <div className="opacity-90 leading-relaxed">{result.message}</div>
                </div>
              )}
            </div>

            {/* Panel Settings */}
            <div className="space-y-3 bg-muted/30 p-3 rounded border border-border/50">
              <div className="text-xs font-semibold text-foreground">Panels</div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasLeftPanel}
                    onChange={(e) => setHasLeftPanel(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Left Panel
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasRightPanel}
                    onChange={(e) => setHasRightPanel(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Right Panel
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasBackPanel}
                    onChange={(e) => setHasBackPanel(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Back Panel
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasTopPanel}
                    onChange={(e) => setHasTopPanel(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Top Panel
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={hasBottomPanel}
                    onChange={(e) => setHasBottomPanel(e.target.checked)}
                    className="rounded bg-muted border-border text-blue-500 focus:ring-0"
                  />
                  Bottom Panel
                </label>
              </div>

              <div className="flex gap-2 items-center">
                <label className="text-xs text-muted-foreground">Thickness</label>
                <input
                  type="number"
                  min={3}
                  max={50}
                  value={panelThickness}
                  onChange={(e) => setPanelThickness(Number(e.target.value))}
                  className="w-16 bg-muted text-foreground rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="flex gap-2 items-center">
                <label className="text-xs text-muted-foreground">Tolerance</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-16 bg-muted text-foreground rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Connector Settings */}
            <div className="space-y-2 bg-muted/30 p-3 rounded border border-border/50">
              <label className="text-xs text-muted-foreground font-semibold">Connector Type</label>
              <select
                value={connectorType}
                onChange={(e) => setConnectorType(e.target.value as 'angle' | 'internal')}
                className="w-full bg-muted border border-transparent text-foreground text-xs rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="angle">Angle Bracket (L-Bracket)</option>
                <option value="internal">Internal Lock</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
