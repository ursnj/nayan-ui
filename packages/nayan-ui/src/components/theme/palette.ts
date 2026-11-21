import type { ComponentThemeColors } from '../types';
import type { NThemePalette } from './types';

/** CamelCase palette colors feed the same semantic tokens as explicit colors/themes props. */
export function paletteColors(palette?: Partial<NThemePalette>): ComponentThemeColors {
  return Object.fromEntries(
    Object.entries(palette ?? {})
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value])
  );
}

export function resolvedPalette(palette: Partial<NThemePalette> | undefined, colors: ComponentThemeColors): NThemePalette {
  return {
    ...palette,
    ...Object.fromEntries(
      Object.entries(colors).map(([key, value]) => [key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), value])
    )
  };
}
