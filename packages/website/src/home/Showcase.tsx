import { ArrowRight, Gamepad2, LayoutGrid, MousePointerClick, Sparkles, SquareStack, TableProperties, TextCursorInput } from 'lucide-react';
import Link from 'next/link';
import { Card, Section, SectionHeader, StatGrid } from '@/design/Primitives';
import { ACCENT_SOFT, CARD_INTERACTIVE, H3, PILL } from '@/design/system';
import { GAME_COUNT, NATIVE_COMPONENT_COUNT, REACT_COMPONENT_COUNT, TOTAL_COMPONENT_COUNT } from '@/services/Counts';

/**
 * What is actually in the box.
 *
 * This section used to hold four cards — Developer Experience, Cross-Platform,
 * Accessibility First, Performance Optimized — every one of which was already
 * a card in the Features section directly above it, in the same words. Saying
 * a thing twice does not make it twice as true; it just means a visitor
 * scrolls past both.
 *
 * So it answers a question the page did not answer anywhere: which components
 * are there? Every name below is a real documented page, and the counts are
 * taken from the navigation rather than rounded up for effect.
 */
const CATEGORIES = [
  {
    icon: TextCursorInput,
    title: 'Forms & input',
    items: [
      'Input',
      'Textarea',
      'Select',
      'Autocomplete',
      'Checkbox',
      'Radio Group',
      'Switch',
      'Slider',
      'Number Field',
      'Search Field',
      'Date Picker'
    ],
    href: '/react/input'
  },
  {
    icon: MousePointerClick,
    title: 'Actions & navigation',
    items: ['Button', 'Button Group', 'Link', 'Linkify', 'Dropdown Menu', 'Tabs'],
    href: '/react/button'
  },
  {
    icon: SquareStack,
    title: 'Overlays',
    items: ['Dialog', 'Sheet', 'Popover', 'Tooltip', 'Confirm Alert', 'Toast'],
    href: '/react/dialog'
  },
  {
    icon: TableProperties,
    title: 'Data display',
    items: ['Table', 'Accordion', 'Card', 'Badge', 'Tag Group', 'Meter', 'Progress', 'Divider', 'Infinite Scroll'],
    href: '/react/table'
  },
  {
    icon: Sparkles,
    title: 'Feedback & loading',
    items: ['Alert', 'Loading', 'Skeleton'],
    href: '/react/alert'
  }
];

const STATS = [
  { value: String(REACT_COMPONENT_COUNT), label: 'React components', detail: 'each with a live demo' },
  { value: String(NATIVE_COMPONENT_COUNT), label: 'React Native components', detail: 'the same design language' },
  { value: String(GAME_COUNT), label: 'Games', detail: 'in @nayan-ui/games' },
  { value: 'MIT', label: 'Licence', detail: 'no tiers, no seats' }
];

const Showcase = () => (
  <Section id="components" labelledBy="components-heading">
    <SectionHeader
      eyebrow="What's included"
      id="components-heading"
      title={`${TOTAL_COMPONENT_COUNT} components across two platforms`}
      lead="Grouped by the job they do. Every name here has its own page with a live demo, a copyable example and a full prop table."
    />

    <StatGrid stats={STATS} className="mb-8" />

    <div className="grid gap-5 lg:grid-cols-2">
      {CATEGORIES.map((category, index) => {
        const Icon = category.icon;
        return (
          <Link
            key={category.title}
            href={category.href}
            /* The last card takes the full width on a two-column grid, so an
               odd count does not leave a hole in the layout. */
            className={`${CARD_INTERACTIVE} group p-5 sm:p-6 ${index === CATEGORIES.length - 1 ? 'lg:col-span-2' : ''}`}>
            <div className="mb-3 flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}>
                <Icon className="h-4 w-4" />
              </span>
              <h3 className={H3}>{category.title}</h3>
              <span className="ml-auto flex items-center gap-1 text-xs text-muted">
                {category.items.length}
                <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {category.items.map(item => (
                <li key={item} className={PILL}>
                  {item}
                </li>
              ))}
            </ul>
          </Link>
        );
      })}
    </div>

    {/* The neighbouring packages, which the home page never mentioned. */}
    <Card className="mt-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${ACCENT_SOFT}`}>
            <Gamepad2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className={H3}>Also in the monorepo</h3>
            <p className="mt-1 text-sm text-muted">
              {GAME_COUNT} React Native games in <code className="font-mono text-xs">@nayan-ui/games</code>, a browser video editor that uploads
              nothing, and a CLI for sitemaps and robots.txt.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/games" className={`${PILL} hover:border-indigo-500/40`}>
            Games
          </Link>
          <Link href="/video-editor" className={`${PILL} hover:border-indigo-500/40`}>
            Video Editor
          </Link>
          <Link href="/devtools" className={`${PILL} hover:border-indigo-500/40`}>
            Devtools
          </Link>
        </div>
      </div>
    </Card>

    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <Link
        href="/react/components"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-default bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-default/50">
        <LayoutGrid aria-hidden className="h-4 w-4" />
        Browse React components
      </Link>
      <Link
        href="/react-native/components"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-default bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-default/50">
        Browse React Native components
      </Link>
    </div>
  </Section>
);

export default Showcase;
