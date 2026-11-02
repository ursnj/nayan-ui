import Games from "@/components/games/Games";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "@nayan-ui/games - 53 Games for React and React Native",
  description:
    "53 ready-made games for React Native apps and React websites, rendered by the Nayan engine (Rust and wgpu natively, WebAssembly with WebGPU or WebGL2 in browsers). Puzzle, arcade, action and strategy games with one GameProps API.",
  path: "/games",
  keywords:
    "react native games, react games, web games, mobile games, game library, nayan engine, puzzle games, arcade games, nayan ui games",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Games", url: `${SITE_URL}/games` },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "@nayan-ui/games",
    applicationCategory: "GameApplication",
    operatingSystem: "iOS, Android, Web",
    description: "53 games for React Native and React, rendered by the Rust/wgpu Nayan engine.",
    url: `${SITE_URL}/games`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
];

export default function GamesPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Games />
    </>
  );
}
