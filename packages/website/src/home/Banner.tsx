'use client';

import { useEffect, useState } from 'react';
import {
  AlertTypes,
  NAccordion,
  NAlert,
  NAvatar,
  NBadge,
  NButton,
  NButtonGroup,
  NCheck,
  NChip,
  NInput,
  NKbd,
  NMeter,
  NNumberField,
  NProgress,
  NRadioGroup,
  NSearchField,
  NSelect,
  NSlider,
  NSwitch,
  NTagGroup,
  NToggleButton,
  NTooltip,
  useNToast
} from '@nayan-ui/react';
import { ArrowRight, Bell, Bold, Check, Copy, Download, Github, Italic, Package, Terminal, Underline } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/design/Primitives';
import { CARD, CONTAINER, GRADIENT_TEXT, H1_HERO, LEAD, WELL } from '@/design/system';
import { TOTAL_COMPONENT_COUNT } from '@/services/Counts';
import { installCode, rnInstallCode } from '@/services/ReactCodeBlocks';

/*
 * Both install commands, taken from the same constants the installation guides
 * print, so the hero cannot drift from the docs.
 *
 * The hero showed only the React line, which quietly framed the library as a
 * web one — the headline two inches above it says "React & React Native", and
 * a visitor who came for mobile had to reach the installation page to find out
 * the native package even exists.
 */
const INSTALLS = [
  { platform: 'React', command: installCode },
  { platform: 'React Native', command: rnInstallCode }
];

const TABS = ['Buttons', 'Forms', 'Feedback', 'Elements'] as const;

const RANGES = ['Day', 'Week', 'Month'];

const FRAMEWORKS = [
  { value: 'next', label: 'Next.js' },
  { value: 'vite', label: 'Vite' },
  { value: 'remix', label: 'Remix' },
  { value: 'expo', label: 'Expo' }
];

const PLANS = [
  { label: 'Free', value: 'free' },
  { label: 'Pro', value: 'pro' }
];

const TAGS = [
  { id: 'react', label: 'React' },
  { id: 'native', label: 'React Native' },
  { id: 'a11y', label: 'Accessible' }
];

const FAQ = [
  { title: 'Is it free?', message: 'Yes — MIT licensed, and it stays that way.' },
  { title: 'Does it theme?', message: 'Light and dark out of the box, plus your own tokens.' }
];

/** A small caption above a row of examples, so the panel reads as a list of components rather than a pile of controls. */
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">{label}</p>
    {children}
  </div>
);

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
 *
 * Four tabs rather than three, and each one now holds a handful of components
 * instead of two or three. The panel is the only place on the page where a
 * visitor can judge whether the components look right, so the more of the
 * library it shows the more work it does — a button group, toggle buttons,
 * badges, chips, a tooltip, a search field, a select, a number field, a radio
 * group, a meter, an alert, a toast, avatars, tags, keys and an accordion,
 * all of them the real thing.
 *
 * Badges and chips get a row each rather than sharing one. They look similar
 * enough side by side that a single row read as one set of pills in two
 * shapes; labelled separately, it is clear they are two components.
 *
 * `NSelect` is the one component here that cannot be server rendered; it is
 * mounted behind a client-only guard, explained where it is used.
 */
