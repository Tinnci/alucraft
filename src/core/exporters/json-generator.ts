import { BOMItem } from '@/core/types';

interface PriceData {
    items: any[];
    total: number;
}

export function generateJSON(bom: BOMItem[], priceData: PriceData): void {
    const blob = new Blob([JSON.stringify({ bom, priceData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-project.json';
    a.click();
    URL.revokeObjectURL(url);
}
