import ConvertImagePage from "@/components/tools/image-tools/ConvertImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Convert Image",
  description:
    "Convert images between JPG, PNG, WebP, SVG, GIF, and other formats in bulk. Free online image converter by Nayan UI.",
  path: "/tools/convert-image",
  keywords:
    "convert image, image converter, jpg to png, png to jpg, webp to jpg, image format converter, png to webp, gif to jpg, tiff to png, avif converter, batch image converter, bulk format change, free image converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Convert Image", url: `${SITE_URL}/tools/convert-image` },
  ]),
  buildTechArticleSchema({
    title: "Convert Image",
    description: "Convert images between JPG, PNG, WebP, SVG, GIF, and other formats.",
    url: `${SITE_URL}/tools/convert-image`,
    keywords: "convert image, image converter, jpg to png, png to jpg, image format converter",
  }),
];

export default function ConvertImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ConvertImagePage />
    </>
  );
}
