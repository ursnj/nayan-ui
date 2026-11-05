import { AppState } from 'react-native';

export const isGameActive = () => AppState.currentState === 'active';
export function subscribeGameActivity(listener: () => void): () => void {
  const subscription = AppState.addEventListener('change', listener);
  return () => subscription.remove();
}
