import Link from "next/link";
import { ArrowRight, Github, Package } from "lucide-react";
import { NText, NView } from "@nayan-ui/engine/components";
import { Badge } from "@/design/Primitives";
import {
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CONTAINER,
  GRADIENT_TEXT,
  H1_HERO,
  LEAD,
} from "@/design/system";
import { TOOL_COUNT } from "@/services/Counts";
import { REPO_URL } from "@/services/seo";
import EnginePreview from "./EnginePreview";
import InstallCommand from "./InstallCommand";

export default function Banner() {
  return (
    <NView tag="section" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/[0.07] to-transparent"
      />
      <NView
        tag="div"
        className={`${CONTAINER} grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16`}
      >
        <NView tag="div" className="min-w-0 text-center lg:text-left">
          <Badge icon={Package}>Open source · MIT licensed</Badge>
          <NText tag="h1" className={`mt-6 ${H1_HERO}`}>
            Build apps and games
            <NText tag="span" className={`block ${GRADIENT_TEXT}`}>
              for React &amp; React Native
            </NText>
          </NText>
          <NText tag="p" className={`mx-auto mt-6 max-w-xl text-lg ${LEAD} lg:mx-0`}>
            Use Nayan Engine to build cross-platform interfaces and 3D games. Play 50+ ready-made
            games, edit video in your browser, or explore {TOOL_COUNT} free developer tools.
          </NText>
          <InstallCommand />
          <NView
            tag="div"
            className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
              Get started
              <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={BUTTON_SECONDARY}
            >
              <Github aria-hidden className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </NView>
        </NView>
        <EnginePreview />
      </NView>
    </NView>
  );
}
