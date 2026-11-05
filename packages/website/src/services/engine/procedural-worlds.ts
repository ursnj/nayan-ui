import type { EngineGuide } from "./types";

export const ProceduralWorldGuides: EngineGuide[] = [
  {
    slug: "procedural-worlds",
    title: "Procedural worlds, field graphs and mesh recipes",
    description:
      "Describe terrain, scatter and walking rules as data, generate worlds natively, query and keep them, and build meshes from field recipes.",
    sections: [
      {
        id: "field-graphs",
        title: "Field graphs",
        paragraphs: [
          "A FieldGraph is a small graph of math and geometry nodes that the native core evaluates. Every method returns a FieldRef and accepts FieldRefs or plain numbers (FieldInput). A node can only refer to earlier nodes, so a graph can't loop. Shared nodes are computed once per sample point, and a graph holds at most 65,536 nodes.",
          "Recipes refer to fields by name: output(name, value) registers a field and returns its name. World fields read the local x and z; mesh and scatter fields read their own inputs through input(name). JavaScript only builds the graph, once. The core samples it on its own thread, so per-point work belongs in the graph, not in a JS loop.",
          "Shapes for distance, falloff and depth are points { x, z }, segments { ax, az, bx, bz } and boxes { x, z, halfX, halfZ, yaw }. Each also takes an offset (subtracted from the distance, default 0) and a width (the fade length used by falloff, default 1, must be positive).",
        ],
        table: {
          headers: ["Node", "Value"],
          rows: [
            [
              "x, z / input(name)",
              "Named inputs. Plain numbers become deduplicated constants and must be finite.",
            ],
            [
              "add, sub, mul, div, neg / sum(...), product(...)",
              "Arithmetic. sum and product chain any number of operands, left to right.",
            ],
            [
              "min(...), max(...), abs, sqrt, floor, fract, square",
              "Per-point math. fract(a) is a − floor(a).",
            ],
            [
              "sin, cos, exp, pow(a, b)",
              "Deterministic transcendental functions: the same value on every platform.",
            ],
            [
              "mix(a, b, t), clamp(a, lo, hi), smooth(a), hypot(...)",
              "Blend, clamp, Hermite smoothstep of a clamped to 0..1, and Euclidean length.",
            ],
            [
              "noise(x, z, period = 0)",
              "Smooth value noise in 0..1 on a unit lattice. A period makes it repeat every period cells in x.",
            ],
            [
              "sines(x, z, base, terms)",
              "base + Σ amp · sin(fx·x + fz·z + phase), terms as [fx, fz, phase, amp]: winding rivers, waves.",
            ],
            [
              "bumps(x, z, items, power = 2)",
              "Σ height · max(0, 1 − u² − v²)^power over ellipses [x, z, height, radiusU, radiusV, yaw]. power ≤ 16.",
            ],
            [
              "distance(x, z, shapes)",
              "Smallest signed distance to the shapes minus offset (negative inside a box). +∞ with no shapes.",
            ],
            [
              "falloff(x, z, shapes)",
              "Π smoothstep((distance − offset) / width): 0 at the shapes, 1 beyond their fade. Flattens areas.",
            ],
            [
              "depth(x, z, boxes)",
              "Largest depth inside any box (its smallest side clearance, minus offset). −∞ with no boxes.",
            ],
            [
              "select(test, le, gt)",
              "le where test ≤ 0, otherwise gt. The core evaluates only the chosen branch.",
            ],
            ["output(name, value)", "Names a field for recipes. Returns the name."],
          ],
        },
        examples: [
          {
            title: "A hilly island with a flattened path",
            description:
              "Use as the start of a world recipe. The island's height ends in a smooth coast. Hills flatten near the path, and select skips the land math at sea. Nothing is evaluated until a recipe uses the graph.",
            code: `import { FieldGraph } from "@nayan-ui/engine";

const route = { kind: "segment", ax: -30, az: 0, bx: 38, bz: 0 } as const;

export function islandFields() {
  const f = new FieldGraph();
  const { x, z } = f;
  const shore = f.sub(f.hypot(x, z), 40); // negative on the island
  const hills = f.mul(
    f.bumps(x, z, [[-15, 12, 5, 9, 7, 0.3], [14, -14, 4, 8, 8, 0]]),
    f.falloff(x, z, [{ ...route, offset: 2, width: 5 }]), // 0 on the path
  );
  const ripples = f.sines(x, z, 0, [[0.21, 0.13, 0, 0.2], [0.07, -0.18, 1.2, 0.3]]);
  const land = f.sum(1, hills, ripples, f.mul(f.noise(f.mul(x, 0.2), f.mul(z, 0.2)), 0.3));
  const coast = f.smooth(f.div(f.add(shore, 4), 6)); // 0 inland, 1 out at sea
  f.output("height", f.select(f.sub(shore, 2), f.mix(land, -1.5, coast), -1.5));
  f.output("path", f.distance(x, z, [{ ...route, offset: 1.5 }])); // negative on the path
  f.output("shore", shore);
  f.output("hills", hills);
  return f;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Fields use the graph's own units. For worlds those are world units in the recipe's local frame, so a distance of 1.5 is 1.5 units wide on screen.",
      },
      {
        id: "world-recipes",
        title: "World recipes",
        paragraphs: [
          "A WorldRecipe is plain data: a seed, an optional rotation, the field graph, terrain, platforms, solid templates, solids, walking rules and ordered steps. Fields, platforms and solids with frame: 'local' sit in a local frame, and rotation (radians) turns that frame into the world, so one recipe can give differently oriented worlds. Queries and generated positions always use world coordinates.",
          "terrain samples its height field on an axis × axis grid and draws it as triangles. The same triangles answer ground queries, so actors stand exactly on what is drawn. The axis may be uneven: fine where play happens, coarse under distant scenery. Regions are tested in order, and a point belongs to the first region whose field is ≤ 0, otherwise to the fallback. Triangles are split along each region's contour, so material edges follow curves rather than grid cells. Every material index becomes its own mesh.",
          "Platforms are axis-aligned decks in the local frame (bridges, piers). They replace the terrain's ground height and surface code under them. Solids block walkers between their bottom and top heights. A hull solid uses a template: the convex outline in x-z of a MeshRecipe, extruded over its height range, then scaled and turned. A rendered rock therefore blocks exactly its own outline.",
          "Game rules never go in the core: walkable ground, regions and placements are all fields and recipe data.",
        ],
        table: {
          headers: ["Recipe field", "Meaning"],
          rows: [
            [
              "seed / rotation",
              "Seeds every random stream. rotation turns the local frame into the world (default 0).",
            ],
            [
              "terrain.axis / height",
              "2 to 2049 strictly ascending grid lines for both axes, and the height field's name.",
            ],
            [
              "terrain.regions / fallback / materials",
              "{ field, surface, material } tested in order. Surface codes are 1..255 (0 means outside). Material indices are below materials.",
            ],
            [
              "terrain.uvSize / normalStep",
              "World units per texture repeat (default [1, 1]). Half-step of the normals' finite differences (default 0.15).",
            ],
            [
              "terrain.shade / tint",
              "An optional per-vertex brightness field, multiplied by tint (default [1, 1, 1]).",
            ],
            ["platforms", "{ x, z, halfX, halfZ, y, surface } in the local frame."],
            [
              "templates / solids",
              "Hull templates (MeshRecipe[]). Box, circle or hull solids with absolute bottom/top heights. frame defaults to 'world'.",
            ],
            [
              "walk.boundary / clearance",
              "Walkers stay this close to the origin, radius included. Ground is walkable where the clearance field is ≥ 0.",
            ],
            [
              "walk.footprint / step",
              "Rim samples (default 8, at most 64). Largest height change across a footprint: max(step[0], radius · step[1]), default [0.25, 0.5].",
            ],
            [
              "walk.height / lift / cell",
              "Solids overlapping lift..height above the ground block a walker (lift default 0.02). Solids' grid cell, default 8.",
            ],
          ],
        },
        examples: [
          {
            title: "Island terrain, a pier and a well",
            description:
              "Run once per world to describe it. Three materials (grass, sand, path), a walkable pier and two blockers. The template is a mesh recipe, such as the rock in Mesh recipes below. Add the generation steps from the next section before generating.",
            code: `import { FieldGraph, type MeshRecipe, type WorldRecipe } from "@nayan-ui/engine";

export const GRASS = 1, SAND = 2, PATH = 3, WOOD = 4; // surface codes; 0 means outside

export function islandRecipe(seed: number, rock: MeshRecipe): WorldRecipe {
  const f = new FieldGraph();
  const { x, z } = f;
  const shore = f.sub(f.hypot(x, z), 40);
  const route = { kind: "segment", ax: -30, az: 0, bx: 38, bz: 0 } as const;
  const hills = f.mul(f.bumps(x, z, [[-15, 12, 5, 9, 7, 0.3], [14, -14, 4, 8, 8, 0]]), f.falloff(x, z, [{ ...route, offset: 2, width: 5 }]));
  const land = f.sum(1, hills, f.mul(f.noise(f.mul(x, 0.2), f.mul(z, 0.2)), 0.3));
  f.output("height", f.mix(land, -1.5, f.smooth(f.div(f.add(shore, 4), 6))));
  f.output("path", f.distance(x, z, [{ ...route, offset: 1.5 }]));
  f.output("sand", f.add(shore, 3)); // the last 3 units before the water
  const pier = f.depth(x, z, [{ kind: "box", x: 44, z: 0, halfX: 6, halfZ: 1.5 }]);
  // Walkable: dry land below the hilltops, plus the pier's deck.
  f.output("clearance", f.max(f.min(f.neg(f.add(shore, 1)), f.sub(1.2, hills)), pier));
  return {
    seed,
    rotation: 0,
    fields: f,
    terrain: {
      axis: Array.from({ length: 65 }, (_, i) => -64 + i * 2),
      height: "height",
      uvSize: [4, 4],
      regions: [
        { field: "path", surface: PATH, material: 2 },
        { field: "sand", surface: SAND, material: 1 },
      ],
      fallback: { surface: GRASS, material: 0 },
      materials: 3,
    },
    platforms: [{ x: 44, z: 0, halfX: 6, halfZ: 1.5, y: 0.4, surface: WOOD }],
    templates: [rock],
    solids: [
      { kind: "circle", x: -6, z: 6, radius: 1.2, bottom: -5, top: 5 }, // a well
      { kind: "hull", template: 0, x: 10, y: 0.6, z: 10, scale: [2, 1.5, 2], yaw: 0.6 },
    ],
    walk: { boundary: 52, clearance: "clearance", height: 1.8 },
    steps: [{ kind: "spawn", near: [-20, 0], rings: 12, samples: 16, radius: 0.6, surfaces: [PATH, GRASS] }],
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Platforms change the ground and surface, not walkability. Raise the clearance field over a deck (max with a depth() of its box, as above), or walkers can't step onto a bridge over water.",
      },
      {
        id: "generation-steps",
        title: "Generation steps",
        paragraphs: [
          "Steps run in order, and each one sees what the earlier steps produced. A spawn filter needs a spawn step first. Scattered solids block the walkable filters, reach and picks that follow them. A reachable source and pick both need a reach step before them. A failing step, such as a pick that doesn't fit, makes generation throw with the core's message.",
          "A scatter step evaluates its layer for count items (count per anchor with source: { anchors }). Fields x and z place each item in frame (default 'world'), then filters drop items, y and attributes are recorded, and solid adds blockers. x and z can read i, count, the randoms r0… (at most 64), the anchor values a0…a15, and with source: 'reachable' a random reachable cell as sx and sz. From y onward, fields can also read the item's local x and z, its world wx and wz, and ground.",
          "Each scatter step draws from its own random stream, chosen by its position in the list. Layers that share a salt draw the same values, so a ring of boulders and the trees just inside it can line up. Inserting a step earlier in the list changes the streams of unsalted layers after it.",
        ],
        table: {
          headers: ["Step / option", "What it does"],
          rows: [
            [
              "spawn { near, rings, samples, radius, surfaces? }",
              "Searches rings 1 unit apart around a local point for walkable ground, optionally on given surfaces. Keeps near if none is found.",
            ],
            [
              "scatter (ScatterLayer)",
              "Seeded items saved as a named layer: [x, y, z, ...attributes] each.",
            ],
            [
              "reach { cell, steps, radius, extent }",
              "Flood-fills ground walkable from the spawn: cells cell apart, linked only through clear lattice steps cell / steps apart, within ±extent.",
            ],
            [
              "pick { groups, attempts = 8 }",
              "Reachable spots per group: count of them, spacing apart and at least fromSpawn from the spawn.",
            ],
            [
              "overview { size, extent }",
              "A size × size grid of surface codes over ±extent, at most 4096, with 0 outside the boundary.",
            ],
            [
              "filters",
              "field { field, min?, max? }, walkable { radius }, surface { surfaces }, spawn { minDistance }. Every filter must pass.",
            ],
            [
              "solid { variant?, shapes }",
              "Per item: none, circle { radius, bottom, top } or hull { template, scale, y, yaw }, all field names. variant picks the shape index; a negative or missing index adds nothing.",
            ],
          ],
        },
        examples: [
          {
            title: "Rocks, coins and grass tufts",
            description:
              "Call with the island recipe's graph (it reads the path field) and use the result as recipe.steps. It finds a spawn, scatters solid rocks away from the path, floods reachable ground, picks spaced coin and chest spots, and grows tufts only on reachable grass.",
            code: `import type { FieldGraph, WorldStep } from "@nayan-ui/engine";

export function islandSteps(f: FieldGraph): WorldStep[] {
  const r = (k: number) => f.input("r" + k);
  const ground = f.input("ground");
  const angle = f.mul(r(0), Math.PI * 2);
  const radius = f.mul(f.sqrt(r(1)), 36); // spread evenly over a disc
  f.output("rock.x", f.mul(f.cos(angle), radius));
  f.output("rock.z", f.mul(f.sin(angle), radius));
  f.output("rock.y", f.sub(ground, 0.1)); // sink the base a little
  f.output("rock.size", f.add(0.6, f.mul(r(2), 1.4)));
  f.output("rock.yaw", f.mul(r(3), Math.PI * 2));
  f.output("rock.template", 0);
  f.output("tuft.x", f.add(f.input("sx"), f.mul(f.sub(r(0), 0.5), 3)));
  f.output("tuft.z", f.add(f.input("sz"), f.mul(f.sub(r(1), 0.5), 3)));
  f.output("ground", ground);
  return [
    { kind: "spawn", near: [-20, 0], rings: 12, samples: 16, radius: 0.6 },
    {
      kind: "scatter", name: "rocks", count: 120, randoms: 4,
      x: "rock.x", z: "rock.z", y: "rock.y", attributes: ["rock.size", "rock.yaw"],
      filters: [{ kind: "spawn", minDistance: 6 }, { kind: "field", field: "path", min: 2 }, { kind: "walkable", radius: 1.5 }],
      solid: { shapes: [{ kind: "hull", template: "rock.template", scale: ["rock.size", "rock.size", "rock.size"], y: "rock.y", yaw: "rock.yaw" }] },
    },
    { kind: "reach", cell: 2, steps: 4, radius: 0.5, extent: 52 },
    { kind: "pick", groups: [{ name: "coins", count: 8, spacing: 8, fromSpawn: 6 }, { name: "chests", count: 2, spacing: 20, fromSpawn: 15 }] },
    {
      kind: "scatter", name: "tufts", count: 800, randoms: 2, source: "reachable",
      x: "tuft.x", z: "tuft.z", y: "ground",
      filters: [{ kind: "surface", surfaces: [1] }, { kind: "walkable", radius: 0.3 }],
    },
    { kind: "overview", size: 64, extent: 52 },
  ];
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "A scatter's x and z can't read the item's own position or ground. Those inputs only exist once the item is placed.",
      },
      {
        id: "generate-worlds",
        title: "Generate a world off the JS thread",
        paragraphs: [
          "generateWorldAsync(recipe, options) sends the recipe to the core, builds on a background native thread and resolves with a ProceduralWorld. generateWorld does the same work on the calling thread. The web's single-threaded WASM core builds immediately, even through the async call, so await warmUpEngine() first and show the loader before you call it.",
          "Build behind a loading screen, once per visit, never in onUpdate. A finished world reports spawn, restored, layers (each layer's stride and count) and picks (named Spot lists), and holds everything else in Rust until dispose().",
        ],
        table: {
          headers: ["WorldOptions", "Meaning"],
          rows: [
            [
              "key",
              "Saves the world under this storage key, and restores a world saved there from the same recipe.",
            ],
            [
              "prepareTerrain",
              "Also builds the terrain meshes during generation (on the background thread with generateWorldAsync), so terrain(material) returns at once. Default false.",
            ],
          ],
        },
        examples: [
          {
            title: "A hook that builds a world",
            description:
              "Use in the screen that loads a level. Expect null while it builds, then a ready world that's disposed on unmount or when the recipe changes. A build that finishes after unmount is disposed straight away.",
            code: `import { useEffect, useState } from "react";
import { generateWorldAsync, warmUpEngine, type ProceduralWorld, type WorldRecipe } from "@nayan-ui/engine";

export function useProceduralWorld(recipe: WorldRecipe, key?: string) {
  const [world, setWorld] = useState<ProceduralWorld | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let alive = true;
    let built: ProceduralWorld | undefined;
    warmUpEngine()
      .then(() => generateWorldAsync(recipe, { key, prepareTerrain: true }))
      .then((result) => {
        if (!alive) return result.dispose();
        built = result;
        setWorld(result);
      })
      .catch((reason: unknown) => {
        if (alive) setError(reason instanceof Error ? reason : new Error(String(reason)));
      });
    return () => {
      alive = false;
      built?.dispose();
      setWorld(null);
    };
  }, [recipe, key]);
  return { world, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Procedural worlds need the native core: they throw in Expo Go, and on an app build older than the module they ask you to rebuild it. Memoize the recipe (or build it from a seed) so the hook doesn't regenerate on every render.",
      },
      {
        id: "query-worlds",
        title: "Query, render and dispose a world",
        paragraphs: [
          "Queries take world coordinates and run in Rust, cheaply enough for every frame. ground is the drawn triangle's height (or a platform's y), so actors and scenery stand on exactly what is drawn. move sweeps a walker in small steps, stops just before contact and slides along it. It never ends inside a blocker or another body. canSee is a walker's test, not an optical one: water, steep steps and solids block it just as they block walking.",
          "terrain(material) returns a material's mesh in the recipe's local frame. Register it with createShape(..., { center: false }) and turn the entity by quat.y(recipe.rotation). Each material is handed over once, so keep the model rather than asking again. Layers come back as flat Float64Arrays of [x, y, z, ...attributes] in world coordinates. dispose() frees the world. It's safe to call twice, and every other method throws after it.",
        ],
        table: {
          headers: ["ProceduralWorld", "Returns"],
          rows: [
            [
              "ground(x, z) / surface(x, z) / platformAt(x, z)",
              "Ground height, surface code, and platform index (or -1).",
            ],
            [
              "field(name, x, z)",
              "Any named field of the recipe at a world point. Throws for an unknown name.",
            ],
            [
              "walkable(x, z, radius)",
              "Inside the boundary, clearance ≥ 0 under the footprint, within the step height, and clear of solids.",
            ],
            [
              "clearance(x, z, radius)",
              "Distance to the nearest boundary, clearance edge or solid, negative when blocked. It ignores step heights.",
            ],
            [
              "solidClearance(x, z, radius, bottom, top)",
              "Distance to solids overlapping one height band only: projectiles, cameras.",
            ],
            [
              "tilt(x, z, yaw = 0)",
              "A quaternion [x, y, z, w] turning up onto the ground's normal, expressed in a frame turned by yaw.",
            ],
            [
              "canSee(a, b, { radius = 0.25, step = 0.4, rise = Infinity })",
              "Whether a walker could go straight from a to b, sampled every step, with its ends at most rise apart in height.",
            ],
            [
              "move(point, dx, dz, radius, bodies = [])",
              "Sweeps point in place, sliding along obstacles and other bodies ({ x, z, radius }).",
            ],
            [
              "layer(name) / reachable() / overview()",
              "Scatter items, reachable cells as [x, z] pairs, and the overview's surface codes row by row from −extent.",
            ],
            [
              "picks / pick(run)",
              "The picked spots. pick(run) redraws them for a new run (0 = as generated), or returns false and keeps the old ones.",
            ],
            [
              "terrain(material) / dispose()",
              "A terrain mesh (once per material), and freeing the world.",
            ],
          ],
        },
        examples: [
          {
            title: "Walk, stand and look",
            description:
              "Call from GameView's onUpdate for each walker, passing the other walkers as bodies. The walker slides around rocks and stops at the water. It stands on the drawn ground, tilted to the slope, and canSee says whether a guard has a clear walking line to it.",
            code: `import { quat, type ProceduralWorld, type Spot, type Vec3 } from "@nayan-ui/engine";

export interface Walker extends Spot {
  radius: number;
  yaw: number;
}

export function stepWalker(land: ProceduralWorld, walker: Walker, others: readonly Walker[], speed: number, dt: number) {
  land.move(walker, Math.sin(walker.yaw) * speed * dt, Math.cos(walker.yaw) * speed * dt, walker.radius, others);
  const position: Vec3 = [walker.x, land.ground(walker.x, walker.z), walker.z];
  const rotation = quat.multiply(land.tilt(walker.x, walker.z), quat.y(walker.yaw)); // turn, then tilt
  return { position, rotation, onPier: land.platformAt(walker.x, walker.z) >= 0 };
}

export const guardSees = (land: ProceduralWorld, guard: Spot, target: Spot) =>
  land.canSee(guard, target, { radius: 0.3, rise: 1.5 });`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "Terrain and scattered rocks as entities",
            description:
              "Run once after generation, inside the scene's setup. Expect one textured entity per terrain material, turned into the world frame, plus a rock wherever the rocks layer placed one, standing on the ground it was placed on.",
            code: `import { createShape, quat, type Model, type ProceduralWorld, type Texture, type World, type WorldRecipe } from "@nayan-ui/engine";

export function spawnIsland(scene: World, land: ProceduralWorld, recipe: WorldRecipe, textures: readonly Texture[], rock: Model) {
  const turn = quat.y(recipe.rotation ?? 0); // terrain meshes are in the local frame
  for (let material = 0; material < recipe.terrain.materials; material++) {
    const mesh = createShape(land.terrain(material), { center: false });
    scene.spawn({ mesh, texture: textures[material] ?? null, rotation: turn, pickable: false });
  }
  const rocks = land.layer("rocks"); // [x, y, z, size, yaw] per rock
  const stride = land.layers.rocks?.stride ?? 5;
  for (let i = 0; i + stride <= rocks.length; i += stride) {
    const [x, y, z, size, yaw] = rocks.subarray(i, i + stride);
    scene.spawn({ mesh: rock, position: [x, y, z], scale: size, rotation: quat.y(yaw), pickable: false });
  }
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Render hull-template rocks with createShape(generateMesh(recipe), { center: false }). Centring moves the mesh away from the outline its solid blocks.",
      },
      {
        id: "keep-worlds",
        title: "Keep worlds between visits",
        paragraphs: [
          "With a key, the core saves a generated world and restores it on later builds from the same recipe. It saves the spawn, layers, scattered solids, reachable ground, picks and overview, so a restore skips every generation step and reports restored: true. The terrain grid is still sampled from the recipe, and its meshes are built only when asked for. Native builds store the record in the engine's cache directory, and the web in IndexedDB. A failed write costs the next visit a regeneration, never the game.",
          "A record is tied to its exact recipe: change a constant, reorder a step or change the seed, and the next build regenerates and overwrites it. Make keys with ProceduralCache.storageKey(key), which adds the cache's revision (procedural:<revision>:<key>), and prefix the key with the owning folder. isWorldKept(key) only reads a small marker written beside the record. It's cheap enough for choosing a loading label, but it doesn't compare recipes.",
          "Worldgen math is deterministic: the core uses its own sin, cos, exp, pow and noise, plus seeded random streams. A recipe gives the same world on iOS, Android and the WASM web core, and pick(run) gives the same spots for the same run.",
        ],
        examples: [
          {
            title: "Restore an island and its terrain models",
            description:
              "Call behind the loader, after warmUpEngine. The first visit generates the world and builds the terrain meshes, and later visits restore both without running the steps or rebuilding meshes. Bump the revision when the recipe code changes.",
            code: `import { ProceduralCache, createShape, generateWorldAsync, isWorldKept, type Model, type WorldRecipe } from "@nayan-ui/engine";

const cache = new ProceduralCache("island:4");

export async function openIsland(recipe: WorldRecipe, slot: number, onStatus: (label: string) => void) {
  const key = cache.storageKey("island/world:" + slot);
  onStatus(isWorldKept(key) ? "Loading island" : "Generating island");
  const terrainKey = "island/terrain:" + slot;
  const needsTerrain = cache.peek<Model[]>(terrainKey) === undefined;
  const land = await generateWorldAsync(recipe, { key, prepareTerrain: needsTerrain });
  const terrain = cache.get(terrainKey, () =>
    Array.from({ length: recipe.terrain.materials }, (_, material) => createShape(land.terrain(material), { center: false })),
  );
  return { land, terrain };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Keep one fixed seed per saved slot. A fresh random seed on every visit makes a new recipe each time, so nothing is ever restored.",
      },
      {
        id: "mesh-recipes",
        title: "Mesh recipes with generateMesh",
        paragraphs: [
          "generateMesh(recipe) builds geometry in the core from a MeshRecipe: a field graph plus parts. It returns Geometry, ready for merge, recolor or createShape, and the same recipe also works as a world's hull template. Every attribute is a named field: position, normal and color take three names each, and uv takes two. Normals aren't computed for you, so output unit normals.",
          "A surface part is a (rows + 1) × (cols + 1) grid reading u = col / cols, v = row / rows, row and col. Its front faces wind by dP/du × dP/dv, flip reverses them and double adds back faces. A cards part makes count flat polygons, each reading i, count and the seeded randoms r0… (at most 32). Its 3 or 4 corners [cu, cv, texU, texV] sit at center + right · cu + up · cv, with one normal and color per card. Use cards for blades, needles and debris.",
        ],
        table: {
          headers: ["MeshPart", "Fields and options"],
          rows: [
            ["surface", "rows, cols ≥ 1, position, normal, uv, color, double?, flip?"],
            ["cards", "count, seed, randoms, corners, center, right, up, normal, color, double?"],
            ["Limits", "2,000,000 vertices per recipe. A recipe that makes no triangles throws."],
          ],
        },
        examples: [
          {
            title: "A lumpy rock and a grass tuft",
            description:
              "Build both once, after warmUpEngine, and reuse the models. The rock is an outward-facing sphere grid with seam-free lumps and a flattened base, so it can also be a hull template. The tuft is 12 two-sided blades fanned at the golden angle, with seeded lean, height and shade.",
            code: `import { FieldGraph, createShape, generateMesh, type MeshRecipe } from "@nayan-ui/engine";

export function rockRecipe(seed: number): MeshRecipe {
  const f = new FieldGraph();
  const u = f.input("u"), v = f.input("v");
  const around = f.mul(u, Math.PI * 2), down = f.mul(v, Math.PI);
  const nx = f.mul(f.sin(down), f.cos(around)), ny = f.cos(down), nz = f.mul(f.sin(down), f.sin(around));
  const detail = f.sum(f.mul(f.sin(f.sum(f.mul(around, 3), f.mul(down, 4), seed)), 0.12), f.mul(f.noise(f.mul(u, 8), f.mul(v, 4), 8), 0.15));
  const lump = f.add(1, f.mul(f.sin(down), detail)); // no lumps at the poles; noise wraps in u
  f.output("px", f.mul(nx, lump));
  f.output("py", f.max(-0.3, f.product(ny, lump, 0.75))); // flat base
  f.output("pz", f.mul(nz, lump));
  f.output("nx", nx); f.output("ny", ny); f.output("nz", nz);
  f.output("tu", f.mul(u, 2)); f.output("tv", v);
  f.output("grey", 0.6);
  return {
    fields: f,
    parts: [{ kind: "surface", rows: 16, cols: 24, position: ["px", "py", "pz"], normal: ["nx", "ny", "nz"], uv: ["tu", "tv"], color: ["grey", "grey", "grey"] }],
  };
}

export function tuftRecipe(seed: number): MeshRecipe {
  const f = new FieldGraph();
  const r = (k: number) => f.input("r" + k);
  const angle = f.add(f.mul(f.input("i"), 2.399), r(0));
  const [cos, sin] = [f.cos(angle), f.sin(angle)];
  const half = f.mul(f.add(0.3, f.mul(r(1), 0.25)), 0.5); // half the blade's height
  const lean = f.add(0.15, f.mul(r(2), 0.3));
  const shade = f.add(0.7, f.mul(r(3), 0.3));
  f.output("cx", f.mul(cos, 0.05)); f.output("cy", half); f.output("cz", f.mul(sin, 0.05));
  f.output("rx", f.mul(sin, -0.03)); f.output("rz", f.mul(cos, 0.03));
  f.output("ux", f.product(cos, lean, half)); f.output("uz", f.product(sin, lean, half));
  f.output("zero", 0); f.output("one", 1);
  f.output("r", f.mul(shade, 0.3)); f.output("g", f.mul(shade, 0.6)); f.output("b", f.mul(shade, 0.2));
  return {
    fields: f,
    parts: [{
      kind: "cards", count: 12, seed, randoms: 4,
      corners: [[-1, -1, 0, 1], [1, -1, 1, 1], [1, 1, 1, 0], [-1, 1, 0, 0]],
      center: ["cx", "cy", "cz"], right: ["rx", "zero", "rz"], up: ["ux", "cy", "uz"],
      normal: ["zero", "one", "zero"], color: ["r", "g", "b"], double: true,
    }],
  };
}

export const rockModel = () => createShape(generateMesh(rockRecipe(7)), { center: false });
export const tuftModel = () => createShape(generateMesh(tuftRecipe(3)), { center: false });`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "field-functions",
        title: "Field-function colors for lathes, tubes and lofts",
        paragraphs: [
          "lathe, tube and loft tessellate in the core. Their per-point options also accept a FieldFunction, a field graph the core evaluates at every vertex, so detailed colors and displacement need no JS callback. Build one with a helper. The build callback receives the graph and the named inputs, and returns [r, g, b] (or one value for a displacement).",
          "Make side patterns repeat across u (equal at u = 0 and 1) to avoid a seam. noise(x, z, period) wraps when x runs over period cells. A FieldFunction can also repaint finished geometry in place through recolor(geometry, color).",
        ],
        table: {
          headers: ["Helper", "Inputs", "Used by"],
          rows: [
            [
              "surfaceColor",
              "u, v, x, y, z, nx, ny, nz",
              "lathe/tube color, loft/block/ellipsoid color, recolor",
            ],
            [
              "faceColor",
              "r (0 at the centre, 1 at the rim), angle",
              "lathe and tube capColor (round end faces)",
            ],
            [
              "sectionColor",
              "r (0 at the axis, 1 at the skin), y",
              "lathe cutColor (a partial sweep's cut faces)",
            ],
            [
              "surfaceDisplacement",
              "u (around), v (down the profile)",
              "lathe displace, along the normal",
            ],
          ],
        },
        examples: [
          {
            title: "A cut melon and a sawn log",
            description:
              "Build once during scene setup. The melon is a three-quarter lathe with striped, ribbed rind and flesh colored across its cut faces. The log is a tube whose end caps show tree rings, with bark noise that wraps around it.",
            code: `import { createShape, faceColor, lathe, sectionColor, surfaceColor, surfaceDisplacement, tube } from "@nayan-ui/engine";

const profile = Array.from({ length: 17 }, (_, i): [number, number] => {
  const a = (i / 16) * Math.PI; // [radius, height], top to bottom
  return [Math.sin(a) * 0.5, Math.cos(a) * 0.45];
});
const rind = surfaceColor((f, p) => {
  const stripe = f.smooth(f.mul(f.sub(f.abs(f.sin(f.mul(p.u, Math.PI * 12))), 0.6), 4));
  return [f.mix(0.3, 0.1, stripe), f.mix(0.6, 0.35, stripe), f.mix(0.2, 0.1, stripe)];
});
const ribs = surfaceDisplacement((f, p) => f.mul(f.cos(f.mul(p.u, Math.PI * 24)), 0.006));
const flesh = sectionColor((f, p) => {
  const edge = f.smooth(f.mul(f.sub(p.r, 0.88), 12)); // 1 near the skin
  return [f.mix(0.95, 0.85, edge), f.mix(0.3, 0.9, edge), f.mix(0.3, 0.6, edge)];
});
export const melon = () =>
  createShape(lathe(profile, { segments: 48, sweep: Math.PI * 1.5, color: rind, displace: ribs, cutColor: flesh }), { shine: 0.4 });

const bark = surfaceColor((f, p) => {
  const n = f.noise(f.mul(p.u, 12), f.mul(p.v, 6), 12); // period 12: no seam around the log
  return [f.add(0.25, f.mul(n, 0.15)), f.add(0.17, f.mul(n, 0.1)), f.add(0.1, f.mul(n, 0.06))];
});
const rings = faceColor((f, p) => {
  const dark = f.smooth(f.mul(f.sub(f.fract(f.mul(p.r, 6)), 0.75), 5));
  return [f.mix(0.85, 0.6, dark), f.mix(0.68, 0.45, dark), f.mix(0.45, 0.28, dark)];
});
export const log = () => createShape(tube([[0, 0, -1], [0, 0, 1]], { radius: 0.3, sides: 16, color: bark, capColor: rings }));`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "A FieldFunction keeps the whole mesh build in Rust. A JS color function runs once per vertex on the JS thread instead.",
      },
    ],
  },
];
