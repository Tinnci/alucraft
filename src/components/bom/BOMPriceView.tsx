import React from 'react';
import { Input } from '@/components/ui/input';

interface BOMPriceViewProps {
    priceData: {
        items: Array<{ category: string; name: string; qty: number; cost: number }>;
        total: number;
    };
    unitPrices: Record<string, number>;
    setUnitPrices: (prices: Record<string, number>) => void;
}

export function BOMPriceView({ priceData, unitPrices, setUnitPrices }: BOMPriceViewProps) {
    return (
        <div className="space-y-4 mt-0">
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
                <div className="text-sm text-primary mb-1">Total Estimated Cost</div>
                <div className="text-3xl font-bold text-foreground">${priceData.total.toFixed(2)}</div>
            </div>

            <div className="space-y-2">
                <h3 className="section-header font-bold text-muted-foreground">Unit Prices</h3>
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                        <span className="text-sm text-foreground">Profile ($/m)</span>
                        <Input
                            type="number"
                            value={unitPrices['profile']}
                            onChange={(e) => setUnitPrices({ ...unitPrices, profile: Number(e.target.value) })}
                            className="w-20 text-right h-8 bg-background"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                        <span className="text-sm text-foreground">Panel ($/m²)</span>
                        <Input
                            type="number"
                            value={unitPrices['panel']}
                            onChange={(e) => setUnitPrices({ ...unitPrices, panel: Number(e.target.value) })}
                            className="w-20 text-right h-8 bg-background"
                        />
                    </div>
                    <div className="flex items-center justify-between bg-muted/30 p-2 rounded">
                        <span className="text-sm text-foreground">Hardware ($/unit)</span>
                        <Input
                            type="number"
                            value={unitPrices['hardware']}
                            onChange={(e) => setUnitPrices({ ...unitPrices, hardware: Number(e.target.value) })}
                            className="w-20 text-right h-8 bg-background"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="section-header font-bold text-white/50">Cost Breakdown</h3>
                <div className="space-y-1">
                    {priceData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                            <span className="text-foreground/80 truncate max-w-[200px]">{item.name}</span>
                            <span className="font-mono text-muted-foreground">${item.cost.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
