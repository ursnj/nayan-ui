import ImageColorPickerPage from "@/components/tools/image-tools/ImageColorPickerPage";
import JsonLd from "@/components/helpers/JsonLd";
import {
  SITE_URL,
  buildBreadcrumbSchema,
  buildPageMetadata,
  buildTechArticleSchema,
} from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Image Color Picker",
  description:
    "Pick exact pixel colors from any image and extract its dominant color palette as HEX, RGB, and HSL. Free online image color picker by Nayan UI.",
  path: "/tools/image-color-picker",
  keywords:
    "image color picker, color picker from image, extract colors from image, dominant color palette, image palette generator, eyedropper tool, hex color picker, rgb color picker, free color picker, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Image Color Picker", url: `${SITE_URL}/tools/image-color-picker` },
  ]),
  buildTechArticleSchema({
    title: "Image Color Picker",
    description: "Pick exact pixel colors from any image and extract its dominant color palette.",
    url: `${SITE_URL}/tools/image-color-picker`,
    keywords: "image color picker, color extractor, dominant palette, hex rgb hsl",
  }),
];

export default function ImageColorPickerRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ImageColorPickerPage />
    </>
  );
}
