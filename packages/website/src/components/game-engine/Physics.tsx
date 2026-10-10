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
  engineColliderShapesCode,
  engineCollisionsCode,
  engineLayersCode,
  engineMovementCode,
  enginePlanarCode,
  engineRaycastCode,
} from "@/services/GameEngineCodeBlocks";
import {
  colliderDefaultsAttributes,
  collisionInfoAttributes,
  physicsOptionsAttributes,
  raycastHitAttributes,
} from "@/services/GameEngineData";

const EnginePhysics = () => (
  <Sidebar title="Physics">
    <DocsIntro lead="Physics is powered by Rapier, running natively. Add a body to an entity and it falls, collides, bounces and gets pushed around. The simulation steps at a fixed 60 Hz and the picture is smoothed between steps, so motion looks the same on any device." />

    <SubHeader title="Bodies" description="Three kinds, set with the physics option. The short form is just the type.">
      <Code code={engineBodiesCode} filename="level.ts" />
    </SubHeader>

    <Attributes title="Physics options" data={physicsOptionsAttributes} />

    <Attributes title="Default collider by mesh" data={colliderDefaultsAttributes} headers={{ name: "Mesh", type: "Collider", default: "Sized from" }} unit="mesh" />

    <SubHeader
      title="Collider shapes"
      description="Balls, boxes, cylinders, capsules and cones. By default the collider matches the mesh and is sized from its scale."
    >
      <Code code={engineColliderShapesCode} filename="level.ts" />
      <ul className={`mt-4 space-y-2 ${BODY}`}>
        <li>
          • Spheres get a ball, cylinders a cylinder, cones a cone and capsules a capsule. Tori get a flat cylinder.
          Everything else, models included, gets a box.
        </li>
        <li>
          • Pass <code>shape</code> with <code>radius</code>, <code>height</code> or <code>size</code> for a
          tighter fit.
        </li>
      </ul>
    </SubHeader>

    <SubHeader
      title="2D games"
      description="planar keeps a body in its XY plane: it moves in x and y and spins only around z."
    >
      <Code code={enginePlanarCode} filename="Jar.tsx" />
      <p className={`mt-4 ${BODY}`}>
        Your game keeps 2D rules while looking 3D: lit, shadowed, with real depth. Pair it with an orthographic
        camera looking down -z.
      </p>
    </SubHeader>

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

    <Attributes title="CollisionInfo" data={collisionInfoAttributes} headers={{ default: "" }} unit="field" />

    <SubHeader title="Moving bodies">
      <Code code={engineMovementCode} filename="player.ts" />
    </SubHeader>

    <SubHeader title="Raycasts" description="Find the first solid thing along a line: ground checks, line of sight, aiming.">
      <Code code={engineRaycastCode} filename="player.ts" />
    </SubHeader>

    <Attributes title="RaycastHit" data={raycastHitAttributes} headers={{ default: "" }} unit="field" />

    <SubHeader title="Change physics later">
      <Code code={engineChangePhysicsCode} filename="bird.ts" />
      <p className={`mt-4 ${BODY}`}>
        Colliders are sized from the entity&apos;s mesh and scale when the body is created. Scaling an entity
        afterwards changes how it looks, not its collider. Set physics again to resize it.
      </p>
    </SubHeader>
  </Sidebar>
);

export default EnginePhysics;
