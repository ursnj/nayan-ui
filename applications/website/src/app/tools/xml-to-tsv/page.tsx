import XmlToTsvPage from "@/components/tools/xml-tools/XmlToTsvPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML to TSV",
  description:
    "Convert XML records to tab-separated values. Free online XML to TSV converter by Nayan UI.",
  path: "/tools/xml-to-tsv",
  keywords:
    "xml to tsv, convert xml to tsv, xml to tsv online, xml tsv converter, xml to tab separated, xml records to tsv, free xml to tsv, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML to TSV", url: `${SITE_URL}/tools/xml-to-tsv` },
  ]),
  buildTechArticleSchema({
    title: "XML to TSV",
    description: "Convert XML records to tab-separated values.",
    url: `${SITE_URL}/tools/xml-to-tsv`,
    keywords: "xml to tsv, convert xml to tsv, xml tsv converter, xml to tab separated",
  }),
];

export default function XmlToTsvRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlToTsvPage />
    </>
  );
}
