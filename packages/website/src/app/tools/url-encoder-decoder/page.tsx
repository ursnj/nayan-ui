import UrlEncoderDecoderPage from "@/components/tools/seo-tools/UrlEncoderDecoderPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "URL Encoder/Decoder",
  description:
    "Encode and decode URLs with encodeURIComponent and encodeURI. Free online URL encoder decoder tool by Nayan UI.",
  path: "/tools/url-encoder-decoder",
  keywords:
    "url encoder, url decoder, url encode decode, percent encoding, uri encoder, uri decoder, encodeURIComponent, url escaping, query string encoder, free url encoder, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "URL Encoder/Decoder", url: `${SITE_URL}/tools/url-encoder-decoder` },
  ]),
  buildTechArticleSchema({
    title: "URL Encoder/Decoder",
    description: "Encode and decode URLs with encodeURIComponent and encodeURI.",
    url: `${SITE_URL}/tools/url-encoder-decoder`,
    keywords: "url encoder, url decoder, percent encoding, uri encoder",
  }),
];

export default function UrlEncoderDecoderRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <UrlEncoderDecoderPage />
    </>
  );
}
