import JsonLd from "@/components/helpers/JsonLd";
import EngineOverview from "@/components/game-engine/Overview";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Game Engine for React Native",
  description:
    "@nayan-ui/engine is a 3D game engine for React Native: Rapier physics, WebGPU rendering with shadows, a native audio mixer and haptics, driven from TypeScript.",
  path: "/game-engine",
  keywords:
    "react native game engine, 3d game engine, react native physics, rapier, webgpu, nayan ui engine",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
  ]),
];

export default function GameEngineOverviewPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineOverview />
    </>
  );
}
