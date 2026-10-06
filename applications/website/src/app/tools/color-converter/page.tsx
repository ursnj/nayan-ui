import ColorConverterPage from "@/components/tools/dev-tools/ColorConverterPage";
import JsonLd from "@/components/helpers/JsonLd";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata, buildTechArticleSchema } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Color Converter",
  description: "Convert colors between HEX, RGB, HSL, and RGBA formats. Free online color converter by Nayan UI.",
  path: "/tools/color-converter",
  keywords: "color converter, hex to rgb, rgb to hex, hex to hsl, color picker, color format converter, free color converter, nayan ui tools",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Developer Tools", url: `${SITE_URL}/tools` },
    { name: "Color Converter", url: `${SITE_URL}/tools/color-converter` },
  ]),
  buildTechArticleSchema({
    title: "Color Converter",
    description: "Convert colors between HEX, RGB, HSL, and RGBA formats.",
    url: `${SITE_URL}/tools/color-converter`,
    keywords: "color converter, hex to rgb, rgb to hex, color picker",
  }),
];

export default function ColorConverterRoute() {
  return (
    <>
      <JsonLd data={schemas} />
      <ColorConverterPage />
    </>
  );
}
