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
    "Create a games project with the Nayan UI CLI, or install @nayan-ui/games in Expo or a React website and render games, settings, results and themes.",
  path: "/games/installation",
  keywords:
    "react native games installation, expo games setup, next.js games, vite games, nayan engine setup, nayan ui cli, create game project",
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
      "Create a project with the CLI",
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
  // The "Create a project with the CLI" section's commands.
  buildHowToSchema({
    name: "Create a games project with the Nayan UI CLI",
    description:
      "Create a Bun workspace with an Expo app, a Vite app and the Car Racing game they share, then run it.",
    tools: ["Node.js (npx)", "Bun"],
    steps: [
      { name: "Create the project", text: "Run npx @nayan-ui/cli new my-game -t games." },
      {
        name: "Install",
        text: "In my-game, run bun install to install the apps and @nayan-ui/engine.",
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
