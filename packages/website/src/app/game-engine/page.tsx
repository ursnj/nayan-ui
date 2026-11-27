import NayanGameEngineDocumentation from "@/components/game-engine/NayanGameEngineDocumentation";
import JsonLd from "@/components/helpers/JsonLd";
import { engineGuides } from "@/services/ui/guides";
import { engineGuideSchemas } from "@/services/ui/seo";
import { buildPageMetadata } from "@/services/seo";

const guide = engineGuides[0]!; // The overview.

export const metadata = buildPageMetadata({
  title: "Nayan Game Engine for React and React Native",
  description:
    "Build UI and 3D games for React and React Native on a Rust core with WebGPU, WebGL2, Metal, Vulkan, physics and audio.",
  path: "/game-engine",
  ogType: "website",
  keywords:
    "React game engine, React Native game engine, Nayan Game Engine, 3D game engine, WebAssembly, wgpu, WebGPU, Rust, 3D games",
});

export default function EnginePage() {
  return (
    <>
      <JsonLd data={engineGuideSchemas(guide)} />
      <NayanGameEngineDocumentation guide={guide} />
    </>
  );
}
