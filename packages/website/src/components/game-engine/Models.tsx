"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { engineModelLoadCode, engineModelMetroCode, engineModelScreenCode } from "@/services/GameEngineCodeBlocks";
import {
  assetSourceAttributes,
  modelAttributes,
  modelOptionsAttributes,
} from "@/services/GameEngineData";

const EngineModels = () => (
  <Sidebar title="3D Models">
    <DocsIntro lead="Bring in models made in Blender or downloaded from asset stores. Load a glTF file once, then spawn it like any built-in shape, as many times as you want." />

    <SubHeader title="Set up Metro" description="Let require() bundle .glb and .gltf files with your app.">
      <Code language="javascript" code={engineModelMetroCode} filename="metro.config.js" />
    </SubHeader>

    <SubHeader
      title="Load and spawn"
      description="loadModel returns a mesh id to use in spawn, and the model's size so you can place it."
    >
      <Code code={engineModelLoadCode} filename="Game.tsx" />
    </SubHeader>

    <Attributes title="loadModel options" data={modelOptionsAttributes} />

    <Attributes title="Model" data={modelAttributes} headers={{ default: "" }} unit="field" />

    <Attributes title="Asset sources" data={assetSourceAttributes} headers={{ name: "Source", default: "" }} unit="source" />

    <SubHeader title="In a screen" description="Load the model, then build the world once it's ready.">
      <Code code={engineModelScreenCode} filename="Forest.tsx" />
    </SubHeader>

    <SubHeader title="What's supported">
      <ul className={`space-y-2 ${BODY}`}>
        <li>
          • glTF 2.0: binary <code>.glb</code> files, or <code>.gltf</code> with the data embedded.
        </li>
        <li>• Meshes, their node positions, rotations and scales, and material and vertex colors.</li>
        <li>• The base color texture, one per model.</li>
        <li>• Skinned animation and Draco-compressed files aren&apos;t supported yet.</li>
        <li>
          • Models, font letters and textured shapes share 240 mesh ids. Spawn each model as many times as you
          like.
        </li>
      </ul>
    </SubHeader>

    <SubHeader title="Good to know">
      <ul className={`space-y-2 ${BODY}`}>
        <li>• All copies of a model are drawn together: a forest of 500 trees is still a single draw call.</li>
        <li>
          • The entity&apos;s <code>color</code> tints the model. Leave it white to keep the original colors and
          texture.
        </li>
        <li>• Physics colliders fit the model&apos;s bounding box. Pass a radius or size for a tighter fit.</li>
        <li>• Keep models low-poly for phones: a few thousand triangles each is plenty.</li>
      </ul>
    </SubHeader>
  </Sidebar>
);

export default EngineModels;
