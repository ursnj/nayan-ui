'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { NText, NView, NPage, NTheme, type NThemeProps } from 'nayan-ui/components';
import type { ComponentPreview } from './types';

const controls = {
  NButton: { className: 'rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90' },
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

export default function PreviewSurface({
  preview,
  themes,
  fullWidth,
  keepViewport
}: {
  preview: ComponentPreview;
  themes: NonNullable<NThemeProps['themes']>;
  fullWidth?: boolean;
  keepViewport?: boolean;
}) {
  const [contentHeight, setContentHeight] = useState<number>();
  const [error, setError] = useState(false);
  const fitPage = !preview.host && !keepViewport;
  const defaultHeight = keepViewport ? 246 : preview.host ? 'auto' : 200;
  const height = (fitPage ? contentHeight : undefined) ?? preview.height ?? defaultHeight;

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    setContentHeight(Math.ceil(height));
  }, []);

  let content: ReactNode;
  if (preview.host) content = preview.render;
  else if (error)
    content = (
      <NText tag="p" className="component-host-demo text-sm text-muted" role="status">
        The engine renderer could not start in this browser.
      </NText>
    );
  else
    content = (
      // The inline page's padding is independent of the browser's safe area.
      <NPage
        className="gap-4 p-5"
        safeArea={false}
        onContentSizeChange={fitPage ? onContentSizeChange : undefined}
        onError={() => setError(true)}
      >
        {preview.render}
      </NPage>
    );

  return (
    <NView
      tag="div"
      className="component-preview-surface relative flex min-w-0 flex-col"
      style={{ width: fullWidth ? '100%' : 'min(100%, 52rem)', height }}
    >
      <NTheme themes={themes} components={controls} radius={8}>
        {content}
      </NTheme>
    </NView>
  );
}
