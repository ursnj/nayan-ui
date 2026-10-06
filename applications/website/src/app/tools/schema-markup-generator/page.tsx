import SchemaMarkupGeneratorPage from "@/components/tools/seo-tools/SchemaMarkupGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Schema Markup Generator",
  description:
    "Generate valid JSON-LD structured data for FAQ, Article, Product, Local Business, and Breadcrumb schema types. Free online schema markup generator by Nayan UI.",
  path: "/tools/schema-markup-generator",
  keywords:
    "schema markup generator, json-ld generator, structured data generator, faq schema, article schema, product schema, local business schema, breadcrumb schema, rich results, schema.org generator, free json-ld tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Schema Markup Generator", url: `${SITE_URL}/tools/schema-markup-generator` },
  ]),
  buildTechArticleSchema({
    title: "Schema Markup Generator",
    description: "Generate valid JSON-LD structured data for FAQ, Article, Product, Local Business, and Breadcrumb schema types.",
    url: `${SITE_URL}/tools/schema-markup-generator`,
    keywords: "schema markup generator, json-ld, structured data, faq schema, product schema",
  }),
];

export default function SchemaMarkupGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <SchemaMarkupGeneratorPage />
    </>
  );
}
