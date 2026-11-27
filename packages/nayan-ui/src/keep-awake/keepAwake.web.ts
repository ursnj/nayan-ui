const tags = new Set<string>();
let sentinel: WakeLockSentinel | undefined;
let pending: Promise<void> | undefined;
function validate(tag: string) {
  if (typeof tag !== 'string' || !tag || tag.length > 256) throw new TypeError('A keep-awake tag is required');
}
async function acquire() {
  if (!tags.size || document.visibilityState === 'hidden' || sentinel || pending) return pending;
  pending = (async () => {
    const lock = await navigator.wakeLock.request('screen');
    if (!tags.size || document.visibilityState === 'hidden') {
      await lock.release();
      return;
    }
    sentinel = lock;
    lock.addEventListener(
      'release',
      () => {
        if (sentinel === lock) sentinel = undefined;
      },
      { once: true }
    );
  })().finally(() => {
    pending = undefined;
  });
  return pending;
}
function visibility() {
  if (tags.size && document.visibilityState === 'visible') void acquire().catch(() => {});
}
export const keepAwake = {
  isAvailable: () => typeof navigator !== 'undefined' && typeof navigator.wakeLock?.request === 'function',
  async activate(tag = 'default'): Promise<void> {
    validate(tag);
    if (!keepAwake.isAvailable()) throw new Error('Screen wake lock is unavailable in this browser');
    const existed = tags.has(tag);
    if (!tags.size) document.addEventListener('visibilitychange', visibility);
    tags.add(tag);
    try {
      await acquire();
    } catch (error) {
      if (!existed) tags.delete(tag);
      if (!tags.size) document.removeEventListener('visibilitychange', visibility);
      throw error;
    }
  },
  async deactivate(tag = 'default'): Promise<void> {
    validate(tag);
    tags.delete(tag);
    if (!tags.size && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibility);
      const lock = sentinel;
      sentinel = undefined;
      await lock?.release();
    }
  }
};
