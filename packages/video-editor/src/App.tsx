import { useEffect, useState } from 'react';
import { NTheme, THEMES, showToast, useLocalStorage } from '@nayan-ui/react';
import { ExportDialog } from './components/ExportDialog';
import { Inspector } from './components/inspector/Inspector';
import { LeftRail } from './components/panels/LeftRail';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { SmallScreenNotice } from './components/shell/SmallScreenNotice';
import { SplitPane } from './components/shell/SplitPane';
import { TopBar } from './components/shell/TopBar';
import { Timeline } from './components/timeline/Timeline';
import { useHasRoom } from './lib/viewport';

/** WebCodecs is the whole premise, so say so plainly rather than failing oddly. */
const hasWebCodecs = typeof window !== 'undefined' && 'VideoEncoder' in window && 'VideoDecoder' in window;

/*
 * Floors for the three columns and the stage.
 *
 * These are what make the layout survive at `MIN_APP_WIDTH`. Pane sizes are
 * remembered in localStorage and the panes do not shrink, so without a floor
 * a layout dragged wide on a large monitor arrives on a 1024px one with the
 * preview at zero and the inspector clipped off the edge.
 *
 * At 1024px they leave exactly: 432 library + 320 preview + 240 inspector,
 * plus the app padding and two gutters.
 */
const LIBRARY_MIN = 220;
const INSPECTOR_MIN = 240;
const MIN_PREVIEW_WIDTH = 320;
const MIN_STAGE_HEIGHT = 220;
/** Matches the divider in SplitPane. */
const SPLIT_GUTTER = 8;

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
        <SplitPane
          direction="vertical"
          anchor="end"
          size={timelineHeight ?? 300}
          min={160}
          max={620}
          minOther={MIN_STAGE_HEIGHT}
          onResize={setTimelineHeight}
          className="flex-1">
          <SplitPane
            direction="horizontal"
            size={libraryWidth ?? 320}
            min={LIBRARY_MIN}
            max={520}
            // The library must leave room for both panes to its right.
            minOther={INSPECTOR_MIN + SPLIT_GUTTER + MIN_PREVIEW_WIDTH}
            onResize={setLibraryWidth}
            className="h-full">
            <LeftRail />
            <SplitPane
              direction="horizontal"
              anchor="end"
              size={inspectorWidth ?? 300}
              min={INSPECTOR_MIN}
              max={480}
              minOther={MIN_PREVIEW_WIDTH}
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
