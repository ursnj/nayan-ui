import { ArrowRight, Github, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { EDITOR_URL, SOURCE_URL } from './content';

/**
 * The last ask, and somewhere to go if it is a no.
 *
 * The related links are internal rather than decorative: this page sits off
 * on its own otherwise, and the rest of the site is what someone who came for
 * a video editor and found a component library might actually want.
 */
const RELATED = [
  { href: '/react/components', title: 'React components', body: '50+ accessible components — the library the editor’s UI is built from.' },
  { href: '/react-native/components', title: 'React Native components', body: 'The same design language, for iOS and Android.' },
  { href: '/devtools', title: 'Developer tools', body: 'Small browser-based tools, built on the same no-upload principle.' },
  { href: '/games', title: 'Games', body: 'Rather more frivolous, equally offline.' }
];

const ClosingCta = () => (
  <section aria-labelledby="cta-heading" className="container mx-auto px-4 pb-16 sm:px-6 lg:px-8">
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-violet-600/10 to-fuchsia-600/15" />
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative px-6 py-14 text-center sm:px-10 sm:py-20">
        <h2 id="cta-heading" className="text-2xl font-bold sm:text-4xl">
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            Open a tab and start cutting
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          There is nothing to install, nothing to sign up for and nothing to upload. Drop a clip in and go — your footage never leaves the machine.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-600">
            <MonitorPlay className="mr-2 h-5 w-5" />
            Open the editor
          </a>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-default bg-surface/70 px-7 py-3.5 font-semibold text-foreground backdrop-blur transition-colors hover:bg-default/50">
            <Github className="mr-2 h-5 w-5" />
            Read the source
          </a>
        </div>
      </div>
    </div>

    <nav aria-label="Elsewhere on Nayan UI" className="mt-8">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Elsewhere on Nayan UI</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {RELATED.map(item => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex h-full flex-col rounded-2xl border border-default bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-lg">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {item.title}
                <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1.5 text-xs leading-relaxed text-muted">{item.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </section>
);

export default ClosingCta;
