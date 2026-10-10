"use client";

import Link from "next/link";
import { DocsIntro } from "@/design/Primitives";
import { ACCENT_TEXT, BODY } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import SubHeader from "@/components/helpers/SubHeader";
import { engineGameLoopCode, engineQuickStartCode } from "@/services/GameEngineCodeBlocks";

const NEXT = [
  { href: "/game-engine/world", label: "World & entities", text: "spawn, move and remove objects" },
  { href: "/game-engine/physics", label: "Physics", text: "bodies, collisions and raycasts" },
  { href: "/game-engine/rendering", label: "Rendering", text: "camera, light, shadows and fog" },
  { href: "/game-engine/models", label: "3D models", text: "load glTF models" },
  { href: "/game-engine/animation", label: "Animation & effects", text: "tweens, particle bursts and camera shake" },
  { href: "/game-engine/text-textures", label: "Text & textures", text: "3D text, images and transparency" },
  { href: "/game-engine/audio-haptics", label: "Audio & haptics", text: "sound effects, music and vibration" },
  { href: "/game-engine/input", label: "Input", text: "taps, swipes, drags, picking and the joystick" },
];

const EngineQuickStart = () => (
  <Sidebar title="Quick Start">
    <DocsIntro lead="Twenty balls dropping onto a floor and bouncing off each other: a complete, physically simulated scene in about thirty lines." />

    <SubHeader title="Your first game" description="Add this screen to your app and run it.">
      <Code code={engineQuickStartCode} filename="BouncingBalls.tsx" />
    </SubHeader>

    <SubHeader title="What's happening">
      <ul className={`space-y-2 ${BODY}`}>
        <li>
          • <strong>World</strong> holds every object. Its capacity is fixed when you create it.
        </li>
        <li>
          • <strong>spawn</strong> adds an object. <code>physics: &quot;dynamic&quot;</code> hands it to the
          physics engine; <code>&quot;fixed&quot;</code> makes it a static floor.
        </li>
        <li>
          • <strong>GameView</strong> draws the world on the GPU and calls <code>onUpdate</code> every
          frame.
        </li>
        <li>
          • <strong>world.update(dt)</strong> advances the simulation. It runs in fixed 60 Hz steps, so
          physics behaves the same at any frame rate.
        </li>
        <li>
          • <strong>dispose</strong> frees the native memory when the screen closes.
        </li>
      </ul>
    </SubHeader>

    <SubHeader
      title="The game loop"
      description="Real games do a little more each frame. This order works for almost everything."
    >
      <Code code={engineGameLoopCode} filename="Game.tsx" />
    </SubHeader>

    <SubHeader title="Next steps">
      <ul className={`space-y-2 ${BODY}`}>
        {NEXT.map((item) => (
          <li key={item.href}>
            •{" "}
            <Link href={item.href} className={`font-medium ${ACCENT_TEXT}`}>
              {item.label}
            </Link>{" "}
            — {item.text}
          </li>
        ))}
      </ul>
    </SubHeader>
  </Sidebar>
);

export default EngineQuickStart;
