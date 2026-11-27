import { NImage, NText, NView } from 'nayan-ui/components';
import Link from 'next/link';
import Code from '@/components/helpers/Code';
import { ArrowRight, Github, Layers3, Play } from '@/design/Icons';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CONTAINER } from '@/design/system';
import { moduleReferences } from '@/services/ui/module-reference';
import { REPO_URL } from '@/services/seo';
import InstallCommand from './InstallCommand';

const scene = moduleReferences.find(({ slug }) => slug === 'games')!;

export default function Banner() {
  return (
    <NView tag="section" className="home-hero [border-bottom:1px_solid_var(--border)] [background:radial-gradient(ellipse_at_81%_10%,_color-mix(in_srgb,_#b298f6_24%,_transparent),_transparent_64%),_var(--background)] dark:[background:radial-gradient(ellipse_at_81%_10%,_color-mix(in_srgb,_#9653fd_21%,_transparent),_transparent_67%),_var(--background)]">
      <NView tag="div" className={CONTAINER}>
        <NView tag="div" className="home-hero-layout grid [grid-template-columns:minmax(0,_1fr)] items-center [gap:clamp(2rem,_5vw,_4rem)] [padding-block:clamp(2.8rem,_5.7vw,_5.1rem)_clamp(1.6rem,_3.4vw,_3rem)] min-[900px]:[grid-template-columns:minmax(0,_0.88fr)_minmax(0,_1.12fr)]">
          <NView tag="div" className="home-hero-copy min-w-0">
            <NText tag="p" className="home-engine-label flex items-center [gap:0.45rem] [margin-bottom:1.15rem] text-accent font-bold [font-size:0.88rem]">
              <Layers3 aria-hidden size={17} />
              Nayan UI
            </NText>
            <NText tag="h1" className="home-title text-foreground [font-size:clamp(3.05rem,_5.65vw,_6rem)] [line-height:0.98] [letter-spacing:-0.073em] font-bold [&_span]:block [&_span]:text-accent">
              Build apps.
              <NText tag="span">Make games.</NText>
            </NText>
            <NText tag="p" className="home-intro [max-width:34rem] [margin-top:1.3rem] text-muted [font-size:clamp(1rem,_1.5vw,_1.15rem)] [line-height:1.58]">
              Build interfaces and 3D games for the web, iOS and Android. Use one TypeScript API for React and React Native, with rendering powered by
              Rust.
            </NText>
            <NView tag="div" className="home-actions flex flex-wrap [gap:0.7rem] [margin-top:1.45rem] max-[420px]:[gap:0.45rem] max-[420px]:[&_>_a]:[padding-inline:0.9rem]">
              <Link href="/game-engine/installation" className={BUTTON_PRIMARY}>
                Start building <ArrowRight aria-hidden size={17} />
              </Link>
              <Link href="/playground" className={BUTTON_SECONDARY}>
                <Play aria-hidden size={16} /> Try the playground
              </Link>
            </NView>
            <InstallCommand />
          </NView>
          <NView tag="div" className="home-hero-media min-w-0 relative isolate">
            <NView tag="div" className="home-hero-artwork overflow-hidden [aspect-ratio:4_/_3] [border-radius:clamp(1.3rem,_2.35vw,_2.4rem)] [background:#d7b9fb] [box-shadow:0_18px_52px_color-mix(in_srgb,_var(--accent)_12%,_transparent)] [&_img]:block [&_img]:w-full [&_img]:h-full [&_img]:object-cover">
              <NImage src="/home/engine-shapes.webp" alt="" width={1448} height={1086} priority />
            </NView>
            <NView tag="div" className="home-hero-code relative [max-width:26rem] min-w-0 [margin:-2.25rem_0.65rem_0] [&_.site-code-block]:[box-shadow:0_18px_42px_rgb(38_12_63_/_0.25)] [&_.site-code-scroll_pre]:min-w-0 [&_.site-code-scroll_pre]:[padding-block:0.75rem_0.85rem] [&_.site-code-scroll_pre]:whitespace-pre-wrap [&_.site-code-scroll_pre]:[overflow-wrap:anywhere] [&_.site-code-scroll_pre]:[font-size:clamp(0.63rem,_0.82vw,_0.74rem)] [&_.site-code-scroll_pre]:[line-height:1.5] min-[900px]:absolute min-[900px]:[inset:auto_auto_1rem_1rem] min-[900px]:[width:min(74%,_28.5rem)] min-[900px]:m-0">
              <Code code={scene.code} filename="Scene.tsx" tone="ink" />
            </NView>
          </NView>
        </NView>
        <NView tag="nav" aria-label="Platform guides" className="home-platforms flex flex-wrap items-center [gap:0.5rem_clamp(1rem,_3vw,_2rem)] [padding-block:0.9rem] [border-top:1px_solid_var(--border)] text-muted [font-size:0.8rem] [&_>_span]:[font-family:var(--font-mono,_monospace)] [&_a]:inline-flex [&_a]:items-center [&_a]:[gap:0.35rem] [&_a]:[min-height:2rem] [&_a]:text-foreground [&_a]:[font-weight:650] [&_a:hover]:text-accent">
          <NText tag="span">Quickstarts</NText>
          <Link href="/react/installation">
            React <ArrowRight aria-hidden size={15} />
          </Link>
          <Link href="/react-native/installation">
            React Native <ArrowRight aria-hidden size={15} />
          </Link>
          <Link href={REPO_URL} target="_blank" rel="noopener noreferrer">
            <Github aria-hidden size={16} /> GitHub
          </Link>
        </NView>
      </NView>
    </NView>
  );
}
