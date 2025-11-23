import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { LayoutBay } from '@/core/types';
import useDesignStore from '@/store/useDesignStore';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NumberSlider as PropertySlider } from '@/components/ui/number-slider';

interface BayInspectorProps {
    selectedBay: LayoutBay;
}

export function BayInspector({ selectedBay }: BayInspectorProps) {
    const resizeBay = useDesignStore((s) => s.resizeBay);
    const splitItem = useDesignStore((s) => s.splitItem);
    const setBayDoorConfig = useDesignStore((s) => s.setBayDoorConfig);

    const doorConfig = selectedBay.config.door;

    return (
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
                        <Tabs defaultValue={doorConfig.type} className="w-full" onValueChange={(v: string) => setBayDoorConfig(selectedBay.id, { type: v as 'single' | 'double' })}>
                            <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="single" className="text-xs">Single</TabsTrigger>
                                <TabsTrigger value="double" className="text-xs">Double</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}

                    {doorConfig?.enabled && doorConfig.type === 'single' && (
                        <Tabs defaultValue={doorConfig.hingeSide} className="w-full" onValueChange={(v: string) => setBayDoorConfig(selectedBay.id, { hingeSide: v as 'left' | 'right' })}>
                            <TabsList className="grid w-full grid-cols-2 h-8">
                                <TabsTrigger value="left" className="text-xs">Left Hinge</TabsTrigger>
                                <TabsTrigger value="right" className="text-xs">Right Hinge</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
