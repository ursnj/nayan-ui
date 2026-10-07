import ResizeImagePage from "@/components/tools/image-tools/ResizeImagePage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Resize Image",
  description:
    "Define your dimensions by percentage or pixels, and resize your JPG, PNG, SVG, and GIF images. Free online image resizer by Nayan UI.",
  path: "/tools/resize-image",
  keywords:
    "resize image, image resizer, resize photo, scale image, bulk resize, resize jpg, resize png, image scaler, change image dimensions, reduce image resolution, enlarge image, free image resizer, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Resize Image", url: `${SITE_URL}/tools/resize-image` },
  ]),
  buildTechArticleSchema({
    title: "Resize Image",
    description: "Define your dimensions by percentage or pixels, and resize your images.",
    url: `${SITE_URL}/tools/resize-image`,
    keywords: "resize image, image resizer, resize photo, scale image, change dimensions",
  }),
];

export default function ResizeImageRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ResizeImagePage />
    </>
  );
}
