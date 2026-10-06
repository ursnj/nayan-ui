import JsonSchemaValidatorPage from "@/components/tools/json-tools/JsonSchemaValidatorPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Schema Validator",
  description: "Validate JSON data against a JSON Schema definition. Free online JSON Schema validator by Nayan UI.",
  path: "/tools/json-schema-validator",
  keywords: "json schema validator, json schema checker, validate json schema, json schema tester, online json schema validator, json schema tool, free json schema validator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Schema Validator", url: `${SITE_URL}/tools/json-schema-validator` },
  ]),
  buildTechArticleSchema({
    title: "JSON Schema Validator",
    description: "Validate JSON data against a JSON Schema definition.",
    url: `${SITE_URL}/tools/json-schema-validator`,
    keywords: "json schema validator, json schema, validate json, schema tester",
  }),
];

export default function JsonSchemaValidatorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonSchemaValidatorPage />
    </>
  );
}
