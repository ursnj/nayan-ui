import JsonValidatorPage from "@/components/tools/json-tools/JsonValidatorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON Validator",
  description:
    "Validate JSON syntax and analyze structure with error location. Free online JSON validator and lint by Nayan UI.",
  path: "/tools/json-validator",
  keywords:
    "json validator, json lint, validate json online, json checker, json syntax checker, json parser, json error finder, json structure analyzer, json debug, json verify, free json validator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON Validator", url: `${SITE_URL}/tools/json-validator` },
  ]),
  buildTechArticleSchema({
    title: "JSON Validator",
    description: "Validate JSON syntax and analyze structure with error location.",
    url: `${SITE_URL}/tools/json-validator`,
    keywords: "json validator, json lint, validate json, json checker, json syntax checker",
  }),
];

export default function JsonValidatorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonValidatorPage />
    </>
  );
}
