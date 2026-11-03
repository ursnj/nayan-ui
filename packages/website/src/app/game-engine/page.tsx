import EngineDocumentation from "@/components/engine/EngineDocumentation";
import JsonLd from "@/components/helpers/JsonLd";
import { engineGuides } from "@/services/engine/guides";
import { engineGuideSchemas } from "@/services/engine/seo";
import { buildPageMetadata } from "@/services/seo";

const guide = engineGuides[0]!; // The overview.

export const metadata = buildPageMetadata({
  title: "Nayan Game Engine: 3D Games for React & React Native",
  description:
    "A 3D game engine for React and React Native: one TypeScript API on a Rust core with WebGPU, WebGL2, Metal and Vulkan, physics, audio and guides.",
  path: "/game-engine",
  ogType: "website",
  keywords:
    "React game engine, React Native game engine, Nayan Game Engine, 3D game engine, WebAssembly, wgpu, WebGPU, Rust, 3D games",
});

export default function EnginePage() {
  return (
    <>
      <JsonLd data={engineGuideSchemas(guide)} />
      <EngineDocumentation guide={guide} />
    </>
  );
}
