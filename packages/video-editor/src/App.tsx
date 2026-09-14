import { useEffect, useState } from 'react';
import { NTheme, THEMES, showToast, useLocalStorage } from '@nayan-ui/react';
import { ExportDialog } from './components/ExportDialog';
import { Inspector } from './components/Inspector';
import { MediaPanel } from './components/MediaPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { TopBar } from './components/TopBar';
import { Timeline } from './components/timeline/Timeline';
import { seekTo, stepFrames, togglePlayback } from './engine/playerInstance';
import { readEditorState, timelineDurationUs } from './store/editor';

/** WebCodecs is the whole premise, so say so plainly rather than failing oddly. */
const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;

function App() {
  // useLocalStorage widens to `T | undefined` for the SSR case; the editor is
  // browser-only, so fall back to the dark theme an NLE is normally used in.
  const [storedTheme, setTheme] = useLocalStorage('THEME', THEMES.DARK);
  const theme = storedTheme ?? THEMES.DARK;
  const [exportOpen, setExportOpen] = useState(false);

  useKeyboardShortcuts(() => setExportOpen(true));

  useEffect(() => {
    if (!hasWebCodecs) {
      showToast('This browser has no WebCodecs support. Try a recent Chrome, Edge or Safari.', 'Unsupported browser');
    }
  }, []);

  return (
    <NTheme theme={theme} className="h-screen">
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <TopBar
          theme={theme}
          onToggleTheme={() => setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
          onExport={() => setExportOpen(true)}
        />

        <div className="flex min-h-0 flex-1">
          <MediaPanel />
          <PreviewPanel />
          <Inspector />
        </div>

        <Timeline />
      </div>

      <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} />
    </NTheme>
  );
}

/**
 * Editor-wide shortcuts. They're skipped whenever focus is in a text field so
 * typing a caption can't trigger playback or delete the clip being edited.
 */
const useKeyboardShortcuts = (openExport: () => void) => {
  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const state = readEditorState();
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }
      if (modifier && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        if (state.selectedClipId) state.duplicateClip(state.selectedClipId);
        return;
      }
      if (modifier && event.key.toLowerCase() === 'e') {
        event.preventDefault();
        openExport();
        return;
      }
      if (modifier) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          void togglePlayback();
          break;
        case 's':
          event.preventDefault();
          state.splitAtPlayhead();
          break;
        case 'Delete':
        case 'Backspace':
          if (!state.selectedClipId) return;
          event.preventDefault();
          state.deleteClip(state.selectedClipId);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          stepFrames(event.shiftKey ? -10 : -1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          stepFrames(event.shiftKey ? 10 : 1);
          break;
        case 'Home':
          event.preventDefault();
          seekTo(0);
          break;
        case 'End':
          event.preventDefault();
          seekTo(timelineDurationUs(state.clips));
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
  }, [openExport]);
};

export default App;
