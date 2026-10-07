import TextToBinaryPage from "@/components/tools/text-tools/TextToBinaryPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Text to Binary",
  description: "Convert text to binary, hex, octal, or decimal and back. Free online converter by Nayan UI.",
  path: "/tools/text-to-binary",
  keywords: "text to binary, binary to text, text to hex, hex to text, text to octal, number system converter, binary converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Text to Binary", url: `${SITE_URL}/tools/text-to-binary` },
  ]),
  buildTechArticleSchema({
    title: "Text to Binary",
    description: "Convert text to binary, hex, octal, or decimal and back.",
    url: `${SITE_URL}/tools/text-to-binary`,
    keywords: "text to binary, binary converter, hex converter, number system",
  }),
];

export default function TextToBinaryRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <TextToBinaryPage />
    </>
  );
}
