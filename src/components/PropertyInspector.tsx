'use client';

import React, { useMemo } from 'react';
import { BoxSelect } from 'lucide-react';
import useDesignStore from '@/store/useDesignStore';
import { findBays, BayConfig } from '@/core/types';
import { getItemProps } from '@/core/item-utils';
import useUIStore from '@/store/useUIStore';

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

// Inspectors
import { BayInspector } from './inspectors/BayInspector';
import { ShelfInspector } from './inspectors/ShelfInspector';
import { DrawerInspector } from './inspectors/DrawerInspector';
import { GlobalSettingsInspector } from './inspectors/GlobalSettingsInspector';

export function PropertyInspector() {
  // === Layout Slice ===
  const layout = useDesignStore((s) => s.layout);

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
  const selectedShelf = useMemo(() => {
  if (!selectedBay) return undefined;
  const p = getItemProps<BayConfig>(selectedBay);
    return (p.shelves ?? []).find((s) => s.id === selectedShelfId);
  }, [selectedBay, selectedShelfId]);
  const selectedDrawer = useMemo(() => {
  if (!selectedBay) return undefined;
  const p = getItemProps<BayConfig>(selectedBay);
    return (p.drawers ?? []).find((d) => d.id === selectedDrawerId);
  }, [selectedBay, selectedDrawerId]);

  return (
    <div className="flex flex-col h-full w-full md:w-80 glass-panel">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/5 shrink-0">
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
            <BayInspector selectedBay={selectedBay} />
          )}

          {/* --- Shelf Properties --- */}
          {selectedObjectType === 'shelf' && selectedShelf && selectedBay && (
            <ShelfInspector selectedBay={selectedBay} selectedShelf={selectedShelf} />
          )}

          {/* --- Drawer Properties --- */}
          {selectedObjectType === 'drawer' && selectedDrawer && selectedBay && (
            <DrawerInspector selectedBay={selectedBay} selectedDrawer={selectedDrawer} />
          )}

          {/* --- Global Settings --- */}
          {!selectedObjectType && (
            <GlobalSettingsInspector />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
