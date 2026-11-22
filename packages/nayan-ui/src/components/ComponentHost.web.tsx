import { reducedMotionQuery } from '../native/reducedMotion.web';
import { type CSSProperties, Fragment, type ReactNode, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { DocumentSurface } from '../native/surface/DocumentSurface.web';
import type { ComponentDocument } from './ComponentDocument';
import { PresentationGestureContext } from './theme/contexts';
import type { ComponentSemantic, ComponentSnapshot } from './types';
import { useKeyboardFields } from './useKeyboardFields';
import { useTextSelection } from './useTextSelection.web';

export type ComponentHostStyle = CSSProperties;

export const selectEventValue = (value: unknown) => value;
export const inputEventValue = (value: string) => ({ target: { value }, currentTarget: { value } });

export function openLink(href: string) {
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) window.location.assign(href);
}

export interface ComponentHostProps {
  active?: boolean;
  document: ComponentDocument;
  snapshot: ComponentSnapshot;
  onSnapshot: (snapshot: ComponentSnapshot) => void;
  style?: ComponentHostStyle;
  onError?: (error: Error) => void;
  overlays?: Readonly<Record<string, ReactNode>>;
  scrollableOverlays?: readonly string[];
}

/** Rust paints layout/chrome; standard browser editors own text editing. */
export function ComponentHost({ active = true, document, snapshot, onSnapshot, style, onError, overlays, scrollableOverlays }: ComponentHostProps) {
  const fields = useKeyboardFields(document, snapshot);
  const openSelects = snapshot.nodes.filter((node) => node.kind === 'NSelect' && node.expanded);
  const openPopups = snapshot.nodes.filter(
    (node) =>
      (node.kind === 'NSelect' && node.expanded) ||
      (node.kind === 'NDatePicker' && snapshot.nodes.some((child) => child.id.startsWith(`${node.id}:`)))
  );
  const popupField = (id: string) => openPopups.some((root) => id.startsWith(`${root.id}:`));
  const semanticId = (id: string) => `nayan-${document.id}-${id}`;
  const { host, mirror, copyEvents, ...textSelection } = useTextSelection(document, snapshot, active);
  const presentation = useContext(PresentationGestureContext);
  useEffect(
    () =>
      presentation?.register(
        () => {
          if (!document.isDisposed) document.cancel();
        },
        (x, y) => {
          if (document.isDisposed || !host.current) return false;
          const rect = host.current.getBoundingClientRect();
          document.setSurfaceOrigin(rect.left, rect.top);
          try {
            return document.canStartSheetDrag(x, y);
          } catch (error) {
            onError?.(error instanceof Error ? error : new Error(String(error)));
            return false;
          }
        }
      ),
    [presentation, document, host, onError]
  );
  const overlayDrag = useRef<{ x: number; y: number; anchorX: number; anchorY: number; captured: boolean } | null>(null);
  const previousSelects = useRef<string[]>([]);

  useLayoutEffect(() => {
    const currentSelects = snapshot.nodes.filter((node) => node.kind === 'NSelect' && node.expanded);
    const closed = previousSelects.current.find((id) => id === snapshot.focused && !currentSelects.some((node) => node.id === id));
    previousSelects.current = currentSelects.map((node) => node.id);
    if (!active || !closed || !host.current) return;
    const focused = window.document.activeElement;
    if (focused !== window.document.body && focused?.tagName !== 'CANVAS') return;
    const trigger = Array.from(host.current.querySelectorAll<HTMLElement>('[data-engine-node]')).find((node) => node.dataset.engineNode === closed);
    trigger?.focus({ preventScroll: true });
  }, [active, snapshot, host]);

  useEffect(
    () => () => {
      if (overlayDrag.current?.captured && !document.isDisposed) document.cancel();
      overlayDrag.current = null;
    },
    [document]
  );

  useEffect(() => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const motion = window.matchMedia(reducedMotionQuery);
    const update = () => {
      if (!document.isDisposed) document.request({ action: 'environment', dark: dark.matches, reducedMotion: motion.matches, platformInputs: true });
    };
    update();
    dark.addEventListener('change', update);
    motion.addEventListener('change', update);
    return () => {
      dark.removeEventListener('change', update);
      motion.removeEventListener('change', update);
    };
  }, [document]);

  return (
    <div
      ref={host}
      {...textSelection}
      tabIndex={0}
      onKeyDown={(event) => {
        const id = event.target instanceof HTMLElement ? event.target.dataset.engineNode : undefined;
        // Ordinary editor arrows, selection and shortcuts belong to the browser, with no WASM hop.
        if (
          event.target instanceof HTMLElement &&
          ['INPUT', 'TEXTAREA'].includes(event.target.tagName) &&
          !openSelects.some((node) => id?.startsWith(`${node.id}:`))
        )
          return;
        if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Escape', ' '].includes(event.key) && document.selectKey(event.key, id)) {
          event.preventDefault();
          return;
        }
        if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
        const delta =
          event.key === 'PageDown'
            ? window.innerHeight * 0.85
            : event.key === 'PageUp'
              ? -window.innerHeight * 0.85
              : event.key === 'ArrowDown'
                ? 48
                : event.key === 'ArrowUp'
                  ? -48
                  : undefined;
        if (delta !== undefined) {
          event.preventDefault();
          document.request({ action: 'pageScroll', delta });
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault();
          document.request({ action: 'pageScroll', offset: event.key === 'Home' ? 0 : 1e9 });
        }
      }}
      style={{ position: 'relative', display: 'flex', flex: 1, minHeight: 200, overflow: 'hidden', cursor: snapshot.cursor ?? 'default', ...style }}
      onPointerMove={(event) => {
        const drag = overlayDrag.current;
        if (drag && event.buttons === 1) {
          const dx = event.clientX - drag.x,
            dy = event.clientY - drag.y;
          if (!drag.captured && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
            drag.captured = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            document.input(0, drag.anchorX, drag.anchorY);
          }
          if (drag.captured) {
            event.preventDefault();
            document.input(1, drag.anchorX + dx, drag.anchorY + dy);
            return;
          }
        }
        if (event.pointerType !== 'mouse' || event.buttons !== 0) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        document.dispatch({ action: 'pointer', x: event.clientX - bounds.left, y: event.clientY - bounds.top });
      }}
      onPointerLeave={() => {
        if (!overlayDrag.current?.captured) document.dispatch({ action: 'pointer', gone: true });
      }}
      onPointerUp={(event) => {
        const drag = overlayDrag.current;
        if (drag?.captured) document.input(2, drag.anchorX + event.clientX - drag.x, drag.anchorY + event.clientY - drag.y);
        overlayDrag.current = null;
      }}
      onPointerCancel={() => {
        if (overlayDrag.current?.captured) document.cancel();
        overlayDrag.current = null;
      }}
    >
      <DocumentSurface
        active={active}
        background="transparent"
        document={document}
        mode="components"
        onError={onError}
        onChange={(update) => {
          if (update.ui) {
            copyEvents(update.ui);
            onSnapshot(update.ui);
          }
        }}
      />
      <span
        ref={mirror}
        aria-hidden="true"
        data-engine-selection
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          whiteSpace: 'pre',
          fontSize: 1,
          lineHeight: '1px',
          userSelect: 'text'
        }}
      />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <style>{'.nayan-platform-input::placeholder{color:var(--nayan-placeholder);opacity:1}'}</style>
        {fields.nodes.map((node) => {
          const [left, top, width, height] = node.rect;
          const select = openSelects.find((root) => node.id.startsWith(`${root.id}:`));
          const style: CSSProperties = { position: 'absolute', left, top, width, height, opacity: 0, margin: 0, padding: 0, pointerEvents: 'none' };
          const focus = () => document.request({ action: 'focus', id: node.id });
          if (['NInput', 'NTextarea', 'NSearchField', 'NInputOtp'].includes(node.kind)) {
            return (
              <BrowserTextField
                key={node.id}
                node={node}
                document={document}
                fields={fields}
                onSnapshot={onSnapshot}
                controls={select ? `${semanticId(select.id)}-listbox` : undefined}
                activeDescendant={select?.activeDescendant ? semanticId(select.activeDescendant) : undefined}
                blocked={Boolean(openPopups.length && !popupField(node.id))}
                popup={popupField(node.id)}
                style={style}
              />
            );
          }
          if (
            [
              'NButton',
              'NPress',
              'NCloseButton',
              'NLink',
              'NMenuItem',
              'NActionItem',
              'NSelect',
              'NDatePicker',
              'NCheck',
              'NSwitch',
              'NToggleButton'
            ].includes(node.kind) ||
            node.id.includes(':option:')
          ) {
            const toggle = ['NCheck', 'NSwitch', 'NToggleButton'].includes(node.kind);
            const radio = node.kind === 'NRadio' || node.kind === 'NRadioGroup';

            return (
              <Fragment key={node.id}>
                <button
                  id={semanticId(node.id)}
                  data-engine-node={node.id}
                  type="button"
                  aria-label={node.label || (node.kind === 'NCloseButton' ? 'Close' : node.kind.slice(1))}
                  role={
                    node.selectOwner
                      ? 'option'
                      : node.kind === 'NSelect'
                        ? 'combobox'
                        : radio
                          ? 'radio'
                          : node.kind === 'NSwitch'
                            ? 'switch'
                            : node.kind === 'NCheck'
                              ? 'checkbox'
                              : node.kind === 'NLink'
                                ? 'link'
                                : undefined
                  }
                  aria-expanded={node.kind === 'NSelect' && !node.selectOwner ? (node.expanded ?? false) : node.expanded}
                  aria-haspopup={node.kind === 'NSelect' && !node.selectOwner ? 'listbox' : undefined}
                  aria-controls={node.kind === 'NSelect' && node.expanded ? `${semanticId(node.id)}-listbox` : undefined}
                  aria-activedescendant={node.activeDescendant ? semanticId(node.activeDescendant) : undefined}
                  aria-selected={radio ? undefined : node.selected}
                  tabIndex={node.selectOwner ? -1 : 0}
                  aria-pressed={node.kind === 'NToggleButton' ? Boolean(node.value) : undefined}
                  aria-checked={radio ? (node.selected ?? false) : toggle && node.kind !== 'NToggleButton' ? Boolean(node.value) : undefined}
                  disabled={node.disabled}
                  style={style}
                  onFocus={focus}
                  onClick={() => document.request({ action: 'activate', id: node.id })}
                >
                  {node.kind === 'NSelect' && !node.selectOwner ? node.valueLabel : null}
                </button>
                {node.kind === 'NSelect' && node.expanded && (
                  <div
                    id={`${semanticId(node.id)}-listbox`}
                    role="listbox"
                    aria-label={node.label}
                    aria-multiselectable={node.multiple}
                    aria-owns={snapshot.nodes
                      .filter((option) => option.selectOwner === node.id)
                      .map((option) => semanticId(option.id))
                      .join(' ')}
                  />
                )}
              </Fragment>
            );
          }
          if (['NSlider', 'NNumberField', 'NCarousel'].includes(node.kind))
            return (
              <input
                key={node.id}
                type="range"
                min={node.min}
                max={node.max}
                step={node.step}
                aria-label={node.label || 'Value'}
                value={Number(node.value) || 0}
                disabled={node.disabled}
                style={style}
                onFocus={focus}
                onKeyDown={(event) => {
                  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
                    event.preventDefault();
                    document.request({ action: 'key', key: event.key, pressed: true, shift: event.shiftKey });
                    document.request({ action: 'key', key: event.key, pressed: false, shift: event.shiftKey });
                  }
                }}
                onChange={(e) => onSnapshot(document.edit(node.id, Number(e.target.value)))}
              />
            );

          return (
            <span
              key={node.id}
              style={style}
              tabIndex={node.kind === 'NList' && !node.disabled ? 0 : undefined}
              onKeyDown={
                node.kind === 'NList'
                  ? (event) => {
                      if (node.disabled) return;
                      if (event.key === 'End') {
                        event.preventDefault();
                        document.request({ action: 'listScroll', id: node.id, kind: 'end' });
                        return;
                      }
                      const value = node.value as { offset: number; viewportHeight: number; itemSize: number; itemCount: number };
                      const offsets: Record<string, number> = {
                        ArrowDown: value.offset + value.itemSize,
                        ArrowUp: value.offset - value.itemSize,
                        PageDown: value.offset + value.viewportHeight,
                        PageUp: value.offset - value.viewportHeight,
                        Home: 0
                      };
                      const offset = offsets[event.key];
                      if (offset === undefined) return;
                      event.preventDefault();
                      document.request({ action: 'listScroll', id: node.id, offset: Math.max(0, offset) });
                    }
                  : undefined
              }
              role={
                node.headingLevel
                  ? 'heading'
                  : node.kind === 'NList'
                    ? 'region'
                    : node.kind === 'NImage'
                      ? node.label
                        ? 'img'
                        : undefined
                      : node.kind === 'NLoading'
                        ? 'status'
                        : node.kind === 'NProgress'
                          ? 'progressbar'
                          : undefined
              }
              aria-label={
                node.kind === 'NProgress' || node.kind === 'NImage' || node.kind === 'NList' || node.kind === 'NLoading' ? node.label : undefined
              }
              aria-level={node.headingLevel}
              aria-busy={node.kind === 'NLoading' ? node.value !== false : undefined}
              aria-hidden={node.kind === 'NImage' && !node.label ? true : undefined}
              aria-valuemin={node.kind === 'NProgress' ? 0 : undefined}
              aria-valuemax={node.kind === 'NProgress' ? 100 : undefined}
              aria-valuenow={node.kind === 'NProgress' ? Number(node.value) : undefined}
            >
              {node.label}
            </span>
          );
        })}
      </div>
      {Object.entries(snapshot.overlays ?? {}).map(([id, [left, top, width, height]]) => {
        if (!overlays?.[id]) return null;
        const [clipLeft, clipTop, clipWidth, clipHeight] = snapshot.overlayClips?.[id] ?? [left, top, width, height];

        return (
          <div
            key={id}
            onPointerDown={
              scrollableOverlays?.includes(id)
                ? (event) => {
                    overlayDrag.current = {
                      x: event.clientX,
                      y: event.clientY,
                      anchorX: clipLeft + clipWidth / 2,
                      anchorY: clipTop + clipHeight / 2,
                      captured: false
                    };
                  }
                : undefined
            }
            onWheel={
              scrollableOverlays?.includes(id)
                ? (event) => {
                    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? clipHeight : 1;
                    document.dispatch({ action: 'pointer', x: clipLeft + clipWidth / 2, y: clipTop + clipHeight / 2 });
                    document.transform(-event.deltaX * unit, -event.deltaY * unit);
                  }
                : undefined
            }
            style={{
              touchAction: scrollableOverlays?.includes(id) ? 'pan-x' : undefined,
              position: 'absolute',
              left: clipLeft,
              top: clipTop,
              width: clipWidth,
              height: clipHeight,
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: left - clipLeft, top: top - clipTop, width, height }}>
              {overlays[id]}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BrowserTextField({
  node,
  document,
  fields,
  onSnapshot,
  controls,
  activeDescendant,
  blocked,
  popup,
  style
}: {
  node: ComponentSemantic;
  document: ComponentDocument;
  fields: ReturnType<typeof useKeyboardFields>;
  onSnapshot: (snapshot: ComponentSnapshot) => void;
  controls?: string;
  activeDescendant?: string;
  blocked: boolean;
  popup: boolean;
  style: CSSProperties;
}) {
  const input = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const initial = useRef(String(node.value ?? '')).current;
  const editor = node.editor;
  const [left, top, width, height] = editor?.rect ?? node.rect;
  const Input = node.multiline ? 'textarea' : 'input';
  const bind = fields.bind;
  useEffect(() => (input.current ? bind(node.id, input.current) : undefined), [bind, node.id, node.multiline]);
  useLayoutEffect(() => {
    if (!node.platformEdit && input.current && input.current.value !== String(node.value ?? '')) input.current.value = String(node.value ?? '');
  }, [node.platformEdit, node.value]);
  useEffect(() => {
    if (blocked) input.current?.blur();
  }, [blocked]);
  return (
    <div style={{ ...style, opacity: blocked ? 0 : 1, overflow: 'hidden' }}>
      <Input
        ref={(element: HTMLInputElement | HTMLTextAreaElement | null) => {
          input.current = element;
        }}
        data-engine-node={node.id}
        className="nayan-platform-input"
        aria-controls={controls}
        aria-activedescendant={activeDescendant}
        aria-label={node.label || 'Text input'}
        aria-hidden={blocked || undefined}
        tabIndex={blocked ? -1 : undefined}
        type={
          node.secret ? 'password' : ['email', 'tel', 'number', 'url', 'search', 'date', 'time'].includes(node.inputType) ? node.inputType : 'text'
        }
        readOnly={node.readOnly}
        disabled={node.disabled}
        defaultValue={initial}
        maxLength={node.maxLength ?? undefined}
        placeholder={editor?.placeholder}
        autoCapitalize={editor?.autoCapitalize}
        autoComplete={editor?.autoComplete}
        autoCorrect={editor?.autoCorrect === undefined ? undefined : editor.autoCorrect ? 'on' : 'off'}
        spellCheck={editor?.autoCorrect}
        autoFocus={editor?.autoFocus && !blocked}
        inputMode={editor?.inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']}
        style={
          {
            ...style,
            left: left - node.rect[0],
            top: top - node.rect[1],
            width,
            height,
            opacity: editor ? 1 : 0,
            pointerEvents: blocked ? 'none' : 'auto',
            color: editor?.color,
            background: 'transparent',
            border: 0,
            outline: 0,
            borderRadius: 0,
            boxSizing: 'border-box',
            resize: 'none',
            fontFamily: 'inherit',
            fontSize: editor?.fontSize ?? 16,
            fontWeight: editor?.fontWeight as CSSProperties['fontWeight'],
            lineHeight: editor ? `${editor.lineHeight}px` : undefined,
            textAlign: editor?.textAlign,
            paddingTop: editor?.padding[0] ?? 0,
            paddingRight: editor?.padding[1] ?? 0,
            paddingBottom: editor?.padding[2] ?? 0,
            paddingLeft: editor?.padding[3] ?? 0,
            '--nayan-placeholder': editor?.placeholderColor
          } as CSSProperties
        }
        onFocus={() => {
          if (!blocked && !node.disabled && !node.readOnly) fields.focus(node.id);
        }}
        onBlur={() => {
          if (!node.disabled && !node.readOnly) fields.blur(node.id);
        }}
        onChange={(event) => {
          if (!document.isDisposed) onSnapshot(document.edit(node.id, event.currentTarget.value, true));
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing && !node.multiline && !popup) {
            event.preventDefault();
            document.dispatch({ action: 'submit', id: node.id });
          }
        }}
      />
    </div>
  );
}
