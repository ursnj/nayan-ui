import { useEffect, useState } from 'react';
import { NTheme, THEMES, showToast, useLocalStorage } from '@nayan-ui/react';
import { ExportDialog } from './components/ExportDialog';
import { Inspector } from './components/inspector/Inspector';
import { LeftRail } from './components/panels/LeftRail';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { SmallScreenNotice } from './components/shell/SmallScreenNotice';
import { SplitPane } from './components/shell/SplitPane';
import { TopBar } from './components/shell/TopBar';
import { useHasRoom } from './lib/viewport';
import { Timeline } from './components/timeline/Timeline';

/** WebCodecs is the whole premise, so say so plainly rather than failing oddly. */
const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;

function App() {
  // useLocalStorage widens to `T | undefined` for the SSR case; the editor is
  // browser-only, so fall back to the dark theme an NLE is normally used in.
  const [storedTheme, setTheme] = useLocalStorage('THEME', THEMES.DARK);
  const theme = storedTheme ?? THEMES.DARK;

  const [exportOpen, setExportOpen] = useState(false);

  const [libraryWidth, setLibraryWidth] = useLocalStorage('EDITOR_LIBRARY_W', 320);
  const [inspectorWidth, setInspectorWidth] = useLocalStorage('EDITOR_INSPECTOR_W', 300);
  const [timelineHeight, setTimelineHeight] = useLocalStorage('EDITOR_TIMELINE_H', 300);
  const hasRoom = useHasRoom();

  useEffect(() => {
    if (!hasWebCodecs) {
      showToast('This browser has no WebCodecs support. Try a recent Chrome, Edge or Safari.', 'Unsupported browser');
    }
  }, []);

  // After every hook, so the rules of hooks hold on both branches. The store
  // and the media library are module-scoped, so a window dragged narrow and
  // back finds the project exactly as it was.
  if (!hasRoom) {
    return (
      <NTheme theme={theme} className="h-full">
        <SmallScreenNotice />
      </NTheme>
    );
  }

  return (
    <NTheme theme={theme} className="h-full">
      <div className="flex h-screen flex-col gap-2 overflow-hidden bg-background p-2">
        <TopBar
          theme={theme}
          onToggleTheme={() => setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
          onExport={() => setExportOpen(true)}
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
    </NTheme>
  );
}

export default App;
