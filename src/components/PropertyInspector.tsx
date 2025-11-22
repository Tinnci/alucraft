'use client';

import React, { useMemo } from 'react';
import { Trash2, Copy, Calculator, AlertTriangle, CheckCircle2, BoxSelect, Layers, Eye, Magnet, ArrowLeftRight, ScanLine } from 'lucide-react';
import useDesignStore from '@/store/useDesignStore';
import { findBays } from '@/core/types';
import useUIStore from '@/store/useUIStore';
import { calculateHinge } from '@/core/hinge-rules';
import { CONNECTORS, ConnectorType } from '@/core/types';

// Shadcn UI Components
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Helper: 带有数值显示的 Slider 包装器
 */
import { NumberSlider as PropertySlider } from '@/components/ui/number-slider';

export function PropertyInspector() {
  // === Settings Slice ===
  const overlay = useDesignStore((s) => s.overlay);
  const height = useDesignStore((s) => s.height);
  const result = useDesignStore((s) => s.result);
  const connectorType = useDesignStore((s) => s.connectorType);
  const hasLeftWall = useDesignStore((s) => s.hasLeftWall);
  const hasRightWall = useDesignStore((s) => s.hasRightWall);
  const hasLeftPanel = useDesignStore((s) => s.hasLeftPanel);
  const hasRightPanel = useDesignStore((s) => s.hasRightPanel);
  const hasBackPanel = useDesignStore((s) => s.hasBackPanel);
  const hasTopPanel = useDesignStore((s) => s.hasTopPanel);
  const hasBottomPanel = useDesignStore((s) => s.hasBottomPanel);
  const panelThickness = useDesignStore((s) => s.panelThickness);
  const tolerance = useDesignStore((s) => s.tolerance);
  const profileType = useDesignStore((s) => s.profileType);

  // === Layout Slice ===
  const layout = useDesignStore((s) => s.layout);
  const resizeBay = useDesignStore((s) => s.resizeBay);
  const removeShelf = useDesignStore((s) => s.removeShelf);
  const splitItem = useDesignStore((s) => s.splitItem);
  const updateShelf = useDesignStore((s) => s.updateShelf);
  const duplicateShelf = useDesignStore((s) => s.duplicateShelf);
  const removeDrawer = useDesignStore((s) => s.removeDrawer);
  const updateDrawer = useDesignStore((s) => s.updateDrawer);
  const duplicateDrawer = useDesignStore((s) => s.duplicateDrawer);
  const setBayDoorConfig = useDesignStore((s) => s.setBayDoorConfig);

  // === Settings Setters ===
  const setOverlay = useDesignStore((s) => s.setOverlay);
  const setResult = useDesignStore((s) => s.setResult);
  const setHasLeftWall = useDesignStore((s) => s.setHasLeftWall);
  const setHasRightWall = useDesignStore((s) => s.setHasRightWall);
  const setHasLeftPanel = useDesignStore((s) => s.setHasLeftPanel);
  const setHasRightPanel = useDesignStore((s) => s.setHasRightPanel);
  const setHasBackPanel = useDesignStore((s) => s.setHasBackPanel);
  const setHasTopPanel = useDesignStore((s) => s.setHasTopPanel);
  const setHasBottomPanel = useDesignStore((s) => s.setHasBottomPanel);
  const setPanelThickness = useDesignStore((s) => s.setPanelThickness);
  const setTolerance = useDesignStore((s) => s.setTolerance);
  const setConnectorType = useDesignStore((s) => s.setConnectorType);

  // === Scene Slice ===
  const showSnapGuides = useDesignStore((s) => s.showSnapGuides);
  const setShowSnapGuides = useDesignStore((s) => s.setShowSnapGuides);
  const enableHaptics = useDesignStore((s) => s.enableHaptics);
  const setEnableHaptics = useDesignStore((s) => s.setEnableHaptics);

  // === UI Store ===
  const selectedBayId = useUIStore((s) => s.selectedBayId);
  const selectedShelfId = useUIStore((s) => s.selectedShelfId);
  const selectedDrawerId = useUIStore((s) => s.selectedDrawerId);
  const selectedObjectType = useUIStore((s) => s.selectedObjectType);
  const setPropertyPanelOpen = useUIStore((s) => s.setPropertyPanelOpen);
  const clearSelection = useUIStore((s) => s.clearSelection);

  // Derived State
  const bays = useMemo(() => findBays(layout), [layout]);
  const selectedBay = useMemo(() => bays.find((b) => b.id === selectedBayId), [bays, selectedBayId]);
  const selectedShelf = useMemo(
    () => (selectedBay?.config.shelves ?? []).find((s) => s.id === selectedShelfId),
    [selectedBay, selectedShelfId]
  );
  const selectedDrawer = useMemo(
    () => (selectedBay?.config.drawers ?? []).find((d) => d.id === selectedDrawerId),
    [selectedBay, selectedDrawerId]
  );

  // Hinge Calculation Logic (kept same)
  const handleCalculate = () => {
    let currentOverlay = overlay;
    let autoAdjusted = false;
    const warningMessages: string[] = [];

    if (hasLeftWall && currentOverlay > 3) {
      currentOverlay = 2;
      autoAdjusted = true;
      warningMessages.push('Left wall detected: Overlay adjusted to 2mm.');
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

  // Helper for door config
  const doorConfig = selectedBay?.config.door;

  return (
    <div className="flex flex-col h-full w-full md:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {selectedObjectType ? (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSelection} title="Back">
              <BoxSelect size={16} />
            </Button>
          ) : (
            <BoxSelect size={16} className="text-blue-400" />
          )}
          <span>
            {selectedObjectType === 'bay' && `Bay #${bays.findIndex((b) => b.id === selectedBayId) + 1}`}
            {selectedObjectType === 'shelf' && `Shelf`}
            {selectedObjectType === 'drawer' && `Drawer`}
            {!selectedObjectType && 'Global Settings'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPropertyPanelOpen(false)}>
          ✕
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">

          {/* --- Bay Properties --- */}
          {selectedObjectType === 'bay' && selectedBay && (
            <Accordion type="single" collapsible defaultValue="dims" className="w-full">
              <AccordionItem value="dims">
                <AccordionTrigger>Dimensions & Split</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <PropertySlider
                    label="Width"
                    value={Math.round(typeof selectedBay.config.width === 'number' ? selectedBay.config.width : 400)}
                    min={100} max={2000} step={10} unit="mm"
                    onChange={(v) => resizeBay(selectedBay.id, v)}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant={selectedBay.config.width === 'auto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => resizeBay(selectedBay.id, 'auto')}
                      className="flex-1 text-xs"
                    >
                      Auto Width
                    </Button>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => splitItem(selectedBay.id, 'horizontal')}>
                      <ArrowLeftRight className="mr-2 h-3 w-3 rotate-90" /> Split Vert
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => splitItem(selectedBay.id, 'vertical')}>
                      <ArrowLeftRight className="mr-2 h-3 w-3" /> Split Horiz
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="door">
                <AccordionTrigger>Door Configuration</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Door Enabled</span>
                    <Button
                      size="sm"
                      variant={doorConfig?.enabled ? 'default' : 'outline'}
                      onClick={() => setBayDoorConfig(selectedBay.id, { enabled: !doorConfig?.enabled })}
                      className="h-6 text-xs"
                    >
                      {doorConfig?.enabled ? 'ON' : 'OFF'}
                    </Button>
                  </div>

                  {doorConfig?.enabled && (
                    <Tabs defaultValue={doorConfig.type} className="w-full" onValueChange={(v) => setBayDoorConfig(selectedBay.id, { type: v as any })}>
                      <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="single" className="text-xs">Single</TabsTrigger>
                        <TabsTrigger value="double" className="text-xs">Double</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  {doorConfig?.enabled && doorConfig.type === 'single' && (
                    <Tabs defaultValue={doorConfig.hingeSide} className="w-full" onValueChange={(v) => setBayDoorConfig(selectedBay.id, { hingeSide: v as any })}>
                      <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="left" className="text-xs">Left Hinge</TabsTrigger>
                        <TabsTrigger value="right" className="text-xs">Right Hinge</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* --- Shelf Properties --- */}
          {selectedObjectType === 'shelf' && selectedShelf && selectedBay && (
            <div className="space-y-4">
              <PropertySlider
                label="Position Y"
                value={Math.round(selectedShelf.y)}
                min={0} max={height} step={10} unit="mm"
                onChange={(v) => updateShelf(selectedBay.id, selectedShelf.id, v)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => duplicateShelf(selectedBay.id, selectedShelf.id)}>
                  <Copy className="mr-2 h-3 w-3" /> Duplicate
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeShelf(selectedBay.id, selectedShelf.id)}>
                  <Trash2 className="mr-2 h-3 w-3" /> Remove
                </Button>
              </div>
            </div>
          )}

          {/* --- Drawer Properties --- */}
          {selectedObjectType === 'drawer' && selectedDrawer && selectedBay && (
            <div className="space-y-4">
              <PropertySlider
                label="Position Y"
                value={Math.round(selectedDrawer.y)}
                min={0} max={height} step={10} unit="mm"
                onChange={(v) => updateDrawer(selectedBay.id, selectedDrawer.id, v, selectedDrawer.height)}
              />
              <PropertySlider
                label="Face Height"
                value={Math.round(selectedDrawer.height)}
                min={100} max={500} step={10} unit="mm"
                onChange={(v) => updateDrawer(selectedBay.id, selectedDrawer.id, selectedDrawer.y, v)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => duplicateDrawer(selectedBay.id, selectedDrawer.id)}>
                  <Copy className="mr-2 h-3 w-3" /> Duplicate
                </Button>
                <Button size="sm" variant="destructive" onClick={() => removeDrawer(selectedBay.id, selectedDrawer.id)}>
                  <Trash2 className="mr-2 h-3 w-3" /> Remove
                </Button>
              </div>
            </div>
          )}

          {/* --- Global Settings --- */}
          {!selectedObjectType && (
            <Accordion type="single" collapsible defaultValue="hinge" className="w-full">
              <AccordionItem value="hinge">
                <AccordionTrigger>Hinge & Overlay</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <PropertySlider
                    label="Door Overlay"
                    value={overlay}
                    min={-5} max={30} step={0.5} unit="mm"
                    onChange={setOverlay}
                  />

                  <div className="flex gap-2">
                    <Button
                      variant={hasLeftWall ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setHasLeftWall(!hasLeftWall)}
                    >
                      {hasLeftWall ? "Left Wall: ON" : "Left Wall: OFF"}
                    </Button>
                    <Button
                      variant={hasRightWall ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => setHasRightWall(!hasRightWall)}
                    >
                      {hasRightWall ? "Right Wall: ON" : "Right Wall: OFF"}
                    </Button>
                  </div>

                  <Button onClick={handleCalculate} className="w-full" size="sm">
                    <Calculator className="mr-2 h-3 w-3" /> Check Compatibility
                  </Button>

                  {result && (
                    <div className={`p-3 rounded-md text-xs border ${result.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                      <div className="flex items-center gap-2 font-bold mb-1">
                        {result.success ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {result.success ? 'Valid Config' : 'Conflict Detected'}
                      </div>
                      <div className="opacity-90 leading-relaxed">{result.message}</div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="panels">
                <AccordionTrigger>Panels & Thickness</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {['Top', 'Bottom', 'Back', 'Left', 'Right'].map(panel => {
                      const key = `has${panel}Panel` as const;
                      // @ts-ignore - dynamic access safe here
                      const isActive = key === 'hasTopPanel' ? hasTopPanel : key === 'hasBottomPanel' ? hasBottomPanel : key === 'hasBackPanel' ? hasBackPanel : key === 'hasLeftPanel' ? hasLeftPanel : hasRightPanel;
                      // @ts-ignore
                      const setter = key === 'hasTopPanel' ? setHasTopPanel : key === 'hasBottomPanel' ? setHasBottomPanel : key === 'hasBackPanel' ? setHasBackPanel : key === 'hasLeftPanel' ? setHasLeftPanel : setHasRightPanel;

                      return (
                        <Button
                          key={panel}
                          variant={isActive ? "secondary" : "outline"}
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => setter(!isActive)}
                        >
                          {panel}
                        </Button>
                      );
                    })}
                  </div>
                  <Separator />
                  <PropertySlider label="Thickness" value={panelThickness} min={3} max={50} step={1} unit="mm" onChange={setPanelThickness} />
                  <PropertySlider label="Tolerance" value={tolerance} min={0} max={10} step={0.5} unit="mm" onChange={setTolerance} />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="view">
                <AccordionTrigger>View & Haptics</AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Snap Guides</span>
                    <Button size="sm" variant={showSnapGuides ? "default" : "outline"} onClick={() => setShowSnapGuides(!showSnapGuides)} className="h-6 text-xs">
                      {showSnapGuides ? <Magnet size={12} className="mr-1" /> : null} {showSnapGuides ? "ON" : "OFF"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Haptics</span>
                    <Button size="sm" variant={enableHaptics ? "default" : "outline"} onClick={() => setEnableHaptics(!enableHaptics)} className="h-6 text-xs">
                      {enableHaptics ? <ScanLine size={12} className="mr-1" /> : null} {enableHaptics ? "ON" : "OFF"}
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="connectors">
                <AccordionTrigger>Connectors</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(CONNECTORS).map(([key, spec]) => (
                      <Button
                        key={key}
                        variant={connectorType === key ? "default" : "ghost"}
                        className="justify-start h-auto py-2 px-3"
                        onClick={() => setConnectorType(key as ConnectorType)}
                      >
                        <div className="text-left">
                          <div className="text-xs font-semibold">{spec.name}</div>
                          <div className="text-[10px] opacity-70">Deduction: {spec.deduction}mm</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
