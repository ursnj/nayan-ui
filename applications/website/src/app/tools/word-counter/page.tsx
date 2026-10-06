import WordCounterPage from "@/components/tools/text-tools/WordCounterPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Word Counter",
  description:
    "Analyze word frequency and vocabulary density. Free online word counter and frequency analyzer by Nayan UI.",
  path: "/tools/word-counter",
  keywords:
    "word counter, word frequency counter, word count online, vocabulary density, unique word counter, word frequency analyzer, text analysis, keyword density checker, most used words, writing analytics, content analysis tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Word Counter", url: `${SITE_URL}/tools/word-counter` },
  ]),
  buildTechArticleSchema({
    title: "Word Counter",
    description: "Analyze word frequency and vocabulary density.",
    url: `${SITE_URL}/tools/word-counter`,
    keywords: "word counter, word frequency, vocabulary density, keyword density, text analysis",
  }),
];

export default function WordCounterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <WordCounterPage />
    </>
  );
}
