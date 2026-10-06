import JsonToTsvPage from "@/components/tools/json-tools/JsonToTsvPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "JSON to TSV",
  description:
    "Convert JSON arrays to tab-separated values. Free online JSON to TSV converter by Nayan UI.",
  path: "/tools/json-to-tsv",
  keywords:
    "json to tsv, convert json to tsv, json to tsv online, json tsv converter, json to tab separated, json to tab delimited, json array to tsv, export json to tsv, json data to tsv, free json to tsv, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "JSON to TSV", url: `${SITE_URL}/tools/json-to-tsv` },
  ]),
  buildTechArticleSchema({
    title: "JSON to TSV",
    description: "Convert JSON arrays to tab-separated values.",
    url: `${SITE_URL}/tools/json-to-tsv`,
    keywords: "json to tsv, convert json to tsv, json tsv converter, json to tab separated",
  }),
];

export default function JsonToTsvRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <JsonToTsvPage />
    </>
  );
}
