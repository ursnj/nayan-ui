import JsonLd from "@/components/helpers/JsonLd";
import EngineTextTextures from "@/components/game-engine/TextTextures";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Text & Textures - Game Engine",
  description:
    "Draw 3D text from TTF and OTF fonts, put PNG and JPEG textures on shapes, use card atlases and see-through colors in @nayan-ui/engine for React Native.",
  path: "/game-engine/text-textures",
  keywords:
    "react native 3d text, textures react native game, sprite sheet, texture atlas, ttf font 3d",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Text & Textures", url: `${SITE_URL}/game-engine/text-textures` },
  ]),
  buildTechArticleSchema({
    title: "Text & Textures - Game Engine",
    description: "Draw 3D text from TTF and OTF fonts, put PNG and JPEG textures on shapes, use card atlases and see-through colors in @nayan-ui/engine for React Native.",
    url: `${SITE_URL}/game-engine/text-textures`,
  }),
];

export default function GameEngineTextTexturesPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineTextTextures />
    </>
  );
}
