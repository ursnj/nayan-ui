'use client';

import { PREVIEW_STACK } from '@/design/system';
import { useCallback, useState, type ReactNode } from 'react';
import { NText, NView, NTheme, type NThemeProps } from 'nayan-ui/components';
import type { ComponentPreview } from './types';

const controls = {
  NButton: { className: 'min-h-9 rounded-lg px-4 py-0 text-sm font-medium hover:opacity-90' },
  NLink: { className: 'font-medium text-accent' },
  NInput: { className: 'min-h-[38px] rounded-lg px-3 py-1 text-sm' },
  NInputOtp: { className: 'rounded-lg text-sm' },
  NNumberField: { className: 'min-h-9 rounded-lg text-sm' },
  NSearchField: { className: 'min-h-9 rounded-lg text-sm' },
  NTextarea: { className: 'min-h-[58px] rounded-lg text-sm' },
  NSelect: { className: 'min-h-9 rounded-lg text-sm' },
  NButtonGroup: { className: 'min-h-9 rounded-lg px-3 py-1 text-sm font-medium' },
  NCard: { className: 'rounded-lg' },
  NMenuItem: { className: 'rounded-lg px-3 text-sm font-medium' }
} satisfies NThemeProps['components'];

export default function PreviewSurface({
  preview,
  fullWidth,
  keepViewport
}: {
  preview: ComponentPreview;
  fullWidth?: boolean;
  keepViewport?: boolean;
}) {
  const [contentHeight, setContentHeight] = useState<number>();
  const [error, setError] = useState(false);
  const fitPage = !preview.host && !keepViewport && !preview.fillViewport;
  const defaultHeight = keepViewport ? 246 : preview.host ? 'auto' : 200;
  const height = (fitPage ? contentHeight : undefined) ?? preview.height ?? defaultHeight;
  const sizing = preview.fillViewport ? 'h-full min-h-0' : fullWidth ? '' : 'max-w-[52rem]';

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    setContentHeight(Math.ceil(height));
  }, []);

  let content: ReactNode;
  if (preview.host) content = preview.render;
  else if (error)
    content = (
      <NText tag="p" className={`${PREVIEW_STACK} text-sm text-muted`} role="status">
        The engine renderer could not start in this browser.
      </NText>
    );
  else content = preview.render;

  return (
    <NView
      tag="div"
      className={`component-preview-surface relative flex w-full min-w-0 flex-col ${sizing}`}
      style={preview.fillViewport ? undefined : { height }}
    >
      <NTheme
        components={controls}
        radius={8}
        className="gap-4 p-5"
        safeArea={false}
        surface={preview.host || error ? false : { onContentSizeChange: fitPage ? onContentSizeChange : undefined, onError: () => setError(true) }}
      >
        {content}
      </NTheme>
    </NView>
  );
}
