import { haptics } from '@nayan-ui/engine';

export enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SELECTION = 'selection'
}

/**
 * Play haptic feedback through the engine's native haptics
 * @param type - Type of haptic feedback to play
 * @param hapticEnabled - Whether haptic feedback is enabled in settings
 */
export const playHaptic = (type: HapticType, hapticEnabled: boolean = false): void => {
  if (!hapticEnabled) return;

  try {
    switch (type) {
      case HapticType.LIGHT:
        haptics.impact(0.4, 0.6);
        break;
      case HapticType.MEDIUM:
        haptics.impact(0.7, 0.5);
        break;
      case HapticType.HEAVY:
        haptics.impact(1, 0.3);
        break;
      case HapticType.SUCCESS:
        haptics.notify('success');
        break;
      case HapticType.WARNING:
        haptics.notify('warning');
        break;
      case HapticType.ERROR:
        haptics.notify('error');
        break;
      case HapticType.SELECTION:
        haptics.selection();
        break;
    }
  } catch {
    // Silently ignore synchronous errors
  }
};
