import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BOMCuttingViewProps {
    cuttingData: {
        bars: number[][];
        totalStockNeeded: number;
        waste: number;
    } | null;
    stockLength: number;
    setStockLength: (length: number) => void;
}

export function BOMCuttingView({ cuttingData, stockLength, setStockLength }: BOMCuttingViewProps) {
    return (
        <div className="space-y-4 mt-0">
            {cuttingData && (
                <>
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                        <span className="text-sm text-foreground">Stock Length</span>
                        <Select value={stockLength.toString()} onValueChange={(v) => setStockLength(parseInt(v))}>
                            <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                                <SelectValue placeholder="Select Length" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="6000">6000 mm</SelectItem>
                                <SelectItem value="3000">3000 mm</SelectItem>
                                <SelectItem value="2500">2500 mm</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3 border border-border">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <div className="text-xs text-muted-foreground">Total Bars Needed</div>
                                <div className="text-2xl font-bold text-primary">{cuttingData.totalStockNeeded}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground">Waste</div>
                                <div className="text-lg font-bold text-destructive">
                                    {((1 - (cuttingData.bars.flat().reduce((a, b) => a + b, 0) / (cuttingData.totalStockNeeded * stockLength))) * 100).toFixed(1)}%
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {cuttingData.bars.map((bar, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                        <span>Bar #{idx + 1}</span>
                                        <span>{bar.reduce((a, b) => a + b, 0)} / {stockLength} mm</span>
                                    </div>
                                    <div className="h-4 bg-muted rounded overflow-hidden flex w-full relative">
                                        {bar.map((cut, cIdx) => (
                                            <div
                                                key={cIdx}
                                                style={{ width: `${(cut / stockLength) * 100}%` }}
                                                className={`h-full border-r border-background/20 flex items-center justify-center group relative ${cIdx % 2 === 0 ? 'bg-primary' : 'bg-primary/80'}`}
                                            >
                                                <span className="text-[8px] text-white font-medium opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity">
                                                    {cut}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
