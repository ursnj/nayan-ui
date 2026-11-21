import GamesInstallation from "@/components/games/Installation";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildHowToSchema,
  buildPageMetadata,
  buildTechArticleSchema,
  gamesAbout,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Games Installation",
  description:
    "Run the games example, or install @nayan-ui/games in Expo or a React website and render games, settings, results and themes.",
  path: "/games/installation",
  keywords:
    "react native games installation, expo games setup, next.js games, vite games, nayan game engine setup, nayan ui cli, create game project",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Games", url: `${SITE_URL}/games` },
    { name: "Installation", url: `${SITE_URL}/games/installation` },
  ]),
  buildTechArticleSchema({
    title: "Games Installation",
    description: "Installation guide and setup instructions for @nayan-ui/games.",
    url: `${SITE_URL}/games/installation`,
    about: gamesAbout,
    sections: [
      "Start with the games example",
      "Requirements",
      "React Native (Expo)",
      "React in the browser (Next.js, Vite)",
      "Settings",
      "Results",
      "Theme",
      "Assets",
    ],
    isPartOf: { name: "Nayan UI games documentation", url: `${SITE_URL}/games` },
  }),
  buildHowToSchema({
    name: "Run the Nayan UI games example",
    description:
      "Run the Car Racing game shared by the Expo and Vite apps in the games example.",
    tools: ["Git", "Bun"],
    steps: [
      { name: "Get the example", text: "Clone https://github.com/ursnj/nayan-ui.git." },
      {
        name: "Install",
        text: "From the repository root, install the filtered Bun workspaces, run bun run engine:build, then open packages/example.",
      },
      { name: "Play in the browser", text: "Run bun run web." },
      {
        name: "Play on a phone",
        text: "Run bun run ios or bun run android, in a development build (not Expo Go).",
      },
    ],
  }),
];

export default function GamesInstallationPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <GamesInstallation />
    </>
  );
}
