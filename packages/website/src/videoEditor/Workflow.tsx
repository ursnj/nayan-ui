import { Clock, Cpu, Layers3 } from 'lucide-react';
import { WORKFLOW_STEPS } from './content';

/**
 * The walkthrough, and the engineering note under it.
 *
 * The steps are the same array the page's `HowTo` schema is built from, so the
 * numbered list a reader sees and the one a search engine parses are the same
 * six instructions.
 */
const Workflow = () => (
  <section id="workflow" aria-labelledby="workflow-heading" className="relative scroll-mt-32 overflow-hidden py-14">
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-indigo-500/[0.04] to-transparent" />

    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">How it works</p>
        <h2 id="workflow-heading" className="text-2xl font-bold sm:text-4xl">
          How to edit a video in your browser
        </h2>
        <p className="mt-4 text-muted">Six steps from a folder of clips to a finished file. No sign-up sits in front of any of them.</p>
      </header>

      <ol className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {WORKFLOW_STEPS.map((step, index) => (
          <li
            key={step.title}
            className="group relative rounded-2xl border border-default bg-surface p-6 transition-colors hover:border-indigo-500/30">
            <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-md shadow-indigo-500/20">
              {index + 1}
            </span>
            <h3 className="mb-2 text-base font-semibold text-foreground">{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      {/* The engineering, for the people who want to know why it can work at all. */}
      <div className="mt-10 rounded-2xl border border-default bg-surface p-6 lg:p-8">
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">Why a browser can do this now</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Browser video editors have historically meant either uploading your footage to someone else&apos;s server or shipping a multi-megabyte WASM
          build of FFmpeg and paying for it in speed. Neither is necessary any more.
        </p>
        <div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-3">
          {[
            {
              icon: Cpu,
              title: 'WebCodecs for decode and encode',
              body: 'Frames go through the same hardware decoders your browser uses to play video, so scrubbing stays responsive and export is quick. Containers are handled by mediabunny.'
            },
            {
              icon: Layers3,
              title: 'One compositor, two destinations',
              body: 'The preview and the exporter run the exact same rendering code, pointed at different canvases. Every position and size is stored as a fraction of the frame, so what you saw is what you get at any resolution.'
            },
            {
              icon: Clock,
              title: 'The audio clock drives playback',
              body: 'Clips are scheduled on a Web Audio graph and the render loop takes its time from that same clock rather than a wall timer, which is what stops picture and sound drifting apart.'
            }
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-default bg-background p-5">
                <Icon className="mb-3 h-5 w-5 text-indigo-500" />
                <h4 className="mb-2 text-sm font-semibold text-foreground">{item.title}</h4>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default Workflow;
