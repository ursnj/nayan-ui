"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { EYEBROW } from "@/design/system";

interface GamePanelProps {
  title: string;
  label: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex='-1'])";

/**
 * A modal side panel beside the game. Its content is server-rendered and stays in the
 * document while closed, so the game's description and rules remain crawlable.
 */
export default function GamePanel({ title, label, open, onClose, children }: GamePanelProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) {
      element.close();
      return;
    }
    if (!element.open) element.showModal();
    return () => element.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="nyn-game-panel border-default bg-surface/95 text-foreground backdrop-blur-xl"
      aria-label={`${title} ${label}`}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
          (element) => element.getClientRects().length > 0,
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <header className="nyn-game-panel-header flex shrink-0 items-start justify-between gap-4 border-b border-default px-5 pb-4 sm:px-6">
        <div className="min-w-0">
          <p className={EYEBROW}>{label}</p>
          <h2 className="mt-1.5 truncate text-xl font-bold tracking-tight text-foreground">
            {title}
          </h2>
        </div>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-default bg-background text-muted transition-colors hover:text-foreground"
          aria-label={`Close ${label.toLowerCase()}`}
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </header>
      <div className="nyn-game-panel-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-6">
        {children}
      </div>
    </dialog>
  );
}
