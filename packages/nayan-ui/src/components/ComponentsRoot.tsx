'use client';

import { createElement, type ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { prepareEngine } from '../native/prepare';
import { ComponentDocument } from './ComponentDocument';
import { ComponentHost, type ComponentHostStyle, inputEventValue, openLink, selectEventValue } from './ComponentHost';
import { ContextBridge, useSurfaceContextValues } from './contextBridge';
import { ComponentAttachmentContext } from './NPlatformView';
import { createComponentRenderer } from './reconciler';
import { ComponentFallbackContext, ComponentRenderContext, ComponentThemeContext, PlatformRenderContext } from './ThemeContext';
import type { ComponentSnapshot } from './types';

export interface ComponentsRootProps {
  /** Pause rendering while retaining the surface for later use. */
  active?: boolean;
  /** Reset browser page scrolling when this navigation key changes. */
  scrollKey?: string;
  /** Build-time stylesheet rules, resolved by the browser Rust layout backend. */
  stylesheet?: string;
  /** Preserve server-rendered semantic content while the browser engine warms up. */
  serverFallback?: boolean;
  /** Hold new browser entrances at their starting pose while the host hides the surface. Defaults to true. */
  entrancesReady?: boolean;
  /** Keep the first visible browser viewport settled when replacing already-visible server HTML. */
  settleInitialEntrances?: boolean;
  /** Keep the startup fallback until visible priority images have painted, for up to this many milliseconds. */
  initialImageWaitMs?: number;
  /** Called once per surface after its first rendered UI snapshot. */
  onReady?: () => void;
  onNavigate?: (href: string) => void;
  /** Intrinsic Rust content size, before the surface viewport clips or scrolls it. */
  onContentSizeChange?: (width: number, height: number) => void;
  children: ReactNode;
  style?: ComponentHostStyle;
  /** Surface clear color, independent of the theme background token. */
  background?: string;
  onError?: (error: Error) => void;
  /** Platform image/picker attachments positioned by Rust layout, keyed by node id. */
  overlays?: Readonly<Record<string, ReactNode>>;
  /** Attachments whose vertical drags scroll their engine viewport; native taps stay native. */
  scrollableOverlays?: readonly string[];
}

/** One wgpu surface for layout/chrome, with direct platform editors in its input bounds. */
export function ComponentsRoot(props: ComponentsRootProps) {
  if (useContext(ComponentRenderContext)) return props.children;
  return <ComponentSurface {...props} />;
}

function ComponentSurface({
  active = true,
  scrollKey,
  stylesheet: suppliedStylesheet,
  serverFallback = false,
  entrancesReady = true,
  settleInitialEntrances = false,
  initialImageWaitMs = 0,
  onReady,
  onNavigate,
  onContentSizeChange,
  children,
  style,
  background,
  onError,
  overlays,
  scrollableOverlays
}: ComponentsRootProps) {
  const theme = useContext(ComponentThemeContext);
  const contextValues = useSurfaceContextValues(theme?.contexts);
  const stylesheet = suppliedStylesheet ?? theme?.stylesheet;
  const [attachments, setAttachments] = useState<Readonly<Record<string, ReactNode>>>({});
  const registerAttachment = useCallback(
    (id: string, children: ReactNode | null) =>
      setAttachments((previous) => {
        if (previous[id] === children || (children === null && !(id in previous))) return previous;
        const next = { ...previous };
        if (children === null) delete next[id];
        else next[id] = children;
        return next;
      }),
    []
  );
  const combinedOverlays = useMemo(() => ({ ...overlays, ...attachments }), [overlays, attachments]);

  const content = useMemo(() => {
    const attached = createElement(
      ComponentAttachmentContext.Provider,
      { value: registerAttachment },
      createElement(ContextBridge, { values: contextValues }, children)
    );
    if (!theme) return attached;
    const {
      providers: Providers,
      presentationBackground,
      presentationInsets,
      stylesheet: _stylesheet,
      contexts: _contexts,
      textProps: _textProps,
      resolvedTheme: _resolved,
      systemTheme: _system,
      setTheme: _setTheme,
      toggleTheme: _toggleTheme,
      fonts: _fonts,
      fontData: _fontData,
      defaultTheme: _defaultTheme,
      onThemeChange: _onThemeChange,
      persistence: _persistence,
      palette: _palette,
      palettes: _palettes,
      ...configuration
    } = theme;
    const themed = createElement(
      ComponentThemeContext.Provider,
      { value: theme },
      createElement('NTheme', { ...configuration, className: 'gap-0 p-0' }, attached)
    );
    return Providers ? createElement(Providers, null, themed) : themed;
  }, [theme, children, registerAttachment, contextValues]);

  const [document, setDocument] = useState<ComponentDocument | null>(null);
  const [snapshot, setSnapshot] = useState<ComponentSnapshot>({ revision: 0, nodes: [], events: [] });
  const themedFontDocument = useRef<ComponentDocument | null>(null);
  useEffect(() => {
    const fonts = theme?.fontData;
    if (!document || document.isDisposed || (!fonts && themedFontDocument.current !== document)) return;
    try {
      setSnapshot(document.request(fonts ? { action: 'fonts', ...fonts } : { action: 'resetFonts' }));
      themedFontDocument.current = fonts ? document : null;
    } catch (error) {
      (onError ?? console.error)(error instanceof Error ? error : new Error(String(error)));
    }
  }, [document, theme?.fontData, onError]);
  const [inputRevision, setInputRevision] = useState(0);
  const renderer = useRef<ReturnType<typeof createComponentRenderer> | null>(null);
  const presentedDocument = useRef<ComponentDocument | null>(null);
  const readyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const changeSequences = useRef(new Map<string, number>());
  const current = useRef({ children: content, onError, entrancesReady, settleInitialEntrances });
  current.current = { children: content, onError, entrancesReady, settleInitialEntrances };

  useEffect(() => {
    setDocument(null);
    setSnapshot({ revision: 0, nodes: [], events: [] });
    changeSequences.current.clear();
    let alive = true;
    let owned: ComponentDocument | null = null;
    const fail = (cause: unknown) => {
      if (alive) current.current.onError?.(cause instanceof Error ? cause : new Error(String(cause)));
    };
    const rules = stylesheet
      ? fetch(stylesheet).then((response) => {
          if (!response.ok) throw new Error(`UI styles could not load (${response.status})`);
          return response.json();
        })
      : undefined;
    void Promise.all([prepareEngine(), rules])
      .then(([, rules]) => {
        if (!alive) return;
        owned = new ComponentDocument();
        if (rules) {
          owned.request({ action: 'stylesheet', stylesheet: rules });
          if (!current.current.entrancesReady || current.current.settleInitialEntrances) {
            owned.dispatch({
              action: 'environment',
              entrancesReady: current.current.entrancesReady,
              settleVisibleEntrances: current.current.settleInitialEntrances
            });
          }
        }
        renderer.current = createComponentRenderer(
          (nodes) => {
            if (alive) {
              try {
                owned!.setTree(nodes);
              } catch (error) {
                fail(error);
              }
            }
          },
          fail,
          owned
        );
        renderer.current.render(current.current.children);
        setDocument(owned);
      })
      .catch(fail);
    return () => {
      alive = false;
      clearTimeout(readyTimer.current);
      readyTimer.current = undefined;
      renderer.current?.dispose();
      renderer.current = null;
      if (themedFontDocument.current === owned) themedFontDocument.current = null;
      owned?.dispose();
    };
  }, [stylesheet]);

  useEffect(() => {
    renderer.current?.render(content);
  }, [content, inputRevision]);

  useLayoutEffect(() => {
    if (stylesheet && document && !document.isDisposed) document.dispatch({ action: 'environment', entrancesReady });
  }, [document, stylesheet, entrancesReady]);

  useEffect(() => {
    if (document && !document.isDisposed)
      document.request({ action: 'environment', overlays: Object.keys(combinedOverlays), surfaceBackground: background ?? null });
  }, [document, combinedOverlays, background]);

  useEffect(() => {
    if (!stylesheet || !document || document.isDisposed || typeof window === 'undefined') return;
    const scroll = () => {
      if (!document.isDisposed && window.location?.hash)
        document.request({ action: 'scrollToId', id: decodeURIComponent(window.location.hash.slice(1)) });
    };
    if (scrollKey !== undefined) document.dispatch({ action: 'pageScroll', offset: 0 });
    scroll();
    window.addEventListener('hashchange', scroll);
    return () => window.removeEventListener('hashchange', scroll);
  }, [document, stylesheet, scrollKey]);

  const markReady = useCallback(() => {
    if (!document || document.isDisposed || presentedDocument.current === document) return;
    clearTimeout(readyTimer.current);
    readyTimer.current = undefined;
    presentedDocument.current = document;
    if (stylesheet && settleInitialEntrances) document.dispatch({ action: 'environment', settleVisibleEntrances: false });
    onReady?.();
  }, [document, onReady, settleInitialEntrances, stylesheet]);

  const accept = useCallback(
    (next: ComponentSnapshot) => {
      if (document?.isDisposed) return;
      document?.readResources(next);
      // Reconcile even when a controlled consumer rejects an edit with an unchanged value.
      // This runs after application updates; accepted echoes are discarded by the transport.
      if (next.partial && document?.hasPendingControlledEdit) setInputRevision(next.revision);
      // Native frame events can arrive after a synchronous IME acknowledgement.
      setSnapshot((previous) => {
        if (next.revision < previous.revision) return previous;
        if (!next.partial) return next;
        const updates = new Map(next.nodes.map((node) => [node.id, node]));
        return { ...previous, revision: next.revision, events: next.events, nodes: previous.nodes.map((node) => updates.get(node.id) ?? node) };
      });
      if (!next.partial && document && presentedDocument.current !== document) {
        if (initialImageWaitMs > 0 && next.priorityImagesPending) {
          readyTimer.current ??= setTimeout(markReady, initialImageWaitMs);
        } else {
          markReady();
        }
      }
      const navigate = (href: string) => {
        if (href.startsWith('#')) document?.request({ action: 'scrollToId', id: decodeURIComponent(href.slice(1)) });
        else (onNavigate ?? openLink)(href);
      };
      for (const event of next.events) {
        const eventKey = `${event.id}:${event.type}`;
        if (event.sequence <= (changeSequences.current.get(eventKey) ?? -1)) continue;
        changeSequences.current.set(eventKey, event.sequence);
        const props = renderer.current?.handlers.get(event.id);
        if (!props) {
          const href = (event.value as { href?: string } | undefined)?.href;
          if (event.type === 'press' && href) navigate(href);
          continue;
        }
        const call = (name: string, value?: unknown) => {
          const callback = props[name];
          if (typeof callback === 'function') callback(value);
        };
        if (event.type === 'pressState') {
          call('onPressState', event.value);
        } else if (event.type === 'longPress') {
          call('onLongPress', event.value);
        } else if (event.type === 'submit') {
          call('onSubmit', event.value);
        } else if (event.type === 'visible') {
          call('onVisibleChange', event.value);
        } else if (event.type === 'loadStart' || event.type === 'loadEnd') {
          call(event.type === 'loadStart' ? 'onLoadStart' : 'onLoadEnd');
        } else if (event.type === 'load') {
          const value = event.value as { width: number; height: number; uri: string };
          call('onLoad', { source: { width: value.width, height: value.height, url: value.uri }, nativeEvent: { source: value } });
        } else if (event.type === 'error') {
          const value = event.value as { error: string };
          call('onError', { ...value, nativeEvent: value });
        } else if (event.type === 'press') {
          const link = event.value as { href?: string; text?: string; linkify?: boolean } | undefined;
          if (link?.linkify && link.href) {
            if (typeof props.onPress === 'function') props.onPress(link.href, link.text ?? link.href);
            else navigate(link.href);
            continue;
          }
          const name = ['onPress', 'onAction', 'onClick', 'onClose'].find((key) => typeof props[key] === 'function');
          if (name) call(name, props.__uiKind === 'NPress' ? event.value : undefined);
          else if (typeof props.href === 'string') navigate(props.href);
        } else {
          const kind = props.__uiKind;
          const name = ['onChangeOptions', 'onChange', 'onValueChange', 'onChangeText', 'onSelectedChange'].find(
            (key) => typeof props[key] === 'function'
          );
          if (name) {
            let value = event.value;
            if (name === 'onChange' && (kind === 'NInput' || kind === 'NTextarea')) value = inputEventValue(String(value ?? ''));
            else if (kind === 'NSelect') {
              if (name === 'onValueChange') {
                const key = (option: unknown) => String((option as { value?: unknown } | null)?.value ?? option ?? '');
                value = Array.isArray(value) ? value.map(key) : key(value);
              } else if (name !== 'onChangeOptions') value = selectEventValue(value);
            }
            call(name, value);
          }
        }
      }
    },
    [document, initialImageWaitMs, markReady, onNavigate]
  );

  const contentWidth = snapshot.contentSize?.[0];
  const contentHeight = snapshot.contentSize?.[1];
  useEffect(() => {
    if (contentWidth != null && contentHeight != null && contentHeight > 0) onContentSizeChange?.(contentWidth, contentHeight);
  }, [contentWidth, contentHeight, onContentSizeChange]);

  return document && !document.isDisposed ? (
    <ComponentHost
      active={active}
      document={document}
      snapshot={snapshot}
      onSnapshot={accept}
      style={style}
      onError={onError}
      overlays={combinedOverlays}
      scrollableOverlays={scrollableOverlays}
    />
  ) : serverFallback ? (
    createElement(
      'div',
      { style: { flex: 1, minHeight: 0, overflow: 'auto' }, 'data-engine-fallback': true },
      createElement(
        ComponentFallbackContext.Provider,
        { value: true },
        createElement(PlatformRenderContext.Provider, { value: true }, children)
      )
    )
  ) : null;
}
