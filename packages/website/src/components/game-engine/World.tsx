"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineAccelerationCode,
  engineAttachCode,
  engineDisposeCode,
  engineGroupsCode,
  engineLifetimeCode,
  engineQueryCode,
  engineSpawnCode,
  engineTransformCode,
} from "@/services/GameEngineCodeBlocks";
import {
  bobAttributes,
  entityOptionsAttributes,
  followAttributes,
  nullableOptionsAttributes,
  worldMethodsAttributes,
  worldPropertiesAttributes,
} from "@/services/GameEngineData";

const EngineWorld = () => (
  <Sidebar title="World & Entities">
    <DocsIntro lead="A World holds every object in your game. Each object is an entity: a shape, model or piece of text with a position, a color and, optionally, physics. spawn creates one and set changes it; both take the same options, and each is a single fast call into the engine." />

    <SubHeader
      title="Create and spawn"
      description="Pick a capacity that covers the most objects you'll have at once, particles included."
    >
      <Code code={engineSpawnCode} filename="world.ts" />
    </SubHeader>

    <Attributes title="Entity options" data={entityOptionsAttributes} />

    <Attributes title="Bob options" data={bobAttributes} />

    <Attributes title="Follow options" data={followAttributes} />

    <SubHeader
      title="Change entities"
      description="world.set takes the same options as spawn. Only what you pass changes, and null removes something. Handles of despawned entities are safely ignored."
    >
      <Code code={engineTransformCode} filename="world.ts" />
    </SubHeader>

    <Attributes title="Removing with null" data={nullableOptionsAttributes} headers={{ name: "Option", type: "In", default: "" }} unit="option" />

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
        Attached parts are visual only: put physics on the parent.
      </p>
    </SubHeader>

    <SubHeader
      title="Groups"
      description='Attachments nest to any depth. Use mesh: "none" for an invisible group or pivot.'
    >
      <Code code={engineGroupsCode} filename="windmill.ts" />
      <ul className={`mt-4 space-y-2 ${BODY}`}>
        <li>
          • Children move, turn and scale with their parent. A child&apos;s position, rotation and scale are in
          its parent&apos;s space.
        </li>
        <li>
          • Because children inherit scale, a rotated child under a parent with uneven scale gets stretched. Keep
          the parent&apos;s scale even, or use a <code>&quot;none&quot;</code> group as the parent.
        </li>
        <li>• Despawning a group despawns everything inside it.</li>
      </ul>
    </SubHeader>

    <SubHeader
      title="Acceleration and picking"
      description="acceleration bends motion over time for entities without a dynamic body. pickable decides whether taps can hit an entity."
    >
      <Code code={engineAccelerationCode} filename="effects.ts" />
    </SubHeader>

    <SubHeader title="Read state">
      <Code code={engineQueryCode} filename="world.ts" />
    </SubHeader>

    <Attributes title="World methods" data={worldMethodsAttributes} headers={{ type: "Returns", default: "" }} unit="method" />

    <Attributes title="World properties" data={worldPropertiesAttributes} unit="property" />

    <SubHeader title="Clean up" description="A world owns native memory. Dispose it when the screen closes.">
      <Code code={engineDisposeCode} filename="Game.tsx" />
    </SubHeader>
  </Sidebar>
);

export default EngineWorld;
