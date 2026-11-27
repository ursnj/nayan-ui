'use client';

import { Fragment, type PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { ComponentsRoot, type ComponentsRootProps } from './ComponentsRoot';
import { NView } from './NView';
import { PageHost } from './PageHost';
import { SafeAreaInsetsContext } from './safeAreaContext';
import { PageContentInsetsContext, PageContext } from './theme/contexts';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps } from './types';

export interface NPageProps extends PropsWithChildren<Pick<ComponentProps, 'className' | 'style'>> {
  fillViewport?: boolean;
  viewportStyle?: ComponentsRootProps['style'];
  surface?: Omit<ComponentsRootProps, 'children' | 'style' | 'stylesheet'>;
  /** Pause the surface while its screen is inactive. */
  active?: boolean;
  keyboard?: boolean;
  /** Protect the end of the page's scroll content. Defaults to true on native. */
  safeArea?: boolean;
  onError?: (error: Error) => void;
  /** Surface clear color; useful for opaque modal content. */
  background?: string;
  onContentSizeChange?: (width: number, height: number) => void;
  /** Hide the page's root indicator without disabling scrolling. */
  showsVerticalScrollIndicator?: boolean;
}

function PageContent({ children, className, style, safeArea, showsVerticalScrollIndicator }: NPageProps) {
  const insets = useContext(SafeAreaInsetsContext);
  const area = useMemo(() => (safeArea && insets ? { insets, edges: { bottom: 'maximum' as const } } : null), [safeArea, insets]);
  return (
    <PageContentInsetsContext.Provider value={area}>
      <NView className={className} style={style} {...{ pageSafeArea: area, showsVerticalScrollIndicator }}>
        {children}
      </NView>
    </PageContentInsetsContext.Provider>
  );
}

/** A screen surface with a platform keyboard and presentation host. All content is rendered by Rust. */
export function NPage(props: NPageProps) {
  if (useContext(ComponentRenderContext)) return <PageContent {...props} safeArea={props.safeArea ?? true} />;
  return <PageSurface {...props} />;
}

function PageSurface({
  children,
  className = '',
  style,
  fillViewport,
  viewportStyle,
  surface,
  active = true,
  keyboard = false,
  safeArea = true,
  background = 'transparent',
  showsVerticalScrollIndicator,
  onContentSizeChange,
  onError
}: NPageProps) {
  const [portals, setPortals] = useState<ReadonlyMap<string, React.ReactNode>>(() => new Map());

  const portal = useCallback(
    (id: string, element: React.ReactNode) =>
      setPortals((previous) => {
        if (previous.get(id) === element || (!element && !previous.has(id))) return previous;
        const next = new Map(previous);
        if (element) next.set(id, element);
        else next.delete(id);
        return next;
      }),
    []
  );

  const scope = useMemo(() => ({ portal }), [portal]);

  const content = (
    <PageContext.Provider value={scope}>
      <PageContent className={className} style={style} safeArea={safeArea} showsVerticalScrollIndicator={showsVerticalScrollIndicator}>
        {children}
      </PageContent>
    </PageContext.Provider>
  );

  return (
    <PageHost keyboard={keyboard} fillViewport={fillViewport} style={viewportStyle}>
      <ComponentsRoot
        active={active}
        onError={onError}
        onContentSizeChange={onContentSizeChange}
        background={background}
        style={{ flex: 1, minHeight: 0 }}
        {...surface}
      >
        {content}
      </ComponentsRoot>
      {[...portals].map(([id, element]) => (
        <Fragment key={id}>{element}</Fragment>
      ))}
    </PageHost>
  );
}
