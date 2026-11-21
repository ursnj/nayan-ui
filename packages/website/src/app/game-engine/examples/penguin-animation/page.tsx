import { NText, NView } from 'nayan-ui/components';
import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import PenguinAnimation from "@/components/examples/penguin-animation/PenguinAnimation";
import Sidebar from "@/components/helpers/Sidebar";
import { H2, LEAD } from "@/design/system";
import { buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Procedural Penguin Animation with Nayan Game Engine",
  description:
    "Playtura’s procedural 3D penguin, with ten native keyframe animations: idle, walk, run, jump, slide, punch, jab, hit, dance and dying. Interactive React example with complete source code.",
  path: "/game-engine/examples/penguin-animation",
});
// The complete scene includes procedural meshes, attached hip/heel joints, ten clips and useWorld.
const source = readFileSync(
  path.join(process.cwd(), "src/components/examples/penguin-animation/PenguinScene.tsx"),
  "utf8",
);

export default function PenguinAnimationPage() {
  return (
    <Sidebar title="Penguin Animation">
      <NText tag="p" className={`mb-8 mt-4 max-w-2xl ${LEAD}`}>
        The penguin from Playtura’s Penguin Run, built entirely with Nayan Game Engine’s procedural
        geometry. Try all ten animations, slow down the action, or drag the scene to see it from
        every angle.
      </NText>
      <PenguinAnimation source={source} />
      <NView tag="section" className="mt-12 space-y-4" aria-labelledby="penguin-setup-heading">
        <NText tag="h2" id="penguin-setup-heading" className={H2}>
          Build your own penguin scene
        </NText>
        <NText tag="p" className={LEAD}>
          Install <NText tag="code">nayan-ui</NText>, copy the complete scene from the Code tab, and
          render it in a container with a fixed height. Every mesh, color, rig part, and animation
          is included. <NText tag="code">useWorld</NText> handles engine startup and cleanup, and native
          keyframes animate the penguin.
        </NText>
        <NText tag="p" className="text-sm text-muted">
          Explore{" "}
          <Link
            href="/game-engine/surfaces-lofts"
            className="text-indigo-600 dark:text-indigo-400 underline"
          >
            procedural surfaces
          </Link>{" "}
          and{" "}
          <Link
            href="/game-engine/animation"
            className="text-indigo-600 dark:text-indigo-400 underline"
          >
            keyframe animations
          </Link>{" "}
          to create your own characters.
        </NText>
      </NView>
    </Sidebar>
  );
}
