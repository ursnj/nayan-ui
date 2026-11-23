import GamesLicensing from "@/components/nayan-games/Licensing";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
  gamesAbout,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Games Licensing",
  description:
    "nayan-games licensing: free for non-commercial use, a paid licence for commercial apps, plus acknowledgments and support.",
  path: "/games/licensing",
  keywords: "react native games license, game library licensing, commercial usage, dual license",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Nayan Games", url: `${SITE_URL}/games` },
    { name: "Licensing", url: `${SITE_URL}/games/licensing` },
  ]),
  buildTechArticleSchema({
    title: "Games Licensing",
    description:
      "Dual licensing for nayan-games: free for non-commercial use, a paid licence for commercial use.",
    url: `${SITE_URL}/games/licensing`,
    keywords: "react native games license, game library licensing, commercial usage, dual license",
    about: gamesAbout,
    sections: ["Non-commercial (free)", "Commercial (paid)", "Acknowledgments", "Support"],
    isPartOf: { name: "Nayan Games documentation", url: `${SITE_URL}/games` },
  }),
];

export default function GamesLicensingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <GamesLicensing />
    </>
  );
}
