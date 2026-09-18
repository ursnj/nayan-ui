import { Blend, Download, Image as ImageIcon, Layers, Package, Palette, Type, Volume2, Wand2 } from 'lucide-react';

/**
 * The feature set as a bento grid rather than a uniform row of cards: the
 * timeline is the reason the thing exists and the project file is a footnote,
 * so they are not the same size. `span` is the column count at `lg`, out of
 * six.
 */
const FEATURES = [
  {
    icon: Layers,
    span: 'lg:col-span-4',
    title: 'A real multi-track timeline',
    accent: 'from-indigo-500 to-violet-500',
    body: 'Stack as many video and audio tracks as the edit needs. Drag to move, pull an edge to trim, split at the playhead, ripple delete to close the gap. Every track carries its own height, level, mute, hide and lock — and everything you do is undoable.',
    chips: ['Trim', 'Split', 'Ripple delete', 'Snapping', 'Groups', 'Multi-select', 'Detach audio', 'In/out range']
  },
  {
    icon: Wand2,
    span: 'lg:col-span-2',
    title: 'Green screen',
    accent: 'from-emerald-500 to-teal-500',
    body: 'A GPU chroma keyer with similarity, edge softness and spill removal. It keys on chrominance rather than raw RGB, so shadows and highlights in the subject survive the matte.'
  },
  {
    icon: Palette,
    span: 'lg:col-span-3',
    title: 'Colour grading that goes deep',
    accent: 'from-amber-500 to-orange-500',
    body: 'Fifteen one-click looks with a strength dial, and the full grade underneath them: exposure, contrast, highlights, shadows, fade, vibrance, temperature, tint, split toning, vignette, grain and sharpen.'
  },
  {
    icon: Blend,
    span: 'lg:col-span-3',
    title: 'Eighteen transitions',
    accent: 'from-rose-500 to-pink-500',
    body: 'Dissolves, dips to black or white, wipes and slides on all four edges, pushes, cross-zooms, a blurred whip pan and an iris. Each is eased on a curve chosen for the move, and the outgoing clip keeps playing through the blend rather than freezing on its last frame.'
  },
  {
    icon: Type,
    span: 'lg:col-span-2',
    title: 'Titles and captions',
    accent: 'from-sky-500 to-cyan-500',
    body: 'Four presets to start from, then full control of font, size, weight, colour, background box, outline and alignment — plus five entrance animations including a typewriter reveal.'
  },
  {
    icon: Volume2,
    span: 'lg:col-span-2',
    title: 'Audio that stays in sync',
    accent: 'from-lime-500 to-green-500',
    body: 'Per-clip volume, fades, speed and reverse, plus track faders. Playback takes its time from the Web Audio clock rather than a wall timer, so picture and sound cannot drift apart.'
  },
  {
    icon: ImageIcon,
    span: 'lg:col-span-2',
    title: 'Backgrounds',
    accent: 'from-purple-500 to-indigo-500',
    body: 'Fill the frame behind your clips with a colour, a linear or radial gradient, or one of your own images. Or use the shot itself, scaled to fill and defocused — the usual answer for landscape footage in a vertical edit.'
  },
  {
    icon: Download,
    span: 'lg:col-span-3',
    title: 'Export you can steer',
    accent: 'from-blue-500 to-indigo-500',
    body: 'Seven formats, four quality levels and presets from 720p to 4K, vertical and square. The dialog measures the likely file size before you commit, shows frames per second and time remaining while it runs, and cancels cleanly.'
  },
  {
    icon: Package,
    span: 'lg:col-span-3',
    title: 'Projects in a single file',
    accent: 'from-teal-500 to-emerald-500',
    body: 'Saving writes one .nayanproj file containing the timeline and every media file you imported. Open it on another machine and everything relinks — no hunting for the originals. It is an ordinary zip, so you can take the media back out.'
  }
];

const Features = () => (
  <section id="features" aria-labelledby="features-heading" className="container mx-auto scroll-mt-32 px-4 py-14 sm:px-6 lg:px-8">
    <header className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Features</p>
      <h2 id="features-heading" className="text-2xl font-bold sm:text-4xl">
        Everything a real edit needs
      </h2>
      <p className="mt-4 text-muted">
        Not a trimmer with a timeline bolted on. These are the operations you reach for on every cut — and they are all in the browser tab, with no
        upload step in front of them.
      </p>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6">
      {FEATURES.map(feature => {
        const Icon = feature.icon;
        return (
          <article
            key={feature.title}
            className={`group relative overflow-hidden rounded-2xl border border-default bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/30 hover:shadow-xl ${feature.span}`}>
            <div
              aria-hidden
              className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${feature.accent} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`}
            />
            <div
              className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} shadow-md transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="relative mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
            <p className="relative text-sm leading-relaxed text-muted">{feature.body}</p>
            {feature.chips ? (
              <ul className="relative mt-4 flex flex-wrap gap-1.5">
                {feature.chips.map(chip => (
                  <li key={chip} className="rounded-md border border-default bg-background px-2 py-0.5 text-[11px] font-medium text-muted">
                    {chip}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  </section>
);

export default Features;
