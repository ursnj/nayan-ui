"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  defaultGameSettingsCode,
  gameComponentCode,
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
const LINK = "text-accent hover:underline";

type Row = [string, string];

const Table = ({ head, rows }: { head: Row; rows: Row[] }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b border-default text-foreground">
          <th className="py-2 pr-4">{head[0]}</th>
          <th className="py-2">{head[1]}</th>
        </tr>
      </thead>
      <tbody className="text-muted">
        {rows.map(([name, detail]) => (
          <tr key={name} className="border-b border-default align-top">
            <td className="py-2 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
              {name}
            </td>
            <td className="py-2">{detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ENTRY_ROWS: Row[] = [
  [
    "@nayan-ui/games",
    "Game components, GAMES / GAMES_LIST / GAMES_MAPPING (import every game), metadata, sounds, types.",
  ],
  [
    "@nayan-ui/games/services",
    "No components: loadGameComponent, warm-up, theme helpers, metadata, sounds, GAME_IDS, types.",
  ],
];

const CALLBACK_ROWS: Row[] = [
  [
    "onEndGame",
    "Once per run: win / lose at the end, cancel on Stop, unmount mid-run or a draw. additionalData: Treasure Hunt { gems, defeated, seconds }, Play with Tua { action, moves }.",
  ],
  ["onPlayingChange", "true when a run starts (and while paused), false when it stops or ends."],
  ["onSettingsChange", "Modal switches (sounds, haptics, Dark Mode) and close (isVisible: false)."],
  ["onReplayGame", "Play Again on the results card."],
  [
    "onShare / onShareScreenshot",
    "Scoreboard share button; onShareScreenshot wins and also adds a share button to the results card.",
  ],
  ["onShowLeaderboard", "Scoreboard leaderboard button."],
  ["bannerAd", "A node shown in the results card."],
];

const GamesApiReference = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "API Reference"}>
      <p className={P}>
        Every export of @nayan-ui/games 1.22.0; each entry resolves to <code>lib/module</code> in
        React Native and <code>lib/web</code> in browsers.
      </p>

      <div className="mb-8">
        <h2 className={H2_DOC}>Entry points</h2>
        <Table head={["Import", "Contains"]} rows={ENTRY_ROWS} />
        <h3 className={H3_DOC}>@nayan-ui/games</h3>
        <Code code={rootExportsCode} />
        <h3 className={H3_DOC}>@nayan-ui/games/services</h3>
        <Code code={servicesExportsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Game components</h2>
        <p className={P}>
          Each is a <code>React.FC&lt;GameProps&gt;</code> with its own loading screen, scoreboard,
          Start/Stop, results card and settings modal.
        </p>
        <Code code={gameComponentCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Types</h2>
        <Code code={typescriptTypesCode} />
        <h3 className={H3_DOC}>Callbacks</h3>
        <Table head={["Prop", "Fires"]} rows={CALLBACK_ROWS} />
        <h3 className={H3_DOC}>DEFAULT_GAME_SETTINGS</h3>
        <Code code={defaultGameSettingsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>GAME_IDS</h2>
        <p className={P}>Each value is also the game&apos;s page slug on this site.</p>
        <Code code={gameIdsEnumCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Loading</h2>
        <Code code={loadersCode} />
        <h3 className={H3_DOC}>Collections and metadata</h3>
        <Code code={gamesCollectionsCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Theme</h2>
        <p className={P}>
          Services entry only; usage in{" "}
          <NLink href="/games/installation" className={LINK}>
            Installation → Theme
          </NLink>
          .
        </p>
        <Code code={themeApiCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Sounds</h2>
        <p className={P}>Games play their own sounds; hosts rarely need more than stopAllSounds.</p>
        <Code code={soundsApiCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Utilities</h2>
        <Code code={utilsApiCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>Not exported</h2>
        <p className={P}>
          engineGame, useEngineGame, EngineGameScreen, EngineHud and src/games/shared are internal;{" "}
          <NLink href="/games/build-a-game" className={LINK}>
            Build an engine game
          </NLink>{" "}
          covers them.
        </p>
      </div>
    </Sidebar>
  );
};

export default GamesApiReference;
