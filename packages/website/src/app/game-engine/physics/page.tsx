import JsonLd from "@/components/helpers/JsonLd";
import EnginePhysics from "@/components/game-engine/Physics";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Physics - Game Engine",
  description:
    "Rapier physics in @nayan-ui/engine: dynamic, kinematic and fixed bodies, colliders, collision layers, sensors, collisions and raycasts.",
  path: "/game-engine/physics",
  keywords:
    "react native physics engine, rapier physics, collisions, raycast, rigid bodies",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Physics", url: `${SITE_URL}/game-engine/physics` },
  ]),
  buildTechArticleSchema({
    title: "Physics - Game Engine",
    description: "Rapier physics in @nayan-ui/engine: dynamic, kinematic and fixed bodies, colliders, collision layers, sensors, collisions and raycasts.",
    url: `${SITE_URL}/game-engine/physics`,
  }),
];

export default function GameEnginePhysicsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EnginePhysics />
    </>
  );
}
