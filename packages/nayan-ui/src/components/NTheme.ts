'use client';

import { type ComponentType, createElement, type PropsWithChildren, useContext, useMemo } from 'react';
import type { TextProps } from 'react-native';
import type { ComponentsRootProps } from './ComponentsRoot';
import type { NThemeContext } from './contextBridge';
import { NPage, type NPageProps } from './NPage';
import { NSafeAreaProvider } from './NSafeArea';
import type { NToastHostProps } from './NToastHost';
import { usePlatformColorScheme } from './PlatformHost';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from './safeAreaContext';
import type { SystemBarsNavigation, SystemBarsOptions, ThemeSystemBarsConfiguration } from './systemBarTypes';
import { type NThemeFonts, useThemeFonts } from './theme/fonts';
import { paletteColors, resolvedPalette } from './theme/palette';
import type { NThemeAppearance, NThemePalette, NThemePersistence } from './theme/types';
import { useThemeControl } from './theme/useThemeControl';
import {
  ComponentFallbackContext,
  ComponentRenderContext,
  ComponentThemeContext,
  type ComponentThemeValue,
  type NThemeMode,
  SystemBarsDepthContext as SystemBarsDepth
} from './ThemeContext';
import { ThemeServices } from './ThemeServices';
import { useThemeSystemBars } from './themeSystemBars';
import type { ComponentProps } from './types';

export type { SystemBarsOptions, SystemBarsNavigation } from './systemBarTypes';

function SystemBarsController({ configuration, navigation }: { configuration: ThemeSystemBarsConfiguration; navigation?: SystemBarsNavigation }) {
  useThemeSystemBars(true, configuration, navigation);
  return null;
}

type NThemeSurfaceOptions = Omit<ComponentsRootProps, 'children' | 'stylesheet'> &
  Pick<NPageProps, 'keyboard' | 'showsVerticalScrollIndicator'>;

export interface NThemeProps extends Omit<ComponentProps, 'components'> {
  /** Screen viewport and rendering options. Set false around an existing navigator or platform layout. */
  surface?: false | NThemeSurfaceOptions;
  /** Shared application tokens. CamelCase color names also configure semantic renderer tokens. */
  palette?: Partial<NThemePalette>;
  /** Light/dark application tokens, resolved with the selected preference. */
  palettes?: { light?: Partial<NThemePalette>; dark?: Partial<NThemePalette> };
  /** Persist and observe the preference in engine storage, independently of account state. */
  persistence?: NThemePersistence;
  /** Static defaults or a resolver that updates when the active appearance changes. */
  components?: ComponentProps['components'] | ((appearance: NThemeAppearance) => ComponentProps['components']);
  /** Root UI typefaces, loaded through engine assets. Native navigation may register the same faces with its platform font loader. */
  fonts?: NThemeFonts;
  /** Initial uncontrolled preference. Root themes default to system; nested themes inherit. */
  defaultTheme?: NThemeMode;
  /** Observe changes, or update a controlled `theme` preference in the application store. */
  onThemeChange?: (theme: NThemeMode) => void;
  /** Root themes supply safe-area measurements when no provider already exists. Default: true. */
  safeArea?: boolean;
  /** Root themes manage a lazy toast outlet. Use false for entirely manual hosting. */
  toasts?: boolean | NToastHostProps;
  /** Application contexts to preserve across native/browser engine surfaces and dialogs. */
  contexts?: readonly NThemeContext[];
  /** Root themes manage native system bars automatically; nested themes opt in. */
  systemBars?: boolean | SystemBarsOptions;
  /** Restrict this system-bar scope to its focused screen, including frozen screens. */
  navigation?: SystemBarsNavigation;
  /** Browser CSS rules compiled to the Rust layout backend. */
  stylesheet?: string;
  /** Re-provide app services across the independent Rust UI React renderer. */
  providers?: ComponentType<PropsWithChildren>;
  /** Safe-area values supplied by the host app for modal presentation chrome. */
  presentationInsets?: { top?: number; bottom?: number };
  /** Platform backdrop for dialogs and sheets that opt in with `blurred`. */
  presentationBackground?: ComponentType;
  /** Scoped native text defaults; individual NText props take precedence. */
  textProps?: Pick<TextProps, 'allowFontScaling' | 'maxFontSizeMultiplier' | 'minimumFontScale' | 'adjustsFontSizeToFit'>;
}

/** Render a themed screen, supply a theme to a host layout, or scope it inside an existing screen. */
export function NTheme(props: NThemeProps) {
  const parent = useContext(ComponentThemeContext);
  const rendering = useContext(ComponentRenderContext);
  return parent || rendering
    ? createElement(ThemeScope, { ...props, systemTheme: parent?.systemTheme ?? 'light' })
    : createElement(PlatformTheme, props);
}

function PlatformTheme(props: NThemeProps) {
  const parent = useContext(ComponentThemeContext);
  const systemTheme = usePlatformColorScheme();
  const insets = useContext(SafeAreaInsetsContext);
  const frame = useContext(SafeAreaFrameContext);
  const content = createElement(ThemeScope, { ...props, systemTheme });
  return !parent && props.safeArea !== false && (!insets || !frame) ? createElement(NSafeAreaProvider, null, content) : content;
}

