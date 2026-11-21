import type { ToastState } from './toastService';

const empty: ToastState = { toast: null, ids: [], wakeAfter: null };
let snapshot = empty;
const listeners = new Set<() => void>();

/** A read-only subscription boundary; theme setup never loads native toast transport or a renderer. */
export const toastSnapshot = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => empty,
  publish(value: ToastState) {
    snapshot = value;
    for (const listener of listeners) listener();
  }
};
