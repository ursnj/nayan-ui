import { ArrowRight, Clapperboard, Gamepad2, LayoutGrid, Wrench } from "lucide-react";
import Link from "next/link";
import { Section, SectionHeader, StatGrid } from "@/design/Primitives";
import { ACCENT_SOFT, BODY, BUTTON_SECONDARY, CARD_INTERACTIVE, H3 } from "@/design/system";
import {
  GAME_COUNT,
  NATIVE_COMPONENT_COUNT,
  REACT_COMPONENT_COUNT,
  TOTAL_COMPONENT_COUNT,
} from "@/services/Counts";

const STATS = [
  { value: String(REACT_COMPONENT_COUNT), label: "React components" },
  { value: String(NATIVE_COMPONENT_COUNT), label: "React Native components" },
  { value: String(GAME_COUNT), label: "Ready-made games" },
  { value: "MIT", label: "Free forever" },
];

const PRODUCTS = [
  {
    icon: LayoutGrid,
    title: "Component library",
    body: `${TOTAL_COMPONENT_COUNT} components across web and mobile, each with a live example you can try and a full list of its options.`,
    href: "/react/components",
    action: "Browse components",
  },
  {
    icon: Clapperboard,
    title: "Video editor",
    body: "Cut, grade and export video in a browser tab. Nothing uploads anywhere — your footage never leaves your machine.",
    href: "/video-editor",
    action: "Open the editor",
  },
  {
    icon: Gamepad2,
    title: "Games",
    body: `${GAME_COUNT} playable games for React Native — puzzle, arcade, action and strategy — that drop straight into a screen.`,
    href: "/games",
    action: "See the games",
  },
  {
    icon: Wrench,
    title: "Developer tools",
    body: "Generate sitemaps and robots.txt, or let an AI agent review a pull request and patch vulnerable dependencies.",
    href: "/devtools",
    action: "Explore the tools",
  },
];

const Showcase = () => (
  <Section id="what-you-get" labelledBy="what-heading">
    <SectionHeader
      eyebrow="What you get"
      id="what-heading"
      title="More than a component library"
      lead={
        <>
          Four things, all free and all open source: components for React and React Native, a video
          editor that runs in a browser tab, a pack of ready-made games, and a set of developer
          tools. Start with whichever one you came for.
        </>
      }
    />

    <StatGrid stats={STATS} className="mb-8" />

    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      {PRODUCTS.map((product) => {
        const Icon = product.icon;
        return (
          <Link
            key={product.href}
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
