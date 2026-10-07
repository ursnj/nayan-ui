import FaviconGeneratorPage from "@/components/tools/image-tools/FaviconGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Favicon Generator",
  description:
    "Generate a complete favicon set (16x16 to 512x512, plus Apple touch icon) from a single image, with a ready-to-use site.webmanifest and HTML markup. Free online favicon generator by Nayan UI.",
  path: "/tools/favicon-generator",
  keywords:
    "favicon generator, favicon maker, generate favicon, apple touch icon generator, site.webmanifest generator, favicon.ico generator, free favicon generator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Favicon Generator", url: `${SITE_URL}/tools/favicon-generator` },
  ]),
  buildTechArticleSchema({
    title: "Favicon Generator",
    description: "Generate a complete favicon set from a single image.",
    url: `${SITE_URL}/tools/favicon-generator`,
    keywords: "favicon generator, favicon maker, apple touch icon, webmanifest",
  }),
];

export default function FaviconGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <FaviconGeneratorPage />
    </>
  );
}
