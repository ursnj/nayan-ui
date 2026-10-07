import UuidGeneratorPage from "@/components/tools/dev-tools/UuidGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "UUID Generator",
  description: "Generate random UUIDs (v4) for development and testing. Free online UUID generator by Nayan UI.",
  path: "/tools/uuid-generator",
  keywords: "uuid generator, guid generator, random uuid, uuid v4 generator, unique id generator, online uuid tool, free uuid generator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "UUID Generator", url: `${SITE_URL}/tools/uuid-generator` },
  ]),
  buildTechArticleSchema({
    title: "UUID Generator",
    description: "Generate random UUIDs (v4) for development and testing.",
    url: `${SITE_URL}/tools/uuid-generator`,
    keywords: "uuid generator, guid generator, random uuid, unique id",
  }),
];

export default function UuidGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <UuidGeneratorPage />
    </>
  );
}
