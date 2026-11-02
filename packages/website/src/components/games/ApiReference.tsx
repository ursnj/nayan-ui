"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  defaultGameSettingsCode,
  gameIdsEnumCode,
  gamesCollectionsCode,
  loadersCode,
  rootExportsCode,
  servicesExportsCode,
  soundsApiCode,
  themeApiCode,
  typescriptTypesCode,
  utilsApiCode,
} from "@/services/GamesCodeBlocks";
import { getMenuItem } from "@/services/Utils";

const P = "text-muted text-sm mb-3";

const ENTRY_ROWS: { entry: string; contents: string; use: string }[] = [
  {
    entry: "@nayan-ui/games",
    contents:
      "All 53 game components, GAMES / GAMES_LIST / GAMES_MAPPING, metadata, sounds and the shared types.",
    use: "Importing one component directly. GAMES and GAMES_MAPPING import every game module.",
  },
  {
    entry: "@nayan-ui/games/services",
    contents:
      "loadGameComponent, the theme helpers, metadata, sounds, GAME_IDS, DEFAULT_GAME_SETTINGS and the types. No game components.",
    use: "Catalogs, one screen for every game, and theming. Only the selected game loads.",
  },
];

const GamesApiReference = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "API Reference"}>
      <p className={P}>
        This page covers the engine-based release, version 1.20.0. Each package entry resolves to{" "}
        <code>lib/module</code> in React Native and to <code>lib/web</code> in browsers. Both expose
        the same API.
      </p>

      <div className="mb-8">
        <h2 className={H2_DOC}>Entry points</h2>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-default text-foreground">
                <th className="py-2 pr-4">Import</th>
                <th className="py-2 pr-4">Contains</th>
                <th className="py-2">Use it for</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              {ENTRY_ROWS.map((row) => (
                <tr key={row.entry} className="border-b border-default align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-foreground">{row.entry}</td>
                  <td className="py-2 pr-4">{row.contents}</td>
                  <td className="py-2">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className={H3_DOC}>@nayan-ui/games</h3>
        <Code code={rootExportsCode} />
        <h3 className={H3_DOC}>@nayan-ui/games/services</h3>
        <Code code={servicesExportsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Game components</h2>
        <p className={P}>
          Every game export is a <code>React.FC&lt;GameProps&gt;</code>. Each one wraps its game in
          the theme provider and a loading screen. That screen waits for the engine and shows an
          error message if the engine is missing from the build. Every game provides its own
          scoreboard, Start/Stop button, results card and settings modal. Mount it in a parent with
          a height.
        </p>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Types</h2>
        <Code code={typescriptTypesCode} />
        <h3 className={H3_DOC}>When each callback fires</h3>
        <ul className="text-muted text-sm space-y-2">
          <li>
            • <strong>onEndGame</strong>: once per run. It reports win or lose when the run ends,
            and cancel on Stop or on unmount during a run. Draws are reported as cancel.
            additionalData is present only for Treasure Hunt{" "}
            <code>{"{ gems, defeated, seconds }"}</code> and Play with Tua{" "}
            <code>{"{ action, moves }"}</code>.
          </li>
          <li>
            • <strong>onPlayingChange</strong>: true when a run starts, false when it stops, ends or
            unmounts. It stays true while the run is paused.
          </li>
          <li>
            • <strong>onSettingsChange</strong>: from the settings modal, for the sound, haptics and
            Dark Mode switches and when the modal closes (isVisible: false).
          </li>
          <li>
            • <strong>onReplayGame</strong>: when Play Again is pressed on the results card.
          </li>
          <li>
            • <strong>onShare / onShareScreenshot / onShowLeaderboard</strong>: the scoreboard
            buttons. The share button calls onShareScreenshot if you pass it, otherwise onShare. The
            results card shows a share button only when onShareScreenshot is passed.
          </li>
          <li>
            • <strong>bannerAd</strong>: a React node placed in the results card.
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>DEFAULT_GAME_SETTINGS</h2>
        <Code code={defaultGameSettingsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>GAME_IDS</h2>
        <p className={P}>
          All 53 identifiers. Each value is also the route slug of the game&apos;s page on this
          site.
        </p>
        <Code code={gameIdsEnumCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Loading games</h2>
        <Code code={loadersCode} />
        <h3 className={H3_DOC}>GAMES, GAMES_LIST, GAMES_MAPPING and metadata</h3>
        <Code code={gamesCollectionsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Theme</h2>
        <p className={P}>
          Exported from @nayan-ui/games/services only. See{" "}
          <NLink href="/games/installation" className="text-accent hover:underline">
            Installation → Theming
          </NLink>{" "}
          for an example.
        </p>
        <Code code={themeApiCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Sounds</h2>
        <p className={P}>
          Games play their own sound effects through the engine mixer. Hosts rarely need these,
          except stopAllSounds when leaving a screen in an unusual way.
        </p>
        <Code code={soundsApiCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Utilities</h2>
        <Code code={utilsApiCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Not exported</h2>
        <p className={P}>
          The engine-game building blocks (engineGame, EngineGameScreen, useEngineGame, EngineHud
          and the shared helpers in src/games/shared) are internal to the library and are not part
          of the package exports. The{" "}
          <NLink href="/games/build-a-game" className="text-accent hover:underline">
            Build an engine game
          </NLink>{" "}
          guide explains how to use them in the library source.
        </p>
      </div>
    </Sidebar>
  );
};

export default GamesApiReference;
