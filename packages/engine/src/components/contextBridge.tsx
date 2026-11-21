import { type Context, createElement, type ReactNode, use, useMemo, useRef } from 'react';
import { themeContexts } from './theme/contexts';

// React contexts are invariant; the bridge erases their types only while transporting values.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NThemeContext = Context<any>;
interface ContextValue {
  context: NThemeContext;
  value: unknown;
}

/** Capture at each surface boundary so providers between NTheme and the surface stay authoritative. */
export function useContextValues(contexts: readonly NThemeContext[]) {
  const previous = useRef<readonly ContextValue[]>([]);
  const values = contexts.map((context) => ({ context, value: use(context) }));
  if (
    values.length !== previous.current.length ||
    values.some((entry, index) => entry.context !== previous.current[index]?.context || !Object.is(entry.value, previous.current[index]?.value))
  )
    previous.current = values;
  return previous.current;
}

export function ContextBridge({ values, children }: { values: readonly ContextValue[]; children?: ReactNode }) {
  return values.reduceRight((content, { context, value }) => createElement(context.Provider, { value }, content), children);
}

/** Renderer-local state/attachment contexts deliberately stay with their owning surface. */
export function useSurfaceContextValues(additional?: readonly NThemeContext[]) {
  const contexts = useMemo(() => [...new Set<NThemeContext>([...themeContexts, ...(additional ?? [])])], [additional]);
  return useContextValues(contexts);
}
