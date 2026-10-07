import ImageToBase64Page from "@/components/tools/image-tools/ImageToBase64Page";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Image to Base64 Converter",
  description:
    "Convert images to Base64-encoded strings or decode Base64 back to an image, entirely in your browser. Free online image to Base64 converter by Nayan UI.",
  path: "/tools/image-to-base64",
  keywords:
    "image to base64, base64 to image, image encoder, base64 image converter, convert image to base64 string, data url generator, embed image in css, embed image in html, free image base64 converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Image to Base64", url: `${SITE_URL}/tools/image-to-base64` },
  ]),
  buildTechArticleSchema({
    title: "Image to Base64 Converter",
    description: "Convert images to Base64-encoded strings or decode Base64 back to an image.",
    url: `${SITE_URL}/tools/image-to-base64`,
    keywords: "image to base64, base64 to image, data url, image encoder",
  }),
];

export default function ImageToBase64Route() {
  return (
    <>
      <JsonLd data={schemas} />
      <ImageToBase64Page />
    </>
  );
}
