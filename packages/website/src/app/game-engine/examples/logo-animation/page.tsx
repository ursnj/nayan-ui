import { NText, NView } from 'nayan-ui/components';
import { LOGOS, type LogoId } from "@/components/examples/logo-animation/logos";
import LogoAnimation from "@/components/examples/logo-animation/LogoAnimation";
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

// Full standalone sources match the continuous, smooth surfaces in the shared preview.
const sources = Object.fromEntries(
  LOGOS.map((logo) => [
    logo.id,
    readFileSync(
      path.join(process.cwd(), "src/components/examples/logo-animation/logos", `${logo.id}.tsx`),
      "utf8",
    ),
  ]),
) as Record<LogoId, string>;

export default function LogoAnimationPage() {
  return (
    <Sidebar title="Logo Animation">
      <NText tag="p" className={`mb-8 mt-4 max-w-2xl ${LEAD}`}>
        Explore {LOGOS.length} famous company logos, brought to life with 3D shapes. Each logo has
        its own signature animation. Choose a company below to preview its animation and read the
        complete source code.
      </NText>
      <LogoAnimation sources={sources} />
      <NView tag="section" id="setup" className="mt-12 scroll-mt-24 space-y-4" aria-labelledby="source-heading">
        <NText tag="h2" id="source-heading" className={H2}>
          Build it with Nayan Game Engine
        </NText>
        <NText tag="p" className={LEAD}>
          Install the engine, then copy the complete component from a logo’s Code tab into your
          React app. Each example includes its geometry, animation loop, and engine setup. Render
          the component inside a container with a fixed height.
        </NText>
        <Code code="bun add nayan-ui" language="bash" filename="Terminal" />
        <NText tag="p" className="text-sm text-muted">
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
        </NText>
        <NText tag="p" className="text-xs text-muted">
          Company names and logos belong to their respective owners. These independent examples
          demonstrate animation with Nayan Game Engine.
        </NText>
      </NView>
    </Sidebar>
  );
}
