import { NView, NText } from 'nayan-ui/components';
import { ArrowRight, Braces, Smartphone } from '@/design/Icons';
import { Section } from '@/design/Primitives';
import { BUTTON_SECONDARY, H2 } from '@/design/system';
import Link from 'next/link';
import NayanComponentsPreview from './NayanComponentsPreview';

export default function Features() {
  return (
    <NView tag="div" className="home-demo-section">
      <Section id="why" labelledBy="why-heading" className="home-demo-layout">
        <NView tag="div" className="home-demo-copy">
          <NText tag="h2" id="why-heading" className={H2}>
            Try the components
          </NText>
          <NText tag="p">Use the live preview to try buttons, forms, feedback and labels. Open the reference to copy a complete example.</NText>
          <NView tag="ul" className="home-demo-details">
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
