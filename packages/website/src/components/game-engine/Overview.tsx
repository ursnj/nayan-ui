"use client";

import {
  Atom,
  BookOpen,
  Download,
  Gamepad2,
  Github,
  Joystick,
  Monitor,
  Rocket,
  Type,
  Volume2,
  Vibrate,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { CheckList, DocsIntro, FeatureCard } from "@/design/Primitives";
import { ACCENT_TEXT, BODY, BUTTON_SMALL } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { engineGameLoopCode } from "@/services/GameEngineCodeBlocks";
import { REPO_URL } from "@/services/seo";

const FEATURES = [
  {
    icon: Gamepad2,
    title: "World & entities",
    body: "Spawn, move and despawn thousands of objects. Lifetimes, chasing, bobbing and nested groups built in.",
    chips: ["spawn", "lifetime", "follow", "groups"],
  },
  {
    icon: Atom,
    title: "Real physics",
    body: "Rapier rigid bodies with gravity, friction, bounce, impulses, collision layers, sensors and raycasts. Planar bodies for 2D games.",
    chips: ["dynamic", "kinematic", "fixed", "2D"],
  },
  {
    icon: Monitor,
    title: "Fast 3D rendering",
    body: "WebGPU with eight built-in shapes, soft shadows, fog and transparency. Load glTF models; every object of the same shape is drawn in one call.",
    chips: ["glTF", "shadows", "ortho", "4x MSAA"],
  },
  {
    icon: WandSparkles,
    title: "Animation & effects",
    body: "Tween position, rotation, scale and color with easings, and await the result. Particle bursts and camera shake.",
    chips: ["animate", "easings", "burst", "shake"],
  },
  {
    icon: Type,
    title: "Text & textures",
    body: "3D text from TTF and OTF fonts for scores and labels. PNG and JPEG textures, with atlas regions for cards and sprites.",
    chips: ["loadFont", "loadTexture", "atlas"],
  },
  {
    icon: Volume2,
    title: "Sound",
    body: "A low-latency mixer: effects, looping music, pitch and stereo pan. Impact sounds play straight from physics.",
    chips: ["WAV", "music", "pan", "pitch"],
  },
  {
    icon: Vibrate,
    title: "Haptics",
    body: "Taps with any intensity and sharpness, ready-made patterns, and vibration that scales with impact speed.",
    chips: ["impact", "notify", "patterns"],
  },
  {
    icon: Joystick,
    title: "Touch input",
    body: "Taps, swipes and drags on the game view, tap-to-pick 3D objects, and a drop-in on-screen joystick.",
    chips: ["tap", "swipe", "pick", "joystick"],
  },
];

const EngineOverview = () => (
  <Sidebar title="Game Engine">
    <DocsIntro
      lead={
        <>
          <code>@nayan-ui/engine</code> is a 3D game engine for React Native. You write your game in
          TypeScript; physics, sound, haptics and the simulation run in a native Rust core, and drawing
          happens on the GPU through WebGPU. It is built for smooth 60 fps games on phones.
        </>
      }
      actions={
        <>
          <Link href="/game-engine/installation" className={BUTTON_SMALL}>
            <Download aria-hidden className="mr-2 h-4 w-4" />
            Installation
          </Link>
          <Link href="/game-engine/quick-start" className={BUTTON_SMALL}>
            <Rocket aria-hidden className="mr-2 h-4 w-4" />
            Quick start
          </Link>
          <Link href="/game-engine/api-reference" className={BUTTON_SMALL}>
            <BookOpen aria-hidden className="mr-2 h-4 w-4" />
            API reference
          </Link>
          <Link
            href={`${REPO_URL}/tree/main/packages/engine`}
            target="_blank"
            rel="noopener noreferrer"
            className={BUTTON_SMALL}
          >
            <Github aria-hidden className="mr-2 h-4 w-4" />
            Source
          </Link>
        </>
      }
      facts={[
        { value: "iOS + Android", label: "Native Rust core" },
        { value: "60 Hz", label: "Fixed-step simulation" },
        { value: "Rapier", label: "Physics engine" },
        { value: "~7.5 MB", label: "Added to your app" },
      ]}
    />

    <SubHeader title="What's inside" description="Everything a typical mobile game needs, in one package.">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </SubHeader>

    <SubHeader
      title="How a game looks"
      description="A world holds your objects, GameView draws it, and onUpdate is your game loop: read input, step the world, react to collisions, move the camera."
    >
      <Code code={engineGameLoopCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Why it's fast">
      <CheckList
        items={[
          "Physics and simulation run in Rust, not in JavaScript.",
          "The renderer reads object positions straight from Rust memory: nothing is copied each frame.",
          "Objects that share a shape are drawn together in a single GPU call.",
          "Sound is mixed on its own thread, so a busy frame never stutters the audio.",
        ]}
      />
    </SubHeader>

    <SubHeader title="Good to know" description="Current status and limits, so there are no surprises.">
      <ul className={`space-y-2 ${BODY}`}>
        <li>• Runs on iOS and Android (8.0 or newer).</li>
        <li>• Needs a development build: Expo Go can&apos;t load native code.</li>
        <li>
          • Draws built-in shapes, glTF models and 3D text, with colors, textures and transparency. Skinned
          (animated) glTF models aren&apos;t supported yet.
        </li>
        <li>• Sounds are WAV files.</li>
      </ul>
      <p className={`mt-4 ${BODY}`}>
        Ready to try it?{" "}
        <Link href="/game-engine/quick-start" className={`font-medium ${ACCENT_TEXT}`}>
          Build a first game in a few minutes
        </Link>
        .
      </p>
    </SubHeader>
  </Sidebar>
);

export default EngineOverview;
