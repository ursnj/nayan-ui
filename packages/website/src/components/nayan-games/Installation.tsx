"use client";

import { NText, NView } from 'nayan-ui/components';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckList } from "@/design/Primitives";
import { H2_DOC, H3_DOC, KBD } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  appJsonCode,
  catalogCode,
  clearGameAssetsCode,
  createProjectCode,
  devBuildCode,
  endGameCode,
  installNativeCode,
  installWebCode,
  metroConfigCode,
  nativeScreenCode,
  pauseCode,
  peerDepsCode,
  simpleUsageCode,
  themeCode,
  warmUpCode,
  webDirectImportCode,
  webNextPlayerCode,
  webSessionCode,
} from "@/services/GamesCodeBlocks";
import { getMenuItem } from "@/services/Utils";

const P = "text-muted text-sm mb-3";
const LINK = "text-accent hover:underline";

type Row = [string, string];

const SETTINGS_ROWS: Row[] = [
  ["isVisible", "Opens the settings modal and pauses. The modal closes through onSettingsChange."],
  ["paused", "Pauses without the modal, for your own overlays."],
  ["enableSounds", "Engine audio on or off."],
  ["enableHaptics", "Haptics on or off."],
  ["theme", "'light' | 'dark'; unset uses the classic palette."],
  ["offset", "Host header height; the scoreboard sits 15 points below it."],
  ["anchor", "Web: settings popover position, { top, right } in CSS pixels."],
  ["enableMusic", "Compatibility only; no game plays music."],
];

const KEYBOARD_ROWS: Row[] = [
  [
    "drag",
    "Arrows / WASD steer, Space taps: car-racing, bike-racing, penguin-run, treasure-hunt, boxing-arena, tank-1990, mob-control, paper-io, space-fighter.",
  ],
  ["swipe", "Arrows / WASD swipe: game-2048, snake-3d, pac-man, maze-runner, crossy-road."],
  ["pointer", "Arrows / WASD move a cursor, Space selects (hold to drag): every other game."],
];

