import { AppState } from 'react-native';
import NativeEngine from '../native/NativeNayanEngine';
import type { NetworkListener } from './types';

export function observeNetwork(changed: NetworkListener): () => void {
  const engine = NativeEngine;
  if (typeof engine?.networkStart !== 'function' || typeof engine.networkStop !== 'function')
    throw new Error('Engine network monitoring requires a native app rebuild with network support');
  let active = true;
  let generation = 0;
  const start = () => {
    const current = ++generation;
    engine.networkStart((value) => {
      if (active && current === generation) changed(value === 1 ? true : value === 0 ? false : null);
    });
  };
  start();
  // iOS can suspend delivery while backgrounded. Re-observe the current path on return.
  const subscription = AppState.addEventListener('change', (state) => {
    if (active && state === 'active') start();
  });
  return () => {
    if (!active) return;
    active = false;
    generation++;
    subscription.remove();
    engine.networkStop();
  };
}
