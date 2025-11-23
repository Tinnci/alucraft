'use client';

import { create } from 'zustand';

/**
 * useUIStore - 管理 UI 状态，独立于设计数据
 * 关注：面板可见性、选中对象、展开/折叠状态等
 */

export type SelectableObjectType = 'bay' | 'shelf' | 'drawer' | null;
// [NEW] 定义可拖拽的组件类型
export type DraggableComponentType = 'shelf' | 'drawer' | null;

export interface UIState {
  // 选中对象管理
  selectedBayId: string | null;
  selectedShelfId: string | null;
  selectedDrawerId: string | null;
  selectedObjectType: SelectableObjectType;

  // 面板状态
  isPropertyPanelOpen: boolean;
  isTopBarExpanded: boolean;
  isBOMPanelOpen: boolean;

  // 浮动面板状态（暂时保留以备过渡期使用）
  isFloatingControlsExpanded: boolean;

  // [NEW] 拖拽状态
  draggedComponent: DraggableComponentType;

  // [NEW] BOM Highlighting
  highlightedPartId: string | null;

  // Setters
  setSelectedBayId: (id: string | null) => void;
  setSelectedShelfId: (id: string | null) => void;
  setSelectedDrawerId: (id: string | null) => void;
  setSelectedObjectType: (type: SelectableObjectType) => void;

  setPropertyPanelOpen: (open: boolean) => void;
  setTopBarExpanded: (expanded: boolean) => void;
  setBOMPanelOpen: (open: boolean) => void;
  setFloatingControlsExpanded: (expanded: boolean) => void;

  // [NEW] 拖拽 Setter
  setDraggedComponent: (type: DraggableComponentType) => void;

  setHighlightedPartId: (id: string | null) => void;

  // 便利方法：清除所有选中状态
  clearSelection: () => void;

  // 便利方法：切换对象选中状态
  selectBay: (bayId: string) => void;
  selectShelf: (bayId: string, shelfId: string) => void;
  selectDrawer: (bayId: string, drawerId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 初始状态
  selectedBayId: null,
  selectedShelfId: null,
  selectedDrawerId: null,
  selectedObjectType: null,
  isPropertyPanelOpen: true,
  isTopBarExpanded: true,
  isBOMPanelOpen: false,
  isFloatingControlsExpanded: true,
  draggedComponent: null,
  highlightedPartId: null,

  // ... Setters ...
  setSelectedBayId: (id) => set({ selectedBayId: id, selectedObjectType: id ? 'bay' : null }),
  setSelectedShelfId: (id) => set({ selectedShelfId: id, selectedObjectType: id ? 'shelf' : null }),
  setSelectedDrawerId: (id) => set({ selectedDrawerId: id, selectedObjectType: id ? 'drawer' : null }),
  setSelectedObjectType: (type) => set({ selectedObjectType: type }),

  setPropertyPanelOpen: (open) => set({ isPropertyPanelOpen: open }),
  setTopBarExpanded: (expanded) => set({ isTopBarExpanded: expanded }),
  setBOMPanelOpen: (open) => set({ isBOMPanelOpen: open }),
  setFloatingControlsExpanded: (expanded) => set({ isFloatingControlsExpanded: expanded }),

  setDraggedComponent: (type) => set({ draggedComponent: type }),
  setHighlightedPartId: (id) => set({ highlightedPartId: id }),

  // ... Helpers ...
  clearSelection: () => set({
    selectedBayId: null,
    selectedShelfId: null,
    selectedDrawerId: null,
    selectedObjectType: null
  }),
  selectBay: (bayId) => set({
    selectedBayId: bayId,
    selectedShelfId: null,
    selectedDrawerId: null,
    selectedObjectType: 'bay'
  }),

  selectShelf: (bayId, shelfId) => set({
    selectedBayId: bayId,
    selectedShelfId: shelfId,
    selectedDrawerId: null,
    selectedObjectType: 'shelf'
  }),

  selectDrawer: (bayId, drawerId) => set({
    selectedBayId: bayId,
    selectedShelfId: null,
    selectedDrawerId: drawerId,
    selectedObjectType: 'drawer'
  })
}));

export default useUIStore;
