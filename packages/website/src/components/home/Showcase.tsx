import { NText, NView } from 'nayan-ui/components';
import { Atom, Boxes, Clapperboard, Gamepad2, LayoutGrid, Wrench, ArrowUpRight } from '@/design/Icons';
import Link from 'next/link';
import { Section } from '@/design/Primitives';
import { H2 } from '@/design/system';
import { componentReferences } from '@/services/nayan-ui/component-reference';
import { moduleReferences } from '@/services/nayan-ui/module-reference';
import { TOOL_COUNT } from '@/services/Counts';

/** Shared with the homepage's structured data. */
export const PRODUCTS = [
  {
    icon: Atom,
    title: 'Nayan Game Engine',
    body: 'Render 3D scenes, add physics, load glTF models and make objects respond to input.',
    href: '/game-engine',
    tone: 'violet'
  },
  {
    icon: LayoutGrid,
    title: 'Nayan Components',
    body: `${componentReferences.length} controls, hooks and examples for building interfaces.`,
    href: '/components',
    tone: 'lime'
  },
  {
    icon: Boxes,
    title: 'Nayan Modules',
    body: `${moduleReferences.length} entry points for tasks like storage, audio and drawing.`,
    href: '/modules',
    tone: 'peach'
  },
  {
    icon: Gamepad2,
    title: 'Nayan Games',
    body: 'Play 50+ arcade, action, strategy and puzzle games in your browser.',
    href: '/games',
    tone: 'pink'
  },
  {
    icon: Clapperboard,
    title: 'Nayan Video Editor',
    body: 'Trim clips, layer tracks and export up to 4K. Your footage stays on your device.',
    href: '/video-editor',
    tone: 'blue'
  },
  {
    icon: Wrench,
    title: 'Developer Tools',
    body: `Browse ${TOOL_COUNT} guides for PDFs, images, structured data, text and SEO.`,
    href: '/tools',
    tone: 'mint'
  }
];

export default function Showcase() {
  return (
    <Section id="what-you-get" labelledBy="what-heading" className="home-catalog">
      <NText tag="h2" id="what-heading" className={H2}>
        Explore Nayan UI
      </NText>
      <NView tag="div" className="home-product-grid">
        {PRODUCTS.map(({ href, title, body, tone, icon: Icon }) => (
          <Link key={href} href={href} data-tone={tone} className="home-product">
            <NView tag="div" className="home-product-top">
              <NText tag="span" className="home-product-icon">
                <Icon aria-hidden size={25} strokeWidth={1.7} />
              </NText>
              <ArrowUpRight aria-hidden size={21} className="home-product-arrow" />
            </NView>
            <NView tag="div">
              <NText tag="h3">{title}</NText>
              <NText tag="p">{body}</NText>
            </NView>
          </Link>
        ))}
      </NView>
    </Section>
  );
}
