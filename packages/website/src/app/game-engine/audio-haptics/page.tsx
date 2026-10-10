import JsonLd from "@/components/helpers/JsonLd";
import EngineAudioHaptics from "@/components/game-engine/AudioHaptics";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Audio & Haptics - Game Engine",
  description:
    "Sound effects, music and haptics in @nayan-ui/engine, plus impact feedback played straight from physics collisions.",
  path: "/game-engine/audio-haptics",
  keywords:
    "react native game audio, game sound effects, haptics, impact feedback",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: `${SITE_URL}/game-engine` },
    { name: "Audio & Haptics", url: `${SITE_URL}/game-engine/audio-haptics` },
  ]),
  buildTechArticleSchema({
    title: "Audio & Haptics - Game Engine",
    description: "Sound effects, music and haptics in @nayan-ui/engine, plus impact feedback played straight from physics collisions.",
    url: `${SITE_URL}/game-engine/audio-haptics`,
  }),
];

export default function GameEngineAudioHapticsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <EngineAudioHaptics />
    </>
  );
}
