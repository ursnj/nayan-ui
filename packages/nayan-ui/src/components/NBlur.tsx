'use client';

import type { RefObject } from 'react';
import { BlurHost } from './BlurHost';
import { NView, type NViewNativeRef } from './NView';
import type { ComponentProps, ComponentStyle } from './types';
import { useComponentRenderer } from './useComponentRenderer';

export interface NBlurProps extends ComponentProps {
  /** Blur strength from 0 to 100. Defaults to 50. */
  intensity?: number;
  /** Blur radius in logical points; overrides intensity (100 = 20 points). */
  radius?: number;
  tint?: 'default' | 'light' | 'dark';
  /** UIKit backdrop material. Other platforms use the configured radius and tint. */
  material?: 'regular' | 'ultraThin';
  /** Optional Android source view. Pass a ref to an NView with collapsable={false} inside NPlatformView. */
  blurTarget?: RefObject<NViewNativeRef | null>;
  /** Disable the effect while keeping children visible. */
  enabled?: boolean;
}

function flatten(style: ComponentProps['style']): ComponentStyle {
  return Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style && typeof style === 'object' ? (style as ComponentStyle) : {};
}

/** One blur API: Rust GPU panels inside ComponentsRoot, platform backdrops around native/browser content. */
export function NBlur({ intensity = 50, radius, tint = 'default', material, enabled = true, blurTarget, style, ...props }: NBlurProps) {
  const rendering = useComponentRenderer('NBlur', true);
  const requested = radius ?? Math.min(100, Math.max(0, intensity)) * 0.2;
  const blur = enabled && Number.isFinite(requested) ? Math.min(64, Math.max(0, requested)) : 0;
  const resolvedTint = blur > 0 ? tint : 'default';
  if (rendering) {
    return (
      <NView
        {...props}
        style={{
          ...(resolvedTint === 'dark' ? { backgroundColor: '#00000033' } : resolvedTint === 'light' ? { backgroundColor: '#ffffff33' } : {}),
          ...flatten(style),
          backdropFilter: `blur(${blur}px)`
        }}
      />
    );
  }
  return <BlurHost {...props} style={style} radius={blur} tint={resolvedTint} material={material} blurTarget={blurTarget} enabled={enabled} />;
}
