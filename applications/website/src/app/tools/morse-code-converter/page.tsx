import MorseCodeConverterPage from "@/components/tools/text-tools/MorseCodeConverterPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Morse Code Converter",
  description:
    "Convert text to Morse code and back, with support for letters, digits, and punctuation. Free online Morse code translator by Nayan UI.",
  path: "/tools/morse-code-converter",
  keywords:
    "morse code converter, morse code translator, text to morse code, morse code to text, morse code generator, decode morse code, encode morse code, amateur radio tool, free morse code tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Morse Code Converter", url: `${SITE_URL}/tools/morse-code-converter` },
  ]),
  buildTechArticleSchema({
    title: "Morse Code Converter",
    description: "Convert text to Morse code and back, with support for letters, digits, and punctuation.",
    url: `${SITE_URL}/tools/morse-code-converter`,
    keywords: "morse code, converter, translator, encode, decode",
  }),
];

export default function MorseCodeConverterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <MorseCodeConverterPage />
    </>
  );
}
