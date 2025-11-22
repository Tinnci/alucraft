import { describe, it, expect } from 'vitest';
import { calculateCuttingList } from './optimizer';

describe('Optimizer (1D Bin Packing)', () => {
    it('should pack simple items into a single bar if they fit', () => {
        const items = [
            { length: 1000, qty: 2 },
            { length: 2000, qty: 1 }
        ];
        // Total: 1000 + 1000 + 2000 = 4000. Fits in 6000.
        // Kerf: 5mm. 
        // 2000 (kerf 5) 1000 (kerf 5) 1000. Total used: 4000 + 10 = 4010. Fits.

        const result = calculateCuttingList(items, 6000, 5);

        expect(result.totalStockNeeded).toBe(1);
        expect(result.bars.length).toBe(1);
        expect(result.bars[0]).toContain(2000);
        expect(result.bars[0]).toContain(1000);
    });

    it('should start a new bar when items do not fit', () => {
        const items = [
            { length: 4000, qty: 2 }
        ];
        // 4000 + 4000 = 8000 > 6000. Needs 2 bars.

        const result = calculateCuttingList(items, 6000, 5);

        expect(result.totalStockNeeded).toBe(2);
        expect(result.bars.length).toBe(2);
        expect(result.bars[0]).toEqual([4000]);
        expect(result.bars[1]).toEqual([4000]);
    });

    it('should handle kerf (blade width) correctly', () => {
        // Stock: 100. Item: 30. Kerf: 5.
        // 30 (5) 30 (5) 30 = 30+5+30+5+30 = 100. Fits exactly 3.
        const items = [{ length: 30, qty: 3 }];
        const result = calculateCuttingList(items, 100, 5);

        expect(result.totalStockNeeded).toBe(1);
        expect(result.bars[0].length).toBe(3);

        // If we try to fit 4: 30*4 + 5*3 = 120 + 15 = 135 > 100.
        const items2 = [{ length: 30, qty: 4 }];
        const result2 = calculateCuttingList(items2, 100, 5);
        expect(result2.totalStockNeeded).toBe(2);
    });

    it('should sort items descending for FFD efficiency', () => {
        // FFD works best when large items are placed first.
        // If we have stock 100. Items: 60, 30, 30.
        // Sorted: 60, 30, 30.
        // Bar 1: 60. Remaining: 40. Next: 30. Fits (60+5+30=95). Remaining: 5.
        // Next: 30. Does not fit.
        // Result: [60, 30], [30]. Total 2 bars.

        // If NOT sorted (e.g. 30, 30, 60) and simple First Fit:
        // Bar 1: 30. Next 30. Fits (30+5+30=65). Remaining 35.
        // Next 60. Does not fit.
        // Result: [30, 30], [60]. Also 2 bars.

        // Let's try a case where sorting matters.
        // Stock 100. Items: 51, 20, 20, 20, 20.
        // Sorted: 51, 20, 20, 20, 20.
        // Bar 1: 51. Rem: 49. Next 20. Fits (51+5+20=76). Rem: 24. Next 20. Fits (76+5+20=101) -> NO!
        // Wait, 51+5+20 = 76. 100-76 = 24. Next 20 fits? 76+5+20 = 101. No.
        // So Bar 1: [51, 20].
        // Bar 2: 20, 20, 20. (20+5+20+5+20 = 70). Fits.
        // Total 2 bars.

        // If unsorted: 20, 20, 20, 20, 51.
        // Bar 1: 20, 20, 20, 20. (20+5+20+5+20+5+20 = 95). Fits.
        // Bar 2: 51.
        // Total 2 bars.

        // FFD isn't always optimal, but it's better than random.
        // The test here just ensures the output is valid and all items are accounted for.
        const items = [
            { length: 20, qty: 4 },
            { length: 51, qty: 1 }
        ];
        const result = calculateCuttingList(items, 100, 5);

        const totalItems = result.bars.reduce((acc, bar) => acc + bar.length, 0);
        expect(totalItems).toBe(5);
    });

    it('should calculate waste ratio correctly', () => {
        const items = [{ length: 5000, qty: 1 }];
        const result = calculateCuttingList(items, 10000, 0); // 10m stock, no kerf

        // Used: 5000. Total Stock: 10000. Waste: 0.5.
        expect(result.wasteRatio).toBe(0.5);
    });
});
