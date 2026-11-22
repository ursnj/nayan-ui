export const NATIVE_PLATFORMS = ['android', 'ios'] as const;
export const WEB_PLATFORMS = ['web'] as const;
export const ALL_PLATFORMS = [...NATIVE_PLATFORMS, ...WEB_PLATFORMS] as const;

export type ReferencePlatform = (typeof ALL_PLATFORMS)[number];
