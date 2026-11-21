import {
  type ComponentType,
  createElement,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from 'react';
import type { NToastHostProps } from './NToastHost';
import { ToastHostOwnershipContext } from './theme/contexts';
export { ToastHostOwnershipContext } from './theme/contexts';
import { toastSnapshot } from './toastSnapshot';

/** Manual root hosts suppress only their own theme's automatic outlet. Modal hosts are independent. */
export function useToastHostOwnership() {
  const owner = useContext(ToastHostOwnershipContext);
  useLayoutEffect(() => owner?.register(), [owner]);
}

function AutomaticToasts(props: NToastHostProps) {
  const { toast } = useSyncExternalStore(toastSnapshot.subscribe, toastSnapshot.getSnapshot, toastSnapshot.getServerSnapshot);
  const [Host, setHost] = useState<ComponentType<NToastHostProps> | null>(null);
  useEffect(() => {
    if (!toast || Host) return;
    let alive = true;
    void import('./NToastHost')
      .then((module) => {
        if (alive) setHost(() => module.NToastHost);
      })
      .catch((error) => console.error('NTheme toasts:', error));
    return () => {
      alive = false;
    };
  }, [toast, Host]);
  return Host ? createElement(ToastHostOwnershipContext.Provider, { value: null }, createElement(Host, props)) : null;
}

export function ThemeServices({ children, toasts = true }: PropsWithChildren<{ toasts?: boolean | NToastHostProps }>) {
  const [manualHosts, setManualHosts] = useState(0);
  const register = useCallback(() => {
    setManualHosts((count) => count + 1);
    return () => setManualHosts((count) => count - 1);
  }, []);
  const ownership = useMemo(() => ({ register }), [register]);
  return createElement(
    ToastHostOwnershipContext.Provider,
    { value: ownership },
    children,
    toasts !== false && manualHosts === 0 ? createElement(AutomaticToasts, typeof toasts === 'object' ? toasts : {}) : null
  );
}
