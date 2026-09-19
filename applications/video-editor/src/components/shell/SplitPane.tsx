import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@nayan-ui/react";
import { clamp } from "../../lib/utils";

/** Width of the divider strip, in px — `w-2` / `h-2` below. */
const GUTTER = 8;

interface SplitPaneProps {
  /** `vertical` splits top/bottom; `horizontal` splits left/right. */
  direction: "horizontal" | "vertical";
  /** Size of the first pane in px. */
  size: number;
  min: number;
  max: number;
  onResize: (size: number) => void;
  /** Which side the handle sizes — `end` means the *second* pane is measured. */
  anchor?: "start" | "end";
  /** Space the other pane must keep; the measured pane never grows past it. */
  minOther?: number;
  children: [React.ReactNode, React.ReactNode];
  className?: string;
}

export const SplitPane = ({
  direction,
  size,
  min,
  max,
  onResize,
  anchor = "start",
  minOther = 0,
  children,
  className,
}: SplitPaneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const secondRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [extent, setExtent] = useState(0);
  const horizontal = direction === "horizontal";

  const measuredRef = anchor === "start" ? firstRef : secondRef;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () => setExtent(horizontal ? element.clientWidth : element.clientHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [horizontal]);

  // Clamped for layout but never written back, so shrinking the window cannot destroy the stored preference.
  const ceiling = extent > 0 ? Math.max(min, extent - GUTTER - minOther) : max;
  const effective = clamp(size, min, Math.min(max, ceiling));

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      setDragging(true);

      const container = containerRef.current;
      const pane = measuredRef.current;
      if (!container || !pane) return;

      const rect = container.getBoundingClientRect();
      let latest = effective;

      const move = (moveEvent: PointerEvent) => {
        const position = horizontal ? moveEvent.clientX - rect.left : moveEvent.clientY - rect.top;
        const total = horizontal ? rect.width : rect.height;
        const limit = Math.min(max, Math.max(min, total - GUTTER - minOther));
        latest = clamp(anchor === "start" ? position : total - position, min, limit);
        // Bypass React while dragging — this fires at pointer rate.
        pane.style.flexBasis = `${latest}px`;
      };

      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        setDragging(false);
        onResize(latest);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [anchor, effective, horizontal, max, min, minOther, measuredRef, onResize],
  );

  // Keep the DOM in step when the size changes from outside a drag.
  useEffect(() => {
    const pane = measuredRef.current;
    if (pane && !dragging) pane.style.flexBasis = `${effective}px`;
  }, [effective, dragging, measuredRef]);

  return (
    <div
      ref={containerRef}
      className={cn("flex min-h-0 min-w-0", horizontal ? "flex-row" : "flex-col", className)}
    >
      <div
        ref={firstRef}
        className="flex min-h-0 min-w-0 flex-col"
        style={
          anchor === "start"
            ? { flexBasis: effective, flexGrow: 0, flexShrink: 0 }
            : { flexBasis: "auto", flexGrow: 1, flexShrink: 1 }
        }
      >
        {children[0]}
      </div>

      <div
        role="separator"
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-label="Resize panel"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={(event) => {
          const wanted = horizontal ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
          if (!wanted.includes(event.key) || event.metaKey || event.ctrlKey || event.altKey) return;
          event.preventDefault();

          const step = event.shiftKey ? 48 : 12;
          const delta = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -step : step;
          onResize(clamp(effective + delta, min, Math.min(max, ceiling)));
        }}
        className={cn(
          "group flex shrink-0 items-center justify-center focus-visible:outline-none",
          horizontal ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize",
        )}
      >
        <span
          className={cn(
            "rounded-full transition-colors",
            horizontal ? "h-10 w-1" : "h-1 w-10",
            dragging
              ? "bg-accent"
              : "bg-transparent group-hover:bg-separator group-focus-visible:bg-accent",
          )}
        />
      </div>

      <div
        ref={secondRef}
        className="flex min-h-0 min-w-0 flex-col"
        style={
          anchor === "end"
            ? { flexBasis: effective, flexGrow: 0, flexShrink: 0 }
            : { flexBasis: "auto", flexGrow: 1, flexShrink: 1 }
        }
      >
        {children[1]}
      </div>
    </div>
  );
};
