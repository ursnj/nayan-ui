import GamesLicensing from "@/components/games/Licensing";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Games Licensing",
  description: "Dual licensing, commercial terms and acknowledgments for @nayan-ui/games.",
  path: "/games/licensing",
  keywords: "react native games license, game library licensing, commercial usage, dual license",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Games", url: `${SITE_URL}/games` },
    { name: "Licensing", url: `${SITE_URL}/games/licensing` },
  ]),
];

export default function GamesLicensingPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <GamesLicensing />
    </>
  );
}
