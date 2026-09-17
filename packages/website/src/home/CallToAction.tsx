import { ArrowRight, Code, Github, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { CtaPanel, Section } from '@/design/Primitives';
import { BODY, BUTTON_PRIMARY, BUTTON_SECONDARY, CARD_INTERACTIVE, H2, H3, LEAD } from '@/design/system';

/**
 * Pick a platform, then go.
 *
 * Trimmed hard. This section previously repeated the four feature pills for
 * the third time on the page, restated the install command inside a
 * full-bleed gradient panel, and signed off with "Let's build something
 * amazing together!" — none of which told a reader anything they had not
 * already been told twice. What survives is the one decision still left to
 * make: web or mobile.
 */
const PLATFORMS = [
  {
    icon: Code,
    title: 'React',
    body: 'Thirty-five components for the web, built on HeroUI and Tailwind CSS. Installation, theming and a page per component.',
    href: '/react/installation',
    action: 'Start with React'
  },
  {
    icon: Smartphone,
    title: 'React Native',
    body: 'Twenty-three components for iOS and Android, built on HeroUI Native. The same props, the same tokens, native rendering.',
    href: '/react-native/installation',
    action: 'Start with React Native'
  }
];

const CallToAction = () => (
  <>
    <Section id="start" labelledBy="start-heading">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Get started</p>
        <h2 id="start-heading" className={H2}>
          Pick a platform
        </h2>
        <p className={`mt-4 ${LEAD}`}>Both are installed the same way and documented the same way. Nothing stops you using both.</p>
      </header>

      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        {PLATFORMS.map(platform => {
          const Icon = platform.icon;
          return (
            <Link key={platform.title} href={platform.href} className={`${CARD_INTERACTIVE} group flex flex-col p-6`}>
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className={H3}>{platform.title}</h3>
              <p className={`mt-2 flex-1 ${BODY}`}>{platform.body}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {platform.action}
                <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </Section>

    <CtaPanel
      title="Free, and staying that way"
      lead="MIT licensed, no accounts, no paid tier and no component held back for one. If something is missing, the issue tracker is the place to say so.">
      <Link href="/react/installation" className={BUTTON_PRIMARY}>
        Read the docs
        <ArrowRight aria-hidden className="ml-2 h-4 w-4" />
      </Link>
      <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
        <Github aria-hidden className="mr-2 h-4 w-4" />
        Star on GitHub
      </a>
    </CtaPanel>
  </>
);

export default CallToAction;
