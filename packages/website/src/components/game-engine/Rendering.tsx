"use client";

import { DocsIntro } from "@/design/Primitives";
import Link from "next/link";
import { ACCENT_TEXT, BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineCameraCode,
  engineFollowCode,
  engineLightCode,
  engineOrthoCode,
  engineShapesCode,
  engineStatsCode,
} from "@/services/GameEngineCodeBlocks";
import { cameraAttributes, gameViewAttributes } from "@/services/GameEngineData";

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

    <Attributes title="Camera fields" data={cameraAttributes} />

    <SubHeader
      title="Orthographic camera"
      description="Set ortho to drop perspective. Board games, puzzles and 2D games look flat and tidy."
    >
      <Code code={engineOrthoCode} filename="Board.tsx" />
    </SubHeader>

    <SubHeader
      title="Follow and shake"
      description="Let the camera chase an entity smoothly, and shake it on big hits. Both work with either camera type."
    >
      <Code code={engineFollowCode} filename="Game.tsx" />
      <p className={`mt-4 ${BODY}`}>
        With <code>follow</code> set, the camera writes <code>target</code> and <code>eye</code> itself each
        frame. More effects are on the{" "}
        <Link href="/game-engine/animation" className={`font-medium ${ACCENT_TEXT}`}>
          Animation &amp; Effects
        </Link>{" "}
        page.
      </p>
    </SubHeader>

    <SubHeader title="Light, sky and fog">
      <Code code={engineLightCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Shapes and colors" description="Built-in shapes are strings, each 1 unit across before scaling.">
      <Code code={engineShapesCode} filename="shapes.ts" />
      <ul className={`mt-4 space-y-2 ${BODY}`}>
        <li>
          • <code>&quot;cube&quot;</code>, <code>&quot;sphere&quot;</code>, <code>&quot;plane&quot;</code>,{" "}
          <code>&quot;cylinder&quot;</code>, <code>&quot;cone&quot;</code>, <code>&quot;capsule&quot;</code>,{" "}
          <code>&quot;torus&quot;</code> and <code>&quot;roundedBox&quot;</code>.{" "}
          <code>&quot;none&quot;</code> draws nothing: use it for groups, pivots and trigger zones.
        </li>
        <li>• Each entity has its own color. Combine shapes with attachments to build characters.</li>
        <li>
          • A color with alpha below 1 is see-through. See-through objects are drawn after everything solid.
        </li>
        <li>
          • Load your own glTF models too: see{" "}
          <Link href="/game-engine/models" className={`font-medium ${ACCENT_TEXT}`}>
            3D Models
          </Link>
          . For images and 3D text, see{" "}
          <Link href="/game-engine/text-textures" className={`font-medium ${ACCENT_TEXT}`}>
            Text &amp; Textures
          </Link>
          .
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
        <li>• Prefer world settings (velocity, follow, lifetime) and animate over moving entities from JS each frame.</li>
        <li>• Use lifetimes or burst for particles so they clean themselves up.</li>
      </ul>
    </SubHeader>
  </Sidebar>
);

export default EngineRendering;
