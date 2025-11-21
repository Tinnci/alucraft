'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface ToastProps {
  result: {
    success: boolean;
    message: string;
    recommendedHinge?: {
      name: string;
    };
    kValue?: number;
  };
}

/**
 * Toast - 通知组件
 * 位置在屏幕底部中间，在 BottomBar 上方
 */
export function Toast({ result }: ToastProps) {
  if (!result) return null;

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        px-6 py-3 rounded-full backdrop-blur-xl shadow-2xl border
        transition-all duration-300 pointer-events-auto
        animate-in fade-in slide-in-from-bottom-2
        ${
          result.success
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {result.success ? (
          <CheckCircle2 size={16} className="flex-shrink-0" />
        ) : (
          <AlertTriangle size={16} className="flex-shrink-0" />
        )}
        <div>
          <div className="font-semibold text-sm">{result.message}</div>
          {result.success && result.recommendedHinge && (
            <div className="text-xs opacity-75 mt-0.5 font-mono">
              {result.recommendedHinge.name} (K={result.kValue})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
