import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Utility for SSR-safe window check
declare const window: any;
const isWindowDefined = () => typeof window !== 'undefined';

// Types for serializer, parser, logger, and setter
type Serializer<T> = (object: T | undefined) => string;
type Parser<T> = (val: string) => T | undefined;
type Setter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

type Options<T> = Partial<{
  serializer: Serializer<T>;
  parser: Parser<T>;
  logger: (error: any) => void;
  syncData: boolean;
}>;

// Named export for the hook
export function useLocalStorage<T>(key: string, defaultValue?: T, options?: Options<T>): [T | undefined, Setter<T>] {
  const opts = useMemo(
    () => ({
      serializer: JSON.stringify as Serializer<T>,
      parser: JSON.parse as Parser<T>,
      logger: console.error,
      syncData: true,
      ...options
    }),
    [options]
  );

  const { serializer, parser, logger, syncData } = opts;
  const rawValueRef = useRef<string | null>(null);

  // Initial value from localStorage or default
  const [value, setValue] = useState<T | undefined>(() => {
    if (!isWindowDefined()) return defaultValue;
    try {
      rawValueRef.current = window.localStorage.getItem(key);
      return rawValueRef.current ? parser(rawValueRef.current) : defaultValue;
    } catch (e) {
      logger(e);
      return defaultValue;
    }
  });

  // Cross-tab and in-tab sync
  useEffect(() => {
    if (!isWindowDefined() || !syncData) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        setValue(e.newValue ? parser(e.newValue) : defaultValue);
      } catch (e) {
        logger(e);
      }
    };
    const handleCustom = (e: CustomEvent) => {
      if (e.detail?.key !== key) return;
      try {
        const newRaw = window.localStorage.getItem(key);
        setValue(newRaw ? parser(newRaw) : defaultValue);
      } catch (e) {
        logger(e);
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('local-storage', handleCustom as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('local-storage', handleCustom as EventListener);
    };
  }, [key, parser, logger, syncData, defaultValue]);

  // Setter: always update localStorage immediately and dispatch custom event
  const setLocalStorageValue = useCallback<Setter<T>>(
    val => {
      setValue(prev => {
        const resolved = typeof val === 'function' ? (val as any)(prev) : val;
        if (!isWindowDefined()) return resolved;
        try {
          if (resolved === undefined) {
            window.localStorage.removeItem(key);
          } else {
            const serialized = serializer(resolved);
            window.localStorage.setItem(key, serialized);
            rawValueRef.current = serialized;
          }
          // Dispatch a custom event for in-tab sync
          window.dispatchEvent(new CustomEvent('local-storage', { detail: { key } }));
        } catch (e) {
          logger(e);
        }
        return resolved;
      });
    },
    [key, serializer, logger]
  );

  return [value, setLocalStorageValue];
}
