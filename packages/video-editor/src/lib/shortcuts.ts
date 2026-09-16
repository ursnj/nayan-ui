import { useCallback, useEffect, useRef } from 'react';
import { seekTo, stepFrames, togglePlayback } from '../engine/playerInstance';
import { readEditorState, timelineDurationUs } from '../store/editor';
import type { EditorState } from '../store/editor';
import { clipEndUs } from '../types';
import type { Clip } from '../types';

/* ------------------------------------------------------------------ *
 * Commands owned by components
 * ------------------------------------------------------------------ */

/**
 * Actions the keyboard can reach but this module cannot implement: saving
 * bundles media and reports progress from the top bar, zoom-to-fit needs the
 * timeline's own measured viewport, export owns a dialog.
 *
 * A component lends its action here instead of the app threading callbacks
 * down to the key handler, which keeps the whole key map in one file while
 * each action stays where it lives.
 */
export type CommandName = 'save' | 'open' | 'export' | 'zoomFit' | 'help';

const commands = new Map<CommandName, () => void>();

export const useCommand = (name: CommandName, run: () => void) => {
  useEffect(() => {
    commands.set(name, run);
    return () => {
      // Guarded: a remount registers the new handler before the old unmounts.
      if (commands.get(name) === run) commands.delete(name);
    };
  }, [name, run]);
};

const run = (name: CommandName) => commands.get(name)?.();

/* ------------------------------------------------------------------ *
 * Modifiers
 * ------------------------------------------------------------------ */

const isApple = typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.userAgent);

/** ⌘ on Apple hardware, Ctrl everywhere else — never both. */
const mod = (event: KeyboardEvent) => (isApple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey);

/** No modifier at all, so a bare letter can't fire on a browser combination. */
const bare = (event: KeyboardEvent) => !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;

/**
 * Option/Alt combinations are matched on `event.code`.
 *
 * macOS treats Option as a compose modifier: ⌥I is a dead key for a
 * circumflex, so `event.key` arrives as `Dead` or a composed character rather
 * than `i`. The physical key is the only reliable thing to test.
 */
const alt = (event: KeyboardEvent, code: string) => event.altKey && !event.metaKey && !event.ctrlKey && event.code === code;

/** The platform's modifier, for tooltips that name their own shortcut. */
export const MOD_LABEL = isApple ? '⌘' : 'Ctrl';
const ALT_LABEL = isApple ? '⌥' : 'Alt';

const key = (event: KeyboardEvent) => event.key.toLowerCase();

/* ------------------------------------------------------------------ *
 * Edit points
 * ------------------------------------------------------------------ */

/**
 * Every instant a cut could land on: clip edges, plus the top of the timeline.
 *
 * De-duplicated because butt-joined clips share an edge, and a jump that had
 * to be pressed twice to clear a seam would feel broken.
 */
const editPoints = (clips: Clip[]): number[] => {
  const points = new Set<number>([0]);
  for (const clip of clips) {
    points.add(clip.startUs);
    points.add(clipEndUs(clip));
  }
  return [...points].sort((a, b) => a - b);
};

/**
 * Half a frame at 60fps — the slack for "already on this edit point".
 *
 * Without it, a playhead parked a rounding error away from an edge would jump
 * to that same edge instead of moving on to the next one.
 */
const EDIT_POINT_TOLERANCE_US = 8_000;

/** The nearest edit point strictly before (`-1`) or after (`1`) an instant. */
const edgeFrom = (clips: Clip[], fromUs: number, direction: -1 | 1): number | null => {
  const points = editPoints(clips);
  if (direction > 0) return points.find(point => point > fromUs + EDIT_POINT_TOLERANCE_US) ?? null;
  for (let index = points.length - 1; index >= 0; index--) {
    if (points[index] < fromUs - EDIT_POINT_TOLERANCE_US) return points[index];
  }
  return null;
};

/** Frames per shift-step: a whole second, rounded to the project's rate. */
const secondInFrames = (state: EditorState) => Math.max(1, Math.round(state.project.fps));

/**
 * Keys owned by whatever has focus rather than by the app, so they never
 * reach the table above. Listed here so the help dialog can show the whole
 * keyboard in one place instead of only the half that is global.
 */
