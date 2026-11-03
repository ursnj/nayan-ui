"use client";

import { NLink } from "@nayan-ui/react";
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
    "Arrows / WASD steer, Space taps: car-racing, bike-racing, penguin-run, treasure-hunt, tank-1990, mob-control, paper-io, space-fighter.",
  ],
  ["swipe", "Arrows / WASD swipe: game-2048, snake-3d, pac-man, maze-runner, crossy-road."],
  ["pointer", "Arrows / WASD move a cursor, Space selects (hold to drag): every other game."],
];

const GamesInstallation = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Installation"}>
      <p className={P}>
        @nayan-ui/games 1.20.0+ renders 53 games with{" "}
        <NLink href="/game-engine" className={LINK}>
          @nayan-ui/engine
        </NLink>{" "}
        1.0.0-beta.2+ on iOS, Android and the web (1.19.0 and earlier are the Skia build).
      </p>

      <div className="mb-8">
        <h2 className={H2_DOC}>Create a project with the CLI</h2>
        <p className={P}>
          The{" "}
          <NLink href="/tools" className={LINK}>
            Nayan UI CLI
          </NLink>{" "}
          creates a games project in one command: a Bun workspace with an Expo app for iOS and
          Android, a Vite app for the browser, and a Car Racing game in <code>shared/</code> that
          both run unchanged. The engine, Metro and Vite are already set up, so add your own games
          next to Car Racing, or install @nayan-ui/games below to bring in the ready-made ones.
        </p>
        <Code language="bash" code={createProjectCode} />
        <p className={P}>
          Needs{" "}
          <a href="https://bun.sh" target="_blank" rel="noopener noreferrer" className={LINK}>
            Bun
          </a>
          . The mobile app runs in a development build, not Expo Go; see{" "}
          <NLink href="/games/build-a-game" className={LINK}>
            build a game
          </NLink>{" "}
          for how a game is put together.
        </p>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Requirements</h2>
        <CheckList
          items={[
            "React Native: a development build with the New Architecture (not Expo Go), Android minSdkVersion 26, arm64 iOS devices or Apple silicon simulators.",
            "Browsers: WebAssembly with WebGPU or WebGL2, over HTTPS or localhost, rendered on the client.",
            "A parent with a real height (flex: 1, or a sized div).",
          ]}
        />
        <Code language="json" code={peerDepsCode} filename="package.json" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>React Native (Expo)</h2>
        <h3 className={H3_DOC}>Install</h3>
        <Code language="bash" code={installNativeCode} />
        <h3 className={H3_DOC}>app.json</h3>
        <p className={P}>Haptics need VIBRATE; the engine needs Android API 26.</p>
        <Code language="json" code={appJsonCode} filename="app.json" />
        <h3 className={H3_DOC}>Metro</h3>
        <Code language="js" code={metroConfigCode} filename="metro.config.js" />
        <h3 className={H3_DOC}>Development build</h3>
        <p className={P}>
          Rebuild after upgrading the engine. For bare apps, see the{" "}
          <NLink href="/game-engine/installation" className={LINK}>
            engine installation guide
          </NLink>
          .
        </p>
        <Code language="bash" code={devBuildCode} />
        <h3 className={H3_DOC}>Render one game</h3>
        <p className={P}>
          Each game is a component taking GameProps; pass onSettingsChange so its settings modal can
          close and save.
        </p>
        <Code code={simpleUsageCode} filename="BlockBlastScreen.tsx" />
        <h3 className={H3_DOC}>One screen for every game</h3>
        <p className={P}>
          loadGameComponent loads only the selected game&apos;s module, behind its loading screen.
        </p>
        <Code code={nativeScreenCode} filename="app/games/[id].tsx" />
        <h3 className={H3_DOC}>Catalog</h3>
        <p className={P}>Metadata from @nayan-ui/games/services loads no game modules.</p>
        <Code code={catalogCode} filename="GameCatalog.tsx" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>React in the browser (Next.js, Vite)</h2>
        <h3 className={H3_DOC}>Install</h3>
        <p className={P}>
          Bundlers pick the browser build (<code>lib/web</code>) automatically. Serve the
          engine&apos;s WASM and audio worklet files with your build; Vite copies them.
        </p>
        <Code language="bash" code={installWebCode} />
        <h3 className={H3_DOC}>Client-only player (Next.js)</h3>
        <Code code={webNextPlayerCode} filename="components/GamePlayer.tsx" />
        <h3 className={H3_DOC}>Session with keyboard controls</h3>
        <p className={P}>
          createKeyboardInput maps keys to the same gestures as touch, and Enter presses
          Start/Stop/Play Again. Audio starts after the first input.
        </p>
        <Code code={webSessionCode} filename="components/GameSession.tsx" />
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <tbody className="text-muted">
              {KEYBOARD_ROWS.map(([mode, keys]) => (
                <tr key={mode} className="border-b border-default align-top">
                  <td className="py-2 pr-4">
                    <span className={KBD}>{mode}</span>
                  </td>
                  <td className="py-2">{keys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className={H3_DOC}>Import one game directly</h3>
        <Code code={webDirectImportCode} filename="SudokuPage.tsx" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Settings</h2>
        <p className={P}>Start from DEFAULT_GAME_SETTINGS and override what you need.</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <tbody className="text-muted">
              {SETTINGS_ROWS.map(([field, effect]) => (
                <tr key={field} className="border-b border-default align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">{field}</td>
                  <td className="py-2">{effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className={H3_DOC}>Pause</h3>
        <p className={P}>Games also pause in the background and resume the same run.</p>
        <Code code={pauseCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Results</h2>
        <p className={P}>
          onEndGame fires once per run. Play Again calls onReplayGame, and the next run reports
          again.
        </p>
        <Code code={endGameCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Theme</h2>
        <p className={P}>
          The modal&apos;s Dark Mode switch changes settings.theme through onSettingsChange; sync
          your app theme there.
        </p>
        <Code code={themeCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Assets</h2>
        <h3 className={H3_DOC}>Warm up at app start</h3>
        <p className={P}>
          Each game loads its own assets on its screen. Warm-up prepares the GPU and fonts once,
          after the splash, so the first game opens faster.
        </p>
        <Code code={warmUpCode} filename="app/_layout.tsx" />
        <h3 className={H3_DOC}>Clear saved assets</h3>
        <p className={P}>
          Prepared geometry is saved on disk (IndexedDB on the web) and rebuilds after clearing. See{" "}
          <NLink href="/game-engine/cache-performance" className={LINK}>
            engine caching
          </NLink>
          .
        </p>
        <Code code={clearGameAssetsCode} />
      </div>

      <p className={P}>
        Next:{" "}
        <NLink href="/games/api-reference" className={LINK}>
          API reference
        </NLink>
        ,{" "}
        <NLink href="/games/build-a-game" className={LINK}>
          build an engine game
        </NLink>
        , or a game page such as{" "}
        <NLink href="/games/treasure-hunt" className={LINK}>
          Treasure Hunt
        </NLink>
        .
      </p>
    </Sidebar>
  );
};

export default GamesInstallation;
