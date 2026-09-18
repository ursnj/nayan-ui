'use client';

import { useEffect, useState } from 'react';
import { NBadge, NButton, NCheck, NInput, NProgress, NSlider, NSwitch } from '@nayan-ui/react';
import { ArrowRight, Check, Copy, Github, Package, Terminal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/design/Primitives';
import { BUTTON_SECONDARY, CARD, CONTAINER, GRADIENT_TEXT, H1_HERO, LEAD } from '@/design/system';
import { TOTAL_COMPONENT_COUNT } from '@/services/Counts';

const INSTALL = 'npm install @nayan-ui/react';

const TABS = ['Buttons', 'Forms', 'Feedback'] as const;

/**
 * The home page hero.
 *
 * The panel on the right renders the actual components from
 * `@nayan-ui/react` — a real `NSwitch`, a real `NSlider`, a real `NInput`.
 * The previous version drew all of them by hand out of divs: a fake checkbox
 * made of a bordered square and a tick icon, a fake switch made of a rounded
 * rectangle with a white dot, fake badges made of styled spans. For a
 * component library's own front page that is precisely the wrong trade —
 * it is an advert for components that says "trust us" instead of showing
 * them, and it drifts the moment the real components change.
 *
 * It doubles as a canary: if a component regresses, the home page shows it.
 */
const Banner = () => {
  const [tab, setTab] = useState(0);
  const [copied, setCopied] = useState(false);

  /* Live state for the demo controls, so they actually respond. */
  const [email, setEmail] = useState('');
  const [notify, setNotify] = useState(true);
  const [dark, setDark] = useState(false);
  const [volume, setVolume] = useState(60);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL);
      setCopied(true);
    } catch {
      // Clipboard permission can be denied; the command is visible regardless.
    }
  };

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.07] via-transparent to-transparent" />
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -top-20 right-1/4 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className={`${CONTAINER} py-14 sm:py-20`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Pitch */}
          <div className="text-center lg:text-left">
            <Badge icon={Package}>Open source · Free forever</Badge>

            <h1 className={`mt-6 ${H1_HERO}`}>
              Components for
              <span className={`block ${GRADIENT_TEXT}`}>React &amp; React Native</span>
            </h1>

            <p className={`mx-auto mt-6 max-w-xl text-lg ${LEAD} lg:mx-0`}>
              {TOTAL_COMPONENT_COUNT} accessible, good-looking components for web and mobile — styled, themeable and documented, so you can start on
              the thing you actually set out to build.
            </p>

            {/* The install command, copyable. It was previously buried at the
                bottom of the page inside a decorative gradient panel. */}
            <div className="mx-auto mt-7 max-w-md lg:mx-0">
              <div className="flex items-center gap-3 rounded-xl border border-default bg-surface px-3.5 py-2.5">
                <Terminal aria-hidden className="h-4 w-4 shrink-0 text-muted" />
                <code className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">{INSTALL}</code>
                <button
                  type="button"
                  onClick={copyInstall}
                  aria-label="Copy install command"
                  aria-live="polite"
                  className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-foreground">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/react/installation" className="sm:w-auto">
                <NButton className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600 sm:w-auto">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </NButton>
              </Link>
              <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer" className={`${BUTTON_SECONDARY} py-2.5`}>
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>

          {/* Live components */}
          <div className={`${CARD} overflow-hidden shadow-xl shadow-indigo-500/5`}>
            <div className="flex items-center justify-between gap-3 border-b border-default bg-background px-4 py-2.5">
              <span className="font-mono text-xs text-muted">@nayan-ui/react</span>
              <span className="text-[11px] text-muted">Live, not a screenshot</span>
            </div>

            <div className="p-4 sm:p-5">
              <div role="tablist" aria-label="Component examples" className="mb-5 flex gap-1 rounded-lg bg-background p-1">
                {TABS.map((label, index) => (
                  <button
                    key={label}
                    role="tab"
                    id={`home-tab-${index}`}
                    aria-selected={tab === index}
                    aria-controls={`home-panel-${index}`}
                    onClick={() => setTab(index)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      tab === index ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {/*
               * A floor on the panel height, so switching tabs does not resize
               * the card and the hero's two columns stay roughly balanced —
               * the Buttons tab alone is about half the height of the pitch
               * beside it.
               */}
              <div className="min-h-[13rem]">
                {tab === 0 && (
                  <div role="tabpanel" id="home-panel-0" aria-labelledby="home-tab-0" className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <NButton>Primary</NButton>
                      <NButton isOutline={true}>Outline</NButton>
                      <NButton isLoading={true}>Loading</NButton>
                      <NButton disabled>Disabled</NButton>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <NBadge color="default">Default</NBadge>
                      <NBadge color="accent">Accent</NBadge>
                      <NBadge color="success">Success</NBadge>
                      <NBadge color="warning">Warning</NBadge>
                      <NBadge color="danger">Danger</NBadge>
                    </div>
                  </div>
                )}

                {tab === 1 && (
                  <div role="tabpanel" id="home-panel-1" aria-labelledby="home-tab-1" className="space-y-4">
                    <NInput
                      id="home-email"
                      type="email"
                      label="Email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    <NCheck checked={notify} onChange={setNotify}>
                      Email me about releases
                    </NCheck>
                    <NSwitch label="Dark mode" enabled={dark} onChange={setDark} />
                  </div>
                )}

                {tab === 2 && (
                  <div role="tabpanel" id="home-panel-2" aria-labelledby="home-tab-2" className="space-y-5">
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted">Upload progress</p>
                      <NProgress value={72} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted">Volume — {volume}</p>
                      <NSlider
                        defaultValue={volume}
                        max={100}
                        step={1}
                        onChange={(value: any) => setVolume(Array.isArray(value) ? value[0] : value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
