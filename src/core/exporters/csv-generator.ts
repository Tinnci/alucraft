import { BOMItem } from '@/core/types';

interface PriceData {
    items: any[];
    total: number;
}

export function generateCSV(priceData: PriceData): void {
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
}
