import JsonLd from "@/components/helpers/JsonLd";
import EngineRendering from "@/components/game-engine/Rendering";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Rendering - Game Engine",
  description:
    "Draw a game world with GameView in @nayan-ui/engine: camera, lighting, soft shadows, sky color, fog and performance tips.",
  path: "/game-engine/rendering",
  keywords:
    "react native 3d rendering, webgpu react native, game camera, shadows",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Rendering", url: `${SITE_URL}/game-engine/rendering` },
  ]),
  buildTechArticleSchema({
    title: "Rendering - Game Engine",
    description: "Draw a game world with GameView in @nayan-ui/engine: camera, lighting, soft shadows, sky color, fog and performance tips.",
    url: `${SITE_URL}/game-engine/rendering`,
  }),
];

export default function GameEngineRenderingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineRendering />
    </>
  );
}
