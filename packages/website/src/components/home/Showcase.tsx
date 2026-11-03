import {
  ArrowRight,
  Atom,
  Clapperboard,
  Gamepad2,
  LayoutGrid,
  Terminal,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { Section, SectionHeader, StatGrid } from "@/design/Primitives";
import { ACCENT_SOFT, BODY, BUTTON_SECONDARY, CARD_INTERACTIVE, H3 } from "@/design/system";
import {
  NATIVE_COMPONENT_COUNT,
  REACT_COMPONENT_COUNT,
  TOOL_COUNT,
  TOTAL_COMPONENT_COUNT,
} from "@/services/Counts";

const STATS = [
  { value: String(REACT_COMPONENT_COUNT), label: "React components" },
  { value: String(NATIVE_COMPONENT_COUNT), label: "React Native components" },
  { value: "50+", label: "Ready-made games" },
  { value: String(TOOL_COUNT), label: "Free developer tools" },
];

/** Exported for the homepage's structured data (app/page.tsx), so the list there matches. */
export const PRODUCTS = [
  {
    icon: LayoutGrid,
    title: "Component library",
    body: `${TOTAL_COMPONENT_COUNT} accessible components for React and React Native, each with a live example and a full list of its options.`,
    href: "/react/components",
    action: "Browse components",
  },
  {
    icon: Atom,
    title: "Game engine",
    body: "Build 3D games for iOS, Android and the web from one TypeScript API: WebGPU, WebGL2, Metal and Vulkan rendering, physics, glTF models, sound and haptics.",
    href: "/game-engine",
    action: "Build your first game",
  },
  {
    icon: Gamepad2,
    title: "Games",
    body: "50+ puzzle, arcade, action and strategy games. Play them in the browser, or drop them into React Native apps and React websites.",
    href: "/games",
    action: "Play the games",
  },
  {
    icon: Clapperboard,
    title: "Video editor",
    body: "Cut, grade and export video up to 4K in a browser tab. Nothing uploads anywhere — your footage never leaves your machine.",
    href: "/video-editor",
    action: "Open the editor",
  },
  {
    icon: Wrench,
    title: "Developer tools",
    body: `${TOOL_COUNT} free tools for PDF, image, JSON, XML, text and SEO work, plus AI code review and everyday developer utilities.`,
    href: "/tools",
    action: "Explore the tools",
  },
  {
    icon: Terminal,
    title: "CLI",
    body: "Start a Vite, Next.js, Expo or games project in one command, and generate or validate sitemaps and robots.txt.",
    href: "/tools#nayan-ui-cli",
    action: "Use the CLI",
  },
];

const Showcase = () => (
  <Section id="what-you-get" labelledBy="what-heading">
    <SectionHeader
      eyebrow="What you get"
      id="what-heading"
      title="More than a component library"
      lead="Six things, all free to use: components for React and React Native, a 3D game engine, ready-made games, a video editor, developer tools and a CLI. Start with whichever one you came for."
    />

    <StatGrid stats={STATS} className="mb-8" />

    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
      {PRODUCTS.map((product) => {
        const Icon = product.icon;
        return (
          <Link
            key={product.title}
            href={product.href}
            className={`${CARD_INTERACTIVE} group flex flex-col p-6`}
          >
            <span
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={H3}>{product.title}</h3>
            <p className={`mt-2 flex-1 ${BODY}`}>{product.body}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
              {product.action}
              <ArrowRight
                aria-hidden
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        );
      })}
    </div>

    <div className="mt-8 flex justify-center">
      <Link href="/react/installation" className={BUTTON_SECONDARY}>
        Read the documentation
        <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
      </Link>
    </div>
  </Section>
);

export default Showcase;
