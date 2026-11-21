/** A CSS variable's colour as #rrggbb, the only form Monaco themes accept (not #fff, rgb() or oklch()). */
const resolveColor = (cssVar: string): string => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  if (!raw) return '#888888';
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!context) return '#888888';
  context.fillStyle = raw;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((value) => (value ?? 0).toString(16).padStart(2, '0')).join('')}`;
};

export const buildTheme = (isDark: boolean) => {
  const surface = resolveColor('--surface');
  const defaultColor = resolveColor('--default');
  const muted = resolveColor('--muted');
  const foreground = resolveColor('--foreground');
  const accent = resolveColor('--accent');

  return {
    base: (isDark ? 'vs-dark' : 'vs') as 'vs-dark' | 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: muted.replace('#', '') },
      { token: 'string', foreground: accent.replace('#', '') }
    ],
    colors: {
      'editor.background': surface,
      'editor.foreground': foreground,
      'editor.lineHighlightBackground': defaultColor,
      'editor.selectionBackground': `${accent}33`,
      'editor.inactiveSelectionBackground': `${accent}1a`,
      'editorLineNumber.foreground': muted,
      'editorLineNumber.activeForeground': foreground,
      'editorCursor.foreground': accent,
      'editorWidget.background': surface,
      'editorWidget.border': defaultColor,
      'editorSuggestWidget.background': surface,
      'editorSuggestWidget.border': defaultColor,
      'editorSuggestWidget.selectedBackground': defaultColor,
      'input.background': surface,
      'input.border': defaultColor,
      'input.foreground': foreground,
      'scrollbarSlider.background': `${muted}40`,
      'scrollbarSlider.hoverBackground': `${muted}60`,
      'scrollbarSlider.activeBackground': `${muted}80`
    }
  };
};

export const THEME_NAME = 'nayan-theme';
