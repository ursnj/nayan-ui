// Shared with the structured data in page.tsx: a FAQPage that disagrees with the visible copy is a violation.

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
