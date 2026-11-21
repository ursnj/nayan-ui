import { ArrowRight, Braces, Smartphone } from '@/design/Icons';
import { Section } from '@/design/Primitives';
import { BUTTON_SECONDARY, H2 } from '@/design/system';
import Link from 'next/link';
import EnginePreview from './EnginePreview';

export default function Features() {
  return (
    <div className="home-demo-section">
      <Section id="why" labelledBy="why-heading" className="home-demo-layout">
        <div className="home-demo-copy">
          <h2 id="why-heading" className={H2}>
            Try the components
          </h2>
          <p>Use the live preview to try buttons, forms, feedback and labels. Open the reference to copy a complete example.</p>
          <ul className="home-demo-details">
            <li>
              <Smartphone aria-hidden size={19} /> Shared controls for React and React Native
            </li>
            <li>
              <Braces aria-hidden size={19} /> Theme tokens for light and dark mode
            </li>
          </ul>
          <Link href="/components" className={BUTTON_SECONDARY}>
            Browse components <ArrowRight aria-hidden size={17} />
          </Link>
        </div>
        <EnginePreview />
      </Section>
    </div>
  );
}
