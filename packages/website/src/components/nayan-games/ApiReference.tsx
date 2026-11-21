"use client";

import { NView, NText } from 'nayan-ui/components';
import Link from "next/link";
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
  <NView tag="div" className="overflow-x-auto mb-4">
    <NView tag="table" className="w-full text-sm text-left">
      <NView tag="thead">
        <NView tag="tr" className="border-b border-default text-foreground">
          <NView tag="th" className="py-2 pr-4">{head[0]}</NView>
          <NView tag="th" className="py-2">{head[1]}</NView>
        </NView>
      </NView>
      <NView tag="tbody" className="text-muted">
        {rows.map(([name, detail]) => (
          <NView tag="tr" key={name} className="border-b border-default align-top">
            <NView tag="td" className="py-2 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
              {name}
            </NView>
            <NView tag="td" className="py-2">{detail}</NView>
          </NView>
        ))}
      </NView>
    </NView>
  </NView>
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
    "Once per run: win / lose at the end, cancel on Stop, unmount mid-run or a draw. additionalData: Treasure Hunt { gems, defeated, seconds }, talking tua { action, moves }.",
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
      <NText tag="p" className={P}>
        Every export of @nayan-ui/games 1.22.0; each entry resolves to <NText tag="code">lib/module</NText> in
        React Native and <NText tag="code">lib/web</NText> in browsers.
      </NText>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Entry points</NText>
        <Table head={["Import", "Contains"]} rows={ENTRY_ROWS} />
        <NText tag="h3" className={H3_DOC}>@nayan-ui/games</NText>
        <Code code={rootExportsCode} />
        <NText tag="h3" className={H3_DOC}>@nayan-ui/games/services</NText>
        <Code code={servicesExportsCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Game components</NText>
        <NText tag="p" className={P}>
          Each is a <NText tag="code">React.FC&lt;GameProps&gt;</NText> with its own loading screen, scoreboard,
          Start/Stop, results card and settings modal.
        </NText>
        <Code code={gameComponentCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Types</NText>
        <Code code={typescriptTypesCode} />
        <NText tag="h3" className={H3_DOC}>Callbacks</NText>
        <Table head={["Prop", "Fires"]} rows={CALLBACK_ROWS} />
        <NText tag="h3" className={H3_DOC}>DEFAULT_GAME_SETTINGS</NText>
        <Code code={defaultGameSettingsCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>GAME_IDS</NText>
        <NText tag="p" className={P}>Each value is also the game&apos;s page slug on this site.</NText>
        <Code code={gameIdsEnumCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Loading</NText>
        <Code code={loadersCode} />
        <NText tag="h3" className={H3_DOC}>Collections and metadata</NText>
        <Code code={gamesCollectionsCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Theme</NText>
        <NText tag="p" className={P}>
          Services entry only; usage in{" "}
          <Link href="/games/installation" className={LINK}>
            Installation → Theme
          </Link>
          .
        </NText>
        <Code code={themeApiCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Sounds</NText>
        <NText tag="p" className={P}>Games play their own sounds; hosts rarely need more than stopAllSounds.</NText>
        <Code code={soundsApiCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Utilities</NText>
        <Code code={utilsApiCode} />
      </NView>

      <NView tag="div" className="mb-8">
        <NText tag="h2" className={H2_DOC}>Not exported</NText>
        <NText tag="p" className={P}>
          engineGame, useEngineGame, EngineGameScreen, EngineHud and src/games/shared are internal;{" "}
          <Link href="/games/build-a-game" className={LINK}>
            Build an engine game
          </Link>{" "}
          covers them.
        </NText>
      </NView>
    </Sidebar>
  );
};

export default GamesApiReference;
