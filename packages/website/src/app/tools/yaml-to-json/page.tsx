import YamlToJsonPage from "@/components/tools/json-tools/YamlToJsonPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "YAML to JSON",
  description: "Convert YAML to JSON format for APIs and configs. Free online YAML to JSON converter by Nayan UI.",
  path: "/tools/yaml-to-json",
  keywords: "yaml to json, yaml json converter, convert yaml to json, online yaml to json, yaml parser, yml to json, free yaml to json, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "YAML to JSON", url: `${SITE_URL}/tools/yaml-to-json` },
  ]),
  buildTechArticleSchema({
    title: "YAML to JSON",
    description: "Convert YAML to JSON format for APIs and configs.",
    url: `${SITE_URL}/tools/yaml-to-json`,
    keywords: "yaml to json, yaml converter, yaml parser, yml to json",
  }),
];

export default function YamlToJsonRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <YamlToJsonPage />
    </>
  );
}
