import React from 'react';
import { Calculator, CheckCircle2, AlertTriangle, Magnet, ScanLine } from 'lucide-react';
import useDesignStore from '@/store/useDesignStore';
import { calculateHinge } from '@/core/hinge-rules';
import { CONNECTORS, ConnectorType } from '@/core/types';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { NumberSlider as PropertySlider } from '@/components/ui/number-slider';

export function GlobalSettingsInspector() {
    // === Settings Slice ===
    const overlay = useDesignStore((s) => s.overlay);
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

    // Hinge Calculation Logic
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

    return (
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
                        <div className={`p-3 rounded-md text-xs border ${result.success ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
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
                        {[
                            { name: 'Top', active: hasTopPanel, setter: setHasTopPanel },
                            { name: 'Bottom', active: hasBottomPanel, setter: setHasBottomPanel },
                            { name: 'Back', active: hasBackPanel, setter: setHasBackPanel },
                            { name: 'Left', active: hasLeftPanel, setter: setHasLeftPanel },
                            { name: 'Right', active: hasRightPanel, setter: setHasRightPanel },
                        ].map(({ name, active, setter }) => (
                            <Button key={name} variant={active ? "secondary" : "outline"} size="sm" className="text-xs h-7" onClick={() => setter(!active)}>
                                {name}
                            </Button>
                        ))}
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
                                    <div className="text-xs opacity-70">Deduction: {spec.deduction}mm</div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
