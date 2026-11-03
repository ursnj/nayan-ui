import PlaygroundLoader from "@/components/engine/playground/PlaygroundLoader";
import JsonLd from "@/components/helpers/JsonLd";
import {
  ENGINE_URL,
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  engineAbout,
} from "@/services/seo";

const URL = `${ENGINE_URL}/playground`;

export const metadata = buildPageMetadata({
  title: "Nayan Game Engine Playground · Live 3D Code Editor",
  description:
    "Write @nayan-ui/engine code in a Monaco editor with autocomplete and type checking, and run the 3D scene live in your browser. Start from an example and share a link.",
  path: "/game-engine/playground",
  ogType: "website",
  keywords:
    "nayan game engine playground, react game engine playground, live 3d code editor, webgpu playground, monaco editor, react native game engine",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Game Engine", url: ENGINE_URL },
    { name: "Playground", url: URL },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nayan Game Engine Playground",
    description:
      "A live code editor for @nayan-ui/engine: edit TypeScript with autocomplete and type checking, and run the 3D scene in the browser.",
    url: URL,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    browserRequirements: "WebGPU or WebGL2",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    about: engineAbout,
    featureList: [
      "Monaco editor with the engine's types",
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
      <PlaygroundLoader />
    </>
  );
}
