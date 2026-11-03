import ApiReference from "@/components/games/ApiReference";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
  gamesAbout,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Games API Reference",
  description:
    "Every export of @nayan-ui/games and @nayan-ui/games/services: game components, GameProps, settings, game ids, loading, themes and sounds.",
  path: "/games/api-reference",
  keywords: "react native games api, game api reference, react native games documentation",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Games", url: `${SITE_URL}/games` },
    { name: "API Reference", url: `${SITE_URL}/games/api-reference` },
  ]),
  buildTechArticleSchema({
    title: "Games API Reference",
    description: "Complete API documentation for @nayan-ui/games.",
    url: `${SITE_URL}/games/api-reference`,
    about: gamesAbout,
    sections: [
      "Entry points",
      "Game components",
      "Types",
      "GAME_IDS",
      "Loading",
      "Theme",
      "Sounds",
      "Utilities",
      "Not exported",
    ],
    isPartOf: { name: "Nayan UI games documentation", url: `${SITE_URL}/games` },
  }),
];

export default function ApiReferencePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <ApiReference />
    </>
  );
}
