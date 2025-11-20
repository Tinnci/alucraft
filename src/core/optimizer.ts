/**
 * Simple 1D Bin Packing (First Fit Decreasing) for profile cutting
 */
export interface StockAllocation {
  bars: number[][]; // Each inner array represents one 6m bar, containing cut lengths
  totalStockNeeded: number;
  wasteRatio: number;
}

export function calculateCuttingList(
  items: { length: number; qty: number }[],
  stockLength: number = 6000,
  bladeWidth: number = 5 // Standard saw blade thickness + trim margin
): StockAllocation {
  // 1. Expand items into individual cuts
  const allCuts: number[] = [];
  items.forEach((item) => {
    for (let i = 0; i < item.qty; i++) {
      allCuts.push(item.length);
    }
  });

  // 2. Sort descending (Crucial for FFD algorithm efficiency)
  allCuts.sort((a, b) => b - a);

  const bars: number[][] = [];

  // 3. Distribute cuts into bars
  for (const cut of allCuts) {
    let placed = false;
    for (const bar of bars) {
      // Calculate current usage: Sum of parts + (N-1) * kerf
      const currentUsed = bar.reduce((acc, val) => acc + val, 0) + (bar.length > 0 ? (bar.length - 1) * bladeWidth : 0);
      
      // Check if it fits: New part + kerf (if not first item)
      const spaceNeeded = bar.length > 0 ? bladeWidth + cut : cut;

      if (currentUsed + spaceNeeded <= stockLength) {
        bar.push(cut);
        placed = true;
        break;
      }
    }

    // If it doesn't fit in any existing bar, start a new one
    if (!placed) {
      bars.push([cut]);
    }
  }

  // 4. Calculate stats
  const totalUsedLength = allCuts.reduce((a, c) => a + c, 0);
  const totalStockLen = bars.length * stockLength;
  const wasteRatio = totalStockLen > 0 ? 1 - (totalUsedLength / totalStockLen) : 0;

  return {
    bars,
    totalStockNeeded: bars.length,
    wasteRatio
  };
}
