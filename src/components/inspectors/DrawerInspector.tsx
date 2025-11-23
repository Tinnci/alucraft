import React from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { LayoutBay, Drawer } from '@/core/types';
import useDesignStore from '@/store/useDesignStore';
import { Button } from '@/components/ui/button';
import { NumberSlider as PropertySlider } from '@/components/ui/number-slider';

interface DrawerInspectorProps {
    selectedBay: LayoutBay;
    selectedDrawer: Drawer;
}

export function DrawerInspector({ selectedBay, selectedDrawer }: DrawerInspectorProps) {
    const height = useDesignStore((s) => s.height);
    const updateDrawer = useDesignStore((s) => s.updateDrawer);
    const duplicateDrawer = useDesignStore((s) => s.duplicateDrawer);
    const removeDrawer = useDesignStore((s) => s.removeDrawer);

    return (
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
    );
}
