import { NText, NView } from 'nayan-ui/components';
import { Atom, Boxes, Clapperboard, Gamepad2, LayoutGrid, Wrench, ArrowUpRight } from '@/design/Icons';
import Link from 'next/link';
import { Section } from '@/design/Primitives';
import { H2 } from '@/design/system';
import { componentReferences } from '@/services/ui/component-reference';
import { moduleReferences } from '@/services/ui/module-reference';
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
    body: `${moduleReferences.length} entry points for media picking, contacts, sign-in, files, storage, and more.`,
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
    <Section id="what-you-get" labelledBy="what-heading" className="home-catalog [padding-top:clamp(2.7rem,_4vw,_3.55rem)]">
      <NText tag="h2" id="what-heading" className={H2}>
        Explore Nayan UI
      </NText>
      <NView tag="div" className="home-product-grid grid [grid-template-columns:minmax(0,_1fr)] [gap:0.85rem] [margin-top:clamp(1.3rem,_2.7vw,_2.2rem)] min-[480px]:grid-cols-2 min-[900px]:[grid-template-columns:repeat(12,_minmax(0,_1fr))] min-[900px]:[gap:1rem]">
        {PRODUCTS.map(({ href, title, body, tone, icon: Icon }) => (
          <Link key={href} href={href} data-tone={tone} className="home-product flex flex-col justify-between [gap:1.2rem] [min-height:10.8rem] [padding:clamp(1rem,_2.4vw,_1.6rem)] [border:1px_solid_color-mix(in_srgb,_var(--tone-ink)_13%,_transparent)] [border-radius:1.3rem] [background:var(--tone-paper)] [transition:box-shadow_180ms,_border-color_180ms] hover:[border-color:color-mix(in_srgb,_var(--tone-ink)_38%,_transparent)] hover:[box-shadow:0_8px_22px_color-mix(in_srgb,_var(--tone)_28%,_transparent)] [&:hover_.home-product-arrow]:[transform:translate(2px,_-2px)] [&_h3]:text-foreground [&_h3]:[font-size:clamp(1.22rem,_2vw,_1.6rem)] [&_h3]:font-bold [&_h3]:[line-height:1.1] [&_h3]:[letter-spacing:-0.043em] [&_p]:[max-width:36ch] [&_p]:[margin-top:0.48rem] [&_p]:[color:color-mix(in_srgb,_var(--foreground)_79%,_var(--tone-paper))] [&_p]:[font-size:0.875rem] [&_p]:[line-height:1.56] min-[900px]:[grid-column:span_4] min-[900px]:[min-height:12rem] min-[900px]:first:[grid-column:span_6] min-[900px]:[&:nth-child(2)]:[grid-column:span_3] min-[900px]:[&:nth-child(3)]:[grid-column:span_3]">
            <NView tag="div" className="home-product-top flex items-center justify-between [color:var(--tone-ink)]">
              <NText tag="span" className="home-product-icon flex items-center justify-center [width:2.7rem] [height:2.7rem] [border-radius:0.85rem] [background:color-mix(in_srgb,_var(--tone-ink)_11%,_transparent)]">
                <Icon aria-hidden size={25} strokeWidth={1.7} />
              </NText>
              <ArrowUpRight aria-hidden size={21} className="home-product-arrow [transition:transform_180ms] motion-reduce:[transform:none]! motion-reduce:[transition:none]!" />
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
