import { useEffect } from "react";
import { seekTo, stepFrames, togglePlayback } from "../engine/playerInstance";
import { readEditorState, timelineDurationUs, useEditor } from "../store/editor";
import { clipEndUs } from "../types";

const isMac = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? navigator.userAgent ?? "");
};

/** Prefixes a shortcut's key for display — "⌘S" on Mac, "Ctrl+S" elsewhere. */
export const MOD_LABEL = isMac() ? "⌘" : "Ctrl+";

export type ShortcutGroup = "Playback" | "Selection" | "Editing" | "Timeline" | "Project";

export interface KeyRow {
  group: ShortcutGroup;
  keys: string;
  label: string;
}

/** Shortcuts the global handler below implements, for the help dialog. */
export const SHORTCUTS: KeyRow[] = [
  { group: "Playback", keys: "Space", label: "Play / pause" },
  { group: "Playback", keys: "← →", label: "Step one frame" },
  { group: "Playback", keys: "↑ ↓", label: "Jump to the previous / next edit" },
  { group: "Playback", keys: "Home", label: "Go to start" },
  { group: "Playback", keys: "End", label: "Go to end" },
  { group: "Playback", keys: "I", label: "Set in point" },
  { group: "Playback", keys: "O", label: "Set out point" },
  { group: "Selection", keys: `${MOD_LABEL}A`, label: "Select all" },
  { group: "Selection", keys: "Esc", label: "Deselect" },
  { group: "Editing", keys: `${MOD_LABEL}Z`, label: "Undo" },
  { group: "Editing", keys: `${MOD_LABEL}⇧Z`, label: "Redo" },
  { group: "Editing", keys: "Delete", label: "Delete selection" },
  { group: "Editing", keys: `${MOD_LABEL}C`, label: "Copy" },
  { group: "Editing", keys: `${MOD_LABEL}X`, label: "Cut" },
  { group: "Editing", keys: `${MOD_LABEL}V`, label: "Paste" },
  { group: "Editing", keys: `${MOD_LABEL}D`, label: "Duplicate" },
  { group: "Editing", keys: "S", label: "Split at playhead" },
  { group: "Editing", keys: `${MOD_LABEL}G`, label: "Group" },
  { group: "Editing", keys: `${MOD_LABEL}⇧G`, label: "Ungroup" },
  { group: "Timeline", keys: "+ / -", label: "Zoom in / out" },
  { group: "Timeline", keys: "\\", label: "Zoom to fit" },
  { group: "Project", keys: `${MOD_LABEL}S`, label: "Save project" },
  { group: "Project", keys: `${MOD_LABEL}O`, label: "Open project" },
  { group: "Project", keys: `${MOD_LABEL}E`, label: "Export video" },
  { group: "Project", keys: "?", label: "Show this dialog" },
];

/**
 * Behaviours implemented locally by a focused element (ClipView, TrackHeader,
 * TransformOverlay), not by the global handler — documented here so the help
 * dialog stays complete.
 */
export const CONTEXTUAL_KEYS: KeyRow[] = [
  { group: "Timeline", keys: "← →", label: "Focused clip: nudge one frame (⇧ for one second)" },
  { group: "Timeline", keys: "↑ ↓", label: "Focused clip: move to the track above / below" },
  { group: "Timeline", keys: "↑ ↓", label: "Focused track header: resize its row (⇧ for more)" },
  {
    group: "Selection",
    keys: "← → ↑ ↓",
    label: "Clip selected in the preview: nudge position (⇧ for ten pixels)",
  },
];

/* ---------------- command registry ---------------- */

type CommandHandler = () => void;
const commands = new Map<string, CommandHandler>();

/** Registers `handler` under `name` for the lifetime of the calling component. */
export const useCommand = (name: string, handler: CommandHandler): void => {
  useEffect(() => {
    commands.set(name, handler);
    return () => {
      if (commands.get(name) === handler) commands.delete(name);
    };
  }, [name, handler]);
};

const dispatch = (name: string): boolean => {
  const handler = commands.get(name);
  if (!handler) return false;
  handler();
  return true;
};

/* ---------------- held (continuous) interaction ---------------- */

/**
 * Groups a held key's repeated edits (nudging with arrow keys, resizing a
 * track by holding ↑/↓) into one undo step, the same way a mouse drag does.
 */
export const useHeldInteraction = (): { begin: () => void; end: () => void } => {
  const begin = useEditor((state) => state.beginInteraction);
  const end = useEditor((state) => state.endInteraction);
  return { begin, end };
};

/* ---------------- global keyboard shortcuts ---------------- */

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
    return true;
  }
  return target.isContentEditable;
};

/** True while a dialog (export, shortcuts, settings, …) is open, so it keeps its own keys. */
const isDialogOpen = (): boolean =>
  typeof document !== "undefined" && document.querySelector('[role="dialog"]') !== null;

