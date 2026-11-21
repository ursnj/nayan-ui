'use client';

export interface NRefreshControlProps {
  refreshing?: boolean;
  onRefresh?: () => void;
  tintColor?: string;
}

/** Declarative refresh configuration consumed by NList/NScrollView; the gesture belongs to Rust. */
export const NRefreshControl = (_props: NRefreshControlProps) => null;
