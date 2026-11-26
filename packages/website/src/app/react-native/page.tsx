import JsonLd from "@/components/helpers/JsonLd";
import Components from "@/components/react-native/components/Components";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "React Native Components",
  description:
    "Explore Nayan UI components for React Native, including shared themes, controls, layouts and forms for iOS and Android.",
  path: "/react-native",
  keywords:
    "react native components, nayan ui react native, mobile ui library, ios components, android components",
});

const schemas = [
  buildBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "React Native", url: `${SITE_URL}/react-native` },
  ]),
];

export default function ReactNativePage() {
  return (
    <>
      <JsonLd data={schemas} />
      <Components />
    </>
  );
}
