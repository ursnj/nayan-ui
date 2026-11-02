"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { CheckList } from "@/design/Primitives";
import { CARD, H2_DOC, H3_DOC, KBD } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  appJsonCode,
  catalogCode,
  clearGameAssetsCode,
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
  webDirectImportCode,
  webNextPlayerCode,
  webSessionCode,
} from "@/services/GamesCodeBlocks";
import { getMenuItem } from "@/services/Utils";

const P = "text-muted text-sm mb-3";

const SETTINGS_ROWS: { field: string; effect: string }[] = [
  {
    field: "isVisible",
    effect:
      "Opens the built-in settings modal (sounds, haptics, dark mode, how to play) and pauses gameplay. The modal closes by calling onSettingsChange with isVisible: false, so always pass onSettingsChange.",
  },
  {
    field: "paused",
    effect:
      "Pauses gameplay without opening the modal. Use it while your own sheet, side panel or popover covers the game.",
  },
  {
    field: "enableSounds",
    effect: "Mutes or unmutes the game's engine audio. Sounds also stop while the game is paused.",
  },
  { field: "enableHaptics", effect: "Turns haptic feedback on or off." },
  {
    field: "theme",
    effect:
      "'light' or 'dark' follows your app and the modal's Dark Mode switch. Leave it unset for the classic palette.",
  },
  {
    field: "offset",
    effect:
      "Height of your header above the game. The scoreboard starts 15 points below it; pass 0 when there is no header.",
  },
  {
    field: "anchor",
    effect:
      "Web only: where the settings popover attaches ({ top, right } in CSS pixels), usually just below your settings button.",
  },
  { field: "enableMusic", effect: "Kept for compatibility. No game plays background music." },
];

const KEYBOARD_ROWS: { mode: string; games: string; keys: string }[] = [
  {
    mode: "drag",
    games:
      "car-racing, bike-racing, penguin-run, treasure-hunt, tank-1990, mob-control, paper-io, space-fighter",
    keys: "Arrows / WASD move or steer, Space taps",
  },
  {
    mode: "swipe",
    games: "game-2048, snake-3d, pac-man, maze-runner, crossy-road",
    keys: "Arrows / WASD swipe in that direction",
  },
  {
    mode: "pointer",
    games: "every other game",
    keys: "Arrows / WASD move a cursor, Space selects, hold Space while moving to drag",
  },
];

