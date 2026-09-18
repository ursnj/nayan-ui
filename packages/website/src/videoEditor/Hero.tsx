import { Clapperboard, Github, MonitorPlay, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import EditorMock from './EditorMock';
import { EDITOR_URL, SOURCE_URL, STATS, TRUST_POINTS } from './content';

/**
 * Above the fold: the claim, the two things you can do about it, and a picture
 * of the thing itself.
 *
 * A server component, like every section here — the page ships no JavaScript
 * of its own, so the copy is in the HTML the crawler receives and the first
 * paint costs nothing to hydrate.
 */
const Hero = () => (
  <section className="relative overflow-hidden">
    {/* Decorative wash. Behind everything, and out of the a11y tree. */}
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-fuchsia-600/10" />
      <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -top-10 right-1/4 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
    </div>

    <div className="container mx-auto px-4 pt-10 pb-8 sm:px-6 sm:pt-16 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-foreground" aria-current="page">
            Video Editor
          </li>
        </ol>
      </nav>

      <div className="mx-auto max-w-4xl text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          Runs entirely in your browser — nothing is uploaded
        </span>

        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          <span className="mb-3 flex items-center justify-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 sm:h-14 sm:w-14">
              <Clapperboard className="h-6 w-6 text-white sm:h-7 sm:w-7" />
            </span>
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Free Video Editor</span>
          </span>
          <span className="block text-xl font-semibold text-foreground sm:text-3xl md:text-4xl">No upload. No account. No watermark.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
          A full multi-track video editor that runs in a browser tab. Trim and split on a real timeline, grade with fifteen looks, key out a green
          screen, add titles and eighteen transitions — then export MP4 up to 4K. Every frame is decoded, composited and encoded on your own machine
          with WebCodecs.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={EDITOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-violet-600 hover:shadow-xl hover:shadow-indigo-500/30">
            <MonitorPlay className="mr-2 h-5 w-5" />
            Open the editor
          </a>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-default bg-surface/60 px-7 py-3.5 font-semibold text-foreground backdrop-blur transition-colors hover:bg-default/50">
            <Github className="mr-2 h-5 w-5" />
            View source
          </a>
        </div>

        <p className="mt-5 text-xs text-muted">Free forever · MIT licensed · Works offline · Nothing leaves your device</p>
      </div>

      <EditorMock />

      {/* Numbers, as a definition list — the label describes the value. */}
      <dl className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
        {STATS.map(stat => (
          <div key={stat.label} className="rounded-2xl border border-default bg-surface/70 p-4 text-center backdrop-blur">
            <dt className="sr-only">{stat.label}</dt>
            <dd>
              <span className="block bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                {stat.value}
              </span>
              <span className="mt-1 block text-sm font-semibold text-foreground">{stat.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{stat.detail}</span>
            </dd>
          </div>
        ))}
      </dl>

      <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {TRUST_POINTS.map(point => (
          <li key={point.label} className="flex items-start gap-2.5 rounded-xl border border-default bg-surface p-4">
            <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            <span>
              <span className="block text-sm font-semibold text-foreground">{point.label}</span>
              <span className="mt-0.5 block text-xs text-muted">{point.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default Hero;
