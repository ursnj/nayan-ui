/**
 * Logs each distinct failure once.
 *
 * The render path drops a frame rather than throwing, which is right — a
 * sample invalidated by a concurrent seek should not take the editor down.
 * But it also means a *persistent* fault is indistinguishable from an empty
 * preview: the background is already painted by the time anything throws, so
 * the picture simply never appears and nothing is reported.
 *
 * Logging every occurrence is no better, since a render fault repeats at
 * frame rate and buries the console. So each distinct cause is reported once.
 */
const reported = new Set<string>();

export const reportOnce = (scope: string, error: unknown) => {
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const key = `${scope}:${message}`;
  if (reported.has(key)) return;
  reported.add(key);
  console.error(`[video-editor] ${scope} failed — the preview will be missing layers:`, error);
};
