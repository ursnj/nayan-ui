import JsonLd from "@/components/helpers/JsonLd";
import EngineModels from "@/components/game-engine/Models";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "3D Models - Game Engine",
  description:
    "Load glTF and GLB 3D models in @nayan-ui/engine and spawn them as instanced entities with physics colliders, in React Native.",
  path: "/game-engine/models",
  keywords:
    "react native gltf, glb model react native, 3d models react native, load 3d model",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "3D Models", url: `${SITE_URL}/game-engine/models` },
  ]),
  buildTechArticleSchema({
    title: "3D Models - Game Engine",
    description: "Load glTF and GLB 3D models in @nayan-ui/engine and spawn them as instanced entities with physics colliders, in React Native.",
    url: `${SITE_URL}/game-engine/models`,
  }),
];

export default function GameEngineModelsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineModels />
    </>
  );
}
