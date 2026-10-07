import JsonLd from "@/components/helpers/JsonLd";
import RNMenu from "@/components/react-native/components/Menu";
import { buildComponentPageSeo } from "@/services/seoHelpers";

const { metadata: pageMetadata, schemas } = buildComponentPageSeo(
  "/react-native/menu",
  "react-native",
);
export const metadata = pageMetadata;

export default function RNMenuPage() {
  return (
    <>
      <JsonLd data={schemas} />
      <RNMenu />
    </>
  );
}
