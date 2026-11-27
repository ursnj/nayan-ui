'use client';
import { type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { DrawerHost } from './DrawerHost';
import { DrawerContext } from './theme/contexts';

export interface NDrawerControls {
  isOpen: boolean;
  open(): void;
  close(): void;
  toggle(): void;
}
export interface NDrawerProps {
  /** Navigator/page content is retained. Routing belongs to the host app. */
  children: ReactNode;
  drawerContent: ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  enabled?: boolean;
  swipeEnabled?: boolean;
  width?: number;
  edgeWidth?: number;
  side?: 'left' | 'right';
  overlayColor?: string;
  accessibilityLabel?: string;
  drawerStyle?: Record<string, unknown>;
}
/** Use in navigator menu buttons and drawer content. */
export function useNDrawer(): NDrawerControls {
  const value = useContext(DrawerContext);
  if (!value) throw new Error('useNDrawer requires an NDrawer');
  return value;
}
/** Platform content with Rust-owned gestures and animation. Mount around a screen or navigator. */
export function NDrawer({
  children,
  drawerContent,
  isOpen: controlled,
  defaultOpen = false,
  onOpenChange,
  enabled = true,
  swipeEnabled = true,
  width = 300,
  edgeWidth = 24,
  side = 'left',
  overlayColor = 'rgba(10,7,24,0.4)',
  accessibilityLabel = 'Navigation menu',
  drawerStyle
}: NDrawerProps) {
  const [uncontrolled, setOpen] = useState(defaultOpen);
  const [command, setCommand] = useState(0);
  const isOpen = enabled && (controlled ?? uncontrolled);
  const current = useRef({ controlled, isOpen, onOpenChange, enabled });
  current.current = { controlled, isOpen, onOpenChange, enabled };
  const change = useCallback((next: boolean) => {
    const state = current.current;
    next = next && state.enabled;
    const changed = next !== state.isOpen;
    // Native opening and closing intents may arrive together after a busy JS turn.
    state.isOpen = next;
    if (state.controlled === undefined) setOpen(next);
    // A controlled parent may decline a gesture. Re-send its authoritative state.
    setCommand((value) => value + 1);
    if (changed) state.onOpenChange?.(next);
  }, []);
  const open = useCallback(() => change(true), [change]);
  const close = useCallback(() => change(false), [change]);
  const toggle = useCallback(() => change(!current.current.isOpen), [change]);
  const controls = useMemo(() => ({ isOpen, open, close, toggle }), [isOpen, open, close, toggle]);
  return (
    <DrawerContext.Provider value={controls}>
      <DrawerHost
        open={isOpen}
        command={command}
        enabled={enabled}
        swipeEnabled={swipeEnabled}
        width={Number.isFinite(width) ? Math.max(1, width) : 300}
        edgeWidth={Number.isFinite(edgeWidth) ? Math.max(0, edgeWidth) : 24}
        right={side === 'right'}
        onChange={change}
        overlayColor={overlayColor}
        accessibilityLabel={accessibilityLabel}
        drawerStyle={drawerStyle}
        drawerContent={drawerContent}>
        {children}
      </DrawerHost>
    </DrawerContext.Provider>
  );
}
export interface DrawerHostProps {
  children: ReactNode;
  drawerContent: ReactNode;
  open: boolean;
  command: number;
  enabled: boolean;
  swipeEnabled: boolean;
  width: number;
  edgeWidth: number;
  right: boolean;
  overlayColor: string;
  accessibilityLabel: string;
  drawerStyle?: Record<string, unknown>;
  onChange(open: boolean): void;
}
