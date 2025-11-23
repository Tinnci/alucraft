import { ItemNode } from './types';

export function getItemComponentId(node: ItemNode): string {
  // Prefer new `componentId` when present, else fallback to legacy `contentType`.
  // Fallback to 'generic_bay' if neither is present.
  return node.componentId ?? node.contentType ?? 'generic_bay';
}

export function getItemProps<T = Record<string, unknown>>(node: ItemNode): T {
  // Prefer new `props` bag when present, else fallback to legacy `config`.
  // We return Record<string, unknown> so callers can narrow types as needed.
  return ((node.props ?? node.config ?? {}) as unknown) as T;
}

export function getItemWidth(node: ItemNode): number | 'auto' | undefined {
  const p = getItemProps(node) as unknown as { width?: number | 'auto' } | undefined;
  return p?.width;
}

export default {
  getItemComponentId,
  getItemProps,
  getItemWidth,
};
