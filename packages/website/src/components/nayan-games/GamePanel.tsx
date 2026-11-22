"use client";

import { NView, NText } from 'nayan-ui/components';
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "@/design/Icons";
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
    <NView tag="dialog"
      ref={dialog}
      className="nyn-game-panel fixed [inset:0_0_0_auto] m-0 [width:min(100%,_460px)] h-dvh max-w-none [max-height:none] p-0 overflow-hidden [border-width:0_0_0_1px] [border-style:solid] [box-shadow:-16px_0_56px_rgb(0_0_0_/_0.2)] open:flex open:flex-col open:animate-game-panel backdrop:[background:rgb(15_23_42_/_0.45)] backdrop:[-webkit-backdrop-filter:blur(2px)] backdrop:[backdrop-filter:blur(2px)] motion-reduce:open:[animation:none] border-default bg-surface/95 text-foreground backdrop-blur-xl"
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
      <NView tag="header" className="nyn-game-panel-header [padding-top:max(1.25rem,_env(safe-area-inset-top))] flex shrink-0 items-start justify-between gap-4 border-b border-default px-5 pb-4 sm:px-6">
        <NView tag="div" className="min-w-0">
          <NText tag="p" className={EYEBROW}>{label}</NText>
          <NText tag="h2" className="mt-1.5 truncate text-xl font-bold tracking-tight text-foreground">
            {title}
          </NText>
        </NView>
        <NView tag="button"
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-default bg-background text-muted transition-colors hover:text-foreground"
          aria-label={`Close ${label.toLowerCase()}`}
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </NView>
      </NView>
      <NView tag="div" className="nyn-game-panel-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 sm:px-6">
        {children}
      </NView>
    </NView>
  );
}
