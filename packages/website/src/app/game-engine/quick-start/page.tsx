import JsonLd from "@/components/helpers/JsonLd";
import EngineQuickStart from "@/components/game-engine/QuickStart";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Quick Start - Game Engine",
  description:
    "Build a first physics game with @nayan-ui/engine in about thirty lines: a world, a GameView and a game loop.",
  path: "/game-engine/quick-start",
  keywords:
    "react native game tutorial, game engine quick start, react native physics example",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Quick Start", url: `${SITE_URL}/game-engine/quick-start` },
  ]),
  buildTechArticleSchema({
    title: "Quick Start - Game Engine",
    description: "Build a first physics game with @nayan-ui/engine in about thirty lines: a world, a GameView and a game loop.",
    url: `${SITE_URL}/game-engine/quick-start`,
  }),
];

export default function GameEngineQuickStartPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineQuickStart />
    </>
  );
}
