import JsonLd from "@/components/helpers/JsonLd";
import NayanGameEngineDocumentation from "@/components/game-engine/NayanGameEngineDocumentation";
import { engineGuides } from "@/services/ui/guides";
import { engineGuideMetadata, engineGuideSchemas } from "@/services/ui/seo";
import { SITE_URL } from "@/services/seo";

const path = "/react/installation";
const guide = engineGuides.find((guide) => guide.slug === "react")!;

export const metadata = engineGuideMetadata(guide, path);

export default function InstallationPage() {
  return (
    <>
      <JsonLd data={engineGuideSchemas(guide, SITE_URL + path)} />
      <NayanGameEngineDocumentation guide={guide} />
    </>
  );
}
