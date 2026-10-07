import CompressImagePage from "@/components/tools/image-tools/CompressImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Compress Image",
  description:
    "Compress JPG, PNG, SVG, and GIF images while saving space and maintaining quality. Free online image compressor by Nayan UI.",
  path: "/tools/compress-image",
  keywords:
    "compress image, image compression, reduce image size, optimize image, jpg compression, png compression, image optimizer, reduce file size, bulk image compressor, webp compression, lossless compression, free image compressor, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Compress Image", url: `${SITE_URL}/tools/compress-image` },
  ]),
  buildTechArticleSchema({
    title: "Compress Image",
    description: "Compress JPG, PNG, SVG, and GIF images while saving space and maintaining quality.",
    url: `${SITE_URL}/tools/compress-image`,
    keywords: "compress image, image compression, reduce image size, optimize image, image compressor",
  }),
];

export default function CompressImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CompressImagePage />
    </>
  );
}
