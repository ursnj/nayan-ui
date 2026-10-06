import CropImagePage from "@/components/tools/image-tools/CropImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Crop Image",
  description:
    "Crop JPG, PNG, or GIF images with ease. Choose pixels to define your rectangle or use the visual editor. Free online image cropper by Nayan UI.",
  path: "/tools/crop-image",
  keywords:
    "crop image, image cropper, crop photo, crop jpg, crop png, visual cropper, trim image, cut image, image cutter, crop picture online, free image cropper, custom crop tool, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Crop Image", url: `${SITE_URL}/tools/crop-image` },
  ]),
  buildTechArticleSchema({
    title: "Crop Image",
    description: "Crop JPG, PNG, or GIF images with ease using pixels or a visual editor.",
    url: `${SITE_URL}/tools/crop-image`,
    keywords: "crop image, image cropper, crop photo, visual cropper, trim image",
  }),
];

export default function CropImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <CropImagePage />
    </>
  );
}
