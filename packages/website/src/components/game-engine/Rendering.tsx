"use client";

import { DocsIntro } from "@/design/Primitives";
import Link from "next/link";
import { ACCENT_TEXT, BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { engineCameraCode, engineLightCode, engineStatsCode } from "@/services/GameEngineCodeBlocks";
import { gameViewAttributes } from "@/services/GameEngineData";

const EngineRendering = () => (
  <Sidebar title="Rendering">
    <DocsIntro lead="GameView draws a world with WebGPU and runs your game loop. Objects of the same shape are drawn together in one GPU call, with soft shadows, distance fog and anti-aliasing." />

    <Attributes title="GameView props" data={gameViewAttributes} />

    <SubHeader
      title="Camera"
      description="A perspective camera defined by where it is (eye), where it looks (target) and its field of view."
    >
      <Code code={engineCameraCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Light, sky and fog">
      <Code code={engineLightCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Shapes and colors">
      <ul className={`space-y-2 ${BODY}`}>
        <li>
          • <code>&quot;cube&quot;</code>, <code>&quot;sphere&quot;</code> and <code>&quot;plane&quot;</code>, each 1 unit
          in size before scaling.
        </li>
        <li>• Each entity has its own solid color. Combine shapes with attachments to build characters.</li>
        <li>
          • Load your own glTF models too: see{" "}
          <Link href="/game-engine/models" className={`font-medium ${ACCENT_TEXT}`}>
            3D Models
          </Link>
          . Textures and transparency are planned.
        </li>
      </ul>
    </SubHeader>

    <SubHeader title="Stats and errors" description="Show frame rate and game-loop time while you build; catch GPU problems.">
      <Code code={engineStatsCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Performance tips">
      <ul className={`space-y-2 ${BODY}`}>
        <li>• Do game logic in onUpdate and mutate the camera object; avoid React state updates every frame.</li>
        <li>• Update React state only when something visible changes, like the score.</li>
        <li>• Prefer world settings (velocity, follow, lifetime) over moving entities from JS each frame.</li>
        <li>• Use lifetimes for particles so they clean themselves up.</li>
      </ul>
    </SubHeader>
  </Sidebar>
);

export default EngineRendering;
