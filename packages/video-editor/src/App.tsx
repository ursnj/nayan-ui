import { useCallback, useEffect, useState } from 'react';
import { NTheme, THEMES, showToast, useLocalStorage } from '@nayan-ui/react';
import { ExportDialog } from './components/ExportDialog';
import { Inspector } from './components/inspector/Inspector';
import { LeftRail } from './components/panels/LeftRail';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { ShortcutsDialog } from './components/shell/ShortcutsDialog';
import { SmallScreenNotice } from './components/shell/SmallScreenNotice';
import { SplitPane } from './components/shell/SplitPane';
import { TopBar } from './components/shell/TopBar';
import { Timeline } from './components/timeline/Timeline';
import { useCommand, useShortcuts } from './lib/shortcuts';
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
/*
 * Defaults for everything the editor remembers between visits.
 *
 * Named rather than inlined at the `useLocalStorage` call, so the reset in
 * Project settings restores the same values the editor first opened with
 * instead of a second set that can quietly drift from them.
 */
const DEFAULT_LIBRARY_WIDTH = 360;
const DEFAULT_INSPECTOR_WIDTH = 300;
const DEFAULT_TIMELINE_HEIGHT = 240;

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

  const [libraryWidth, setLibraryWidth] = useLocalStorage('EDITOR_LIBRARY_W', DEFAULT_LIBRARY_WIDTH);
  const [inspectorWidth, setInspectorWidth] = useLocalStorage('EDITOR_INSPECTOR_W', DEFAULT_INSPECTOR_WIDTH);
  const [timelineHeight, setTimelineHeight] = useLocalStorage('EDITOR_TIMELINE_H', DEFAULT_TIMELINE_HEIGHT);
  const hasRoom = useHasRoom();
  const [helpOpen, setHelpOpen] = useState(false);

  useShortcuts();
  useCommand(
    'export',
    useCallback(() => setExportOpen(true), [])
  );
  useCommand(
    'help',
    useCallback(() => setHelpOpen(open => !open), [])
  );

  /*
   * Writes the defaults back rather than clearing the keys: these values are
   * React state as well as stored strings, so removing them would leave the
   * running layout untouched until a reload.
   */
  const resetPreferences = useCallback(() => {
    setLibraryWidth(DEFAULT_LIBRARY_WIDTH);
    setInspectorWidth(DEFAULT_INSPECTOR_WIDTH);
    setTimelineHeight(DEFAULT_TIMELINE_HEIGHT);
    setTheme(THEMES.DARK);
    showToast('Panel sizes and theme are back to how the editor ships.', 'Layout reset');
  }, [setInspectorWidth, setLibraryWidth, setTheme, setTimelineHeight]);

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
          onShowShortcuts={() => setHelpOpen(true)}
          onResetPreferences={resetPreferences}
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
      <ShortcutsDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </NTheme>
  );
}

export default App;
