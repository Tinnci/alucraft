'use client';

import React from 'react';
import useUIStore from '@/store/useUIStore';
import { useBOMCalculations } from '@/hooks/useBOMCalculations';
import {
  Layers,
  DollarSign,
  Scissors,
  ShoppingCart,
  FileSpreadsheet,
  Download
} from 'lucide-react';

// Shadcn UI Components
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

// Sub-components
import { BOMListView } from './bom/BOMListView';
import { BOMPriceView } from './bom/BOMPriceView';
import { BOMCuttingView } from './bom/BOMCuttingView';

export function BOMPanel() {
  // Use Global UI Store
  const isOpen = useUIStore((state) => state.isBOMPanelOpen);
  const setIsOpen = useUIStore((state) => state.setBOMPanelOpen);
  const setHighlightedPartId = useUIStore((state) => state.setHighlightedPartId);

  // Use Custom Hook for Calculations
  const {
    bom,
    stockLength,
    setStockLength,
    unitPrices,
    setUnitPrices,
    cuttingData,
    priceData,
    exportJson,
    exportCsv
  } = useBOMCalculations();

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
            <TabsContent value="list" className="mt-0">
              <BOMListView bom={bom} setHighlightedPartId={setHighlightedPartId} />
            </TabsContent>

            <TabsContent value="price" className="mt-0">
              <BOMPriceView priceData={priceData} unitPrices={unitPrices} setUnitPrices={setUnitPrices} />
            </TabsContent>

            <TabsContent value="cutting" className="mt-0">
              <BOMCuttingView cuttingData={cuttingData} stockLength={stockLength} setStockLength={setStockLength} />
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
