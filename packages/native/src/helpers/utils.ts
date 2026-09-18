import { cn } from 'heroui-native';

export { cn };

export enum THEMES {
  light = 'light',
  dark = 'dark',
  system = 'system'
}

/**
 * Shared scrim/backdrop style for modal surfaces (dialogs, bottom sheets) so the
 * overlay dimming is consistent across the library. Defined once at module scope
 * to avoid re-creating the style object on every render.
 */
export const OVERLAY_STYLE = { backgroundColor: 'rgba(0, 0, 0, 0.5)' } as const;
