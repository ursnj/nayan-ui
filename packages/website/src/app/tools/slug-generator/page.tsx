import SlugGeneratorPage from "@/components/tools/text-tools/SlugGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Slug Generator",
  description:
    "Generate URL-friendly slugs from any text. Free online slug generator by Nayan UI.",
  path: "/tools/slug-generator",
  keywords:
    "slug generator, url slug generator, seo slug, permalink generator, text to slug, friendly url generator, url-friendly slug, slug maker, seo friendly url, clean url generator, blog slug, cms slug tool, free slug generator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Slug Generator", url: `${SITE_URL}/tools/slug-generator` },
  ]),
  buildTechArticleSchema({
    title: "Slug Generator",
    description: "Generate URL-friendly slugs from any text.",
    url: `${SITE_URL}/tools/slug-generator`,
    keywords: "slug generator, url slug, seo slug, permalink generator, friendly url",
  }),
];

export default function SlugGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SlugGeneratorPage />
    </>
  );
}
