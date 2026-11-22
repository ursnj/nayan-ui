import { NView, NText } from 'nayan-ui/components';
import { ArrowRight, Braces, Smartphone } from '@/design/Icons';
import { Section } from '@/design/Primitives';
import { BUTTON_SECONDARY, H2 } from '@/design/system';
import Link from 'next/link';
import NayanComponentsPreview from './NayanComponentsPreview';

export default function Features() {
  return (
    <NView tag="div" className="home-demo-section [border-block:1px_solid_var(--border)] [background:radial-gradient(ellipse_at_8%_0%,_color-mix(in_srgb,_#caaaee_29%,_transparent),_transparent_68%),_var(--surface-secondary)] dark:[background:radial-gradient(ellipse_at_8%_0%,_color-mix(in_srgb,_#8d50cf_22%,_transparent),_transparent_68%),_var(--surface-secondary)]">
      <Section id="why" labelledBy="why-heading" className="home-demo-layout grid [grid-template-columns:minmax(0,_1fr)] items-center [gap:clamp(2rem,_5vw,_4rem)] min-[900px]:[grid-template-columns:minmax(0,_0.8fr)_minmax(0,_1.2fr)]">
        <NView tag="div" className="home-demo-copy min-w-0 [&_>_p]:[max-width:33rem] [&_>_p]:[margin-top:1rem] [&_>_p]:text-muted [&_>_p]:[line-height:1.65]">
          <NText tag="h2" id="why-heading" className={H2}>
            Try the components
          </NText>
          <NText tag="p">Use the live preview to try buttons, forms, feedback and labels. Open the reference to copy a complete example.</NText>
          <NView tag="ul" className="home-demo-details grid [gap:0.65rem] [margin-block:1.35rem] text-foreground [font-size:0.88rem] [&_li]:flex [&_li]:items-center [&_li]:[gap:0.6rem] [&_svg]:shrink-0 [&_svg]:text-accent">
            <NView tag="li">
              <Smartphone aria-hidden size={19} /> Shared controls for React and React Native
            </NView>
            <NView tag="li">
              <Braces aria-hidden size={19} /> Theme tokens for light and dark mode
            </NView>
          </NView>
          <Link href="/components" className={BUTTON_SECONDARY}>
            Browse components <ArrowRight aria-hidden size={17} />
          </Link>
        </NView>
        <NayanComponentsPreview />
      </Section>
    </NView>
  );
}
