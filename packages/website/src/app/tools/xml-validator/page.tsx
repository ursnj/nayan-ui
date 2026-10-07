import XmlValidatorPage from "@/components/tools/xml-tools/XmlValidatorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "XML Validator",
  description:
    "Validate XML syntax and analyze document structure. Free online XML validator and lint tool by Nayan UI.",
  path: "/tools/xml-validator",
  keywords:
    "xml validator, xml lint, validate xml online, xml checker, xml syntax checker, xml parser, xml well-formedness, free xml validator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "XML Validator", url: `${SITE_URL}/tools/xml-validator` },
  ]),
  buildTechArticleSchema({
    title: "XML Validator",
    description: "Validate XML syntax and analyze document structure.",
    url: `${SITE_URL}/tools/xml-validator`,
    keywords: "xml validator, xml lint, validate xml, xml checker, xml syntax checker",
  }),
];

export default function XmlValidatorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <XmlValidatorPage />
    </>
  );
}
