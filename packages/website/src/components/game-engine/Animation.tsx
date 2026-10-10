"use client";

import { DocsIntro } from "@/design/Primitives";
import Link from "next/link";
import { ACCENT_TEXT, BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineAnimateChainCode,
  engineAnimateCode,
  engineAnimatePulseCode,
  engineBurstCode,
  engineShakeCode,
} from "@/services/GameEngineCodeBlocks";
import { animateOptionsAttributes, burstOptionsAttributes, easingAttributes } from "@/services/GameEngineData";

const EngineAnimation = () => (
  <Sidebar title="Animation & Effects">
    <DocsIntro lead="Slide pieces, pop tiles, fade things out, throw confetti and shake the screen. Animations and particles run in the Rust core, so they need no code in your game loop." />

    <SubHeader
      title="Animate"
      description="world.animate moves an entity from where it is now to a target position, rotation, scale or color."
    >
      <Code code={engineAnimateCode} filename="board.ts" />
    </SubHeader>

    <Attributes title="Animate options" data={animateOptionsAttributes} />

    <Attributes title="Easings" data={easingAttributes} />

    <SubHeader
      title="Wait and chain"
      description="animate returns a Promise. Await it to run steps in order, or to check the board once a move is done."
    >
      <Code code={engineAnimateChainCode} filename="board.ts" />
      <p className={`mt-4 ${BODY}`}>
        The Promise also resolves if the animation is replaced or stopped, or the entity is despawned. It never
        rejects.
      </p>
    </SubHeader>

    <SubHeader
      title="Pulses and stopping"
      description="repeat runs it again; yoyo plays every other run backwards. Together they make pulses and pops."
    >
      <Code code={engineAnimatePulseCode} filename="effects.ts" />
    </SubHeader>

    <SubHeader title="How animations behave">
      <ul className={`space-y-2 ${BODY}`}>
        <li>• Each entity runs one animation at a time. Starting a new one replaces the old one.</li>
        <li>
          • To animate position and scale with different timings, put the entity inside a{" "}
          <code>&quot;none&quot;</code> group and animate the group and the child separately.
        </li>
        <li>
          • For an attached entity, the target position and rotation are relative to its parent.
        </li>
        <li>• Animating position or rotation also moves the entity&apos;s physics body.</li>
        <li>• Animating scale changes how it looks, not an existing physics collider.</li>
      </ul>
    </SubHeader>

    <SubHeader
      title="Particle bursts"
      description="world.burst spawns many small, short-lived pieces in one call: explosions, sparks, dust and confetti."
    >
      <Code code={engineBurstCode} filename="effects.ts" />
    </SubHeader>

    <Attributes title="Burst options" data={burstOptionsAttributes} />

    <p className={BODY}>
      Particles are entities, so they count against the world&apos;s capacity. burst returns how many it spawned,
      which is fewer if the world is nearly full.
    </p>

    <SubHeader
      title="Camera shake"
      description="Set camera.shake to a strength in world units. It fades out by itself."
    >
      <Code code={engineShakeCode} filename="Game.tsx" />
      <p className={`mt-4 ${BODY}`}>
        More camera options are on the{" "}
        <Link href="/game-engine/rendering" className={`font-medium ${ACCENT_TEXT}`}>
          Rendering
        </Link>{" "}
        page.
      </p>
    </SubHeader>
  </Sidebar>
);

export default EngineAnimation;
