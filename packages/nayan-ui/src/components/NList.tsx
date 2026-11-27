'use client';

import { type ComponentType, createElement, type ReactElement, type ReactNode, type Ref } from 'react';
import { ListBridge } from './ListBridge';
import type { ComponentProps } from './types';

export interface NListRef<T = unknown> {
  readonly itemType?: T;
  scrollToIndex(options: { index: number; viewPosition?: number }): void;
  scrollToOffset(options: { offset: number; animated?: boolean }): void;
  scrollToEnd(): void;
}

export interface NListRenderItemInfo<T> {
  item: T;
  index: number;
}

export interface NListVisibleRange {
  first: number;
  last: number;
}

export interface NListProps<T> extends Pick<ComponentProps, 'id' | 'className' | 'style' | 'width' | 'height' | 'accessibilityLabel' | 'isDisabled'> {
  data?: readonly T[];
  numColumns?: number;
  /** Pack variable-height items independently in each column. Requires a masonry-capable engine build. */
  masonry?: boolean;
  contentContainerClassName?: string;
  contentContainerStyle?: ComponentProps['style'];
  refreshControl?: import('react').ReactElement<{ refreshing?: boolean; onRefresh?: () => void; tintColor?: string }>;
  contentInsetAdjustmentBehavior?: string;
  automaticallyAdjustContentInsets?: boolean;
  scrollsToTop?: boolean;
  renderItem: (info: NListRenderItemInfo<T>) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  /** Exact row height in logical points, including any separator. */
  itemSize?: number;
  /** Rust measures row content when itemSize is omitted. */
  estimatedItemSize?: number;
  variableSize?: boolean;
  fillViewport?: boolean;
  contentKey?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Extra rows mounted on each side of the viewport. Default: 6. */
  overscan?: number;
  showsVerticalScrollIndicator?: boolean;
  initialNumToRender?: number;
  initialScrollIndex?: number;
  extraData?: unknown;
  ListHeaderComponent?: ComponentType | ReactElement | null;
  /** Exact height of the scrolling header in logical points. */
  headerSize?: number;
  StickyHeaderComponent?: ComponentType | ReactElement | null;
  /** Exact height of the header pinned inside the list viewport. */
  stickyHeaderSize?: number;
  ListFooterComponent?: ComponentType | ReactElement | null;
  ListEmptyComponent?: ComponentType | ReactElement | null;
  ItemSeparatorComponent?: ComponentType | ReactElement | null;
  /** Space reserved inside each row for its separator. Default: 1. */
  separatorSize?: number;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
  /** Distance to the end as a fraction of the viewport height. Default: 0.5. */
  onEndReachedThreshold?: number;
  onStickyHeaderChange?: (pinned: boolean) => void;
  onVisibleRangeChange?: (range: NListVisibleRange) => void;
  ref?: Ref<NListRef>;
}

/** Stateless component API. Rust owns scrolling, ranges and notification policy. */
export function NList<T>(props: NListProps<T>) {
  return createElement(ListBridge<T>, props);
}
