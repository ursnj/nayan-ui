import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";
import BuildAGame from "./BuildAGame";

export const metadata = buildPageMetadata({
  title: "Build an Engine Game",
  description:
    "How games in @nayan-ui/games are built on @nayan-ui/engine: the screen, constants, game and scene files, useEngineGame, EngineGameScreen, the engine HUD and lifecycle rules.",
  path: "/games/build-a-game",
  keywords:
    "nayan engine game tutorial, react native 3d game, useEngineGame, EngineGameScreen, game lifecycle",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Games", url: `${SITE_URL}/games` },
    { name: "Build an Engine Game", url: `${SITE_URL}/games/build-a-game` },
  ]),
  buildTechArticleSchema({
    title: "Build an Engine Game",
    description:
      "The file pattern, hooks and lifecycle rules used by every game in @nayan-ui/games.",
    url: `${SITE_URL}/games/build-a-game`,
  }),
];

export default function BuildAGamePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <BuildAGame />
    </>
  );
}
