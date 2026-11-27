'use client';

import { component } from './component';
import type { ComponentProps } from './types';

type ImageSource =
  | number
  | string
  | {
      uri: string;
      headers?: Record<string, string>;
      width?: number;
      height?: number;
      scale?: number;
      cache?: 'default' | 'reload' | 'force-cache' | 'only-if-cached';
    };

/** Supply known pixel dimensions to let Rust choose the smallest adequate remote variant. */
export type NImageSource = ImageSource | readonly ImageSource[];

export interface NImageLoadEvent {
  source: { width: number; height: number; url: string };
  nativeEvent: { source: { width: number; height: number; uri: string } };
}

export interface NImageErrorEvent {
  error: string;
  nativeEvent: { error: string };
}

export interface NImageProps extends Omit<ComponentProps, 'placeholder'> {
  source?: NImageSource;
  src?: string;
  placeholder?: NImageSource;
  fallbackSource?: NImageSource;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'repeat';
  /** Decode near the laid-out size at screen density. Disable for original-resolution pixels. */
  allowDownscaling?: boolean;
  cachePolicy?: 'none' | 'memory' | 'disk' | 'memory-disk';
  /** Prioritize this image once visible. Browser HTML also loads it eagerly at high fetch priority. */
  priority?: boolean;
  /** Change to retry a failed source or reset a recycled view. */
  recyclingKey?: string | number;
  tintColor?: string;
  onLoadStart?: () => void;
  onLoad?: (event: NImageLoadEvent) => void;
  onError?: (event: NImageErrorEvent) => void;
  onLoadEnd?: () => void;
}

export const NImage = /* @__PURE__ */ component<NImageProps>('NImage');