function ThemeScope({ children, systemTheme, surface, ...props }: NThemeProps & { systemTheme: 'light' | 'dark' }) {
  const rendering = useContext(ComponentRenderContext);
  const fallback = useContext(ComponentFallbackContext);
  const parent = useContext(ComponentThemeContext);
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeControl(props, parent, systemTheme);
  const fontData = useThemeFonts(props.fonts, parent?.fontData);
  const depth = useContext(SystemBarsDepth);
  const insets = useContext(SafeAreaInsetsContext);
  const measuredInsets = useMemo(() => (insets ? { top: insets.top, bottom: insets.bottom } : undefined), [insets]);
  const {
    colors,
    themes,
    palette,
    palettes,
    radius,
    components: componentDefaults,
    providers,
    presentationBackground,
    presentationInsets = parent?.presentationInsets ?? measuredInsets,
    stylesheet,
    textProps,
    contexts
  } = props;

  const resolved = useMemo(() => {
    const colorsForAllModes = colors || palette ? { ...parent?.colors, ...paletteColors(palette), ...colors } : parent?.colors;
    const colorsByMode =
      colors || themes || palette || palettes || parent?.themes
        ? {
            light: {
              ...parent?.colors,
              ...parent?.themes?.light,
              ...paletteColors(palette),
              ...paletteColors(palettes?.light),
              ...colors,
              ...themes?.light
            },
            dark: {
              ...parent?.colors,
              ...parent?.themes?.dark,
              ...paletteColors(palette),
              ...paletteColors(palettes?.dark),
              ...colors,
              ...themes?.dark
            }
          }
        : undefined;
    const inheritedPalette = palette ? { ...parent?.palette, ...palette } : parent?.palette;
    const palettesByMode =
      palette || palettes || parent?.palettes
        ? {
            light: { ...parent?.palette, ...parent?.palettes?.light, ...palette, ...palettes?.light },
            dark: { ...parent?.palette, ...parent?.palettes?.dark, ...palette, ...palettes?.dark }
          }
        : undefined;
    const activeColors = { ...colorsForAllModes, ...colorsByMode?.[resolvedTheme] };
    const components =
      typeof componentDefaults === 'function'
        ? componentDefaults({
            theme,
            resolvedTheme,
            systemTheme,
            isDarkMode: resolvedTheme === 'dark',
            colors: activeColors,
            palette: resolvedPalette({ ...inheritedPalette, ...palettesByMode?.[resolvedTheme] }, activeColors)
          })
        : componentDefaults;
    return { colors: colorsForAllModes, themes: colorsByMode, palette: inheritedPalette, palettes: palettesByMode, components };
  }, [parent, colors, themes, palette, palettes, componentDefaults, theme, resolvedTheme, systemTheme]);
  const components = resolved.components;

  const value = useMemo(
    (): ComponentThemeValue => ({
      ...parent,
      ...Object.fromEntries(
        Object.entries({
          theme,
          colors,
          themes,
          radius,
          components,
          providers,
          presentationBackground,
          presentationInsets,
          stylesheet,
          textProps,
          contexts: contexts ? [...new Set([...(parent?.contexts ?? []), ...contexts])] : parent?.contexts
        }).filter(([, value]) => value !== undefined)
      ),
      colors: resolved.colors,
      themes: resolved.themes,
      palette: resolved.palette,
      palettes: resolved.palettes,
      components: components
        ? Object.fromEntries(
            [...new Set([...Object.keys(parent?.components ?? {}), ...Object.keys(components)])].map((kind) => {
              const inherited = parent?.components?.[kind],
                own = components[kind];
              return [
                kind,
                { className: [inherited?.className, own?.className].filter(Boolean).join(' '), style: { ...inherited?.style, ...own?.style } }
              ];
            })
          )
        : parent?.components,
      textProps: textProps ? { ...parent?.textProps, ...textProps } : parent?.textProps,
      fontData,
      systemTheme,
      resolvedTheme,
      setTheme,
      toggleTheme
    }),
    [
      parent,
      theme,
      colors,
      themes,
      resolved,
      radius,
      components,
      providers,
      presentationBackground,
      presentationInsets,
      stylesheet,
      textProps,
      contexts,
      fontData,
      systemTheme,
      resolvedTheme,
      setTheme,
      toggleTheme
    ]
  );

  const managesBars = !rendering && (props.systemBars === true || typeof props.systemBars === 'object' || (!parent && props.systemBars !== false));

  let screen = children;
  if (!rendering && !fallback && surface !== false) {
    const { style: viewportStyle, keyboard, showsVerticalScrollIndicator, ...options } = surface ?? {};
    screen = createElement(NPage, {
      children,
      className: props.className,
      style: props.style,
      safeArea: props.safeArea,
      keyboard,
      showsVerticalScrollIndicator,
      fillViewport: !parent && viewportStyle === undefined,
      viewportStyle,
      surface: options
    });
  }

  const content = rendering
    ? createElement(
        ComponentThemeContext.Provider,
        { value },
        createElement(
          'NTheme',
          {
            ...props,
            theme,
            colors: value.colors,
            themes: value.themes,
            components: value.components,
            palette: undefined,
            palettes: undefined,
            persistence: undefined,
            fonts: undefined,
            defaultTheme: undefined,
            onThemeChange: undefined,
            systemBars: undefined,
            navigation: undefined,
            providers: undefined,
            presentationBackground: undefined,
            presentationInsets: undefined,
            textProps: undefined,
            contexts: undefined,
            safeArea: undefined,
            toasts: undefined
          },
          children
        )
      )
    : createElement(ComponentThemeContext.Provider, { value }, parent ? screen : createElement(ThemeServices, { toasts: props.toasts }, screen));
  return createElement(
    SystemBarsDepth.Provider,
    { value: depth + 1 },
    managesBars
      ? createElement(SystemBarsController, {
          configuration: {
            depth,
            theme: value.theme ?? undefined,
            colors: value.colors,
            themes: value.themes,
            options: typeof props.systemBars === 'object' ? props.systemBars : {}
          },
          navigation: props.navigation
        })
      : null,
    content
  );
}
