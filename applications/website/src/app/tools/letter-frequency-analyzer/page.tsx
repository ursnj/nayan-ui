import LetterFrequencyAnalyzerPage from "@/components/tools/text-tools/LetterFrequencyAnalyzerPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Letter Frequency Analyzer",
  description:
    "Analyze how often each letter appears in your text, with counts and percentages for every letter A-Z. Free online letter frequency analyzer by Nayan UI.",
  path: "/tools/letter-frequency-analyzer",
  keywords:
    "letter frequency analyzer, letter frequency counter, text analysis tool, alphabet frequency, cipher analysis tool, cryptography tool, character frequency, free letter frequency tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Letter Frequency Analyzer", url: `${SITE_URL}/tools/letter-frequency-analyzer` },
  ]),
  buildTechArticleSchema({
    title: "Letter Frequency Analyzer",
    description: "Analyze how often each letter appears in your text, with counts and percentages for every letter A-Z.",
    url: `${SITE_URL}/tools/letter-frequency-analyzer`,
    keywords: "letter frequency, analyzer, cipher analysis, cryptography, text analysis",
  }),
];

export default function LetterFrequencyAnalyzerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <LetterFrequencyAnalyzerPage />
    </>
  );
}
