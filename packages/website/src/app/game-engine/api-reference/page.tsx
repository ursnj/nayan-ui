import JsonLd from "@/components/helpers/JsonLd";
import EngineApiReference from "@/components/game-engine/ApiReference";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "API Reference - Game Engine",
  description:
    "Complete API reference for @nayan-ui/engine: World, GameView, audio, haptics, Joystick and all exported types.",
  path: "/game-engine/api-reference",
  keywords:
    "nayan ui engine api, game engine api reference, world api",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "API Reference", url: `${SITE_URL}/game-engine/api-reference` },
  ]),
  buildTechArticleSchema({
    title: "API Reference - Game Engine",
    description: "Complete API reference for @nayan-ui/engine: World, GameView, audio, haptics, Joystick and all exported types.",
    url: `${SITE_URL}/game-engine/api-reference`,
  }),
];

export default function GameEngineApiReferencePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineApiReference />
    </>
  );
}
