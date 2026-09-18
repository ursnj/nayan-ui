import { Blend, Github, Layers, MonitorPlay, Package, Palette, Type, Volume2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { CtaPanel, FaqList, FeatureCard, PageHero, Section, SectionHeader, StatGrid } from '@/design/Primitives';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, CARD_PAD, GRID_GAP, H3, H4_CARD } from '@/design/system';
import { DESTINATIONS, EDITOR_URL, FACTS, FAQS, SOURCE_URL, STEPS } from './content';

const FEATURES = [
  {
    icon: Layers,
    title: 'Layer as much as you like',
    body: 'Stack video, music, voice-over and titles on as many tracks as you need, and move any of it without disturbing the rest.'
  },
  {
    icon: Wand2,
    title: 'Remove a green screen',
    body: 'Drop out the background behind your subject and put anything you like there instead, with edges that still look believable.'
  },
  {
    icon: Palette,
    title: 'Make it look good',
    body: 'Fifteen one-click looks, from warm and sunny to cold and cinematic, each with a dial so you can take it as far as you want.'
  },
  {
    icon: Blend,
    title: 'Smooth cuts between shots',
    body: 'Eighteen transitions — fades, wipes, slides, zooms and a whip pan — for when a hard cut is not what the moment needs.'
  },
  {
    icon: Type,
    title: 'Titles and captions',
    body: 'Add readable text anywhere on the frame, pick a style, and have it appear with a little animation rather than just popping in.'
  },
  {
    icon: Volume2,
    title: 'Sound that stays put',
    body: 'Balance your levels, fade music under speech, slow a clip down or run it backwards — and the audio never drifts out of step.'
  }
];

const EditorScreenshot = () => (
  <div className={`${CARD} overflow-hidden p-1.5 shadow-xl shadow-indigo-500/5`}>
    <img
      src="/video-editor/editor-light.png"
      alt="The Nayan UI video editor: a media library on the left, the preview in the middle, clip properties on the right and a multi-track timeline along the bottom."
      width={1600}
      height={1000}
      className="block w-full rounded-xl dark:hidden"
    />
    <img
      src="/video-editor/editor-dark.png"
      alt="The Nayan UI video editor: a media library on the left, the preview in the middle, clip properties on the right and a multi-track timeline along the bottom."
      width={1600}
      height={1000}
      className="hidden w-full rounded-xl dark:block"
    />
  </div>
);

const VideoEditorMain = () => (
  <>
    <PageHero
      media={<EditorScreenshot />}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Video Editor' }]}
      eyebrow="Video Editor"
      title="Free online video editor"
      titleAccent="No upload, no account, no watermark"
      lead="Edit video in a browser tab — trim, layer, colour, caption and export, all the way up to 4K. Your footage stays on your own computer the whole time."
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
      <div className="mx-auto mt-10 max-w-4xl">
        <StatGrid stats={FACTS} />
      </div>
    </PageHero>

    <Section id="features" labelledBy="features-heading">
      <SectionHeader
        eyebrow="Features"
        id="features-heading"
        title="Everything a real edit needs"
        lead="Not a trimmer with a few sliders. The things you actually need to finish a video."
      />
      <div className={`grid sm:grid-cols-2 lg:grid-cols-3 ${GRID_GAP}`}>
        {FEATURES.map(feature => (
          <FeatureCard key={feature.title} icon={feature.icon} title={feature.title} body={feature.body} />
        ))}
      </div>
    </Section>

    <Section id="how-it-works" labelledBy="how-heading">
      <SectionHeader
        eyebrow="How it works"
        id="how-heading"
        title="How to edit a video in your browser"
        lead="Four steps from a folder of clips to something you can post. No sign-up in front of any of them."
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

    <Section id="destinations" labelledBy="destinations-heading">
      <SectionHeader
        eyebrow="Wherever it is going"
        id="destinations-heading"
        title="Made for the shapes people actually post"
        lead="Pick the shape once and the preview, the guides and the export all follow it."
      />
      <div className={`grid sm:grid-cols-3 ${GRID_GAP}`}>
        {DESTINATIONS.map(item => (
          <div key={item.title} className={`${CARD} ${CARD_PAD}`}>
            <h3 className={`mb-2 ${H3}`}>{item.title}</h3>
            <p className="text-sm leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>

      <div className={`${CARD} ${CARD_PAD} mt-5`}>
        <h3 className={H3}>Your project, in one file</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Saving gives you a single file with the timeline and all of your media inside it, so you can close the tab, move to another machine and pick
          up exactly where you left off.
        </p>
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
