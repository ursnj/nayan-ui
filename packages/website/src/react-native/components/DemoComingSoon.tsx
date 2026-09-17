'use client';

import { Smartphone } from 'lucide-react';
import Link from 'next/link';
import { ACCENT_SOFT, BUTTON_SMALL } from '@/design/system';

interface DemoComingSoonProps {
  componentName?: string;
  description?: string;
}

/**
 * Stands in for a live demo on the React Native pages.
 *
 * It said "Demo Coming Soon" in a large empty card, which on twenty-three
 * consecutive pages reads as a broken site rather than as a known gap. The
 * reason is worth stating: these components render React Native primitives,
 * which a browser cannot mount without `react-native-web` aliased into the
 * build — it is not an oversight that they are missing, and no amount of
 * waiting will change it on its own.
 *
 * So the placeholder now says why, and points at the two things on the page
 * that *are* useful — the usage example and the full prop table below it —
 * plus the React equivalent, which shares the prop names and does run here.
 */
const DemoComingSoon = ({ componentName = 'This component', description }: DemoComingSoonProps) => (
  <div className="flex flex-col items-start gap-4 sm:flex-row">
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${ACCENT_SOFT}`}>
      <Smartphone className="h-5 w-5" />
    </span>
    <div>
      <p className="text-sm font-semibold text-foreground">{componentName} renders natively, so it cannot run in this page</p>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
        {description ||
          'React Native components build to native iOS and Android views rather than DOM nodes. The usage example and the full prop table below are complete — and the React version shares the same prop names, if you want to see the behaviour in a browser.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="#usage" className={BUTTON_SMALL}>
          Jump to usage
        </Link>
        <Link href="/react/components" className={BUTTON_SMALL}>
          See the React components
        </Link>
      </div>
    </div>
  </div>
);

export default DemoComingSoon;
