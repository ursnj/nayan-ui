export const engineNavigation = [
  {
    slug: "overview",
    title: "Nayan Engine",
    description:
      "Create objects, draw them, and react to player input. Learn the shared engine API through a complete game and small practical examples.",
    link: "/engine",
  },
  {
    slug: "installation",
    title: "Installation and platform setup",
    description:
      "Install the engine, select the correct platform entry, prepare native development builds, and serve browser WASM assets correctly.",
    link: "/engine/installation",
  },
  {
    slug: "first-game",
    title: "Build your first game",
    description:
      "Make a complete tap-to-collect game with a shared scene, initialization hook, and React or React Native screen.",
    link: "/engine/first-game",
  },
  {
    slug: "react",
    title: "React browser quickstart",
    description:
      "A complete scene, an initialization hook with cleanup, and a platform host. Tap the bouncing ball to apply an impulse; pause and resume without replacing the world.",
    link: "/engine/react",
  },
  {
    slug: "react-native",
    title: "React Native quickstart",
    description:
      "A complete scene, an initialization hook with cleanup, and a platform host. Tap the bouncing ball to apply an impulse; pause and resume without replacing the world.",
    link: "/engine/react-native",
  },
  {
    slug: "recipes",
    title: "Common game recipes",
    description:
      "Copy focused examples for movement, collisions, pickups, input, scoring, animation, timers and reusable models.",
    link: "/engine/recipes",
  },
  {
    slug: "agent-guide",
    title: "Engine guide for AI agents",
    description:
      "Exact engine patterns, a reusable implementation prompt and concrete checks for coding agents.",
    link: "/engine/agent-guide",
  },
  {
    slug: "world-entities",
    title: "Worlds, entities and lifecycle",
    description:
      "Create fixed-capacity worlds, compose reusable entities, drive motion and parent transforms, and release each world predictably.",
    link: "/engine/world-entities",
  },
  {
    slug: "game-view",
    title: "GameView, quality and overlays",
    description:
      "Configure the shared frame loop, rendering surface, errors, performance reporting and screen-space engine UI.",
    link: "/engine/game-view",
  },
  {
    slug: "camera-lighting",
    title: "Camera, light, fog and materials",
    description:
      "Build perspective, orthographic and following cameras, then tune directional lighting, shadows and material color.",
    link: "/engine/camera-lighting",
  },
  {
    slug: "physics-collisions",
    title: "Physics, collisions and raycasts",
    description:
      "Use Rapier rigid bodies, custom colliders, collision layers, sensors, impulses and world-space raycasts through the shared API.",
    link: "/engine/physics-collisions",
  },
  {
    slug: "animation",
    title: "Transform animation and springs",
    description:
      "Animate positions, rotations, scales and colors in the core, including keyframes, staggered groups, loops, relative turns and interruptible springs.",
    link: "/engine/animation",
  },
  {
    slug: "skeletal-animation",
    title: "Skeletal models and animation clips",
    description:
      "Load a rig once, play embedded GLB clips independently on entities, crossfade poses, and sample selected animated vertices for grounding and attachments.",
    link: "/engine/skeletal-animation",
  },
  {
    slug: "input-picking",
    title: "Gestures, joystick and picking",
    description:
      "Use the same gesture API for browser pointers and native touches, pick rendered entities, and convert between screen coordinates and world space.",
    link: "/engine/input-picking",
  },
  {
    slug: "particles",
    title: "Particles, smoke and emissive effects",
    description:
      "Spawn core-simulated bursts with built-in or reusable custom meshes, directional spread, lifetime color changes and expanding smoke.",
    link: "/engine/particles",
  },
  {
    slug: "models-textures",
    title: "Models, textures and asset loading",
    description:
      "Load cached GLB/glTF meshes and PNG/JPEG textures on both hosts, understand material limits, and use normalized texture regions.",
    link: "/engine/models-textures",
  },
  {
    slug: "text-fonts",
    title: "Fonts, text and measurement",
    description:
      "Draw flat or extruded text in the scene or HUD, preload useful glyphs, measure strings and keep changing scores aligned.",
    link: "/engine/text-fonts",
  },
  {
    slug: "procedural-geometry",
    title: "Paths, extrusion, lathe and tube geometry",
    description:
      "Build reusable meshes from outlines and profiles, combine parts, color surfaces and control normals without creating new meshes every frame.",
    link: "/engine/procedural-geometry",
  },
  {
    slug: "surfaces-lofts",
    title: "Parametric surfaces, lofts and deformation",
    description:
      "Author terrain, curved shells, rounded blocks and ellipsoids with controlled tessellation, UVs and reusable interpolation functions.",
    link: "/engine/surfaces-lofts",
  },
  {
    slug: "solid-modelling",
    title: "Solid modelling, optimization and LOD",
    description:
      "Use immutable solid recipes for boolean forms and seeded displacement, then tessellate, optimize and reuse static geometry.",
    link: "/engine/solid-modelling",
  },
  {
    slug: "scoreboard-timers",
    title: "Scoreboards and game-time timers",
    description:
      "Keep scores, lives and clocks in the shared core, dispatch UI events during update, and schedule callbacks that pause with the game.",
    link: "/engine/scoreboard-timers",
  },
  {
    slug: "audio-haptics",
    title: "Audio, impact feedback and haptics",
    description:
      "Load WAV banks, manage individual voices and global preferences, and respect differences between native feedback and browser capabilities.",
    link: "/engine/audio-haptics",
  },
  {
    slug: "cache-performance",
    title: "Procedural cache and performance",
    description:
      "Persist deterministic static meshes, batch transform updates, observe capacity limits, and keep the frame loop free of asset construction.",
    link: "/engine/cache-performance",
  },
  {
    slug: "render-source",
    title: "Custom RenderSource integration",
    description:
      "Feed GameView from a custom simulation using the same instance-buffer layout, or use World as the supported high-level source.",
    link: "/engine/render-source",
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting and deployment",
    description:
      "Diagnose initialization, asset, layout, input and lifecycle failures on React and React Native without changing the shared gameplay API.",
    link: "/engine/troubleshooting",
  },
  {
    slug: "api-reference",
    title: "Public API reference",
    description:
      "Every public runtime export and TypeScript type, with source-derived signatures and links to detailed guides.",
    link: "/engine/api-reference",
  },
];
