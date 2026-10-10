"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineAttachCode,
  engineDisposeCode,
  engineLifetimeCode,
  engineQueryCode,
  engineSpawnCode,
  engineTransformCode,
} from "@/services/GameEngineCodeBlocks";
import { spawnOptionsAttributes } from "@/services/GameEngineData";

const EngineWorld = () => (
  <Sidebar title="World & Entities">
    <DocsIntro lead="A World holds every object in your game. Each object is an entity: a shape with a position, a color and, optionally, physics. You get back a small handle to change or remove it later." />

    <SubHeader
      title="Create and spawn"
      description="Pick a capacity that covers the most objects you'll have at once, particles included."
    >
      <Code code={engineSpawnCode} filename="world.ts" />
    </SubHeader>

    <Attributes title="Spawn options" data={spawnOptionsAttributes} />

    <SubHeader
      title="Move and change"
      description="Every setter takes the entity handle. Handles of despawned entities are safely ignored."
    >
      <Code code={engineTransformCode} filename="world.ts" />
    </SubHeader>

    <SubHeader
      title="Lifetimes"
      description="Give particles, bullets and effects a lifetime instead of tracking them yourself."
    >
      <Code code={engineLifetimeCode} filename="effects.ts" />
    </SubHeader>

    <SubHeader
      title="Attached parts"
      description="Build an object from several shapes. Children follow their parent exactly and are removed with it."
    >
      <Code code={engineAttachCode} filename="bird.ts" />
      <p className={`mt-4 ${BODY}`}>
        Attachments are one level deep, and attached parts are visual only: put physics on the parent.
      </p>
    </SubHeader>

    <SubHeader title="Read state">
      <Code code={engineQueryCode} filename="world.ts" />
    </SubHeader>

    <SubHeader title="Clean up" description="A world owns native memory. Dispose it when the screen closes.">
      <Code code={engineDisposeCode} filename="Game.tsx" />
    </SubHeader>
  </Sidebar>
);

export default EngineWorld;
