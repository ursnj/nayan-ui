import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import type { NThemeProps } from '../NTheme';
import type { ComponentThemeValue, NThemeMode } from '../ThemeContext';

/** Palette-only nested themes delegate changes; explicit theme scopes own their preference. */
export function useThemeControl(props: NThemeProps, parent: ComponentThemeValue | null, systemTheme: 'light' | 'dark') {
  const [local, setLocal] = useState<NThemeMode>(props.defaultTheme ?? 'system');
  const persistence = props.persistence;
  const storage = persistence?.storage;
  const key = persistence?.key ?? 'theme';
  const encoding = persistence?.encoding ?? 'string';
  const snapshot = useCallback(() => {
    const raw = storage?.getString(key);
    let value: unknown = raw;
    if (encoding === 'json' && raw !== undefined) {
      try {
        value = JSON.parse(raw);
      } catch {
        return undefined;
      }
    }
    return value === 'light' || value === 'dark' || value === 'system' ? value : undefined;
  }, [storage, key, encoding]);
  const subscribe = useCallback(
    (changed: () => void) =>
      storage?.subscribe((changedKey) => {
        if (!changedKey || changedKey === key) changed();
      }) ?? (() => {}),
    [storage, key]
  );
  const saved = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const owns = !parent || props.theme != null || props.defaultTheme !== undefined || props.onThemeChange !== undefined || persistence !== undefined;
  const theme = props.theme ?? (owns ? (persistence ? (saved ?? props.defaultTheme ?? 'system') : local) : (parent?.theme ?? 'system'));
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  const current = useRef({ props, parent, owns, theme, resolvedTheme, systemTheme });
  current.current = { props, parent, owns, theme, resolvedTheme, systemTheme };
  const setTheme = useCallback((next: NThemeMode) => {
    if (next !== 'light' && next !== 'dark' && next !== 'system') return;
    const state = current.current;
    if (!state.owns) return state.parent?.setTheme?.(next);
    if (next === state.theme) return;
    const persistence = state.props.persistence;
    if (persistence) persistence.storage.set(persistence.key ?? 'theme', persistence.encoding === 'json' ? JSON.stringify(next) : next);
    if (state.props.theme == null) {
      state.theme = next;
      state.resolvedTheme = next === 'system' ? state.systemTheme : next;
      setLocal(next);
    }
    state.props.onThemeChange?.(next);
  }, []);
  const toggleTheme = useCallback(() => {
    const state = current.current;
    if (!state.owns) return state.parent?.toggleTheme?.();
    setTheme(state.resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [setTheme]);
  return { theme, resolvedTheme, setTheme, toggleTheme };
}

const serverSnapshot = () => undefined;
