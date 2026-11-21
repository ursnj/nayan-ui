import { createContext } from 'react';

/** Read-only Rust output used to materialize a bounded React row window. */
export interface ComponentListPlan {
  configuration: string;
  start: number;
  end: number;
  first: number;
  last: number;
  itemCount: number;
  itemSize: number;
  offset: number;
  viewportHeight: number;
  distanceFromEnd: number;
  endReached?: boolean;
  visibleChanged?: boolean;
  refreshRequested?: boolean;
  headerPinned?: boolean;
  headerPinnedChanged?: boolean;
}

export type ComponentListScroll = { kind: 'offset'; offset: number } | { kind: 'index'; index: number; viewPosition?: number } | { kind: 'end' };

export interface ComponentRuntime {
  captureNode?(id: string, uri: string, screen: { width: number; height: number }): Promise<{ base64: string; width: number; height: number }>;
  planList(id: string, props: Record<string, unknown>): ComponentListPlan;
  scrollList(id: string, command: ComponentListScroll): void;
}

export const ComponentRuntimeContext = /* @__PURE__ */ createContext<ComponentRuntime | null>(null);
