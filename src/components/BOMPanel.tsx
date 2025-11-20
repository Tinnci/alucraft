'use client';

import React, { useState } from 'react';
import useDesignStore, { BOMItem, DesignState } from '@/store/useDesignStore';
import { ChevronDown, ChevronUp, FileJson, FileSpreadsheet, Layers, Box, Wrench } from 'lucide-react';

export function BOMPanel() {
  const getBOM = useDesignStore((state: DesignState) => state.getBOM);
  const bom: BOMItem[] = getBOM();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'profile' | 'panel' | 'hardware'>('all');

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
    const rows = bom.map(i => [i.name, i.qty, i.lengthMm || '', i.note || '']);
    const header = ['name', 'qty', 'length_mm', 'note'];
    const csv = [header, ...rows].map(r => r.map(c => JSON.stringify(c)).join(',')).join('\n');
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
                {i.lengthMm && <div className="text-xs text-white/50 mt-0.5">Length: {i.lengthMm} mm</div>}
                {i.note && <div className="text-xs text-white/40 mt-0.5 italic">{i.note}</div>}
              </div>
              <div className="flex items-center justify-center min-w-[2rem] h-6 bg-white/10 rounded text-xs font-bold text-white/80">
                {i.qty}
              </div>
            </div>
          ))}
        </div>

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
