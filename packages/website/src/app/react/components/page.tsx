import JsonLd from "@/components/helpers/JsonLd";
import Components from "@/components/react/components/Components";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "React Components",
  description:
    "Browse Nayan UI UI examples for React. Explore controls, layouts, forms, and feedback.",
  path: "/react/components",
  keywords:
    "react components, nayan ui react, ui components list, button, input, dialog, table, accordion, toast, tailwind components",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "React Components", url: `${SITE_URL}/react/components` },
  ]),
];

export default function ComponentsPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
