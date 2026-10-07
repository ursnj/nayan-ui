import LoremIpsumGeneratorPage from "@/components/tools/text-tools/LoremIpsumGeneratorPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Lorem Ipsum Generator",
  description:
    "Generate placeholder text for designs and prototypes. Free online Lorem Ipsum generator by Nayan UI.",
  path: "/tools/lorem-ipsum-generator",
  keywords:
    "lorem ipsum generator, placeholder text generator, dummy text, lipsum generator, filler text, random text generator, sample text, mock content, design placeholder, prototype text, blind text generator, free lorem ipsum, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Lorem Ipsum Generator", url: `${SITE_URL}/tools/lorem-ipsum-generator` },
  ]),
  buildTechArticleSchema({
    title: "Lorem Ipsum Generator",
    description: "Generate placeholder text for designs and prototypes.",
    url: `${SITE_URL}/tools/lorem-ipsum-generator`,
    keywords: "lorem ipsum generator, placeholder text, dummy text, lipsum, filler text",
  }),
];

export default function LoremIpsumGeneratorRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <LoremIpsumGeneratorPage />
    </>
  );
}
