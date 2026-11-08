import { LOGOS } from "@/components/examples/logos";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Sidebar from "@/components/helpers/Sidebar";
import { CARD_INTERACTIVE, EYEBROW, LEAD, PILL } from "@/design/system";
import { buildPageMetadata } from "@/services/seo";

export const metadata = buildPageMetadata({
  title: "Examples",
  description:
    "Explore working examples built with Nayan UI. Explore company logo animations powered by Nayan Game Engine.",
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
      </div>
    </Sidebar>
  );
}
