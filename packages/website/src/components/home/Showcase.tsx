import { ArrowUpRight, Atom, Clapperboard, Gamepad2, LayoutGrid, Boxes, Wrench } from '@/design/Icons';
import Link from 'next/link';
import { Section, SectionHeader } from '@/design/Primitives';
import { ACCENT_SOFT, BODY, CARD_INTERACTIVE, GRID_GAP, H3 } from '@/design/system';
import { TOOL_COUNT } from '@/services/Counts';

/** Shared with the homepage's structured data. */
export const PRODUCTS = [
  {
    icon: Atom,
    title: 'Nayan Engine',
    body: 'Build with Rust rendering, physics, glTF models, spatial audio and haptics.',
    href: '/game-engine'
  },
  {
    icon: LayoutGrid,
    title: 'Engine components',
    body: 'Browse controls and hooks with React and React Native examples.',
    href: '/components'
  },
  {
    icon: Boxes,
    title: 'Engine modules',
    body: 'Explore storage, audio, drawing, platform services and more.',
    href: '/modules'
  },
  {
    icon: Gamepad2,
    title: 'Games',
    body: 'Play 50+ puzzle, arcade, action and strategy games in your browser.',
    href: '/games'
  },
  {
    icon: Clapperboard,
    title: 'Video editor',
    body: 'Cut, grade and export up to 4K in your browser, with your footage on your device.',
    href: '/video-editor'
  },
  {
    icon: Wrench,
    title: 'Developer tools',
    body: `Browse ${TOOL_COUNT} guides for PDFs, images, structured data, text and SEO.`,
    href: '/tools'
  }
];

export default function Showcase() {
  return (
    <Section id="what-you-get" labelledBy="what-heading">
      <SectionHeader id="what-heading" title="Explore Nayan UI" />
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
        {PRODUCTS.map((product) => {
          const Icon = product.icon;
          return (
            <Link key={product.href} href={product.href} className={`${CARD_INTERACTIVE} product-card group p-5 sm:p-6`}>
              <div className="mb-6 flex items-start justify-between">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}>
                  <Icon aria-hidden size={21} strokeWidth={1.7} />
                </span>
                <ArrowUpRight aria-hidden size={19} className="text-muted transition-colors group-hover:text-accent" />
              </div>
              <h3 className={H3}>{product.title}</h3>
              <p className={`mt-2 max-w-xs ${BODY}`}>{product.body}</p>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
