import { useCallback, useEffect, useRef, useState } from 'react';

const isWindowDefined = () => typeof window !== 'undefined';
const LOCAL_STORAGE_CHANGE_EVENT = 'nayan-ui:local-storage-change';

interface LocalStorageChangeDetail {
  key: string;
  newValue: string | null;
  source: symbol;
}

export type LocalStorageSerializer<T> = (object: T | undefined) => string;
export type LocalStorageParser<T> = (val: string) => T | undefined;
export type LocalStorageSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

export type UseLocalStorageOptions<T> = Partial<{
  serializer: LocalStorageSerializer<T>;
  parser: LocalStorageParser<T>;
  logger: (error: unknown) => void;
  syncData: boolean;
}>;

// Named export for the hook
export function useLocalStorage<T>(key: string, defaultValue?: T, options?: UseLocalStorageOptions<T>): [T | undefined, LocalStorageSetter<T>] {
  const serializer = options?.serializer ?? (JSON.stringify as LocalStorageSerializer<T>);
  const parser = options?.parser ?? (JSON.parse as LocalStorageParser<T>);
  const logger = options?.logger ?? console.error;
  const syncData = options?.syncData ?? true;

  // Stable refs so event handlers always see the latest values without re-registering
  const serializerRef = useRef(serializer);
  const parserRef = useRef(parser);
  const loggerRef = useRef(logger);
  const defaultValueRef = useRef(defaultValue);
  const keyRef = useRef(key);
  const sourceRef = useRef(Symbol(key));
  serializerRef.current = serializer;
  parserRef.current = parser;
  loggerRef.current = logger;
  defaultValueRef.current = defaultValue;

  // Use the default for SSR and the first client render to avoid hydration
  // mismatches, then reconcile with localStorage in the effect below.
  const [value, setValue] = useState<T | undefined>(defaultValue);
  const valueRef = useRef(value);
  valueRef.current = value;

  const applyStoredValue = useCallback((raw: string | null) => {
    try {
      const nextValue = raw !== null ? parserRef.current(raw) : defaultValueRef.current;
      valueRef.current = nextValue;
      setValue(nextValue);
    } catch (error) {
      loggerRef.current(error);
    }
  }, []);

  useEffect(() => {
    if (!isWindowDefined()) return;
    keyRef.current = key;
    try {
      applyStoredValue(window.localStorage.getItem(key));
    } catch (error) {
      loggerRef.current(error);
      valueRef.current = defaultValueRef.current;
      setValue(defaultValueRef.current);
    }
  }, [applyStoredValue, key]);

  // Keep hook instances synchronized across tabs and within the current document.
  useEffect(() => {
    if (!isWindowDefined() || !syncData) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      applyStoredValue(e.newValue);
    };
    const handleLocalStorageChange = (event: Event) => {
      const detail = (event as CustomEvent<LocalStorageChangeDetail>).detail;
      if (!detail) return;
      const { key: changedKey, newValue, source } = detail;
      if (changedKey !== key || source === sourceRef.current) return;
      applyStoredValue(newValue);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleLocalStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleLocalStorageChange);
    };
  }, [applyStoredValue, key, syncData]);

  // Setter: update state and localStorage
  const setLocalStorageValue = useCallback<LocalStorageSetter<T>>(
    val => {
      const resolved = typeof val === 'function' ? (val as (previous: T | undefined) => T | undefined)(valueRef.current) : val;
      valueRef.current = resolved;
      setValue(resolved);

      if (!isWindowDefined()) return;
      try {
        const serialized = resolved === undefined ? null : serializerRef.current(resolved);
        if (serialized === null) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, serialized);
        }
        window.dispatchEvent(
          new CustomEvent<LocalStorageChangeDetail>(LOCAL_STORAGE_CHANGE_EVENT, {
            detail: { key, newValue: serialized, source: sourceRef.current }
          })
        );
      } catch (error) {
        loggerRef.current(error);
      }
    },
    [key]
  );

  return [value, setLocalStorageValue];
}
