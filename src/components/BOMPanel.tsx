'use client';

import React, { useState, useMemo } from 'react';
import useDesignStore, { DesignState } from '../store/useDesignStore';
import { BOMItem, ProfileBOMItem } from '@/core/types';
import { calculateCuttingList } from '@/core/optimizer';
import {
  Box,
  Layers,
  Wrench,
  FileSpreadsheet,
  DollarSign,
  Scissors,
  X,
  ShoppingCart,
  Download
} from 'lucide-react';

// Mock Unit Prices (in real app, fetch from DB or user input)
const DEFAULT_PRICES: Record<string, number> = {
  'profile': 15.0, // per meter
  'panel': 45.0,   // per sqm
  'hardware': 2.5  // per unit
};

export function BOMPanel() {
  const getBOM = useDesignStore((state: DesignState) => state.getBOM);
  const bom: BOMItem[] = getBOM();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'price' | 'cutting'>('list');
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
    const blob = new Blob([JSON.stringify({ bom, priceData }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
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
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {/* Floating Toggle Button Removed */}

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-full md:w-[400px]
          bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-blue-400" size={20} />
            <h2 className="text-lg font-semibold text-white">Bill of Materials</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded text-white/50 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-1 border-b border-white/10">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
          >
            <Layers size={14} /> List
          </button>
          <button
            onClick={() => setActiveTab('price')}
            className={`flex-1 py-2 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'price' ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
          >
            <DollarSign size={14} /> Price
          </button>
          <button
            onClick={() => setActiveTab('cutting')}
            className={`flex-1 py-2 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors ${activeTab === 'cutting' ? 'bg-blue-600 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
          >
            <Scissors size={14} /> Cutting
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

          {/* --- LIST VIEW --- */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Profiles */}
              <div>
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Box size={12} /> Profiles
                </h3>
                <div className="space-y-1">
                  {bom.filter(i => i.category === 'profile').map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{item.name}</div>
                        <div className="text-xs text-white/40">{item.lengthMm}mm</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-white/80 bg-white/10 px-2 py-1 rounded">
                        x{item.qty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panels */}
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Layers size={12} /> Panels
                </h3>
                <div className="space-y-1">
                  {bom.filter(i => i.category === 'panel').map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{item.name}</div>
                        <div className="text-xs text-white/40">{item.widthMm} x {item.heightMm} mm</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-white/80 bg-white/10 px-2 py-1 rounded">
                        x{item.qty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardware */}
              <div>
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Wrench size={12} /> Hardware
                </h3>
                <div className="space-y-1">
                  {bom.filter(i => i.category === 'hardware').map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{item.name}</div>
                        <div className="text-xs text-white/40 italic">{item.note}</div>
                      </div>
                      <div className="text-sm font-mono font-bold text-white/80 bg-white/10 px-2 py-1 rounded">
                        x{item.qty}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- PRICE VIEW --- */}
          {activeTab === 'price' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-center">
                <div className="text-sm text-blue-300 mb-1">Total Estimated Cost</div>
                <div className="text-3xl font-bold text-white">${priceData.total.toFixed(2)}</div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Unit Prices</h3>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between bg-white/5 p-2 rounded">
                    <span className="text-sm text-white">Profile ($/m)</span>
                    <input
                      type="number"
                      value={unitPrices['profile']}
                      onChange={(e) => setUnitPrices({ ...unitPrices, profile: Number(e.target.value) })}
                      className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-2 rounded">
                    <span className="text-sm text-white">Panel ($/m²)</span>
                    <input
                      type="number"
                      value={unitPrices['panel']}
                      onChange={(e) => setUnitPrices({ ...unitPrices, panel: Number(e.target.value) })}
                      className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-2 rounded">
                    <span className="text-sm text-white">Hardware ($/unit)</span>
                    <input
                      type="number"
                      value={unitPrices['hardware']}
                      onChange={(e) => setUnitPrices({ ...unitPrices, hardware: Number(e.target.value) })}
                      className="w-20 bg-black/20 border border-white/10 rounded px-2 py-1 text-right text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Cost Breakdown</h3>
                <div className="space-y-1">
                  {priceData.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-white/5 last:border-0">
                      <span className="text-white/80 truncate max-w-[200px]">{item.name}</span>
                      <span className="font-mono text-white/60">${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --- CUTTING VIEW --- */}
          {activeTab === 'cutting' && cuttingData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                <span className="text-sm text-white">Stock Length</span>
                <select
                  value={stockLength}
                  onChange={(e) => setStockLength(parseInt(e.target.value))}
                  className="bg-black/20 text-white border border-white/10 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value={6000}>6000 mm</option>
                  <option value={3000}>3000 mm</option>
                  <option value={2500}>2500 mm</option>
                </select>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <div className="text-xs text-white/50">Total Bars Needed</div>
                    <div className="text-2xl font-bold text-blue-400">{cuttingData.totalStockNeeded}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/50">Waste</div>
                    <div className="text-lg font-bold text-red-400">
                      {((1 - (cuttingData.bars.flat().reduce((a, b) => a + b, 0) / (cuttingData.totalStockNeeded * stockLength))) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {cuttingData.bars.map((bar, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-white/40">
                        <span>Bar #{idx + 1}</span>
                        <span>{bar.reduce((a, b) => a + b, 0)} / {stockLength} mm</span>
                      </div>
                      <div className="h-4 bg-slate-700 rounded overflow-hidden flex w-full relative">
                        {bar.map((cut, cIdx) => (
                          <div
                            key={cIdx}
                            style={{ width: `${(cut / stockLength) * 100}%` }}
                            className={`h-full border-r border-black/20 flex items-center justify-center group relative ${cIdx % 2 === 0 ? 'bg-blue-500' : 'bg-blue-400'}`}
                          >
                            <span className="text-[8px] text-white font-medium opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity">
                              {cut}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-white/5 grid grid-cols-2 gap-3">
          <button
            onClick={exportCsv}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium rounded-lg transition-colors border border-emerald-600/20"
          >
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button
            onClick={exportJson}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 text-sm font-medium rounded-lg transition-colors border border-cyan-600/20"
          >
            <Download size={16} /> Export JSON
          </button>
        </div>
      </div >
    </>
  );
}

export default BOMPanel;
