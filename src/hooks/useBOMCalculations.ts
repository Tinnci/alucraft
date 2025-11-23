import { useState, useMemo } from 'react';
import useDesignStore, { DesignState } from '@/store/useDesignStore';
import { BOMItem, ProfileBOMItem } from '@/core/types';
import { calculateCuttingList } from '@/core/optimizer';
import { generateCSV } from '@/core/exporters/csv-generator';
import { generateJSON } from '@/core/exporters/json-generator';
import { DEFAULT_PRICES } from '@/config/prices';

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
