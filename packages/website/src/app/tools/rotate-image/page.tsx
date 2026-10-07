import RotateImagePage from "@/components/tools/image-tools/RotateImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Rotate Image",
  description:
    "Rotate or flip JPG, PNG, or GIF images individually or in bulk. Free online image rotator by Nayan UI.",
  path: "/tools/rotate-image",
  keywords:
    "rotate image, image rotator, flip image, rotate jpg, rotate png, mirror image, rotate photo, flip photo, image orientation, rotate 90 degrees, rotate 180 degrees, free image rotator, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Rotate Image", url: `${SITE_URL}/tools/rotate-image` },
  ]),
  buildTechArticleSchema({
    title: "Rotate Image",
    description: "Rotate or flip JPG, PNG, or GIF images individually or in bulk.",
    url: `${SITE_URL}/tools/rotate-image`,
    keywords: "rotate image, image rotator, flip image, mirror image, rotate photo",
  }),
];

export default function RotateImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <RotateImagePage />
    </>
  );
}
