import JsonLd from "@/components/helpers/JsonLd";
import NayanGameEngineDocumentation from "@/components/nayan-game-engine/NayanGameEngineDocumentation";
import { engineGuides } from "@/services/nayan-ui/guides";
import { engineGuideMetadata, engineGuideSchemas } from "@/services/nayan-ui/seo";
import { SITE_URL } from "@/services/seo";

const path = "/react-native/installation";
const guide = engineGuides.find((guide) => guide.slug === "react-native")!;

export const metadata = engineGuideMetadata(guide, path);

export default function InstallationPage() {
  return (
    <>
      <JsonLd data={engineGuideSchemas(guide, SITE_URL + path)} />
      <NayanGameEngineDocumentation guide={guide} />
    </>
  );
}
