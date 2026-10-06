import { useCallback, useEffect, useState } from "react";
import { NTheme, THEMES, showToast, useLocalStorage } from "@nayan-ui/react";
import { ExportDialog } from "./components/ExportDialog";
import { Inspector } from "./components/inspector/Inspector";
import { LeftRail } from "./components/panels/LeftRail";
import { PreviewPanel } from "./components/preview/PreviewPanel";
import { LeaveGuard } from "./components/shell/LeaveGuard";
import { ShortcutsDialog } from "./components/shell/ShortcutsDialog";
import { SmallScreenNotice } from "./components/shell/SmallScreenNotice";
import { SplitPane } from "./components/shell/SplitPane";
import { TopBar } from "./components/shell/TopBar";
import { Timeline } from "./components/timeline/Timeline";
import { useCommand, useShortcuts } from "./lib/shortcuts";
import { useHasRoom } from "./lib/viewport";

const hasWebCodecs =
  typeof window !== "undefined" && "VideoEncoder" in window && "VideoDecoder" in window;

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
  const [storedTheme, setTheme] = useLocalStorage("THEME", THEMES.DARK);
  const theme = storedTheme ?? THEMES.DARK;

  const [exportOpen, setExportOpen] = useState(false);

  const [libraryWidth, setLibraryWidth] = useLocalStorage(
    "EDITOR_LIBRARY_W",
    DEFAULT_LIBRARY_WIDTH,
  );
  const [inspectorWidth, setInspectorWidth] = useLocalStorage(
    "EDITOR_INSPECTOR_W",
    DEFAULT_INSPECTOR_WIDTH,
  );
  const [timelineHeight, setTimelineHeight] = useLocalStorage(
    "EDITOR_TIMELINE_H",
    DEFAULT_TIMELINE_HEIGHT,
  );
  const hasRoom = useHasRoom();
  const [helpOpen, setHelpOpen] = useState(false);

  useShortcuts();
  useCommand(
    "export",
    useCallback(() => setExportOpen(true), []),
  );
  useCommand(
    "help",
    useCallback(() => setHelpOpen((open) => !open), []),
  );

  const resetPreferences = useCallback(() => {
    setLibraryWidth(DEFAULT_LIBRARY_WIDTH);
    setInspectorWidth(DEFAULT_INSPECTOR_WIDTH);
    setTimelineHeight(DEFAULT_TIMELINE_HEIGHT);
    setTheme(THEMES.DARK);
    showToast("Panel sizes and theme are back to how the editor ships.", "Layout reset");
  }, [setInspectorWidth, setLibraryWidth, setTheme, setTimelineHeight]);

  useEffect(() => {
    if (!hasWebCodecs) {
      showToast(
        "This browser has no WebCodecs support. Try a recent Chrome, Edge or Safari.",
        "Unsupported browser",
      );
    }
  }, []);

  if (!hasRoom) {
    return (
      <NTheme theme={theme} className="h-full">
        <SmallScreenNotice />
        <LeaveGuard />
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

        <SplitPane
          direction="vertical"
          anchor="end"
          size={timelineHeight ?? 300}
          min={160}
          max={620}
          minOther={MIN_STAGE_HEIGHT}
          onResize={setTimelineHeight}
          className="flex-1"
        >
          <SplitPane
            direction="horizontal"
            size={libraryWidth ?? 320}
            min={LIBRARY_MIN}
            max={520}
            // The library must leave room for both panes to its right.
            minOther={INSPECTOR_MIN + SPLIT_GUTTER + MIN_PREVIEW_WIDTH}
            onResize={setLibraryWidth}
            className="h-full"
          >
            <LeftRail />
            <SplitPane
              direction="horizontal"
              anchor="end"
              size={inspectorWidth ?? 300}
              min={INSPECTOR_MIN}
              max={480}
              minOther={MIN_PREVIEW_WIDTH}
              onResize={setInspectorWidth}
              className="h-full"
            >
              <PreviewPanel />
              <Inspector />
            </SplitPane>
          </SplitPane>

          <Timeline />
        </SplitPane>
      </div>

      <ExportDialog isOpen={exportOpen} onClose={() => setExportOpen(false)} />
      <ShortcutsDialog isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      <LeaveGuard />
    </NTheme>
  );
}

export default App;
