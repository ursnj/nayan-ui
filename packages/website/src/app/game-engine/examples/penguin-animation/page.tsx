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
// The complete scene includes Playtura's procedural meshes, rig, ten clips, and useWorld setup.
const source = readFileSync(
  path.join(process.cwd(), "src/components/examples/penguin-animation/PenguinScene.tsx"),
  "utf8",
);

export default function PenguinAnimationPage() {
  return (
    <Sidebar title="Penguin Animation">
      <p className={`mb-8 mt-4 max-w-2xl ${LEAD}`}>
        The penguin from Playtura’s Penguin Run, built entirely with Nayan Game Engine’s procedural
        geometry. Try all ten animations, slow down the action, or drag the scene to see it from
        every angle.
      </p>
      <PenguinAnimation source={source} />
      <section className="mt-12 space-y-4" aria-labelledby="penguin-setup-heading">
        <h2 id="penguin-setup-heading" className={H2}>
          Build your own penguin scene
        </h2>
        <p className={LEAD}>
          Install <code>@nayan-ui/engine</code>, copy the complete scene from the Code tab, and
          render it in a container with a fixed height. Every mesh, color, rig part, and animation
          is included. <code>useWorld</code> handles engine startup and cleanup, and native
          keyframes animate the penguin.
        </p>
        <p className="text-sm text-muted">
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
        </p>
      </section>
    </Sidebar>
  );
}
