import GamesInstallation from "@/components/games/Installation";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Games Installation",
  description:
    "Install @nayan-ui/games in Expo or a React website and render games, settings, results and themes.",
  path: "/games/installation",
  keywords:
    "react native games installation, expo games setup, next.js games, vite games, nayan engine setup",
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
