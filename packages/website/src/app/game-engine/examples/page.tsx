import { LOGOS } from "@/components/examples/logo-animation/logos";
import Link from "next/link";
import { ArrowUpRight, Bird } from "lucide-react";
import Sidebar from "@/components/helpers/Sidebar";
import { CARD_INTERACTIVE, EYEBROW, LEAD, PILL } from "@/design/system";
import { buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Examples",
  description:
    "Explore interactive company logo animations and Playtura’s procedural animated penguin built with Nayan Game Engine.",
  path: "/game-engine/examples",
});

export default function ExamplesPage() {
  return (
    <Sidebar title="Examples">
      <p className={`mb-3 ${EYEBROW}`}>Made with Nayan</p>
      <p className={`mt-4 max-w-2xl ${LEAD}`}>
        Explore ideas in action. Open an example, try it out, and use the code as a starting point
        for your own project.
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Link
          href="/game-engine/examples/logo-animation"
          className={`${CARD_INTERACTIVE} group overflow-hidden`}
        >
          <div className="flex h-60 items-center justify-center bg-[#0B1020]">
            <div
              aria-hidden
              className="grid grid-cols-2 gap-2 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
            >
              {["#F25022", "#7FBA00", "#00A4EF", "#FFB900"].map((color) => (
                <span key={color} style={{ backgroundColor: color }} className="h-14 w-14" />
              ))}
            </div>
          </div>
          <div className="space-y-3 p-6">
            <span className={PILL}>Game Engine</span>
            <h2 className="flex items-center justify-between text-lg font-semibold text-foreground">
              Logo Animation <ArrowUpRight aria-hidden className="h-5 w-5 text-muted" />
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Animate {LOGOS.length} famous logos, including Microsoft, Google, Cisco, and Nike,
              with 3D shapes and Nayan Game Engine.
            </p>
          </div>
        </Link>
        <Link
          href="/game-engine/examples/penguin-animation"
          className={`${CARD_INTERACTIVE} group overflow-hidden`}
        >
          <div
            aria-hidden
            className="relative flex h-60 items-center justify-center overflow-hidden bg-sky-500/10"
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(115deg, transparent 0 35px, #0284c7 36px 45px, transparent 46px 82px)",
              }}
            />
            <Bird
              className="relative h-28 w-28 text-sky-600 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none dark:text-sky-400"
              strokeWidth={1.2}
            />
          </div>
          <div className="space-y-3 p-6">
            <span className={PILL}>Game Engine</span>
            <h2 className="flex items-center justify-between text-lg font-semibold text-foreground">
              Penguin Animation <ArrowUpRight aria-hidden className="h-5 w-5 text-muted" />
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Meet the procedural penguin from Playtura. Explore all ten actions, including walking,
              running, jumping, sliding, punches, and a victory dance.
            </p>
          </div>
        </Link>
      </div>
    </Sidebar>
  );
}
