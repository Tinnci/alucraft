import { useState, useMemo } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { BOMItem, ProfileBOMItem } from '@/core/types';
import { calculateCuttingList } from '@/core/optimizer';

// Mock Unit Prices (in real app, fetch from DB or user input)
export const DEFAULT_PRICES: Record<string, number> = {
    'profile': 15.0, // per meter
    'panel': 45.0,   // per sqm
    'hardware': 2.5  // per unit
};

export function useBOMCalculations() {
    const getBOM = useDesignStore((state: DesignState) => state.getBOM);
    const bom: BOMItem[] = getBOM();

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
    import { generateCSV } from '@/core/exporters/csv-generator';
    import { generateJSON } from '@/core/exporters/json-generator';

    // --- Exports ---
    const exportJson = () => {
        generateJSON(bom, priceData);
    };

    const exportCsv = () => {
        generateCSV(priceData);
    };

    return {
        bom,
        stockLength,
        setStockLength,
        unitPrices,
        setUnitPrices,
        cuttingData,
        priceData,
        exportJson,
        exportCsv
    };
}
