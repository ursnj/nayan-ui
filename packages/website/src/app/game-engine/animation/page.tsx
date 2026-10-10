import JsonLd from "@/components/helpers/JsonLd";
import EngineAnimation from "@/components/game-engine/Animation";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Animation & Effects - Game Engine",
  description:
    "Animate position, rotation, scale and color with easings in @nayan-ui/engine, and add particle bursts and camera shake to React Native games.",
  path: "/game-engine/animation",
  keywords:
    "react native game animation, tween react native, particle effects react native, camera shake, easing",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Animation & Effects", url: `${SITE_URL}/game-engine/animation` },
  ]),
  buildTechArticleSchema({
    title: "Animation & Effects - Game Engine",
    description: "Animate position, rotation, scale and color with easings in @nayan-ui/engine, and add particle bursts and camera shake to React Native games.",
    url: `${SITE_URL}/game-engine/animation`,
  }),
];

export default function GameEngineAnimationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineAnimation />
    </>
  );
}
