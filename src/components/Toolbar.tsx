'use client';

import React from 'react';
import { MousePointer2, Move, Ruler, DoorOpen, DoorClosed } from 'lucide-react';
import useDesignStore, { DesignState } from '../store/useDesignStore';

export function Toolbar() {
  const isDoorOpen = useDesignStore((state: DesignState) => state.isDoorOpen);
  const setIsDoorOpen = useDesignStore((state: DesignState) => state.setIsDoorOpen);

  return (
    <div className="w-full flex flex-col gap-2 p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl z-50 items-center">
      <button className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Select">
        <MousePointer2 size={20} />
      </button>
      <button className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Move">
        <Move size={20} />
      </button>
      <button className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Measure">
        <Ruler size={20} />
      </button>
      <div className="h-px w-full bg-white/10 my-1" />
      <button 
        className={`p-3 rounded-lg transition-colors ${isDoorOpen ? 'text-blue-400 bg-blue-500/20' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
        onClick={() => setIsDoorOpen(!isDoorOpen)}
        title={isDoorOpen ? "Close Door" : "Open Door"}
      >
        {isDoorOpen ? <DoorOpen size={20} /> : <DoorClosed size={20} />}
      </button>
    </div>
  );
}
