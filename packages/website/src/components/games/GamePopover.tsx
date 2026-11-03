"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { GAME_TOOLBAR_BUTTON } from "./GameToolbar";

interface GamePopoverProps {
  title: string;
  icon: ReactNode;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/** A toolbar button with a light-dismiss popover anchored beneath it. */
export default function GamePopover({ title, icon, onOpenChange, children }: GamePopoverProps) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 120, right: 16 });

  const position = useCallback(() => {
    const bounds = trigger.current?.getBoundingClientRect();
    if (!bounds) return;
    const width = Math.min(360, window.innerWidth - 32);
    const maxRight = Math.max(16, window.innerWidth - width - 16);
    setAnchor({
      top: bounds.bottom + 10,
      right: Math.min(maxRight, Math.max(16, window.innerWidth - bounds.right)),
    });
  }, []);

  useEffect(() => {
    position();
    window.addEventListener("resize", position);
    return () => window.removeEventListener("resize", position);
  }, [position]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={title}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        popoverTarget={id}
        title={title}
        className={GAME_TOOLBAR_BUTTON}
      >
        {icon}
      </button>
      <div
        id={id}
        popover="auto"
        role="dialog"
        aria-labelledby={`${id}-title`}
        className="nyn-game-popover rounded-2xl border border-default bg-surface/90 p-5 text-foreground shadow-2xl shadow-black/20 backdrop-blur-xl"
        style={anchor}
        onBeforeToggle={(event) => {
          if (event.newState !== "open") return;
          position();
          setOpen(true);
          onOpenChange(true);
        }}
        onToggle={(event) => {
          const visible = event.newState === "open";
          setOpen(visible);
          onOpenChange(visible);
        }}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-4">
          <h2 id={`${id}-title`} className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-default/60 hover:text-foreground"
            aria-label={`Close ${title.toLowerCase()}`}
            popoverTarget={id}
            popoverTargetAction="hide"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain text-sm leading-relaxed text-muted">
          {children}
        </div>
      </div>
    </>
  );
}
