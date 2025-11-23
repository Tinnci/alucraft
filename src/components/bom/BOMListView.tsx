import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { Box, Layers, Wrench } from 'lucide-react';
import { BOMItem } from '@/core/types';

interface BOMListViewProps {
    bom: BOMItem[];
    setHighlightedPartId: (id: string | null) => void;
}

export function BOMListView({ bom, setHighlightedPartId }: BOMListViewProps) {
    const [profilesRef] = useAutoAnimate<HTMLDivElement>();
    const [panelsRef] = useAutoAnimate<HTMLDivElement>();
    const [hardwareRef] = useAutoAnimate<HTMLDivElement>();

    return (
        <div className="space-y-6 mt-0">
            {/* Profiles */}
            <div>
                <h3 className="section-header font-bold text-chart-1 mb-2 flex items-center gap-2">
                    <Box size={12} /> Profiles
                </h3>
                <div className="space-y-1" ref={profilesRef}>
                    {bom.filter(i => i.category === 'profile').map((item, idx) => (
                        <div
                            key={idx}
                            className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50 hover:bg-muted/50 transition-colors cursor-default"
                            onMouseEnter={() => item.partId && setHighlightedPartId(item.partId)}
                            onMouseLeave={() => setHighlightedPartId(null)}
                        >
                            <div className="min-w-0">
                                <div className="text-sm text-foreground truncate">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.lengthMm}mm</div>
                            </div>
                            <div className="text-sm font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                                x{item.qty}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panels */}
            <div>
                <h3 className="section-header font-bold text-chart-2 mb-2 flex items-center gap-2">
                    <Layers size={12} /> Panels
                </h3>
                <div className="space-y-1" ref={panelsRef}>
                    {bom.filter(i => i.category === 'panel').map((item, idx) => (
                        <div
                            key={idx}
                            className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50 hover:bg-muted/50 transition-colors cursor-default"
                            onMouseEnter={() => item.partId && setHighlightedPartId(item.partId)}
                            onMouseLeave={() => setHighlightedPartId(null)}
                        >
                            <div className="min-w-0">
                                <div className="text-sm text-foreground truncate">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.widthMm} x {item.heightMm} mm</div>
                            </div>
                            <div className="text-sm font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                                x{item.qty}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hardware */}
            <div>
                <h3 className="section-header font-bold text-chart-3 mb-2 flex items-center gap-2">
                    <Wrench size={12} /> Hardware
                </h3>
                <div className="space-y-1" ref={hardwareRef}>
                    {bom.filter(i => i.category === 'hardware').map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50">
                            <div className="min-w-0">
                                <div className="text-sm text-foreground truncate">{item.name}</div>
                                <div className="text-xs text-muted-foreground italic">{item.note}</div>
                            </div>
                            <div className="text-sm font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                                x{item.qty}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
