import { prepareEngine as prepare } from './NativeNayanEngine.web';
let requestedPersistence = false;
export function prepareEngine(): Promise<void> {
  if (!requestedPersistence && typeof navigator !== 'undefined') {
    requestedPersistence = true;
    // Browsers own the permission decision. Do not block game startup on a permission prompt.
    try {
      void navigator.storage?.persist?.().catch(() => {});
    } catch {
      /* Storage can be disabled. */
    }
  }
  return prepare();
}
