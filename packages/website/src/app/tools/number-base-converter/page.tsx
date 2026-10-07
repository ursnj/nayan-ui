import NumberBaseConverterPage from "@/components/tools/dev-tools/NumberBaseConverterPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Number Base Converter",
  description:
    "Convert numbers between binary, octal, decimal, and hexadecimal instantly, with support for arbitrarily large and negative values. Free online tool by Nayan UI.",
  path: "/tools/number-base-converter",
  keywords:
    "number base converter, binary to decimal, decimal to binary, hex to decimal, binary to hex, octal converter, base converter online, free number base converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Number Base Converter", url: `${SITE_URL}/tools/number-base-converter` },
  ]),
  buildTechArticleSchema({
    title: "Number Base Converter",
    description: "Convert numbers between binary, octal, decimal, and hexadecimal instantly.",
    url: `${SITE_URL}/tools/number-base-converter`,
    keywords: "number base converter, binary, octal, decimal, hexadecimal",
  }),
];

export default function NumberBaseConverterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <NumberBaseConverterPage />
    </>
  );
}
