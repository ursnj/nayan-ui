import JsonLd from "@/components/helpers/JsonLd";
import EngineWorld from "@/components/game-engine/World";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "World & Entities - Game Engine",
  description:
    "Spawn, move and remove entities in @nayan-ui/engine: spawn options, motion, lifetimes, attached parts and queries.",
  path: "/game-engine/world",
  keywords:
    "game entities react native, spawn objects, game world api",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "World & Entities", url: `${SITE_URL}/game-engine/world` },
  ]),
  buildTechArticleSchema({
    title: "World & Entities - Game Engine",
    description: "Spawn, move and remove entities in @nayan-ui/engine: spawn options, motion, lifetimes, attached parts and queries.",
    url: `${SITE_URL}/game-engine/world`,
  }),
];

export default function GameEngineWorldPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineWorld />
    </>
  );
}
