import { Blend, Github, Layers, MonitorPlay, Package, Palette, Type, Volume2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { CtaPanel, FactList, FaqList, FeatureCard, PageHero, Section, SectionHeader, StatGrid } from '@/design/Primitives';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, CARD_PAD, GRID_GAP, H3, H4_CARD } from '@/design/system';
import { EDITOR_URL, FACTS, FAQS, FORMATS, SIZES, SOURCE_URL, STEPS } from './content';

/**
 * The /video-editor landing page.
 *
 * Rebuilt on the site's design system. It was written before that system
 * existed and so had invented its own of everything: a hand-drawn mock of the
 * editor window in markup, a sticky in-page nav no other page has, a bento
 * grid with nine differently-gradiented icon tiles, chip clouds naming all
 * fifteen colour looks and all eighteen transitions, two wide tables, a
 * keyboard map, a glossary and a page-specific closing panel. Read on its own
 * it was fine. Read after any other page on the site it was a different
 * website.
 *
 * Now it is the same five shapes every other landing page uses — `PageHero`,
 * `SectionHeader`, `FeatureCard`, `FactList`, `CtaPanel` — at the same
 * spacing, in the same one accent.
 */
const FEATURES = [
  {
    icon: Layers,
    title: 'Multi-track timeline',
    body: 'Stack as many video and audio tracks as the edit needs. Trim, split, ripple delete, group and snap — with undo across all of it.'
  },
  {
    icon: Wand2,
    title: 'Green screen',
    body: 'A chroma keyer with similarity, edge softness and spill removal, keyed on colour rather than raw RGB so shadows survive the matte.'
  },
  {
    icon: Palette,
    title: 'Colour grading',
    body: 'Fifteen one-click looks with a strength dial, and the full grade underneath: exposure, contrast, temperature, split toning and grain.'
  },
  {
    icon: Blend,
    title: 'Eighteen transitions',
    body: 'Dissolves, dips, wipes, slides, pushes, cross-zooms, a whip pan and an iris — each eased on a curve chosen for the move.'
  },
  {
    icon: Type,
    title: 'Titles and captions',
    body: 'Four presets to start from, then full control of font, colour, outline and alignment, plus five entrance animations.'
  },
  {
    icon: Volume2,
    title: 'Audio in sync',
    body: 'Per-clip volume, fades, speed and reverse, plus track faders. Playback runs off the audio clock, so picture and sound cannot drift.'
  }
];

const VideoEditorMain = () => (
  <>
    <PageHero
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Video Editor' }]}
      eyebrow="Video Editor"
      title="Free online video editor"
      titleAccent="No upload, no account, no watermark"
      lead="A full multi-track video editor that runs in a browser tab. Cut, grade, key out a green screen, add titles and export MP4 up to 4K — every frame processed on your own machine."
      actions={
        <>
          <a href={EDITOR_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
            <MonitorPlay aria-hidden className="mr-2 h-5 w-5" />
            Open the editor
          </a>
          <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_SECONDARY}>
            <Github aria-hidden className="mr-2 h-5 w-5" />
            View source
          </a>
        </>
      }
      note="Free forever · MIT licensed · Works offline · Nothing leaves your device">
      {/* The badge that used to sit here said "Runs entirely in your browser",
          under a headline reading "No upload, no account, no watermark" and
          above a note reading "Nothing leaves your device" — the same fact,
          three times, in three type sizes. */}
      <div className="mx-auto mt-10 max-w-4xl">
        <StatGrid stats={FACTS} />
      </div>
    </PageHero>

    <Section id="features" labelledBy="features-heading">
      <SectionHeader
        eyebrow="Features"
        id="features-heading"
        title="Everything a real edit needs"
        lead="Not a trimmer with a timeline bolted on — the operations you reach for on every cut."
      />
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
        {FEATURES.map(feature => (
          <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
        ))}
      </div>
    </Section>

    <Section id="how-it-works" labelledBy="how-heading" className="border-y border-default bg-surface/40">
      <SectionHeader
        eyebrow="How it works"
        id="how-heading"
        title="How to edit a video in your browser"
        lead="Four steps from a folder of clips to a finished file. No sign-up sits in front of any of them."
      />
      <ol className={`grid sm:grid-cols-2 lg:grid-cols-4 ${GRID_GAP}`}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={`${CARD} ${CARD_PAD}`}>
            <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-300">
              {index + 1}
            </span>
            <h3 className={`mb-2 ${H4_CARD}`}>{step.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>

    <Section id="sizes" labelledBy="sizes-heading">
      <SectionHeader
        eyebrow="Sizes & formats"
        id="sizes-heading"
        title="The right size for where it is going"
        lead="Set the project once and the preview, the safe zones and the export all follow it."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${CARD} overflow-hidden`}>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Recommended project size by destination</caption>
            <thead>
              <tr className="border-b border-default bg-background">
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Where it is going
                </th>
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Ratio
                </th>
                <th scope="col" className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  Size
                </th>
              </tr>
            </thead>
            <tbody>
              {SIZES.map(row => (
                <tr key={row.platform} className="border-b border-default last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                    {row.platform}
                  </th>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{row.ratio}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">{row.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <FactList facts={FORMATS} />
          <div className={`${CARD} ${CARD_PAD} mt-5`}>
            <h3 className={H3}>Projects in a single file</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Saving writes one <code className="font-mono text-xs">.nayanproj</code> file containing the timeline and every media file you imported,
              so opening it on another machine restores the whole project with nothing to re-import.
            </p>
          </div>
        </div>
      </div>
    </Section>

    <Section id="faq" labelledBy="faq-heading">
      <SectionHeader eyebrow="FAQ" id="faq-heading" title="Frequently asked questions" />
      <FaqList faqs={FAQS} />
    </Section>

    <CtaPanel title="Open a tab and start cutting" lead="Nothing to install, nothing to sign up for and nothing to upload. Drop a clip in and go.">
      <a href={EDITOR_URL} target="_blank" rel="noopener noreferrer" className={BUTTON_PRIMARY}>
        <MonitorPlay aria-hidden className="mr-2 h-5 w-5" />
        Open the editor
      </a>
      <Link href="/react/installation" className={BUTTON_SECONDARY}>
        <Package aria-hidden className="mr-2 h-5 w-5" />
        Browse the component library
      </Link>
    </CtaPanel>
  </>
);

export default VideoEditorMain;
