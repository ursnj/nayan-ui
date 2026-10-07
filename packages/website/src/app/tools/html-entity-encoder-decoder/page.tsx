import HtmlEntityEncoderDecoderPage from "@/components/tools/dev-tools/HtmlEntityEncoderDecoderPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "HTML Entity Encoder/Decoder",
  description:
    "Encode text into HTML entities or decode named and numeric HTML entities back into readable text. Free online tool by Nayan UI.",
  path: "/tools/html-entity-encoder-decoder",
  keywords:
    "html entity encoder, html entity decoder, html escape, html unescape, named entities, numeric character reference, encode html, decode html, free html entity tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "HTML Entity Encoder/Decoder", url: `${SITE_URL}/tools/html-entity-encoder-decoder` },
  ]),
  buildTechArticleSchema({
    title: "HTML Entity Encoder/Decoder",
    description: "Encode text into HTML entities or decode named and numeric HTML entities back into readable text.",
    url: `${SITE_URL}/tools/html-entity-encoder-decoder`,
    keywords: "html entity encoder, html entity decoder, html escape, html unescape",
  }),
];

export default function HtmlEntityEncoderDecoderRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <HtmlEntityEncoderDecoderPage />
    </>
  );
}