export const CONTEXTUAL_KEYS: KeyRow[] = [
  { group: 'Selection', keys: '← → ↑ ↓', label: 'Nudge a clip in the frame — selection box over the preview' },
  { group: 'Selection', keys: 'Shift + arrows', label: 'Nudge ten frame pixels at a time' },
  { group: 'Editing', keys: '← →', label: 'Move a clip a frame — clip focused on the timeline' },
  { group: 'Editing', keys: '↑ ↓', label: 'Move a clip to the lane above or below' },
  { group: 'Timeline', keys: '↑ ↓', label: 'Row height — track divider focused' },
  { group: 'Timeline', keys: '← → ↑ ↓', label: 'Pane width or height — panel divider focused' }
];

const isHorizontalArrow = (event: KeyboardEvent) => event.key === 'ArrowLeft' || event.key === 'ArrowRight';
const isDeleteKey = (event: KeyboardEvent) => event.key === 'Delete' || event.key === 'Backspace';

/** `+` arrives as `=` unshifted and `+` shifted; `−` as `-` or `_`. */
const ZOOM_KEYS: Record<string, number | undefined> = { '=': 1, '+': 1, '-': -1, _: -1 };

/* ------------------------------------------------------------------ *
 * The key map
 * ------------------------------------------------------------------ */

export type ShortcutGroup = 'Playback' | 'Selection' | 'Editing' | 'Timeline' | 'Project';

/** One row of the key map, as the help dialog shows it. */
export interface KeyRow {
  group: ShortcutGroup;
  /** Rendered in the help dialog, so it carries the platform's modifier. */
  keys: string;
  label: string;
}

export interface Shortcut extends KeyRow {
  match: (event: KeyboardEvent) => boolean;
  act: (state: EditorState, event: KeyboardEvent) => void;
  /**
   * Fires even while a text field has focus. Only for the few whose meaning
   * can't be confused with editing text — saving a project, not deleting clips.
   */
  inFields?: boolean;
}

/**
 * The editor's whole keyboard surface, in one table.
 *
 * Matchers are exact about modifiers rather than ordered by precedence, so
 * `⌘⇧Z` can never also trigger `⌘Z`, and the first match wins outright.
 *
 * Bare letters are deliberately single-press rather than chorded: this is a
 * tool people keep both hands on, and every letter here is one an NLE user
 * already reaches for.
 */
