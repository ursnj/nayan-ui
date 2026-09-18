import { Code, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { CtaPanel } from '@/design/Primitives';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/design/system';

/**
 * The closing panel, and the page's only full-bleed gradient.
 *
 * This used to be two sections: a "Pick a platform" grid of two cards
 * followed by this panel. The grid repeated the component-library card in the
 * section above it and the buttons in the panel below it, which made three
 * calls to action in a row. The platform choice is now the panel's two
 * buttons, where it is one decision rather than a section.
 */
const CallToAction = () => (
  <CtaPanel
    title="Free, and staying that way"
    lead="MIT licensed, no accounts, no paid tier and no component held back for one. If something is missing, the issue tracker is the place to say so.">
    <Link href="/react/installation" className={BUTTON_PRIMARY}>
      <Code aria-hidden className="mr-2 h-4 w-4" />
      Start with React
    </Link>
    <Link href="/react-native/installation" className={BUTTON_SECONDARY}>
      <Smartphone aria-hidden className="mr-2 h-4 w-4" />
      Start with React Native
    </Link>
  </CtaPanel>
);

export default CallToAction;