const Banner = () => {
  const [tab, setTab] = useState(0);

  /* Which command was last copied, so each row ticks independently. */
  const [copied, setCopied] = useState<string | null>(null);

  /* Live state for the demo controls, so they actually respond. */
  const [email, setEmail] = useState('');
  const [query, setQuery] = useState('');
  const [seats, setSeats] = useState(3);
  const [framework, setFramework] = useState<{ value: string; label: string } | null>(FRAMEWORKS[0]);
  const [plan, setPlan] = useState('pro');
  const [notify, setNotify] = useState(true);
  const [dark, setDark] = useState(false);
  const [volume, setVolume] = useState(60);
  const [range, setRange] = useState(RANGES[1]);
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [tags, setTags] = useState<any>(new Set(['react']));

  const toast = useNToast();

  /* See the note beside `NSelect` in the Forms panel. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(null), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copyInstall = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
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

            {/* The install commands, copyable. They were previously buried at
                the bottom of the page inside a decorative gradient panel. */}
            <div className="mx-auto mt-7 max-w-md divide-y divide-default overflow-hidden rounded-xl border border-default bg-surface lg:mx-0">
              {INSTALLS.map(({ platform, command }) => (
                <div key={command} className="flex items-center gap-3 px-3.5 py-2.5">
                  <Terminal aria-hidden className="h-4 w-4 shrink-0 text-muted" />
                  <code className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">{command}</code>
                  <span className="shrink-0 text-[11px] font-medium text-muted">{platform}</span>
                  <button
                    type="button"
                    onClick={() => copyInstall(command)}
                    aria-label={`Copy ${platform} install command`}
                    aria-live="polite"
                    className="shrink-0 rounded-md p-1 text-muted transition-colors hover:text-foreground">
                    {copied === command ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>

            {/*
             * Both actions are `NButton`s.
             *
             * The GitHub link used to be an `<a>` carrying `BUTTON_SECONDARY`,
             * and it came out visibly bigger than the button beside it — not
             * by a rounding error but by ten pixels. HeroUI's button is a fixed
             * `h-10 md:h-9` at `text-sm`, so the primary was 36px tall with
             * 14px text no matter what padding it was given (the `py-2.5` it
             * carried did nothing at all). The anchor had no height of its own:
             * it inherited the page's 16px text and added `py-3`, landing
             * around 48px. The radius differed too — `rounded-3xl` from HeroUI
             * against `rounded-xl` from the token.
             *
             * Matching the numbers by hand would just be a copy of HeroUI's
             * metrics waiting to drift from them, so the secondary is now the
             * library's own outline button. `BUTTON_SECONDARY` is untouched and
             * still right on the pages that pair it with `BUTTON_PRIMARY`;
             * the hero is the one place that mixed the two systems.
             *
             * Spacing between label and icon is HeroUI's `gap-2` for both,
             * rather than a margin on one icon and a different one on the other.
             */}
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/react/installation" className="sm:w-auto">
                <NButton className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-600 sm:w-auto">
                  Get started
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </NButton>
              </Link>
              <a href="https://github.com/ursnj/nayan-ui" target="_blank" rel="noopener noreferrer" className="sm:w-auto">
                <NButton isOutline={true} className="w-full px-6 font-semibold sm:w-auto">
                  <Github aria-hidden className="h-4 w-4" />
                  View on GitHub
                </NButton>
              </a>
            </div>
          </div>

          {/* Live components */}
          <div className={`${CARD} overflow-hidden shadow-xl shadow-indigo-500/5`}>
            {/* `bg-surface` for the same reason as the code frame's header
                (see `helpers/Code.tsx`): this card sits on the page, so a
                `--background` header was the colour of the page behind it. */}
            <div className="flex items-center justify-between gap-3 border-b border-default bg-surface px-4 py-2.5">
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
               * A grey well behind the examples, so the components read as
               * components. Most of them are white or near-white — an input, a
               * select, an outline button, an accordion — and on the card's own
               * white surface their edges dissolved: the demo looked like
               * floating text with a few coloured pills in it. `WELL` is the
               * token the site already uses for this, and it is what the
               * component documentation pages put their demos on.
               *
               * The min-height is a floor on the panel, so switching tabs does
               * not resize the card and the hero's two columns stay roughly
               * balanced — the shortest tab is still well under the height of
               * the pitch beside it.
               */}
              <div className={`${WELL} min-h-[19rem] p-4`}>
                {tab === 0 && (
                  <div role="tabpanel" id="home-panel-0" aria-labelledby="home-tab-0" className="space-y-4">
                    <Row label="Buttons">
                      <div className="flex flex-wrap gap-2">
                        <NButton>Primary</NButton>
                        <NButton isOutline={true}>Outline</NButton>
                        <NButton isLoading={true}>Loading</NButton>
                        <NButton disabled>Disabled</NButton>
                        <NButton isOutline={true} aria-label="Download">
                          <Download className="h-4 w-4" />
                        </NButton>
                      </div>
                    </Row>
                    <Row label="Button group">
                      <NButtonGroup items={RANGES} selected={range} onChange={setRange} size="sm" ariaLabel="Date range" />
                    </Row>
                    <Row label="Toggle buttons">
                      <div className="flex flex-wrap items-center gap-2">
                        <NToggleButton isIconOnly aria-label="Bold" size="sm" isSelected={bold} onChange={setBold}>
                          <Bold className="h-4 w-4" />
                        </NToggleButton>
                        <NToggleButton isIconOnly aria-label="Italic" size="sm" isSelected={italic} onChange={setItalic}>
                          <Italic className="h-4 w-4" />
                        </NToggleButton>
                        <NToggleButton isIconOnly aria-label="Underline" size="sm" isSelected={underline} onChange={setUnderline}>
                          <Underline className="h-4 w-4" />
                        </NToggleButton>
                        <NTooltip message="Tooltips too">
                          <NButton isOutline={true}>Hover me</NButton>
                        </NTooltip>
                      </div>
                    </Row>
                    <Row label="Badges">
                      <div className="flex flex-wrap items-center gap-2">
                        <NBadge color="default">Default</NBadge>
                        <NBadge color="accent">Accent</NBadge>
                        <NBadge color="success">Success</NBadge>
                        <NBadge color="warning">Warning</NBadge>
                        <NBadge color="danger">Danger</NBadge>
                      </div>
                    </Row>
                    <Row label="Chips">
                      <div className="flex flex-wrap items-center gap-2">
                        <NChip color="accent" variant="primary" size="sm">
                          New
                        </NChip>
                        <NChip color="success" variant="soft" size="sm">
                          Stable
                        </NChip>
                        <NChip color="default" variant="secondary" size="sm">
                          v2.1
                        </NChip>
                        <NChip color="danger" variant="soft" size="sm">
                          Beta
                        </NChip>
                      </div>
                    </Row>
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
                    <NSearchField value={query} onChange={setQuery} placeholder="Search components..." fullWidth />
                    {/*
                     * `NSelect` mounts on the client only. It wraps
                     * react-select, which reads an emotion cache that is null
                     * during server rendering — it throws "Cannot read
                     * properties of null (reading 'registered')" and takes the
                     * whole home page to a 500. The same guard is on the
                     * select's own documentation page, for the same reason.
                     *
                     * The placeholder matches the mounted field's height, so
                     * the panel does not jump on hydration.
                     */}
                    {mounted ? (
                      <NSelect
                        label="Framework"
                        placeholder="Pick a framework"
                        options={FRAMEWORKS}
                        value={framework}
                        onChange={value => setFramework(value)}
                        className="mb-3"
                      />
                    ) : (
                      <div className="h-[68px] animate-pulse rounded-lg border border-default bg-background" aria-hidden />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Row label="Seats">
                        <NNumberField value={seats} onChange={setSeats} minValue={1} maxValue={99} aria-label="Seats" />
                      </Row>
                      <NRadioGroup label="Plan" items={PLANS} value={plan} onChange={setPlan} />
                    </div>
                    <NCheck checked={notify} onChange={setNotify}>
                      Email me about releases
                    </NCheck>
                    <NSwitch label="Dark mode" enabled={dark} onChange={setDark} />
                  </div>
                )}

                {tab === 2 && (
                  <div role="tabpanel" id="home-panel-2" aria-labelledby="home-tab-2" className="space-y-5">
                    <Row label="Upload progress">
                      <NProgress value={72} />
                    </Row>
                    <Row label="Storage used">
                      <NMeter value={82} color="warning" label="82% of 10 GB" />
                    </Row>
                    <Row label={`Volume — ${volume}`}>
                      <NSlider
                        defaultValue={volume}
                        max={100}
                        step={1}
                        onChange={(value: any) => setVolume(Array.isArray(value) ? value[0] : value)}
                      />
                    </Row>
                    <NAlert type={AlertTypes.SUCCESS} title="Build passed" message="42 components, no regressions." />
                    <NButton isOutline={true} onClick={() => toast('Rendered by the real NToast.', 'Hello from Nayan UI')}>
                      <Bell className="mr-2 h-4 w-4" />
                      Show a toast
                    </NButton>
                  </div>
                )}

                {tab === 3 && (
                  <div role="tabpanel" id="home-panel-3" aria-labelledby="home-tab-3" className="space-y-5">
                    <Row label="Avatars">
                      <div className="flex items-center gap-2">
                        <NAvatar size="sm" color="accent" variant="soft" fallback="ND" />
                        <NAvatar size="sm" color="success" variant="soft" fallback="AK" />
                        <NAvatar size="sm" color="warning" variant="soft" fallback="RS" />
                        <NAvatar size="sm" fallback="+9" />
                      </div>
                    </Row>
                    <Row label="Tags">
                      <NTagGroup items={TAGS} selectionMode="multiple" selectedKeys={tags} onSelectionChange={setTags} size="sm" />
                    </Row>
                    <Row label="Keyboard shortcut">
                      <div className="flex items-center gap-1.5 text-sm text-muted">
                        <NKbd>⌘</NKbd>
                        <NKbd>K</NKbd>
                        <span>to search the docs</span>
                      </div>
                    </Row>
                    <NAccordion items={FAQ} />
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
