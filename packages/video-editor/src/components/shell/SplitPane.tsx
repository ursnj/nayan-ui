import { useCallback, useEffect, useRef, useState } from 'react';
import { clamp, cn } from '../../lib/utils';

interface SplitPaneProps {
  /** `vertical` splits top/bottom; `horizontal` splits left/right. */
  direction: 'horizontal' | 'vertical';
  /** Size of the first pane in px. */
  size: number;
  min: number;
  max: number;
  onResize: (size: number) => void;
  /** Which side the handle sizes — `end` means the *second* pane is measured. */
  anchor?: 'start' | 'end';
  children: [React.ReactNode, React.ReactNode];
  className?: string;
}

/**
 * Two panes with a draggable divider.
 *
 * The divider writes straight to the DOM during a drag and only pushes the
 * final value into React state on release, so resizing a panel doesn't
 * re-render the timeline or restart the preview on every pointer move.
 */
export const SplitPane = ({ direction, size, min, max, onResize, anchor = 'start', children, className }: SplitPaneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const horizontal = direction === 'horizontal';

  const measuredRef = anchor === 'start' ? firstRef : secondRef;

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      setDragging(true);

      const container = containerRef.current;
      const pane = measuredRef.current;
      if (!container || !pane) return;

      const rect = container.getBoundingClientRect();
      let latest = size;

      const move = (moveEvent: PointerEvent) => {
        const position = horizontal ? moveEvent.clientX - rect.left : moveEvent.clientY - rect.top;
        const total = horizontal ? rect.width : rect.height;
        latest = clamp(anchor === 'start' ? position : total - position, min, max);
        // Bypass React while dragging — this fires at pointer rate.
        pane.style.flexBasis = `${latest}px`;
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        setDragging(false);
        onResize(latest);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [anchor, horizontal, max, min, measuredRef, onResize, size]
  );

  // Keep the DOM in step when the size changes from outside a drag.
  useEffect(() => {
    const pane = measuredRef.current;
    if (pane && !dragging) pane.style.flexBasis = `${size}px`;
  }, [size, dragging, measuredRef]);

  return (
    <div ref={containerRef} className={cn('flex min-h-0 min-w-0', horizontal ? 'flex-row' : 'flex-col', className)}>
      {/*
        The wrappers are flex columns, not plain blocks: a block wrapper gives
        its child no height to resolve `flex-1` against, so a pane's content
        sizes itself and spills over the divider into the pane below. They
        deliberately don't clip — that would cut off each island's shadow.
      */}
      <div
        ref={firstRef}
        className="flex min-h-0 min-w-0 flex-col"
        style={anchor === 'start' ? { flexBasis: size, flexGrow: 0, flexShrink: 0 } : { flexBasis: 'auto', flexGrow: 1, flexShrink: 1 }}>
        {children[0]}
      </div>

      {/*
        The divider *is* the gutter between two islands, so it needs no line of
        its own — it's a transparent strip that shows a grab pill on hover.
        That also makes it comfortably large to hit, which a 1px rule never is.
      */}
      <div
        role="separator"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-label="Resize panel"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={event => {
          const step = event.shiftKey ? 48 : 12;
          if (horizontal && event.key === 'ArrowLeft') onResize(clamp(size - step, min, max));
          if (horizontal && event.key === 'ArrowRight') onResize(clamp(size + step, min, max));
          if (!horizontal && event.key === 'ArrowUp') onResize(clamp(size - step, min, max));
          if (!horizontal && event.key === 'ArrowDown') onResize(clamp(size + step, min, max));
        }}
        className={cn(
          'group flex shrink-0 items-center justify-center focus-visible:outline-none',
          horizontal ? 'w-2 cursor-col-resize' : 'h-2 cursor-row-resize'
        )}>
        <span
          className={cn(
            'rounded-full transition-colors',
            horizontal ? 'h-10 w-1' : 'h-1 w-10',
            dragging ? 'bg-accent' : 'bg-transparent group-hover:bg-separator group-focus-visible:bg-accent'
          )}
        />
      </div>

      <div
        ref={secondRef}
        className="flex min-h-0 min-w-0 flex-col"
        style={anchor === 'end' ? { flexBasis: size, flexGrow: 0, flexShrink: 0 } : { flexBasis: 'auto', flexGrow: 1, flexShrink: 1 }}>
        {children[1]}
      </div>
    </div>
  );
};
