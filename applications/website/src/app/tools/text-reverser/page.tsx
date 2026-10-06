import TextReverserPage from "@/components/tools/text-tools/TextReverserPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Text Reverser",
  description:
    "Reverse text, words, or lines in various modes. Free online text reverser by Nayan UI.",
  path: "/tools/text-reverser",
  keywords:
    "text reverser, reverse text online, reverse string, reverse words, backwards text, flip text, mirror text, reverse lines, reverse each word, backward text generator, text flipper, free reverse text tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Text Reverser", url: `${SITE_URL}/tools/text-reverser` },
  ]),
  buildTechArticleSchema({
    title: "Text Reverser",
    description: "Reverse text, words, or lines in various modes.",
    url: `${SITE_URL}/tools/text-reverser`,
    keywords: "text reverser, reverse text, reverse string, backwards text, mirror text",
  }),
];

export default function TextReverserRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <TextReverserPage />
    </>
  );
}