const GamesInstallation = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Installation"}>
      <NText tag="p" className={P}>
        @nayan-ui/games 1.20.0+ renders 53 games with{" "}
        <Link href="/game-engine" className={LINK}>
          nayan-ui
        </Link>{" "}
        1.0.0-beta.2+ on iOS, Android and the web (1.19.0 and earlier are the Skia build).
      </NText>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Start with the games example</NText>
        <NText tag="p" className={P}>
          The example includes an Expo app for iOS and Android, a Vite app for the browser, and a
          Car Racing game in <NText tag="code">shared/</NText>. Both apps are ready to run from the same Bun
          workspace.
        </NText>
        <Code language="bash" code={createProjectCode} />
        <NText tag="p" className={P}>
          Needs{" "}
          <NView tag="a" href="https://bun.sh" target="_blank" rel="noopener noreferrer" className={LINK}>
            Bun
          </NView>
          . The mobile app runs in a development build, not Expo Go; see{" "}
          <Link href="/games/build-a-game" className={LINK}>
            build a game
          </Link>{" "}
          for how a game is put together.
        </NText>
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Requirements</NText>
        <CheckList
          items={[
            "React Native: a development build with the New Architecture (not Expo Go), Android minSdkVersion 26, arm64 iOS devices or Apple silicon simulators.",
            "Browsers: WebAssembly with WebGPU or WebGL2, over HTTPS or localhost, rendered on the client.",
            "A parent with a real height (flex: 1, or a sized div).",
          ]}
        />
        <Code language="json" code={peerDepsCode} filename="package.json" />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>React Native (Expo)</NText>
        <NText tag="h3" className={H3_DOC}>Install</NText>
        <Code language="bash" code={installNativeCode} />
        <NText tag="h3" className={H3_DOC}>app.json</NText>
        <NText tag="p" className={P}>Haptics need VIBRATE; the engine needs Android API 26.</NText>
        <Code language="json" code={appJsonCode} filename="app.json" />
        <NText tag="h3" className={H3_DOC}>Metro</NText>
        <Code language="js" code={metroConfigCode} filename="metro.config.js" />
        <NText tag="h3" className={H3_DOC}>Development build</NText>
        <NText tag="p" className={P}>
          Rebuild after upgrading the engine. For bare apps, see the{" "}
          <Link href="/game-engine/installation" className={LINK}>
            engine installation guide
          </Link>
          .
        </NText>
        <Code language="bash" code={devBuildCode} />
        <NText tag="h3" className={H3_DOC}>Render one game</NText>
        <NText tag="p" className={P}>
          Each game is a component taking GameProps; pass onSettingsChange so its settings modal can
          close and save.
        </NText>
        <Code code={simpleUsageCode} filename="BlockBlastScreen.tsx" />
        <NText tag="h3" className={H3_DOC}>One screen for every game</NText>
        <NText tag="p" className={P}>
          loadGameComponent loads only the selected game&apos;s module, behind its loading screen.
        </NText>
        <Code code={nativeScreenCode} filename="app/games/[id].tsx" />
        <NText tag="h3" className={H3_DOC}>Catalog</NText>
        <NText tag="p" className={P}>Metadata from @nayan-ui/games/services loads no game modules.</NText>
        <Code code={catalogCode} filename="GameCatalog.tsx" />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>React in the browser (Next.js, Vite)</NText>
        <NText tag="h3" className={H3_DOC}>Install</NText>
        <NText tag="p" className={P}>
          Bundlers pick the browser build (<NText tag="code">lib/web</NText>) automatically. Serve the
          engine&apos;s WASM and audio worklet files with your build; Vite copies them.
        </NText>
        <Code language="bash" code={installWebCode} />
        <NText tag="h3" className={H3_DOC}>Client-only player (Next.js)</NText>
        <Code code={webNextPlayerCode} filename="components/GamePlayer.tsx" />
        <NText tag="h3" className={H3_DOC}>Session with keyboard controls</NText>
        <NText tag="p" className={P}>
          createKeyboardInput maps keys to the same gestures as touch, and Enter presses
          Start/Stop/Play Again. Audio starts after the first input.
        </NText>
        <Code code={webSessionCode} filename="components/GameSession.tsx" />
        <NView tag="div" className="overflow-x-auto mb-4">
          <NView tag="table" className="w-full text-sm text-left">
            <NView tag="tbody" className="text-muted">
              {KEYBOARD_ROWS.map(([mode, keys]) => (
                <NView tag="tr" key={mode} className="border-b border-default align-top">
                  <NView tag="td" className="py-2 pr-4">
                    <NText tag="span" className={KBD}>{mode}</NText>
                  </NView>
                  <NView tag="td" className="py-2">{keys}</NView>
                </NView>
              ))}
            </NView>
          </NView>
        </NView>
        <NText tag="h3" className={H3_DOC}>Import one game directly</NText>
        <Code code={webDirectImportCode} filename="SudokuPage.tsx" />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Settings</NText>
        <NText tag="p" className={P}>Start from DEFAULT_GAME_SETTINGS and override what you need.</NText>
        <NView tag="div" className="overflow-x-auto mb-4">
          <NView tag="table" className="w-full text-sm text-left">
            <NView tag="tbody" className="text-muted">
              {SETTINGS_ROWS.map(([field, effect]) => (
                <NView tag="tr" key={field} className="border-b border-default align-top">
                  <NView tag="td" className="py-2 pr-4 font-mono text-xs text-foreground">{field}</NView>
                  <NView tag="td" className="py-2">{effect}</NView>
                </NView>
              ))}
            </NView>
          </NView>
        </NView>
        <NText tag="h3" className={H3_DOC}>Pause</NText>
        <NText tag="p" className={P}>Games also pause in the background and resume the same run.</NText>
        <Code code={pauseCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Results</NText>
        <NText tag="p" className={P}>
          onEndGame fires once per run. Play Again calls onReplayGame, and the next run reports
          again.
        </NText>
        <Code code={endGameCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Theme</NText>
        <NText tag="p" className={P}>
          The modal&apos;s Dark Mode switch changes settings.theme through onSettingsChange; sync
          your app theme there.
        </NText>
        <Code code={themeCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Assets</NText>
        <NText tag="h3" className={H3_DOC}>Warm up at app start</NText>
        <NText tag="p" className={P}>
          Each game loads its own assets on its screen. Warm-up prepares the GPU and fonts once,
          after the splash, so the first game opens faster.
        </NText>
        <Code code={warmUpCode} filename="app/_layout.tsx" />
        <NText tag="h3" className={H3_DOC}>Clear saved assets</NText>
        <NText tag="p" className={P}>
          Prepared geometry is saved on disk (IndexedDB on the web) and rebuilds after clearing. See{" "}
          <Link href="/game-engine/cache-performance" className={LINK}>
            engine caching
          </Link>
          .
        </NText>
        <Code code={clearGameAssetsCode} />
      </NView>

      <NText tag="p" className={P}>
        Next:{" "}
        <Link href="/games/api-reference" className={LINK}>
          API reference
        </Link>
        ,{" "}
        <Link href="/games/build-a-game" className={LINK}>
          build an engine game
        </Link>
        , or a game page such as{" "}
        <Link href="/games/treasure-hunt" className={LINK}>
          Treasure Hunt
        </Link>
        .
      </NText>
    </Sidebar>
  );
};

export default GamesInstallation;
