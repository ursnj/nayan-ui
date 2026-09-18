import { Code, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { CtaPanel } from '@/design/Primitives';
import { BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/design/system';

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
