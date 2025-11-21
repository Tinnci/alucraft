'use client';

import React, { useState } from 'react';
import useDesignStore, { DesignState } from '../store/useDesignStore';
import { BOMItem, ProfileBOMItem } from '@/core/types';
import { calculateCuttingList } from '@/core/optimizer';
import { ChevronDown, ChevronUp, FileJson, Box, Layers, Wrench, FileSpreadsheet } from 'lucide-react';

export function BOMPanel() {
  const getBOM = useDesignStore((state: DesignState) => state.getBOM);
  const bom: BOMItem[] = getBOM();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'panel' | 'hardware'>('all');
  const [stockLength, setStockLength] = useState<number>(6000);

  const cuttingData = React.useMemo(() => {
    const profileItems = bom
        .filter((i): i is ProfileBOMItem => i.category === 'profile' && !!i.lengthMm)
        .map(i => ({ length: i.lengthMm!, qty: i.qty }));
    
    if (profileItems.length === 0) return null;
    return calculateCuttingList(profileItems, stockLength);
  }, [bom, stockLength]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(bom, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-bom.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
  const rows = bom.map(i => {
    const base = [i.category, i.name, i.qty, i.note || ''];
    if (i.category === 'profile') {
      return [...base, i.lengthMm, '', ''];
    }
    if (i.category === 'panel') {
      return [...base, '', i.widthMm, i.heightMm];
    }
    if (i.category === 'hardware') {
      return [...base, '', '', ''];
    }
    return base;
  });
  const header = ['Type', 'Name', 'Qty', 'Note', 'Length (mm)', 'Width (mm)', 'Height (mm)'];
    const csv = [header, ...rows].map(r => r.map(c => JSON.stringify(c ?? '')).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alucraft-bom.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalItems = bom.reduce((acc, item) => acc + item.qty, 0);

  const filteredBOM = activeTab === 'all' ? bom : bom.filter(i => i.category === activeTab);

  return (
    <div className={`fixed bottom-4 right-4 w-80 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden transition-all duration-300 flex flex-col shadow-2xl z-50 ${isExpanded ? 'max-h-[80vh]' : 'max-h-14'}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">BOM</span>
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">{totalItems} items</span>
        </div>
        {isExpanded ? <ChevronDown size={18} className="text-white/50" /> : <ChevronUp size={18} className="text-white/50" />}
      </div>

      {/* Stock length selector */}
      {isExpanded && (
        <div className="px-4 pb-2 pt-0">
          <label className="text-xs text-white/60 mr-2">Stock Length:</label>
          <select
            value={stockLength}
            onChange={(e) => setStockLength(parseInt(e.target.value))}
            className="bg-white/5 text-white/70 rounded px-2 py-1 text-xs"
          >
            <option value={6000}>6,000 mm</option>
            <option value={3000}>3,000 mm</option>
            <option value={2500}>2,500 mm</option>
          </select>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 custom-scrollbar flex flex-col">
        
        {/* Tabs */}
        <div className="flex bg-white/5 p-1 rounded-lg mb-2 shrink-0">
            <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
            >
                All
            </button>
            <button 
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors flex items-center justify-center gap-1 ${activeTab === 'profile' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
                title="Profiles"
            >
                <Box size={10} /> Profiles
            </button>
            <button 
                onClick={() => setActiveTab('panel')}
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors flex items-center justify-center gap-1 ${activeTab === 'panel' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
                title="Panels"
            >
                <Layers size={10} /> Panels
            </button>
            <button 
                onClick={() => setActiveTab('hardware')}
                className={`flex-1 py-1 text-[10px] font-medium rounded transition-colors flex items-center justify-center gap-1 ${activeTab === 'hardware' ? 'bg-blue-600 text-white' : 'text-white/50 hover:text-white'}`}
                title="Hardware"
            >
                <Wrench size={10} /> Hardware
            </button>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {filteredBOM.length === 0 && <div className="text-center text-white/30 text-xs py-4">No items in this category</div>}
          {filteredBOM.map((i: BOMItem, idx: number) => (
            <div key={idx} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
              <div className="flex-1 min-w-0 pr-3">
                <div className="text-sm font-medium text-white/90 truncate">{i.name}</div>
                {i.category === 'profile' && <div className="text-xs text-white/50 mt-0.5">Length: {i.lengthMm} mm</div>}
                {i.note && <div className="text-xs text-white/40 mt-0.5 italic">{i.note}</div>}
              </div>
              <div className="flex items-center justify-center min-w-[2rem] h-6 bg-white/10 rounded text-xs font-bold text-white/80">
                {i.qty}
              </div>
            </div>
          ))}
        </div>

        {/* Cutting Optimization Summary */}
        {activeTab !== 'panel' && activeTab !== 'hardware' && cuttingData && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-2 shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-blue-200 flex items-center gap-1">
                        <Box size={12} /> Material Estimate (6m Bars)
                    </span>
                    <span className="text-sm font-bold text-blue-100">{cuttingData.totalStockNeeded} x 6m</span>
                </div>
                <div className="space-y-1">
                    {cuttingData.bars.map((bar, idx) => (
                        <div key={idx} className="flex items-center gap-1 text-[10px] text-white/50">
                            <div className="w-4 text-right opacity-50">#{idx + 1}</div>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden flex">
                                {bar.map((cut, cIdx) => (
                                    <div 
                                        key={cIdx} 
                                        style={{ width: `${(cut / 6000) * 100}%` }} 
                                        className={`h-full border-r border-black/50 ${cIdx % 2 === 0 ? 'bg-blue-500' : 'bg-blue-400'}`}
                                        title={`${cut}mm`}
                                    />
                                ))}
                            </div>
                            <div className="w-8 text-right">{Math.round((bar.reduce((a,b)=>a+b,0) / 6000) * 100)}%</div>
                        </div>
                    ))}
                </div>
                <div className="text-[9px] text-white/30 mt-2 text-right">
                    Includes 5mm saw blade kerf per cut
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-2 mt-2 border-t border-white/10 shrink-0">
          <button 
            onClick={exportCsv}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium rounded-lg transition-colors"
          >
            <FileSpreadsheet size={14} /> CSV
          </button>
          <button 
            onClick={exportJson}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium rounded-lg transition-colors"
          >
            <FileJson size={14} /> JSON
          </button>
        </div>
      </div>
    </div>
  );
}

export default BOMPanel;
