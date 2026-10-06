// Render/decode errors can recur on every frame; reporting every occurrence
// would flood the console and crowd out everything else being debugged.
const reported = new Set<string>();

/** Logs `error` to the console the first time this `key` is seen, then stays quiet. */
export const reportOnce = (key: string, error: unknown): void => {
  if (reported.has(key)) return;
  reported.add(key);
  console.error(`[video-editor] ${key}:`, error);
};
