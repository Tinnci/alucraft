'use client';

import React, { useState, useMemo } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import useUIStore from '@/store/useUIStore';
import { BOMItem, ProfileBOMItem } from '@/core/types';
import { calculateCuttingList } from '@/core/optimizer';
import {
  Box,
  Layers,
  Wrench,
  FileSpreadsheet,
  DollarSign,
  Scissors,
  ShoppingCart,
  Download
} from 'lucide-react';

// Shadcn UI Components
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock Unit Prices (in real app, fetch from DB or user input)
const DEFAULT_PRICES: Record<string, number> = {
  'profile': 15.0, // per meter
  'panel': 45.0,   // per sqm
  'hardware': 2.5  // per unit
};

export function BOMPanel() {
  const getBOM = useDesignStore((state: DesignState) => state.getBOM);
  const bom: BOMItem[] = getBOM();

  // Use Global UI Store
  const isOpen = useUIStore((state) => state.isBOMPanelOpen);
  const setIsOpen = useUIStore((state) => state.setBOMPanelOpen);

  const [stockLength, setStockLength] = useState<number>(6000);
  const [unitPrices, setUnitPrices] = useState(DEFAULT_PRICES);

  // --- Cutting Optimization Data ---
  const cuttingData = useMemo(() => {
    const profileItems = bom
      .filter((i): i is ProfileBOMItem => i.category === 'profile' && !!i.lengthMm)
      .map(i => ({ length: i.lengthMm!, qty: i.qty }));

    if (profileItems.length === 0) return null;
    return calculateCuttingList(profileItems, stockLength);
  }, [bom, stockLength]);

  // --- Price Calculation ---
  const priceData = useMemo(() => {
    const items = bom.map(item => {
      let cost = 0;
      if (item.category === 'profile' && item.lengthMm) {
        cost = (item.lengthMm / 1000) * item.qty * unitPrices['profile'];
      } else if (item.category === 'panel' && item.widthMm && item.heightMm) {
        const area = (item.widthMm * item.heightMm) / 1000000;
        cost = area * item.qty * unitPrices['panel'];
      } else {
        cost = item.qty * unitPrices['hardware'];
      }
      return { ...item, cost };
    });

    const total = items.reduce((acc, item) => acc + item.cost, 0);

    return { items, total };
  }, [bom, unitPrices]);

  // --- Exports ---
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ bom, priceData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = priceData.items.map(i => {
      const base = [i.category, i.name, i.qty, i.cost.toFixed(2)];
      return base;
    });
    const header = ['Category', 'Name', 'Qty', 'Cost'];
    const csv = [header, ...rows].map(r => r.map(c => JSON.stringify(c ?? '')).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-bom.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full md:w-[400px] p-0 flex flex-col bg-background/95 backdrop-blur-xl border-l border-border text-foreground">
        <SheetHeader className="p-4 border-b border-border bg-muted/5">
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="text-primary" size={20} />
            Bill of Materials
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="list" className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="list" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Layers size={14} className="mr-2" /> List
              </TabsTrigger>
              <TabsTrigger value="price" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <DollarSign size={14} className="mr-2" /> Price
              </TabsTrigger>
              <TabsTrigger value="cutting" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Scissors size={14} className="mr-2" /> Cutting
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* --- LIST VIEW --- */}
            <TabsContent value="list" className="space-y-6 mt-0">
              {/* Profiles */}
              <div>
                <h3 className="text-xs font-bold text-chart-1 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Box size={12} /> Profiles
                </h3>
                <div className="space-y-1">
                  {bom.filter(i => i.category === 'profile').map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50">
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
                <h3 className="text-xs font-bold text-chart-2 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Layers size={12} /> Panels
                </h3>
                <div className="space-y-1">
                  {bom.filter(i => i.category === 'panel').map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-muted/30 p-2 rounded border border-border/50">
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
                <h3 className="text-xs font-bold text-chart-3 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Wrench size={12} /> Hardware
                </h3>
                <div className="space-y-1">
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
            </TabsContent>

            {/* --- PRICE VIEW --- */}
            <TabsContent value="price" className="space-y-4 mt-0">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg text-center">
                <div className="text-sm text-primary mb-1">Total Estimated Cost</div>
                <div className="text-3xl font-bold text-foreground">${priceData.total.toFixed(2)}</div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unit Prices</h3>
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
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Cost Breakdown</h3>
                <div className="space-y-1">
                  {priceData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                      <span className="text-foreground/80 truncate max-w-[200px]">{item.name}</span>
                      <span className="font-mono text-muted-foreground">${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* --- CUTTING VIEW --- */}
            <TabsContent value="cutting" className="space-y-4 mt-0">
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
            </TabsContent>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-muted/5 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={exportCsv}
              className="w-full border-chart-2/20 text-chart-2 hover:bg-chart-2/10 hover:text-chart-2"
            >
              <FileSpreadsheet size={16} className="mr-2" /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportJson}
              className="w-full border-chart-1/20 text-chart-1 hover:bg-chart-1/10 hover:text-chart-1"
            >
              <Download size={16} className="mr-2" /> Export JSON
            </Button>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default BOMPanel;
