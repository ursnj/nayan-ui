import { LOGOS, type LogoId } from "@/components/examples/logos";
import LogoAnimation from "@/components/examples/LogoAnimation";
import Code from "@/components/helpers/Code";
import Link from "next/link";
import Sidebar from "@/components/helpers/Sidebar";
import { H2, LEAD } from "@/design/system";
import { buildPageMetadata } from "@/services/seo";
import { readFileSync } from "node:fs";
import path from "node:path";

export const metadata = buildPageMetadata({
  title: "Company Logo Animations with Nayan Game Engine",
  description: `Explore ${LOGOS.length} animated company logos including Microsoft, Google, Cisco, Telegram and Xbox. Try live React examples built with Nayan Game Engine, with playback controls and source code.`,
  path: "/game-engine/examples/logo-animation",
});

// Complete standalone sources include the continuous Google G and the Playtua controller.
const sources = Object.fromEntries(
  LOGOS.map((logo) => [
    logo.id,
    readFileSync(
      path.join(process.cwd(), "src/components/examples/logos", `${logo.id}.tsx`),
      "utf8",
    ),
  ]),
) as Record<LogoId, string>;

export default function LogoAnimationPage() {
  return (
    <Sidebar title="Logo Animation">
      <p className={`mb-8 mt-4 max-w-2xl ${LEAD}`}>
        Explore {LOGOS.length} famous company logos, brought to life with 3D shapes. Each logo has
        its own signature animation. Choose a company below to preview it, see the complete code, or
        export an animated WebP.
      </p>
      <LogoAnimation sources={sources} />
      <section id="setup" className="mt-12 scroll-mt-24 space-y-4" aria-labelledby="source-heading">
        <h2 id="source-heading" className={H2}>
          Build it with Nayan Game Engine
        </h2>
        <p className={LEAD}>
          Install the engine, then copy the complete component from a logo’s Code tab into your
          React app. Each example includes its geometry, animation loop, and engine setup. Render
          the component inside a container with a fixed height.
        </p>
        <Code code="npm install @nayan-ui/engine" language="bash" filename="Terminal" />
        <p className="text-sm text-muted">
          Learn more about{" "}
          <Link
            href="/game-engine/world-entities"
            className="text-indigo-600 dark:text-indigo-400 underline"
          >
            worlds and entities
          </Link>{" "}
          and{" "}
          <Link
            href="/game-engine/game-view"
            className="text-indigo-600 dark:text-indigo-400 underline"
          >
            GameView
          </Link>
          .
        </p>
        <p className="text-xs text-muted">
          Company names and logos belong to their respective owners. These independent examples
          demonstrate animation with Nayan Game Engine.
        </p>
      </section>
    </Sidebar>
  );
}