const GamesInstallation = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Installation"}>
      <div className={`${CARD} p-5 mb-8`}>
        <p className="text-sm text-foreground font-semibold mb-2">Which version these docs cover</p>
        <p className="text-muted text-sm">
          These pages describe the engine-based @nayan-ui/games: 53 games rendered by{" "}
          <NLink href="/engine" className="text-accent hover:underline">
            @nayan-ui/engine
          </NLink>{" "}
          (Rust and wgpu on iOS and Android, WebAssembly with WebGPU or WebGL2 in browsers). It
          ships from version 1.20.0, which requires @nayan-ui/engine 1.0.0-beta.2 or later. Version
          1.19.0 and earlier are the Skia and Reanimated build. They have different peer
          dependencies and do not run in plain React websites.
        </p>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Requirements</h2>
        <CheckList
          items={[
            "React Native: a development or store build with the New Architecture. Expo Go does not contain the engine's native core.",
            "Android: minSdkVersion 26 and the VIBRATE permission. iOS: arm64 devices and Apple silicon simulators. The prebuilt engine does not include Intel simulators.",
            "Metro must treat .glb and .gltf files as assets, because Treasure Hunt and Play with Tua load models.",
            "Browsers: matching React and React DOM versions, WebAssembly, and WebGPU or WebGL2, served over HTTPS or localhost. Render games on the client only.",
            "Give the game a parent with a real height (flex: 1, or a div with a set height).",
          ]}
        />
        <h3 className={H3_DOC}>Peer dependencies</h3>
        <p className={P}>
          Only the engine and React are always required. The others depend on the platform. Gesture
          Handler, Reanimated, Worklets, Skia and react-native-svg are no longer needed.
        </p>
        <Code language="json" code={peerDepsCode} filename="package.json" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>React Native (Expo)</h2>
        <h3 className={H3_DOC}>1. Install</h3>
        <Code language="bash" code={installNativeCode} />
        <h3 className={H3_DOC}>2. Android settings and permissions</h3>
        <Code language="json" code={appJsonCode} filename="app.json" />
        <h3 className={H3_DOC}>3. Metro asset extensions</h3>
        <Code language="js" code={metroConfigCode} filename="metro.config.js" />
        <h3 className={H3_DOC}>4. Build a development client</h3>
        <Code language="bash" code={devBuildCode} />
        <p className={P}>
          Rebuild the app after you upgrade @nayan-ui/engine. For bare React Native apps and
          CocoaPods, see the{" "}
          <NLink href="/engine/installation" className="text-accent hover:underline">
            engine installation guide
          </NLink>
          .
        </p>
        <h3 className={H3_DOC}>5. Render one game</h3>
        <p className={P}>
          Every game is a component that takes GameProps. Keep the settings in state and pass
          onSettingsChange so the built-in settings modal can open, close and save preferences.
        </p>
        <Code code={simpleUsageCode} filename="BlockBlastScreen.tsx" />
        <h3 className={H3_DOC}>6. A full game screen</h3>
        <p className={P}>
          This Expo Router screen loads any game by id with loadGameComponent. Only the selected
          game&apos;s module loads, behind the library&apos;s loading screen. The screen opens
          settings from the header, places the scoreboard below the header, follows the system
          theme, blocks the back swipe during a run and records results.
        </p>
        <Code code={nativeScreenCode} filename="app/games/[id].tsx" />
        <h3 className={H3_DOC}>Catalog screen</h3>
        <Code code={catalogCode} filename="GameCatalog.tsx" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>React in the browser (Next.js, Vite)</h2>
        <p className={P}>
          The package includes a browser build. Bundlers that resolve the browser condition load{" "}
          <code>lib/web</code> for both <code>@nayan-ui/games</code> and{" "}
          <code>@nayan-ui/games/services</code>. The build bundles its React Native Web adapters
          along with the sounds, models and textures. react, react-dom and @nayan-ui/engine stay
          external. Serve the engine&apos;s WASM and audio worklet files with your build; Vite
          copies them automatically. Audio starts after the player&apos;s first click, tap or key
          press.
        </p>
        <h3 className={H3_DOC}>1. Install</h3>
        <Code language="bash" code={installWebCode} />
        <h3 className={H3_DOC}>2. Load the game on the client only (Next.js)</h3>
        <Code code={webNextPlayerCode} filename="components/GamePlayer.tsx" />
        <h3 className={H3_DOC}>3. The game session, with keyboard controls</h3>
        <p className={P}>
          The engine&apos;s createKeyboardInput turns arrow keys, WASD, Space and Enter into the
          same pointer gestures as mouse and touch. Enter presses Start, Stop or Play Again. Dispose
          the adapter while a modal or panel is open so that it receives the keys instead.
        </p>
        <Code code={webSessionCode} filename="components/GameSession.tsx" />
        <div className="overflow-x-auto my-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-default text-foreground">
                <th className="py-2 pr-4">Mode</th>
                <th className="py-2 pr-4">Games</th>
                <th className="py-2">Keys</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {KEYBOARD_ROWS.map((row) => (
                <tr key={row.mode} className="border-b border-default align-top">
                  <td className="py-2 pr-4">
                    <span className={KBD}>{row.mode}</span>
                  </td>
                  <td className="py-2 pr-4">{row.games}</td>
                  <td className="py-2">{row.keys}</td>
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
        <p className={P}>
          Every game reads the same GameSettings. Start from DEFAULT_GAME_SETTINGS and change the
          fields your app needs.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-default text-foreground">
                <th className="py-2 pr-4">Field</th>
                <th className="py-2">Effect</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {SETTINGS_ROWS.map((row) => (
                <tr key={row.field} className="border-b border-default align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">{row.field}</td>
                  <td className="py-2">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className={H3_DOC}>Pausing for overlays</h3>
        <p className={P}>
          Games also pause when the app goes to the background, and the same run resumes when it
          returns.
        </p>
        <Code code={pauseCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Results: onEndGame</h2>
        <p className={P}>
          Each game draws its own scoreboard, Start/Stop button and results card. onEndGame is
          called once per run. Play Again calls onReplayGame and starts a new run, which reports its
          own result.
        </p>
        <Code code={endGameCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Theming</h2>
        <p className={P}>
          All 53 games support light and dark themes. Override the palettes once with
          configureGameThemes, then pass settings.theme. The settings modal&apos;s Dark Mode switch
          changes settings.theme through onSettingsChange; update your app theme there to keep the
          two in sync.
        </p>
        <Code code={themeCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Assets and caching</h2>
        <p className={P}>
          You don&apos;t register assets or configure storage. Each game&apos;s loading screen waits
          for the engine to start, then prepares the game&apos;s fonts, textures, models and meshes.
          The engine saves prepared geometry in app-private files on iOS and Android, and in
          IndexedDB in browsers. Stop, Play Again and unmount reuse those assets. The library does
          not need expo-file-system.
        </p>
        <h3 className={H3_DOC}>Clear saved assets from your settings screen</h3>
        <p className={P}>
          Call clearAssetCache only when the user asks for it. Games already loaded keep working,
          and assets rebuild on the next launch. See the{" "}
          <NLink href="/engine/cache-performance" className="text-accent hover:underline">
            engine caching guide
          </NLink>
          .
        </p>
        <Code code={clearGameAssetsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Next steps</h2>
        <ul className="text-muted text-sm space-y-2">
          <li>
            • The{" "}
            <NLink href="/games/api-reference" className="text-accent hover:underline">
              API reference
            </NLink>{" "}
            lists every export, type and signature.
          </li>
          <li>
            •{" "}
            <NLink href="/games/build-a-game" className="text-accent hover:underline">
              Build an engine game
            </NLink>{" "}
            explains the library&apos;s file pattern for new games.
          </li>
          <li>
            • Each game&apos;s page (for example{" "}
            <NLink href="/games/treasure-hunt" className="text-accent hover:underline">
              Treasure Hunt
            </NLink>
            ) lists its controls and rules.
          </li>
        </ul>
      </div>
    </Sidebar>
  );
};

export default GamesInstallation;
