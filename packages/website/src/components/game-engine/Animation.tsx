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
  engineAnimateTogetherCode,
  engineBurstCode,
  engineKeyframesCode,
  engineRelativeCode,
  engineShakeAnimCode,
  engineShakeCode,
  engineSpringCode,
  engineStaggerCode,
} from "@/services/GameEngineCodeBlocks";
import {
  animateOptionsAttributes,
  animateTargetAttributes,
  burstOptionsAttributes,
  easingAttributes,
  springAttributes,
} from "@/services/GameEngineData";

const EngineAnimation = () => (
  <Sidebar title="Animation & Effects">
    <DocsIntro lead="Slide pieces, hop them in arcs, spin cards, reveal boards, follow fingers on springs, throw confetti and shake the screen. Animations and particles run in the Rust core: no code in your game loop, and one native call however many entities you animate." />

    <SubHeader
      title="Animate"
      description="world.animate moves an entity from where it is now to a target position, rotation, scale or color."
    >
      <Code code={engineAnimateCode} filename="board.ts" />
    </SubHeader>

    <Attributes title="What to animate" data={animateTargetAttributes} />

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

    <SubHeader
      title="Several at once"
      description="Position, rotation, scale, color and shake are separate tracks, so they run side by side."
    >
      <Code code={engineAnimateTogetherCode} filename="piece.ts" />
    </SubHeader>

    <SubHeader title="Keyframes and curves" description="Pass an array of targets to pass through them in order.">
      <Code code={engineKeyframesCode} filename="piece.ts" />
    </SubHeader>

    <SubHeader title="Turn and move by" description="Relative animations: turn by angles (any amount) or move by an offset.">
      <Code code={engineRelativeCode} filename="effects.ts" />
    </SubHeader>

    <SubHeader
      title="Springs"
      description="Natural motion with no fixed duration. Retarget a moving spring and it carries on smoothly."
    >
      <Code code={engineSpringCode} filename="Game.tsx" />
    </SubHeader>

    <Attributes title="Spring options" data={springAttributes} />

    <SubHeader title="Stagger" description="Animate many entities in one call, each starting a little after the last.">
      <Code code={engineStaggerCode} filename="board.ts" />
    </SubHeader>

    <SubHeader title="Shake">
      <Code code={engineShakeAnimCode} filename="board.ts" />
    </SubHeader>

    <SubHeader title="How animations behave">
      <ul className={`space-y-2 ${BODY}`}>
        <li>
          • Animating a property again replaces only that property on that entity; other properties keep
          animating.
        </li>
        <li>• The Promise resolves once every entity and property in that call has finished.</li>
        <li>• Cheap: 10,000 entities with looping keyframe animations take about 0.7 ms per update on a desktop CPU.</li>
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
