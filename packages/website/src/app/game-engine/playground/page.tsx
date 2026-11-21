import NayanPlaygroundLoader from "@/components/nayan-playground/NayanPlaygroundLoader";
import JsonLd from "@/components/helpers/JsonLd";
import {
  ENGINE_URL,
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  engineAbout,
} from "@/services/seo";

const URL = `${SITE_URL}/game-engine/playground`;

export const metadata = buildPageMetadata({
  title: "Nayan Playground · Live Editor",
  description:
    "Write nayan-ui code with TypeScript suggestions and diagnostics, and run the 3D scene live in your browser. Start from an example and share a link.",
  path: "/game-engine/playground",
  ogType: "website",
  keywords:
    "nayan game engine playground, react game engine playground, live 3d code editor, webgpu playground, typescript editor, react native game engine",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Nayan Game Engine", url: ENGINE_URL },
    { name: "Nayan Playground", url: URL },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nayan Playground",
    description:
      "A live code editor for nayan-ui: edit TypeScript with autocomplete and type checking, and run the 3D scene in the browser.",
    url: URL,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "WebGPU or WebGL2",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    about: engineAbout,
    featureList: [
      "TypeScript suggestions and diagnostics for the engine",
      "Live preview",
      "Starter examples",
      "Shareable links",
    ],
  },
];

export default function PlaygroundPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <NayanPlaygroundLoader />
    </>
  );
}
