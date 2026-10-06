import Base64EncoderDecoderPage from "@/components/tools/text-tools/Base64EncoderDecoderPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Base64 Encoder/Decoder",
  description: "Encode and decode text to and from Base64 format. Free online Base64 tool by Nayan UI.",
  path: "/tools/base64-encoder-decoder",
  keywords: "base64 encoder, base64 decoder, base64 encode decode, text to base64, base64 to text, online base64 tool, free base64 converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Base64 Encoder/Decoder", url: `${SITE_URL}/tools/base64-encoder-decoder` },
  ]),
  buildTechArticleSchema({
    title: "Base64 Encoder/Decoder",
    description: "Encode and decode text to and from Base64 format.",
    url: `${SITE_URL}/tools/base64-encoder-decoder`,
    keywords: "base64 encoder, base64 decoder, encode decode, text to base64",
  }),
];

export default function Base64EncoderDecoderRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <Base64EncoderDecoderPage />
    </>
  );
}
