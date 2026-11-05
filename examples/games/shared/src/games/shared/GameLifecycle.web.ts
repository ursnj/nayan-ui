export const isGameActive = () => document.visibilityState !== 'hidden';
export function subscribeGameActivity(listener: () => void): () => void {
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}
