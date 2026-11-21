/** Playtura-only Metro adapter for Expo's development wrapper. */
import { useEffect, useId } from 'react';
import { keepAwake } from './keepAwake';
export const ExpoKeepAwakeTag = 'ExpoKeepAwakeDefaultTag';
export const activateKeepAwakeAsync = (tag = ExpoKeepAwakeTag) => keepAwake.activate(tag);
export const activateKeepAwake = activateKeepAwakeAsync;
export const deactivateKeepAwake = (tag = ExpoKeepAwakeTag) => keepAwake.deactivate(tag);
export const isAvailableAsync = async () => keepAwake.isAvailable();
export function useKeepAwake(tag?: string, _options?: { suppressDeactivateWarnings?: boolean }) {
  const id = useId();
  useEffect(() => {
    const key = `expo:${tag ?? id}`;
    void keepAwake.activate(key).catch(() => {});
    return () => {
      void keepAwake.deactivate(key).catch(() => {});
    };
  }, [tag, id]);
}
