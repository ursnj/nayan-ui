import JsonToYamlPage from "@/components/tools/json-tools/JsonToYamlPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON to YAML",
  description:
    "Convert JSON to YAML format for configuration files. Free online JSON to YAML converter by Nayan UI.",
  path: "/tools/json-to-yaml",
  keywords:
    "json to yaml, convert json to yaml, json to yaml online, json yaml converter, json to yml, json to yaml config, json yaml transform, configuration file converter, free json to yaml, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON to YAML", url: `${SITE_URL}/tools/json-to-yaml` },
  ]),
  buildTechArticleSchema({
    title: "JSON to YAML",
    description: "Convert JSON to YAML format for configuration files.",
    url: `${SITE_URL}/tools/json-to-yaml`,
    keywords: "json to yaml, convert json to yaml, json yaml converter, json to yml",
  }),
];

export default function JsonToYamlRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonToYamlPage />
    </>
  );
}