export const SHORTCUTS: Shortcut[] = [
  /* ---------------- Playback ---------------- */
  {
    group: 'Playback',
    keys: 'Space',
    label: 'Play or pause',
    match: event => bare(event) && (event.key === ' ' || event.code === 'Space'),
    act: () => void togglePlayback()
  },
  {
    group: 'Playback',
    keys: '← →',
    label: 'Step one frame',
    match: event => !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && isHorizontalArrow(event),
    act: (_state, event) => stepFrames(event.key === 'ArrowLeft' ? -1 : 1)
  },
  {
    group: 'Playback',
    keys: 'Shift ← →',
    label: 'Step one second',
    match: event => !event.metaKey && !event.ctrlKey && !event.altKey && event.shiftKey && isHorizontalArrow(event),
    act: (state, event) => stepFrames(event.key === 'ArrowLeft' ? -secondInFrames(state) : secondInFrames(state))
  },
  {
    group: 'Playback',
    keys: '↑ ↓',
    label: 'Previous or next edit point',
    match: event => bare(event) && (event.key === 'ArrowUp' || event.key === 'ArrowDown'),
    act: (state, event) => {
      const target = edgeFrom(state.clips, state.playheadUs, event.key === 'ArrowUp' ? -1 : 1);
      if (target !== null) seekTo(target);
    }
  },
  {
    group: 'Playback',
    keys: 'Home  End',
    label: 'Jump to the start or the end',
    match: event => bare(event) && (event.key === 'Home' || event.key === 'End'),
    act: (state, event) => seekTo(event.key === 'Home' ? 0 : timelineDurationUs(state.clips))
  },
  {
    group: 'Playback',
    keys: 'I  O',
    label: 'Mark in or out at the playhead',
    match: event => bare(event) && (key(event) === 'i' || key(event) === 'o'),
    act: (state, event) => {
      if (key(event) === 'i') state.setInPoint(state.playheadUs);
      else state.setOutPoint(state.playheadUs);
    }
  },
  {
    group: 'Playback',
    keys: 'Shift I  Shift O',
    label: 'Go to the in or out point',
    match: event => event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && (key(event) === 'i' || key(event) === 'o'),
    act: (state, event) => {
      const target = key(event) === 'i' ? state.inPointUs : state.outPointUs;
      if (target !== null) seekTo(target);
    }
  },
  {
    group: 'Playback',
    keys: `${ALT_LABEL} I  ${ALT_LABEL} O`,
    label: 'Clear the in or out point',
    match: event => alt(event, 'KeyI') || alt(event, 'KeyO'),
    act: (state, event) => {
      if (event.code === 'KeyI') state.setInPoint(null);
      else state.setOutPoint(null);
    }
  },
  {
    group: 'Playback',
    keys: `${ALT_LABEL} X`,
    label: 'Clear the whole range',
    match: event => alt(event, 'KeyX'),
    act: state => {
      state.setInPoint(null);
      state.setOutPoint(null);
    }
  },

  /* ---------------- Selection ---------------- */
  {
    group: 'Selection',
    keys: `${MOD_LABEL} A`,
    label: 'Select every clip',
    match: event => mod(event) && !event.shiftKey && key(event) === 'a',
    act: state => state.selectAll()
  },
  {
    group: 'Selection',
    keys: `${MOD_LABEL} ⇧ A  Esc`,
    label: 'Deselect everything',
    match: event => (mod(event) && event.shiftKey && key(event) === 'a') || (bare(event) && event.key === 'Escape'),
    act: state => state.setSelection([])
  },
  {
    group: 'Selection',
    keys: `${MOD_LABEL} G`,
    label: 'Group the selection',
    match: event => mod(event) && !event.shiftKey && key(event) === 'g',
    act: state => state.groupSelection()
  },
  {
    group: 'Selection',
    keys: `${MOD_LABEL} ⇧ G`,
    label: 'Ungroup',
    match: event => mod(event) && event.shiftKey && key(event) === 'g',
    act: state => state.ungroupSelection()
  },

  /* ---------------- Editing ---------------- */
  {
    group: 'Editing',
    keys: `${MOD_LABEL} B  ${MOD_LABEL} K`,
    label: 'Split at the playhead',
    // ⌘B is Final Cut's Blade and Resolve's Split; ⌘K is Premiere's Add Edit.
    // Both are bound because the two camps expect different keys, and a bare
    // `S` — which this used to be — is Premiere's snapping toggle.
    match: event => mod(event) && !event.shiftKey && (key(event) === 'b' || key(event) === 'k'),
    act: state => state.splitAt(state.playheadUs)
  },
  {
    group: 'Editing',
    keys: 'Delete',
    label: 'Delete the selection',
    match: event => bare(event) && isDeleteKey(event),
    act: state => state.deleteSelection()
  },
  {
    group: 'Editing',
    keys: 'Shift Delete',
    label: 'Ripple delete — closes the gap',
    match: event => event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && isDeleteKey(event),
    act: state => state.deleteSelection(true)
  },
  {
    group: 'Editing',
    keys: `${MOD_LABEL} C`,
    label: 'Copy',
    match: event => mod(event) && key(event) === 'c',
    act: state => state.copySelection()
  },
  {
    group: 'Editing',
    keys: `${MOD_LABEL} X`,
    label: 'Cut',
    match: event => mod(event) && key(event) === 'x',
    act: state => state.cutSelection()
  },
  {
    group: 'Editing',
    keys: `${MOD_LABEL} V`,
    label: 'Paste at the playhead',
    match: event => mod(event) && key(event) === 'v',
    act: state => state.paste(state.playheadUs)
  },
  {
    group: 'Editing',
    keys: `${MOD_LABEL} D`,
    label: 'Duplicate',
    match: event => mod(event) && key(event) === 'd',
    act: state => state.duplicateSelection()
  },
  {
    group: 'Editing',
    keys: 'T',
    label: 'Add a text clip',
    match: event => bare(event) && key(event) === 't',
    act: state => void state.addTextClip(undefined, state.playheadUs)
  },
  {
    group: 'Editing',
    keys: `${MOD_LABEL} Z`,
    label: 'Undo',
    match: event => mod(event) && !event.shiftKey && key(event) === 'z',
    act: state => state.undo()
  },
  {
    group: 'Editing',
    keys: `${MOD_LABEL} ⇧ Z`,
    label: 'Redo',
    match: event => (mod(event) && event.shiftKey && key(event) === 'z') || (mod(event) && key(event) === 'y'),
    act: state => state.redo()
  },

  /* ---------------- Timeline ---------------- */
  {
    group: 'Timeline',
    keys: '+  −',
    label: 'Zoom in or out',
    match: event => !event.metaKey && !event.ctrlKey && !event.altKey && ZOOM_KEYS[event.key] !== undefined,
    act: (state, event) => state.setZoom(state.pxPerSec * (ZOOM_KEYS[event.key] === 1 ? 1.4 : 1 / 1.4))
  },
  {
    group: 'Timeline',
    keys: 'Shift Z',
    label: 'Zoom to fit the project',
    // Premiere, Final Cut and Resolve all agree on this one.
    match: event => event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && key(event) === 'z',
    act: () => run('zoomFit')
  },
  {
    group: 'Timeline',
    keys: 'S  N',
    label: 'Toggle snapping',
    // `S` is Premiere's, `N` is Resolve's and Avid's.
    match: event => bare(event) && (key(event) === 's' || key(event) === 'n'),
    act: state => state.toggleSnap()
  },
  {
    group: 'Timeline',
    keys: 'R',
    label: 'Toggle ripple editing',
    match: event => bare(event) && key(event) === 'r',
    act: state => state.toggleRipple()
  },

  /* ---------------- Project ---------------- */
  {
    group: 'Project',
    keys: `${MOD_LABEL} S`,
    label: 'Save the project bundle',
    match: event => mod(event) && !event.shiftKey && key(event) === 's',
    act: () => run('save'),
    inFields: true
  },
  {
    group: 'Project',
    keys: `${MOD_LABEL} O`,
    label: 'Open a project bundle',
    match: event => mod(event) && key(event) === 'o',
    act: () => run('open'),
    inFields: true
  },
  {
    group: 'Project',
    keys: `${MOD_LABEL} E`,
    label: 'Export video',
    match: event => mod(event) && key(event) === 'e',
    act: () => run('export'),
    inFields: true
  },
  {
    group: 'Project',
    keys: '?',
    label: 'Show this list',
    match: event => !event.metaKey && !event.ctrlKey && !event.altKey && event.key === '?',
    act: () => run('help')
  }
];