/** The playhead's nearest clip boundary in `direction`, or null if there isn't one. */
const jumpToEdit = (direction: -1 | 1): void => {
  const state = readEditorState();
  const points = new Set<number>([0]);
  for (const clip of state.clips) {
    points.add(clip.startUs);
    points.add(clipEndUs(clip));
  }
  const sorted = [...points].sort((a, b) => a - b);
  const playhead = state.playheadUs;

  let target: number | null = null;
  if (direction === 1) {
    target = sorted.find((point) => point > playhead) ?? null;
  } else {
    for (let index = sorted.length - 1; index >= 0; index--) {
      if (sorted[index] < playhead) {
        target = sorted[index];
        break;
      }
    }
  }
  if (target !== null) seekTo(target);
};

/** Registers the single global keydown listener that drives every shortcut in `SHORTCUTS`. */
export const useShortcuts = (): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // A focused control (text field, slider, a clip claiming its own arrow
      // keys) already handled this, or asked to be left alone.
      if (event.defaultPrevented || isEditableTarget(event.target) || isDialogOpen()) return;

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key;
      const lower = key.length === 1 ? key.toLowerCase() : key;

      // Playback
      if (key === " ") {
        event.preventDefault();
        void togglePlayback();
        return;
      }
      if (key === "ArrowLeft" && !mod) {
        event.preventDefault();
        stepFrames(-1);
        return;
      }
      if (key === "ArrowRight" && !mod) {
        event.preventDefault();
        stepFrames(1);
        return;
      }
      if (key === "ArrowUp" && !mod) {
        event.preventDefault();
        jumpToEdit(-1);
        return;
      }
      if (key === "ArrowDown" && !mod) {
        event.preventDefault();
        jumpToEdit(1);
        return;
      }
      if (key === "Home") {
        event.preventDefault();
        seekTo(0);
        return;
      }
      if (key === "End") {
        event.preventDefault();
        seekTo(timelineDurationUs(readEditorState().clips));
        return;
      }
      if (lower === "i" && !mod) {
        event.preventDefault();
        readEditorState().setInPoint(readEditorState().playheadUs);
        return;
      }
      if (lower === "o" && !mod) {
        event.preventDefault();
        readEditorState().setOutPoint(readEditorState().playheadUs);
        return;
      }

      // Project (checked before the plain-letter editing shortcuts below, since they share letters)
      if (mod && lower === "s") {
        event.preventDefault();
        dispatch("save");
        return;
      }
      if (mod && lower === "o") {
        event.preventDefault();
        dispatch("open");
        return;
      }
      if (mod && lower === "e") {
        event.preventDefault();
        dispatch("export");
        return;
      }
      if (key === "?") {
        event.preventDefault();
        dispatch("help");
        return;
      }

      // Selection
      if (mod && lower === "a") {
        event.preventDefault();
        readEditorState().selectAll();
        return;
      }
      if (key === "Escape") {
        readEditorState().setSelection([]);
        return;
      }

      // Editing
      if (mod && !event.shiftKey && lower === "z") {
        event.preventDefault();
        readEditorState().undo();
        return;
      }
      if (mod && event.shiftKey && lower === "z") {
        event.preventDefault();
        readEditorState().redo();
        return;
      }
      if (key === "Delete" || key === "Backspace") {
        event.preventDefault();
        readEditorState().deleteSelection();
        return;
      }
      if (mod && lower === "c") {
        event.preventDefault();
        readEditorState().copySelection();
        return;
      }
      if (mod && lower === "x") {
        event.preventDefault();
        readEditorState().cutSelection();
        return;
      }
      if (mod && lower === "v") {
        event.preventDefault();
        readEditorState().paste();
        return;
      }
      if (mod && lower === "d") {
        event.preventDefault();
        readEditorState().duplicateSelection();
        return;
      }
      if (!mod && lower === "s") {
        event.preventDefault();
        readEditorState().splitAt(readEditorState().playheadUs);
        return;
      }
      if (mod && !event.shiftKey && lower === "g") {
        event.preventDefault();
        readEditorState().groupSelection();
        return;
      }
      if (mod && event.shiftKey && lower === "g") {
        event.preventDefault();
        readEditorState().ungroupSelection();
        return;
      }

      // Timeline
      if (key === "+" || key === "=") {
        event.preventDefault();
        const state = readEditorState();
        state.setZoom(state.pxPerSec * 1.25);
        return;
      }
      if (key === "-" || key === "_") {
        event.preventDefault();
        const state = readEditorState();
        state.setZoom(state.pxPerSec / 1.25);
        return;
      }
      if (key === "\\") {
        event.preventDefault();
        dispatch("zoomFit");
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
};
