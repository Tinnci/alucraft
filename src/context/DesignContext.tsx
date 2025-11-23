import { createContext, useContext } from 'react';
import { ProfileType } from '@/core/types';

export interface DesignContextValue {
  profileType: ProfileType;
  height: number; // cabinet height
  depth: number;  // cabinet depth
  isShiftDown: boolean;
}

export const DesignContext = createContext<DesignContextValue | undefined>(undefined);

export function useDesignContext(): DesignContextValue {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesignContext must be used inside a DesignContext.Provider');
  return ctx;
}

export default DesignContext;
