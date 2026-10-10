"use client";

import { DocsIntro } from "@/design/Primitives";
import { BODY } from "@/design/system";
import Attributes from "@/components/helpers/Attributes";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import {
  engineBodiesCode,
  engineChangePhysicsCode,
  engineCollisionsCode,
  engineLayersCode,
  engineMovementCode,
  engineRaycastCode,
} from "@/services/GameEngineCodeBlocks";
import { bodyOptionsAttributes, colliderOptionsAttributes } from "@/services/GameEngineData";

const EnginePhysics = () => (
  <Sidebar title="Physics">
    <DocsIntro lead="Physics is powered by Rapier, running natively. Add a body to an entity and it falls, collides, bounces and gets pushed around. The simulation steps at a fixed 60 Hz and the picture is smoothed between steps, so motion looks the same on any device." />

    <SubHeader title="Bodies" description="Three kinds, set with the body option when spawning.">
      <Code code={engineBodiesCode} filename="level.ts" />
    </SubHeader>

    <Attributes title="Body options" data={bodyOptionsAttributes} />
    <Attributes title="Collider options" data={colliderOptionsAttributes} />

    <SubHeader
      title="Collision layers"
      description="Layers decide what can touch what. Use one bit per kind of object."
    >
      <Code code={engineLayersCode} filename="layers.ts" />
    </SubHeader>

    <SubHeader
      title="Collisions"
      description="After world.update, loop over the contacts that started or ended during that update."
    >
      <Code code={engineCollisionsCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Moving bodies">
      <Code code={engineMovementCode} filename="player.ts" />
    </SubHeader>

    <SubHeader title="Raycasts" description="Find the first solid thing along a line: ground checks, line of sight, aiming.">
      <Code code={engineRaycastCode} filename="player.ts" />
    </SubHeader>

    <SubHeader title="Change physics later">
      <Code code={engineChangePhysicsCode} filename="bird.ts" />
      <p className={`mt-4 ${BODY}`}>
        Collider shapes are balls and boxes for now. Scaling an entity afterwards changes how it looks,
        not its collider: set the size when you spawn it.
      </p>
    </SubHeader>
  </Sidebar>
);

export default EnginePhysics;