/* ------------------------------------------------------------------ *
 * The listener
 * ------------------------------------------------------------------ */

/**
 * Input types that are not text entry, so a key press on them isn't typing.
 *
 * A slider is the one that matters: it takes focus as a real
 * `input[type=range]`, and treating it as a field meant that after dragging a
 * value, ⌘Z, ⌘S and Delete all did nothing until focus moved elsewhere. Its
 * own keys are safe regardless — react-aria's `useMove` calls both
 * `preventDefault` and `stopPropagation` on the arrows, and the thumb does the
 * same for Home, End and the page keys, so those never reach this listener.
 */
const NON_TEXT_INPUTS = new Set(['range', 'checkbox', 'radio', 'color', 'button', 'submit', 'reset', 'file', 'image']);

/** Keys typed into a field mean what the field says they mean. */
const isFieldTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
};

/**
 * Space and Enter activate whatever control has focus, so they can't be taken
 * globally: a plain `<button>` fires its click on *keyup*, which a
 * `preventDefault` here would cancel — pressing space on the focused mute
 * button would toggle playback and never mute anything.
 */
const ownsActivationKeys = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest('button, a[href], [role="button"], [role="checkbox"], [role="switch"], [role="separator"]') !== null;

/**
 * Binds the key map for the life of the app.
 *
 * Components that own a key locally — the clip on the timeline, the selection
 * box over the preview, a pane divider — call `preventDefault`, and this bails
 * on an event already handled. React delegates from the root container, which
 * sits below `window` in the propagation path, so their handlers have always
 * run by the time this one sees the event.
 */
export const useShortcuts = () => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if ((event.key === ' ' || event.key === 'Enter') && ownsActivationKeys(event.target)) return;

      const inField = isFieldTarget(event.target);
      const state = readEditorState();

      for (const shortcut of SHORTCUTS) {
        if (inField && !shortcut.inFields) continue;
        if (!shortcut.match(event)) continue;
        // Claimed: no browser default, and no second binding on the same key.
        event.preventDefault();
        shortcut.act(state, event);
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
};

/* ------------------------------------------------------------------ *
 * Held keys
 * ------------------------------------------------------------------ */

/**
 * Brackets a held arrow key as a single undo entry.
 *
 * Key repeat fires a keydown per repeat, and each one commits. Without this a
 * clip nudged across a second of timeline would need fifty undos to put back,
 * so the whole hold is wrapped in one interaction the way a pointer drag is.
 */
export const useHeldInteraction = () => {
  const open = useRef(false);

  const begin = useCallback(() => {
    if (open.current) return;
    open.current = true;
    readEditorState().beginInteraction();
  }, []);

  const end = useCallback(() => {
    if (!open.current) return;
    open.current = false;
    readEditorState().endInteraction();
  }, []);

  // An interaction left open swallows the next edit's undo entry, and a key
  // held while the element unmounts never fires its keyup.
  useEffect(() => end, [end]);

  return { begin, end };
};
