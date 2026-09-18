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
 * do I use it, and where can I post it.
 */

/** The running editor lives at this path, served as a static Vite bundle. */
export const EDITOR_URL = '/video-editor/start';
export const SOURCE_URL = 'https://github.com/ursnj/nayan-ui/tree/main/packages/video-editor';

/** The facts strip under the hero. Short, checkable, no adjectives. */
export const FACTS = [
  { value: '4K', label: 'Full-quality export' },
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
    title: 'Add your clips',
    body: 'Drag your videos, photos and music straight in. Nothing gets uploaded — the editor reads the files where they already are.'
  },
  {
    title: 'Cut it down',
    body: 'Shorten clips, split them where you want, and close the gaps. Edges snap together so your cuts land where you meant them to.'
  },
  {
    title: 'Make it look right',
    body: 'Choose a look, drop out a green screen, add titles, and put a transition between the shots that need one.'
  },
  {
    title: 'Save or share it',
    body: 'Export a finished video and it lands in your downloads. Or save the project and come back to it whenever you like.'
  }
];

/* ------------------------------------------------------------------ *
 * Where it goes
 * ------------------------------------------------------------------ */

/**
 * What used to sit here was a table of pixel dimensions and two lists of
 * codecs — "1080 × 1920", "MP4, MOV, MKV, WebM · MP3, WAV, M4A, FLAC, OGG",
 * "Chrome or Edge 94+, Safari 16.4+". Accurate, and exactly the wrong thing
 * to put in front of someone deciding whether to try a video editor. The
 * presets still exist in the editor; the page describes what they are for.
 */
export const DESTINATIONS = [
  {
    title: 'Vertical video',
    body: 'One-click presets for Reels, Shorts and TikTok. Landscape footage fills the frame behind itself instead of sitting in black bars.'
  },
  {
    title: 'Widescreen and square',
    body: 'YouTube, feeds and ads, up to 4K. Safe-zone guides keep your titles clear of the places apps put their own buttons.'
  },
  {
    title: 'Audio on its own',
    body: 'Cut a podcast on the same timeline and export just the mix, without a video track riding along with it.'
  }
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
    a: 'Yes, all the way up to 4K, and it stays smooth while you work because the editor uses the same video hardware your browser uses to play it.'
  },
  {
    q: 'How do I make a vertical video for Reels, Shorts or TikTok?',
    a: 'Pick the vertical preset when you start. If your footage is widescreen, you can either reframe it or let the shot fill the space behind itself, so you get a full frame instead of black bars.'
  },
  {
    q: 'Can I save a project and come back to it?',
    a: 'Yes. Saving gives you one file with your whole project inside it, media included, so you can reopen it later — on this computer or a different one — and everything is still there.'
  }
];
