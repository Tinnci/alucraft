import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { LayoutBay, Shelf } from '@/core/types';
import useDesignStore from '@/store/useDesignStore';
import { Button } from '@/components/ui/button';
import { NumberSlider as PropertySlider } from '@/components/ui/number-slider';

interface ShelfInspectorProps {
    selectedBay: LayoutBay;
    selectedShelf: Shelf;
}

export function ShelfInspector({ selectedBay, selectedShelf }: ShelfInspectorProps) {
    const height = useDesignStore((s) => s.height);
    const updateShelf = useDesignStore((s) => s.updateShelf);
    const duplicateShelf = useDesignStore((s) => s.duplicateShelf);
    const removeShelf = useDesignStore((s) => s.removeShelf);

    return (
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
    );
}
