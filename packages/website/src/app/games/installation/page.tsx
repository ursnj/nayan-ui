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
    "Start with the Nayan UI boilerplate or install nayan-games in a React or Expo app.",
  path: "/games/installation",
  keywords:
    "react native games installation, expo games setup, next.js games, vite games, nayan game engine setup, nayan ui cli, create game project",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Nayan Games", url: `${SITE_URL}/games` },
    { name: "Installation", url: `${SITE_URL}/games/installation` },
  ]),
  buildTechArticleSchema({
    title: "Games Installation",
    description: "Installation guide and setup instructions for nayan-games.",
    url: `${SITE_URL}/games/installation`,
    about: gamesAbout,
    sections: [
      "Start with the Nayan UI starter",
      "Requirements",
      "React Native (Expo)",
      "React in the browser (Next.js, Vite)",
      "Settings",
      "Results",
      "Theme",
      "Assets",
    ],
    isPartOf: { name: "Nayan Games documentation", url: `${SITE_URL}/games` },
  }),
  buildHowToSchema({
    name: "Run the Nayan UI starter",
    description:
      "Run the Nayan UI starter landing page on the web or in an Expo development build.",
    tools: ["Git", "Bun"],
    steps: [
      { name: "Get the starter", text: "Clone https://github.com/ursnj/nayan-ui.git." },
      {
        name: "Install",
        text: "Open templates/nayan-ui and run bun install --frozen-lockfile.",
      },
      { name: "Run in the browser", text: "Run bun run web." },
      {
        name: "Run on a phone",
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
