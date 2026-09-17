import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Section, SectionHeader } from '@/design/Primitives';
import { CARD, CARD_PAD, H4_CARD } from '@/design/system';
import Code from '@/helpers/Code';

/**
 * Install, import, use — on the front page.
 *
 * This is new. The home page previously showed the install command once, as
 * decoration inside a gradient panel at the very bottom, and said nothing
 * about what the next two steps were; you had to reach `/react/installation`
 * to learn that there is a theme provider at all. For a library, "how do I
 * start" is the question the front page exists to answer, so it is answered
 * here in the three commands it actually takes.
 *
 * The samples are the real ones from the installation page's code blocks,
 * trimmed to the shortest thing that runs.
 */
const STEPS = [
  {
    title: 'Install the package',
    body: 'One dependency. Tailwind v4 needs no config file — the library ships its own styles.',
    language: 'bash',
    filename: 'terminal',
    code: 'npm install @nayan-ui/react'
  },
  {
    title: 'Import the styles',
    body: 'Brings in the component CSS and the theme tokens you can later override.',
    language: 'css',
    filename: 'index.css',
    code: `@import '@nayan-ui/react/styles.css';

body {
  color: var(--foreground);
  background: var(--background);
}`
  },
  {
    title: 'Use a component',
    body: 'Wrap the tree in NTheme once, then import components where you need them.',
    language: 'tsx',
    filename: 'App.tsx',
    code: `import { NButton, NTheme, THEMES } from '@nayan-ui/react';

const App = () => (
  <NTheme theme={THEMES.LIGHT}>
    <NButton onClick={() => alert('Hello')}>Click me</NButton>
  </NTheme>
);

export default App;`
  }
];

const QuickStart = () => (
  <Section id="quick-start" labelledBy="quick-start-heading" className="border-y border-default bg-surface/40">
    <SectionHeader
      eyebrow="Quick start"
      id="quick-start-heading"
      title="Running in three steps"
      lead="No CLI to learn, no configuration file to generate, no build step of its own."
    />

    <ol className="grid gap-5 lg:grid-cols-3">
      {STEPS.map((step, index) => (
        <li key={step.title} className={`${CARD} ${CARD_PAD} flex min-w-0 flex-col`}>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {index + 1}
            </span>
            <h3 className={H4_CARD}>{step.title}</h3>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted">{step.body}</p>
          <div className="mt-auto">
            <Code code={step.code} language={step.language} filename={step.filename} />
          </div>
        </li>
      ))}
    </ol>

    <div className="mt-8 text-center">
      <Link
        href="/react/installation"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400">
        Full installation guide, including React Native
        <ArrowRight aria-hidden className="h-4 w-4" />
      </Link>
    </div>
  </Section>
);

export default QuickStart;
