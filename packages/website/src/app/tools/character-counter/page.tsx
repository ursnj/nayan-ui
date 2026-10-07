import CharacterCounterPage from "@/components/tools/text-tools/CharacterCounterPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Character Counter",
  description:
    "Count characters, words, sentences, paragraphs, and estimate reading time. Free online character counter by Nayan UI.",
  path: "/tools/character-counter",
  keywords:
    "character counter, character count online, word counter, sentence counter, paragraph counter, reading time calculator, letter counter, text length, free character count tool, writing assistant, social media character limit, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Character Counter", url: `${SITE_URL}/tools/character-counter` },
  ]),
  buildTechArticleSchema({
    title: "Character Counter",
    description: "Count characters, words, sentences, paragraphs, and estimate reading time.",
    url: `${SITE_URL}/tools/character-counter`,
    keywords: "character counter, word counter, sentence counter, reading time, letter count",
  }),
];

export default function CharacterCounterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CharacterCounterPage />
    </>
  );
}
