'use client';

import { useContext } from 'react';
import type { RefObject } from 'react';
import { BlurHost, BlurTargetHost, type NBlurTargetProps, type NBlurTargetRef } from './BlurHost';
import { NView } from './NView';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps, ComponentStyle } from './types';

export interface NBlurProps extends ComponentProps {
  /** Blur strength from 0 to 100. Defaults to 50. */
  intensity?: number;
  /** Blur radius in logical points; overrides intensity (100 = 20 points). */
  radius?: number;
  tint?: 'default' | 'light' | 'dark';
  /** Android source, outside this blur's foreground. Ignored by iOS and the browser. */
  blurTarget?: RefObject<NBlurTargetRef | null>;
  /** Disable the effect while keeping children visible. */
  enabled?: boolean;
}

function flatten(style: ComponentProps['style']): ComponentStyle {
  return Array.isArray(style) ? Object.assign({}, ...style.map(flatten)) : style && typeof style === 'object' ? (style as ComponentStyle) : {};
}

/** One blur API: Rust GPU panels inside ComponentsRoot, platform backdrops around native/browser content. */
export function NBlur({ intensity = 50, radius, tint = 'default', enabled = true, blurTarget, style, ...props }: NBlurProps) {
  const rendering = useContext(ComponentRenderContext);
  const requested = radius ?? Math.min(100, Math.max(0, intensity)) * 0.2;
  const blur = enabled && Number.isFinite(requested) ? Math.min(64, Math.max(0, requested)) : 0;
  const material = blur > 0 ? tint : 'default';
  if (rendering) {
    return (
      <NView
        {...props}
        style={{
          ...(material === 'dark' ? { backgroundColor: '#00000033' } : material === 'light' ? { backgroundColor: '#ffffff33' } : {}),
          ...flatten(style),
          backdropFilter: `blur(${blur}px)`
        }}
      />
    );
  }
  return <BlurHost {...props} style={style} radius={blur} tint={material} blurTarget={blurTarget} enabled={enabled} />;
}

/** A non-collapsing platform container that Android can sample without capturing its overlay. */
export const NBlurTarget = BlurTargetHost;
export type { NBlurTargetProps, NBlurTargetRef };
