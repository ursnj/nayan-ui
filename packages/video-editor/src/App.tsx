import { useEffect, useMemo, useState } from 'react';
import { NTheme, THEMES, showToast, useLocalStorage } from '@nayan-ui/react';
import { ExportDialog } from './components/ExportDialog';
import { Inspector } from './components/inspector/Inspector';
import { LeftRail } from './components/panels/LeftRail';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { CommandPalette } from './components/shell/CommandPalette';
import type { Command } from './components/shell/CommandPalette';
import { ShortcutsDialog } from './components/shell/ShortcutsDialog';
import { SplitPane } from './components/shell/SplitPane';
import { TopBar } from './components/shell/TopBar';
import { Timeline } from './components/timeline/Timeline';
import { jumpToEdge, seekTo, stepFrames, togglePlayback, totalDurationUs } from './engine/playerInstance';
import { readEditorState, timelineDurationUs } from './store/editor';

/** WebCodecs is the whole premise, so say so plainly rather than failing oddly. */
const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;

function App() {
  // useLocalStorage widens to `T | undefined` for the SSR case; the editor is
  // browser-only, so fall back to the dark theme an NLE is normally used in.
  const [storedTheme, setTheme] = useLocalStorage('THEME', THEMES.DARK);
  const theme = storedTheme ?? THEMES.DARK;

  const [exportOpen, setExportOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [libraryWidth, setLibraryWidth] = useLocalStorage('EDITOR_LIBRARY_W', 320);
  const [inspectorWidth, setInspectorWidth] = useLocalStorage('EDITOR_INSPECTOR_W', 300);
  const [timelineHeight, setTimelineHeight] = useLocalStorage('EDITOR_TIMELINE_H', 300);

  const commands = useEditorCommands({
    openExport: () => setExportOpen(true),
    openShortcuts: () => setShortcutsOpen(true)
  });

  useKeyboardShortcuts({
    openExport: () => setExportOpen(true),
    openShortcuts: () => setShortcutsOpen(true),
    openPalette: () => setPaletteOpen(true)
  });

  useEffect(() => {
    if (!hasWebCodecs) {
      showToast('This browser has no WebCodecs support. Try a recent Chrome, Edge or Safari.', 'Unsupported browser');
    }
  }, []);

  return (
    <NTheme theme={theme} className="h-full">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <TopBar
          theme={theme}
          onToggleTheme={() => setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
          onExport={() => setExportOpen(true)}
          onShowShortcuts={() => setShortcutsOpen(true)}
          onShowCommands={() => setPaletteOpen(true)}
        />

        {/* Stage over timeline, then library / preview / inspector across the stage. */}
        <SplitPane direction="vertical" anchor="end" size={timelineHeight ?? 300} min={160} max={620} onResize={setTimelineHeight} className="flex-1">
          <SplitPane direction="horizontal" size={libraryWidth ?? 320} min={220} max={520} onResize={setLibraryWidth} className="h-full">
            <LeftRail />
            <SplitPane
              direction="horizontal"
              anchor="end"
              size={inspectorWidth ?? 300}
              min={240}
              max={480}
              onResize={setInspectorWidth}
              className="h-full">
              <PreviewPanel />
              <Inspector />
            </SplitPane>
          </SplitPane>

          <Timeline />
        </SplitPane>
      </div>

      <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <ShortcutsDialog isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette isOpen={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </NTheme>
  );
}

/** Everything the palette can run. Reads state lazily so entries never go stale. */
const useEditorCommands = ({ openExport, openShortcuts }: { openExport: () => void; openShortcuts: () => void }): Command[] =>
  useMemo(
    () => [
      { id: 'play', group: 'Playback', label: 'Play / pause', shortcut: 'Space', run: () => void togglePlayback() },
      { id: 'start', group: 'Playback', label: 'Go to start', shortcut: 'Home', run: () => seekTo(0) },
      { id: 'end', group: 'Playback', label: 'Go to end', shortcut: 'End', run: () => seekTo(totalDurationUs()) },
      { id: 'prev-edit', group: 'Playback', label: 'Jump to previous edit', shortcut: '↑', run: () => jumpToEdge(-1) },
      { id: 'next-edit', group: 'Playback', label: 'Jump to next edit', shortcut: '↓', run: () => jumpToEdge(1) },
      {
        id: 'set-in',
        group: 'Playback',
        label: 'Set in point',
        shortcut: 'I',
        run: () => readEditorState().setInPoint(readEditorState().playheadUs)
      },
      {
        id: 'set-out',
        group: 'Playback',
        label: 'Set out point',
        shortcut: 'O',
        run: () => readEditorState().setOutPoint(readEditorState().playheadUs)
      },
      {
        id: 'clear-range',
        group: 'Playback',
        label: 'Clear in and out points',
        shortcut: '⇧X',
        run: () => {
          readEditorState().setInPoint(null);
          readEditorState().setOutPoint(null);
        }
      },

      { id: 'split', group: 'Edit', label: 'Split at playhead', shortcut: 'S', run: () => readEditorState().splitAt(readEditorState().playheadUs) },
      { id: 'duplicate', group: 'Edit', label: 'Duplicate selection', shortcut: '⌘D', run: () => readEditorState().duplicateSelection() },
      { id: 'delete', group: 'Edit', label: 'Delete selection', shortcut: '⌫', run: () => readEditorState().deleteSelection() },
      { id: 'ripple-delete', group: 'Edit', label: 'Ripple delete selection', shortcut: '⇧⌫', run: () => readEditorState().deleteSelection(true) },
      { id: 'copy', group: 'Edit', label: 'Copy', shortcut: '⌘C', run: () => readEditorState().copySelection() },
      { id: 'cut', group: 'Edit', label: 'Cut', shortcut: '⌘X', run: () => readEditorState().cutSelection() },
      { id: 'paste', group: 'Edit', label: 'Paste at playhead', shortcut: '⌘V', run: () => readEditorState().paste() },
      { id: 'select-all', group: 'Edit', label: 'Select all clips', shortcut: '⌘A', run: () => readEditorState().selectAll() },
      { id: 'group', group: 'Edit', label: 'Group selection', shortcut: '⌘G', run: () => readEditorState().groupSelection() },
      { id: 'ungroup', group: 'Edit', label: 'Ungroup selection', shortcut: '⇧⌘G', run: () => readEditorState().ungroupSelection() },
      { id: 'undo', group: 'Edit', label: 'Undo', shortcut: '⌘Z', run: () => readEditorState().undo() },
      { id: 'redo', group: 'Edit', label: 'Redo', shortcut: '⇧⌘Z', run: () => readEditorState().redo() },

      { id: 'add-text', group: 'Insert', label: 'Add text clip', shortcut: 'T', run: () => readEditorState().addTextClip() },
      { id: 'marker', group: 'Insert', label: 'Add marker', shortcut: 'M', run: () => readEditorState().addMarker() },
      { id: 'video-track', group: 'Insert', label: 'Add video track', run: () => readEditorState().addTrack('video') },
      { id: 'audio-track', group: 'Insert', label: 'Add audio track', run: () => readEditorState().addTrack('audio') },

      { id: 'tool-select', group: 'Tools', label: 'Select tool', shortcut: 'V', run: () => readEditorState().setTool('select') },
      { id: 'tool-razor', group: 'Tools', label: 'Razor tool', shortcut: 'C', run: () => readEditorState().setTool('razor') },
      { id: 'snap', group: 'Tools', label: 'Toggle snapping', shortcut: 'N', run: () => readEditorState().toggleSnap() },

      { id: 'zoom-in', group: 'View', label: 'Zoom in', shortcut: '+', run: () => readEditorState().setZoom(readEditorState().pxPerSec * 1.4) },
      { id: 'zoom-out', group: 'View', label: 'Zoom out', shortcut: '−', run: () => readEditorState().setZoom(readEditorState().pxPerSec / 1.4) },
      { id: 'export', group: 'File', label: 'Export video…', shortcut: '⌘E', run: openExport },
      { id: 'new', group: 'File', label: 'New project', run: () => readEditorState().resetProject() },
      { id: 'shortcuts', group: 'Help', label: 'Keyboard shortcuts', shortcut: '?', run: openShortcuts }
    ],
    [openExport, openShortcuts]
  );

/**
 * Editor-wide shortcuts. They're skipped whenever focus is in a text field so
 * typing a caption can't trigger playback or delete the clip being edited.
 */
const useKeyboardShortcuts = ({
  openExport,
  openShortcuts,
  openPalette
}: {
  openExport: () => void;
  openShortcuts: () => void;
  openPalette: () => void;
}) => {
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const state = readEditorState();
      const modifier = event.metaKey || event.ctrlKey;

      // The palette is reachable even while typing; everything else is not.
      if (modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openPalette();
        return;
      }
      if (isTyping(event.target)) return;

      if (modifier) {
        const key = event.key.toLowerCase();
        const handlers: Record<string, () => void> = {
          z: () => (event.shiftKey ? state.redo() : state.undo()),
          d: () => state.duplicateSelection(),
          c: () => state.copySelection(),
          x: () => state.cutSelection(),
          v: () => state.paste(),
          a: () => state.selectAll(),
          g: () => (event.shiftKey ? state.ungroupSelection() : state.groupSelection()),
          e: openExport
        };
        const handler = handlers[key];
        if (handler) {
          event.preventDefault();
          handler();
        }
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          void togglePlayback();
          break;
        case 's':
          event.preventDefault();
          state.splitAt(state.playheadUs);
          break;
        case 'Delete':
        case 'Backspace':
          if (state.selectedClipIds.length === 0) return;
          event.preventDefault();
          state.deleteSelection(event.shiftKey);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          stepFrames(event.shiftKey ? -10 : -1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          stepFrames(event.shiftKey ? 10 : 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          jumpToEdge(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          jumpToEdge(1);
          break;
        case 'Home':
          event.preventDefault();
          seekTo(0);
          break;
        case 'End':
          event.preventDefault();
          seekTo(timelineDurationUs(state.clips));
          break;
        case 'i':
          state.setInPoint(state.playheadUs);
          break;
        case 'o':
          state.setOutPoint(state.playheadUs);
          break;
        case 'X':
          state.setInPoint(null);
          state.setOutPoint(null);
          break;
        case 'v':
          state.setTool('select');
          break;
        case 'c':
          state.setTool('razor');
          break;
        case 'n':
          state.toggleSnap();
          break;
        case 'm':
          state.addMarker();
          break;
        case 't':
          state.addTextClip();
          break;
        case '+':
        case '=':
          state.setZoom(state.pxPerSec * 1.4);
          break;
        case '-':
          state.setZoom(state.pxPerSec / 1.4);
          break;
        case '?':
          openShortcuts();
          break;
        case 'Escape':
          state.selectClip(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openExport, openPalette, openShortcuts]);
};

export default App;
