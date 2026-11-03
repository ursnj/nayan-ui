import Games from "@/components/games/Games";
import { FAQS, FEATURES, STEPS } from "@/components/games/content";
import JsonLd from "@/components/helpers/JsonLd";
import { GAMES_LIST } from "@/services/GamesData";
import {
  GAMES_URL,
  SITE_NAME,
  SITE_URL,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildHowToSchema,
  buildPageMetadata,
  gamesSoftwareSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "50+ Free Games for React & React Native",
  description:
    "Play 50+ free puzzle, arcade, action and strategy games online, and add them to React Native apps and React websites with one component each.",
  path: "/games",
  ogType: "website",
  keywords:
    "react native games, react games, web games, mobile games, game library, nayan engine, puzzle games, arcade games, play games online, nayan ui games",
});

// Every schema below describes what the page shows: the games grid, the feature cards, the four
// steps and the FAQ (content.ts is shared with the page, so the text matches).
const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Games", url: GAMES_URL },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${GAMES_URL}#page`,
    name: "50+ ready-made games",
    description:
      "Play puzzle, arcade, action and strategy games in the browser, and add them to React Native apps and React websites.",
    url: GAMES_URL,
    inLanguage: "en-US",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    about: { "@id": `${GAMES_URL}#software` },
    mainEntity: {
      "@type": "ItemList",
      name: "Games",
      numberOfItems: GAMES_LIST.length,
      itemListElement: GAMES_LIST.map((game, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${GAMES_URL}/${game.id}`,
        name: game.name,
        image: `${SITE_URL}/games/${game.id}.png`,
      })),
    },
  },
  {
    ...gamesSoftwareSchema,
    featureList: FEATURES.map((feature) => `${feature.title}: ${feature.body}`),
  },
  buildHowToSchema({
    name: "Add a game to your app",
    description: "Four steps from install to a reported result.",
    tools: ["@nayan-ui/games", "@nayan-ui/engine"],
    steps: STEPS.map((step) => ({
      name: step.title,
      text: step.body,
      url: `${GAMES_URL}#how-it-works`,
    })),
  }),
  buildFaqSchema(FAQS),
];

export default function GamesPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Games />
    </>
  );
}
