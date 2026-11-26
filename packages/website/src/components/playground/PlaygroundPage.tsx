import NayanPlaygroundLoader from "@/components/playground/NayanPlaygroundLoader";
import JsonLd from "@/components/helpers/JsonLd";
import {
  ENGINE_URL,
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  engineAbout,
} from "@/services/seo";

export const playgroundMetadata = (path: string) => buildPageMetadata({
  title: "Nayan Playground · Live Editor",
  description:
    "Write nayan-ui code with TypeScript suggestions and diagnostics, and run the 3D scene live in your browser. Start from an example and share a link.",
  path,
  bannerFor: "/playground",
  ogType: "website",
  keywords:
    "nayan game engine playground, react game engine playground, live 3d code editor, webgpu playground, typescript editor, react native game engine",
});

export default function PlaygroundPage({ path }: { path: string }) {
  const url = SITE_URL + path;
  const schemas = [
    buildBreadcrumbSchema([
      { name: "Home", url: SITE_URL },
      { name: "Nayan Game Engine", url: ENGINE_URL },
      { name: "Nayan Playground", url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Nayan Playground",
      description:
        "A live code editor for nayan-ui: edit TypeScript with autocomplete and type checking, and run the 3D scene in the browser.",
      url,
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
  return (
    <>
      <JsonLd data={schemas} />
      <NayanPlaygroundLoader />
    </>
  );
}
