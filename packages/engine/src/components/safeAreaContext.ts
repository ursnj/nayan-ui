'use client';
import { useContext } from 'react';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from './theme/contexts';
export { SafeAreaFrameContext, SafeAreaInsetsContext } from './theme/contexts';
export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface SafeAreaFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface SafeAreaMetrics {
  insets: SafeAreaInsets;
  frame: SafeAreaFrame;
}
export type SafeAreaEdge = keyof SafeAreaInsets;
export type SafeAreaEdgeMode = 'off' | 'additive' | 'maximum';
export type SafeAreaEdges = readonly SafeAreaEdge[] | Partial<Record<SafeAreaEdge, SafeAreaEdgeMode>>;
export function useNSafeAreaInsets(): SafeAreaInsets {
  const value = useContext(SafeAreaInsetsContext);
  if (!value) throw new Error('useNSafeAreaInsets requires an NSafeAreaProvider');
  return value;
}
export function useNSafeAreaFrame(): SafeAreaFrame {
  const value = useContext(SafeAreaFrameContext);
  if (!value) throw new Error('useNSafeAreaFrame requires an NSafeAreaProvider');
  return value;
}
export const sameSafeArea = (a: SafeAreaMetrics, b: SafeAreaMetrics) =>
  a.insets.top === b.insets.top &&
  a.insets.right === b.insets.right &&
  a.insets.bottom === b.insets.bottom &&
  a.insets.left === b.insets.left &&
  a.frame.x === b.frame.x &&
  a.frame.y === b.frame.y &&
  a.frame.width === b.frame.width &&
  a.frame.height === b.frame.height;
