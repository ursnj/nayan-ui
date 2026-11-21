import { useId, useLayoutEffect, useRef } from 'react';
import { AppState, useColorScheme } from 'react-native';
import NativeEngine from '../native/NativeNayanEngine';
import type { SystemBarsNavigation, ThemeSystemBarsConfiguration } from './systemBarTypes';

export function useThemeSystemBars(enabled: boolean, configuration: ThemeSystemBarsConfiguration, navigation?: SystemBarsNavigation): void {
  const id = useId();
  const systemDark = useColorScheme() === 'dark';
  const supportsWindowTheme = typeof NativeEngine?.systemThemeSet === 'function';
  // Older native apps only accept the original bar schema. Shared games/Kidster can keep
  // running on those builds while Playtura upgrades its window-theme implementation.
  const serialized = JSON.stringify(
    supportsWindowTheme
      ? { ...configuration, systemDark }
      : {
          depth: configuration.depth,
          theme: configuration.theme,
          options: configuration.options,
          systemDark
        }
  );
  const current = useRef(serialized);
  current.current = serialized;
  const scope = useRef<{ update: () => void } | null>(null);

  useLayoutEffect(() => {
    const engine = NativeEngine;
    const set = supportsWindowTheme ? engine?.systemThemeSet : engine?.systemBarsSet;
    if (!enabled || typeof set !== 'function' || !engine || typeof engine.systemBarsRemove !== 'function') return;
    let registered = false;
    let alive = true;
    let focused = navigation?.isFocused() ?? true;
    let last: string | undefined;
    const release = () => {
      if (registered) engine.systemBarsRemove(id);
      registered = false;
      last = undefined;
    };
    const update = (force = false) => {
      if (!alive || !focused) return;
      if (!force && registered && last === current.current) return;
      set.call(engine, id, current.current);
      registered = true;
      last = current.current;
    };
    scope.current = { update };
    const focus = navigation?.addListener('focus', () => {
      focused = true;
      update(true);
    });
    const blur = navigation?.addListener('blur', () => {
      focused = false;
      release();
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') update(true);
    });
    update();
    return () => {
      alive = false;
      focus?.();
      blur?.();
      appState.remove();
      release();
      scope.current = null;
    };
  }, [enabled, id, navigation, supportsWindowTheme]);

  useLayoutEffect(() => {
    scope.current?.update();
  }, [serialized]);
}
