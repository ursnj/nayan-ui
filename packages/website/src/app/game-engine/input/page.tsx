import JsonLd from "@/components/helpers/JsonLd";
import EngineInput from "@/components/game-engine/Input";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Input - Game Engine",
  description:
    "Touch controls for @nayan-ui/engine games: the built-in Joystick and React Native buttons and taps.",
  path: "/game-engine/input",
  keywords:
    "react native joystick, game touch controls, virtual joystick",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Input", url: `${SITE_URL}/game-engine/input` },
  ]),
  buildTechArticleSchema({
    title: "Input - Game Engine",
    description: "Touch controls for @nayan-ui/engine games: the built-in Joystick and React Native buttons and taps.",
    url: `${SITE_URL}/game-engine/input`,
  }),
];

export default function GameEngineInputPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineInput />
    </>
  );
}
