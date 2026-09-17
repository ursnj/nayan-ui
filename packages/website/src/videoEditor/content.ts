/*
 * Copy for the /video-editor page.
 *
 * Kept here so the structured data in `page.tsx` is built from the same
 * arrays the page renders — a FAQPage or HowTo that disagrees with the
 * visible copy is a structured-data violation.
 *
 * This file used to be three times the length. It carried a sixteen-term
 * glossary, a ten-row comparison table, a six-question buyer's guide, a
 * keyboard map, a specifications grid and an explanation of WebCodecs,
 * hardware decoders and the Web Audio clock. Almost none of that is what
 * someone looking for a free video editor needs before they try one, so it is
 * gone. What is left answers four questions: what is it, what can it do, how
 * do I use it, and what size should my video be.
 */

/** The running editor lives at this path, served as a static Vite bundle. */
export const EDITOR_URL = '/video-editor/start';
export const SOURCE_URL = 'https://github.com/ursnj/nayan-ui/tree/main/packages/video-editor';

/** The facts strip under the hero. Short, checkable, no adjectives. */
export const FACTS = [
  { value: '4K', label: 'Up to 3840 × 2160' },
  { value: '15', label: 'Colour looks' },
  { value: '18', label: 'Transitions' },
  { value: '0', label: 'Bytes uploaded' }
];

/* ------------------------------------------------------------------ *
 * Steps — also the HowTo schema
 * ------------------------------------------------------------------ */

/**
 * Four steps, down from six. "Open the editor" and "save the project" were
 * instructions in name only; both now live where they belong — in the call to
 * action and in the export step.
 */
export const STEPS = [
  {
    title: 'Bring in your footage',
    body: 'Drag files onto the media panel or pick them from disk. Nothing is uploaded — the browser reads each file where it already sits.'
  },
  {
    title: 'Cut it down',
    body: 'Trim the edges, split at the playhead, and ripple delete to close the gaps. Snapping holds cuts to clip edges so joins land clean.'
  },
  {
    title: 'Make it look right',
    body: 'Pick one of fifteen looks and dial its strength, key out a green screen, add titles, and drop a transition on any cut.'
  },
  {
    title: 'Export or save',
    body: 'Choose a format and quality, and the dialog estimates the file size before you commit. Or save one project file with the media inside.'
  }
];

/* ------------------------------------------------------------------ *
 * Sizes — the question people actually arrive with
 * ------------------------------------------------------------------ */

export const SIZES = [
  { platform: 'YouTube', ratio: '16:9', size: '1920 × 1080' },
  { platform: 'YouTube Shorts', ratio: '9:16', size: '1080 × 1920' },
  { platform: 'Instagram Reels · TikTok', ratio: '9:16', size: '1080 × 1920' },
  { platform: 'Instagram feed', ratio: '4:5', size: '1080 × 1350' },
  { platform: 'LinkedIn · square feeds', ratio: '1:1', size: '1080 × 1080' },
  { platform: 'Podcasts · audio only', ratio: '—', size: 'M4A · WAV · OGG' }
];

export const FORMATS = [
  { label: 'Import', value: 'MP4, MOV, MKV, WebM · MP3, WAV, M4A, FLAC, OGG · PNG, JPEG, WebP, GIF' },
  { label: 'Export', value: 'MP4, MOV, MKV, WebM · M4A, WAV, OGG for audio alone' },
  { label: 'Needs', value: 'Chrome or Edge 94+, Safari 16.4+, and a window at least 1024px wide' }
];

/* ------------------------------------------------------------------ *
 * FAQ — also the FAQPage schema
 * ------------------------------------------------------------------ */

/**
 * Six questions, down from twelve. The ones cut were about browser support
 * matrices, WebGL2 fallbacks and encode speed — real questions, but ones
 * people ask after they have tried it, not before.
 */
export const FAQS = [
  {
    q: 'Is this video editor really free?',
    a: 'Yes — free, MIT licensed and open source, with no tiers, no trial and no watermark. There is no account to make and nothing to pay for, because there is no server to pay for.'
  },
  {
    q: 'Are my files uploaded anywhere?',
    a: 'No. There is no server and no upload step. Your media is opened directly from disk, edited in the browser, and the finished file is written back to your downloads folder. Nothing ever leaves the machine.'
  },
  {
    q: 'Is there a watermark or a length limit?',
    a: 'Neither. The only practical limits are your machine’s memory and how long you are willing to wait for the export.'
  },
  {
    q: 'Can I edit 4K video?',
    a: 'Yes. Projects go up to 3840 × 2160 at up to 60 fps, and decoding runs on the same hardware your browser uses to play video.'
  },
  {
    q: 'How do I make a vertical video for Reels, Shorts or TikTok?',
    a: 'Set the project to the vertical 1080 × 1920 preset. For landscape footage, either reframe the clip, or set the background to the blurred clip so the shot fills the frame behind itself instead of leaving black bars.'
  },
  {
    q: 'Can I save a project and come back to it?',
    a: 'Yes. Saving writes a single .nayanproj file holding the timeline and every media file you imported, so opening it restores the whole project with nothing to re-import — on this machine or any other.'
  }
];
