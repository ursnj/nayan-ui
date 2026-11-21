'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NText, NView, NPage, NTheme, type NThemeProps } from 'nayan-ui/components';
import { stylesheet } from '@/app/nayan-ui-styles';
import type { ComponentPreview } from './types';

type Themes = NonNullable<NThemeProps['themes']>;
type Color = keyof NonNullable<Themes['light']>;

const themeTokens: readonly Color[] = [
  'background',
  'foreground',
  'surface',
  'surface-foreground',
  'surface-secondary',
  'surface-tertiary',
  'overlay',
  'overlay-foreground',
  'muted',
  'default',
  'default-foreground',
  'accent',
  'accent-foreground',
  'field-background',
  'field-foreground',
  'field-placeholder',
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'danger',
  'danger-foreground',
  'border',
  'separator',
  'focus',
  'link'
];

let siteThemes: Themes | undefined;

function getSiteThemes(): Themes {
  if (siteThemes) return siteThemes;
  // Resolve the same CSS custom properties that paint the home workbench to browser RGB values.
  const probe = document.createElement('span');
  probe.hidden = true;
  document.body.append(probe);
  function colors(mode: 'light' | 'dark') {
    probe.dataset.theme = mode;
    const entries = themeTokens.map((token) => {
      probe.style.color = `var(--${token})`;
      return [token, getComputedStyle(probe).color] as const;
    });
    return Object.fromEntries(entries) as NonNullable<Themes['light']>;
  }
  try {
    siteThemes = { light: colors('light'), dark: colors('dark') };
    return siteThemes;
  } finally {
    probe.remove();
  }
}

const controls = {
  NButton: { className: 'rounded-lg px-3 py-2 text-sm font-semibold hover:opacity-90' },
  NCloseButton: { className: 'rounded-lg bg-transparent text-sm text-muted hover:bg-default' },
  NLink: { className: 'font-medium text-accent' },
  NInput: { className: 'rounded-lg text-sm' },
  NInputOtp: { className: 'rounded-lg text-sm' },
  NNumberField: { className: 'rounded-lg text-sm' },
  NSearchField: { className: 'rounded-lg text-sm' },
  NTextarea: { className: 'rounded-lg text-sm' },
  NSelect: { className: 'rounded-lg text-sm' },
  NTabs: { className: 'rounded-md px-3 py-1 text-sm font-semibold' },
  NButtonGroup: { className: 'rounded-md px-3 py-1 text-sm font-semibold' },
  NDisclosure: { className: 'text-sm font-semibold' },
  NCard: { className: 'rounded-xl' },
  NMenuItem: { className: 'rounded-lg px-3 text-sm font-medium' }
} satisfies NThemeProps['components'];

export default function PreviewSurface({ preview, fullWidth }: { preview: ComponentPreview; fullWidth?: boolean }) {
  const [themes, setThemes] = useState(siteThemes);
  const height = preview.height ?? (preview.host ? 246 : 168);
  const [error, setError] = useState(false);

  useEffect(() => {
    setThemes(getSiteThemes());
  }, []);

  let content: ReactNode;
  if (preview.host) content = preview.render;
  else if (!themes)
    content = (
      <NText tag="p" className="component-host-demo text-sm text-muted" role="status">
        Preparing preview…
      </NText>
    );
  else if (error)
    content = (
      <NText tag="p" className="component-host-demo text-sm text-muted" role="status">
        The engine renderer could not start in this browser.
      </NText>
    );
  else
    content = (
      <NPage className={preview.styled ? 'engine-preview-content flex flex-col gap-4' : 'gap-4 p-5'} onError={() => setError(true)}>
        {preview.render}
      </NPage>
    );

  return (
    <NView
      tag="div"
      className="component-preview-surface relative flex min-w-0 flex-col"
      inert={preview.host && !themes}
      style={{ width: fullWidth ? '100%' : 'min(100%, 36rem)', height: height === 'auto' ? height : `clamp(12.5rem, ${height}px, 100%)` }}
    >
      <NTheme themes={themes} components={controls} radius={10} stylesheet={preview.styled ? stylesheet : undefined}>
        {content}
      </NTheme>
    </NView>
  );
}
