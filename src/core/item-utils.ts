import { ItemNode } from './types';

export function getItemComponentId(node: ItemNode): string {
  // Prefer new `componentId` when present, else fallback to legacy `contentType`.
  // Avoid assuming a default content type; return 'unknown' if none present to
  // ensure we surface fallback renderers / errors in the registry layer.
  return node.componentId || node.contentType || 'unknown';
}

export function getItemProps<T = Record<string, unknown>>(node: ItemNode): T {
  // Prefer new `props` bag when present, else fallback to legacy `config`.
  // We return Record<string, unknown> so callers can narrow types as needed.
  return ((node.props ?? node.config ?? {}) as unknown) as T;
}

export function getItemWidth(node: ItemNode): number | 'auto' | undefined {
  // Explicitly use `any` here to avoid the complex typings around transform/event
  // handlers and to keep the helper robust against legacy `config` shapes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = getItemProps<any>(node);
  return p?.width;
}

const itemUtils = {
  getItemComponentId,
  getItemProps,
  getItemWidth,
};

export default itemUtils;
