'use client';

import { type ReactElement } from 'react';
import { NList } from './NList';
import type { NRefreshControlProps } from './NRefreshControl';
import { NScrollShadow } from './NScrollShadow';
import { NView } from './NView';
import { PageContentInsetsContext } from './theme/contexts';
import type { ComponentProps } from './types';

export interface NScrollViewProps extends ComponentProps {
  horizontal?: boolean;
  contentContainerClassName?: string;
  contentContainerStyle?: ComponentProps['style'];
  showsHorizontalScrollIndicator?: boolean;
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: ReactElement<NRefreshControlProps>;
}

const SINGLE = [0] as const;

export function NScrollView({
  children,
  horizontal = false,
  showsHorizontalScrollIndicator,
  showsVerticalScrollIndicator,
  className = '',
  contentContainerClassName = '',
  style,
  contentContainerStyle,
  refreshControl,
  ...props
}: NScrollViewProps) {
  const classes = `${className} ${contentContainerClassName}`;
  if (horizontal)
    return (
      <PageContentInsetsContext.Provider value={null}>
        <NScrollShadow {...props} orientation="horizontal" showsScrollIndicator={showsHorizontalScrollIndicator} className={className} style={style}>
          <NView className={`flex-row ${contentContainerClassName}`} style={contentContainerStyle}>
            {children}
          </NView>
        </NScrollShadow>
      </PageContentInsetsContext.Provider>
    );
  if (refreshControl)
    return (
      <PageContentInsetsContext.Provider value={null}>
        <NList
          {...{ pageScrollContent: 'item' }}
          data={SINGLE}
          keyExtractor={() => 'content'}
          renderItem={() => (
            <NView {...{ pageScrollContent: true }} className={classes} style={contentContainerStyle ?? style}>
              {children}
            </NView>
          )}
          estimatedItemSize={400}
          fillViewport
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          onRefresh={refreshControl.props.onRefresh}
          refreshing={refreshControl.props.refreshing}
        />
      </PageContentInsetsContext.Provider>
    );

  return (
    <NView {...props} {...{ pageScrollContent: true }} className={classes} style={[style, contentContainerStyle]}>
      <PageContentInsetsContext.Provider value={null}>{children}</PageContentInsetsContext.Provider>
    </NView>
  );
}
