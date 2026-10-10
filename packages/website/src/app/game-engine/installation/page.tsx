import JsonLd from "@/components/helpers/JsonLd";
import EngineInstallation from "@/components/game-engine/Installation";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Installation - Game Engine",
  description:
    "Install @nayan-ui/engine and react-native-webgpu, build a development client and check the native core is linked.",
  path: "/game-engine/installation",
  keywords:
    "nayan ui engine installation, react native game engine setup, react-native-webgpu",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Installation", url: `${SITE_URL}/game-engine/installation` },
  ]),
  buildTechArticleSchema({
    title: "Installation - Game Engine",
    description: "Install @nayan-ui/engine and react-native-webgpu, build a development client and check the native core is linked.",
    url: `${SITE_URL}/game-engine/installation`,
  }),
];

export default function GameEngineInstallationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineInstallation />
    </>
  );
}
