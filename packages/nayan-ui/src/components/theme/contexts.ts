import { createContext, type ReactNode } from 'react';
import type { KeyboardStore } from '../keyboardStore';
import type { NDrawerControls } from '../NDrawer';
import type { SafeAreaEdges, SafeAreaFrame, SafeAreaInsets } from '../safeAreaContext';
import type { ComponentThemeValue } from '../ThemeContext';

/** Application scopes owned by NTheme and its semantic children. No platform implementations here. */
export const ComponentThemeContext = /* @__PURE__ */ createContext<ComponentThemeValue | null>(null);
export const SystemBarsDepthContext = /* @__PURE__ */ createContext(0);
export const DrawerContext = /* @__PURE__ */ createContext<NDrawerControls | null>(null);
export const KeyboardContext = /* @__PURE__ */ createContext<KeyboardStore | null>(null);
export const PageContext = /* @__PURE__ */ createContext<{ portal(id: string, element: ReactNode): void } | null>(null);
export const PageContentInsetsContext = /* @__PURE__ */ createContext<{ insets: SafeAreaInsets; edges: SafeAreaEdges } | null>(null);
export const SafeAreaInsetsContext = /* @__PURE__ */ createContext<SafeAreaInsets | null>(null);
export const SafeAreaFrameContext = /* @__PURE__ */ createContext<SafeAreaFrame | null>(null);
export const PresentationGestureContext = /* @__PURE__ */ createContext<{
  register(cancel: () => void, canStart?: (x: number, y: number) => boolean | Promise<boolean>): () => void;
} | null>(null);
export const ToastHostOwnershipContext = /* @__PURE__ */ createContext<{ register(): () => void } | null>(null);

/** Rendering targets keep their own renderer, runtime and attachment contexts. */
export const themeContexts = [
  ComponentThemeContext,
  DrawerContext,
  PresentationGestureContext,
  KeyboardContext,
  PageContext,
  PageContentInsetsContext,
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
  SystemBarsDepthContext,
  ToastHostOwnershipContext
] as const;
