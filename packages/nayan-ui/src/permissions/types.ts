export const permissionNames = [
  'camera',
  'microphone',
  'notifications',
  'location',
  'location-coarse',
  'location-background',
  'photos',
  'photos-add',
  'videos',
  'media-audio',
  'media-location',
  'storage-read',
  'storage-write',
  'contacts',
  'contacts-write',
  'calendars',
  'calendars-write',
  'reminders',
  'bluetooth',
  'bluetooth-scan',
  'bluetooth-advertise',
  'nearby-wifi',
  'local-network',
  'motion',
  'body-sensors',
  'body-sensors-background',
  'speech-recognition',
  'tracking',
  'music-library',
  'homekit',
  'siri',
  'phone',
  'call-phone',
  'call-log',
  'read-sms',
  'receive-sms',
  'send-sms',
  'overlay',
  'write-settings',
  'exact-alarms',
  'all-files-access',
  'install-packages',
  'notification-listener',
  'do-not-disturb',
  'usage-access',
  'battery-optimization',
  'clipboard-read',
  'clipboard-write',
  'persistent-storage'
] as const;

/** Android manifest permission, including permissions declared by the host or a vendor. */
export type AndroidPermission = `android:${string}`;
export type Permission = (typeof permissionNames)[number] | AndroidPermission;

export type PermissionStatus = 'granted' | 'limited' | 'prompt' | 'denied' | 'unknown' | 'unavailable';

export interface PermissionResult {
  status: PermissionStatus;
  /** Whether the platform can display a permission prompt. Null means it could not tell. */
  canAskAgain: boolean | null;
  /** Opening a system settings screen is required for this kind of access. */
  requiresSettings?: true;
}
