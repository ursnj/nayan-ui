import EngineDocumentation from "@/components/engine/EngineDocumentation";
import JsonLd from "@/components/helpers/JsonLd";
import { engineGuides } from "@/services/engine/guides";
import { SITE_URL, buildBreadcrumbSchema, buildPageMetadata } from "@/services/seo";
export const metadata = buildPageMetadata({
  title: "Nayan Engine · React and React Native",
  description:
    "Build React browser and React Native games with one TypeScript API, a shared Rust core, WebGPU, WebGL2, Metal and Vulkan. Detailed guides and code examples.",
  path: "/engine",
  keywords: "React game engine, React Native game engine, Nayan engine, WASM, wgpu, 3D games",
});
export default function EnginePage() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: "Home", url: SITE_URL },
          { name: "Engine", url: `${SITE_URL}/engine` },
        ])}
      />
      <EngineDocumentation guide={engineGuides[0]} />
    </>
  );
}
